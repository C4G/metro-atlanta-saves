import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { validate } from 'class-validator';

jest.mock('@mas/backend-checkpoints', () => ({ CheckpointsService: class {} }));
jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-programs', () => ({ ProgramsService: class {} }));
jest.mock('@mas/backend-users', () => ({ UsersService: class {} }));
jest.mock('@mas/backend-requirements', () => ({ RequirementRemindersService: class {} }));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_MINUTE: '* * * * *' },
}));
jest.mock('@mas/backend-shared', () => ({
  ...jest.requireActual('../../../shared/src/lib/util/validate-user-any-role'),
  ...jest.requireActual('../../../shared/src/lib/util/validate-user-is-admin-or-staff'),
  ...jest.requireActual('../../../shared/src/lib/util/decorator/role.decorator'),
  ...jest.requireActual('../../../shared/src/lib/util/guard/role.guard'),
  ManagedSessionGuard: class {},
  formatCurrency: { format: String },
  imageRelPath: (path: string) => `images/${path}`,
  imageAbsPath: (path: string) => `/uploads/${path}`,
}));
import { ManagedSessionGuard, RoleGuard } from '@mas/backend-shared';
import { UsersOnProgramsController } from './users-on-programs.controller';
import { UsersOnProgramsService } from './users-on-programs.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

const enrolled = (overrides: Record<string, unknown> = {}) => ({
  usersOnPrograms: {
    findUnique: jest.fn().mockResolvedValue({ userId: 'person-1', totalAmountPaidOut: 0, paidDate: null }),
    update: jest.fn().mockReturnValue('update'),
  },
  requirement: { findUnique: jest.fn().mockResolvedValue({ programId: 'program-1' }) },
  requirementCompletion: { upsert: jest.fn().mockResolvedValue({ requirementId: 'task-1' }) },
  participantPayment: { create: jest.fn().mockReturnValue('create'), findMany: jest.fn() },
  $transaction: jest.fn().mockResolvedValue([{ id: 'payment-1' }]),
  ...overrides,
});

const serviceWith = (prisma: object) => new UsersOnProgramsService(prisma as never, {} as never, {} as never);

describe('Staff task actions', () => {
  it('marks a task done for a participant and records who did it', async () => {
    const prisma = enrolled();
    await serviceWith(prisma).completeForParticipant('program-1', 'person-1', 'task-1', 'staff-1');
    expect(prisma.requirementCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 'person-1', programId: 'program-1', requirementId: 'task-1', completedById: 'staff-1' },
        update: {},
      }),
    );
  });

  it('reviews a task the participant has not finished by completing it on their behalf', async () => {
    const prisma = enrolled();
    await serviceWith(prisma).verifyRequirement('program-1', 'person-1', 'task-1', 'staff-1', { verified: true });
    expect(prisma.requirementCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ completedById: 'staff-1', verifiedById: 'staff-1' }),
      }),
    );
  });

  it('refuses to unreview a task that has no completion', async () => {
    await expect(
      serviceWith(enrolled()).verifyRequirement('program-1', 'person-1', 'task-1', 'staff-1', { verified: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects tasks from another program', async () => {
    const prisma = enrolled({ requirement: { findUnique: jest.fn().mockResolvedValue({ programId: 'other' }) } });
    await expect(
      serviceWith(prisma).completeForParticipant('program-1', 'person-1', 'task-1', 'staff-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.requirementCompletion.upsert).not.toHaveBeenCalled();
  });
});

describe('Participant payments', () => {
  const proof = { originalname: 'check.jpg', mimetype: 'image/jpeg', path: 'abc.jpg' } as Express.Multer.File;
  const body = { amount: '250.50', paidAt: '2026-11-02', checkNumber: ' 1042 ', paidBy: 'Frontline Housing' };

  it('stores the payment with its proof and adds it to the total paid out', async () => {
    const prisma = enrolled();
    await serviceWith(prisma).recordPayment('program-1', 'person-1', 'staff-1', body, proof);
    expect(prisma.participantPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 250.5,
          checkNumber: '1042',
          proofName: 'check.jpg',
          proofPath: 'images/abc.jpg',
          recordedById: 'staff-1',
        }),
      }),
    );
    expect(prisma.usersOnPrograms.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalAmountPaidOut: { increment: 250.5 } }) }),
    );
  });

  it('refuses payments for people outside the program', async () => {
    const prisma = enrolled({ usersOnPrograms: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } });
    await expect(
      serviceWith(prisma).recordPayment('program-1', 'person-1', 'staff-1', body, proof),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([{ amount: '0' }, { amount: '-5' }, { amount: '12.345' }, { amount: 'ten' }, { paidAt: 'soon' }])(
    'validates the payment form %p',
    async (overrides) => {
      const dto = Object.assign(new RecordPaymentDto(), body, overrides);
      expect((await validate(dto)).length).toBeGreaterThan(0);
    },
  );

  it('requires a photo of the check', async () => {
    const controller = new UsersOnProgramsController({} as never, {} as never);
    await expect(
      controller.recordPayment({ user: { id: 'staff-1' } } as never, 'program-1', 'person-1', body),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks staff from other partners', async () => {
    const record = jest.fn();
    const controller = new UsersOnProgramsController(
      { recordPayment: record } as never,
      { findOne: jest.fn().mockResolvedValue({ partnerId: 'partner-1' }) } as never,
    );
    await expect(
      controller.recordPayment(
        { user: { id: 'staff-1', role: 'Partner_Staff', partnerId: 'partner-2' } } as never,
        'program-1',
        'person-1',
        body,
        { ...proof, path: '/tmp/none' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(record).not.toHaveBeenCalled();
  });

  it.each([
    'completeForParticipant',
    'uncompleteForParticipant',
    'getPayments',
    'recordPayment',
    'getPaymentProof',
  ] as const)('guards %s with session and staff roles', (method) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UsersOnProgramsController.prototype[method])).toEqual([
      ManagedSessionGuard,
      RoleGuard,
    ]);
  });
});
