import { ConflictException, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
}));
import { ManagedSessionGuard, RoleGuard } from '@mas/backend-shared';
import { UsersOnProgramsController } from './users-on-programs.controller';
import { UsersOnProgramsService } from './users-on-programs.service';
import { VerifyRequirementDto } from './dto/verify-requirement.dto';

describe('Task verification', () => {
  const updateMany = jest.fn();
  const findUnique = jest.fn();
  const completedAt = '2026-10-16T12:00:00.000Z';
  let service: UsersOnProgramsService;
  beforeEach(() => {
    jest.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue({
      requirementId: 'task-1',
      completedAt: new Date(completedAt),
      verifiedAt: new Date(),
      verifiedBy: { id: 'staff-1', firstName: 'Sam', lastName: 'Lee' },
    });
    service = new UsersOnProgramsService(
      { $transaction: jest.fn((callback) => callback({ requirementCompletion: { updateMany, findUnique } })) } as never,
      {} as never,
      {} as never,
    );
  });
  it('verifies only the current enrolled participant submission for the selected program', async () => {
    await service.verifyRequirement('program-1', 'person-1', 'task-1', 'staff-1', { verified: true, completedAt });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        programId: 'program-1',
        userId: 'person-1',
        requirementId: 'task-1',
        completedAt: new Date(completedAt),
        requirement: { programId: 'program-1' },
      },
      data: { verifiedAt: expect.any(Date), verifiedById: 'staff-1' },
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_programId_requirementId: { userId: 'person-1', programId: 'program-1', requirementId: 'task-1' },
        },
      }),
    );
  });
  it('clears only staff verification, never the participant completion', async () => {
    await service.verifyRequirement('program-1', 'person-1', 'task-1', 'staff-1', { verified: false, completedAt });
    expect(updateMany.mock.calls[0][0].data).toEqual({ verifiedAt: null, verifiedById: null });
  });
  it('rejects missing, withdrawn, or stale submissions instead of creating a completion', async () => {
    updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.verifyRequirement('program-1', 'person-1', 'task-1', 'staff-1', { verified: true, completedAt }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('lists completed tasks from the recorded completions', async () => {
    const findRequirements = jest.fn().mockResolvedValue([{ id: 'task-1', name: 'Budget', dueAt: null }]);
    const findEnrollments = jest.fn().mockResolvedValue([
      {
        user: { id: 'person-1', firstName: 'Jordan', lastName: 'Lee', email: 'j@example.com' },
        requirementCompletions: [{ requirementId: 'task-1', completedAt: new Date('2026-03-02') }],
      },
    ]);
    const findProgram = jest.fn().mockResolvedValue({ startDate: null, checkpointNames: [] });
    service = new UsersOnProgramsService(
      {
        program: { findUnique: findProgram },
        requirement: { findMany: findRequirements },
        usersOnPrograms: { findMany: findEnrollments },
      } as never,
      {} as never,
      {} as never,
    );
    const result = await service.getTaskReview('program-1');
    expect(result.participants[0].requirementStatus).toEqual(['task-1']);
    expect(findEnrollments).toHaveBeenCalledWith(expect.objectContaining({ where: { programId: 'program-1' } }));
  });
  it('lists program months in order and ignores checkpoints that are not months', async () => {
    service = new UsersOnProgramsService(
      {
        program: {
          findUnique: jest.fn().mockResolvedValue({
            startDate: null,
            checkpointNames: [{ name: 'Month 10' }, { name: 'Bonus' }, { name: 'Month 2' }, { name: 'month 1' }],
          }),
        },
        requirement: { findMany: jest.fn().mockResolvedValue([]) },
        usersOnPrograms: { findMany: jest.fn().mockResolvedValue([]) },
      } as never,
      {} as never,
      {} as never,
    );
    const result = await service.getTaskReview('program-1');
    expect(result.months).toEqual([
      { name: 'month 1', number: 1 },
      { name: 'Month 2', number: 2 },
      { name: 'Month 10', number: 10 },
    ]);
  });
  it.each([
    { verified: 'true', completedAt },
    { verified: true, completedAt: 'not-a-date' },
    { completedAt },
    { verified: true },
  ])('validates incoming verification payload %p', async (body) => {
    expect((await validate(Object.assign(new VerifyRequirementDto(), body))).length).toBeGreaterThan(0);
  });
});

describe('Task review permissions', () => {
  const review = jest.fn();
  const verify = jest.fn();
  const findProgram = jest.fn().mockResolvedValue({ partnerId: 'partner-1' });
  let controller: UsersOnProgramsController;
  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersOnProgramsController(
      { getTaskReview: review, verifyRequirement: verify } as never,
      { findOne: findProgram } as never,
    );
  });
  const request = (role: string, partnerId: string) => ({ user: { id: 'staff-1', role, partnerId } }) as never;
  it.each(['getTaskReview', 'verifyRequirement'] as const)(
    'requires both session and staff-role guards on %s',
    (method) => {
      const handler = UsersOnProgramsController.prototype[method];
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([ManagedSessionGuard, RoleGuard]);
      const guard = new RoleGuard(new Reflector());
      const context = (role: string) =>
        ({
          getHandler: () => handler,
          switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
        }) as ExecutionContext;
      expect(guard.canActivate(context('Administrator'))).toBe(true);
      expect(guard.canActivate(context('Partner_Staff'))).toBe(true);
      expect(guard.canActivate(context('Participant'))).toBe(false);
      expect(guard.canActivate(context(''))).toBe(false);
    },
  );
  it('blocks staff from other partners for both reads and writes', async () => {
    await expect(controller.getTaskReview(request('Partner_Staff', 'partner-2'), 'program-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.verifyRequirement(request('Partner_Staff', 'partner-2'), 'program-1', 'person-1', 'task-1', {
        verified: true,
        completedAt: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(review).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });
  it.each([
    ['Partner_Staff', 'partner-1'],
    ['Administrator', 'other-partner'],
  ])('permits scoped review by %s', async (role, partnerId) => {
    const body = { verified: true, completedAt: new Date().toISOString() };
    await controller.getTaskReview(request(role, partnerId), 'program-1');
    await controller.verifyRequirement(request(role, partnerId), 'program-1', 'person-1', 'task-1', body);
    expect(verify).toHaveBeenCalledWith('program-1', 'person-1', 'task-1', 'staff-1', body);
  });
});
