jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_MINUTE: '* * * * *' },
}));

import { RequirementReminderStatus } from '@mas/prisma-client';
import { Logger } from '@nestjs/common';
import { RequirementRemindersService } from './requirement-reminders.service';

describe('RequirementRemindersService', () => {
  const requirementFindUnique = jest.fn();
  const usersOnProgramsFindMany = jest.fn();
  const deliveryCreateMany = jest.fn();
  const deliveryUpdateMany = jest.fn();
  const deliveryFindUnique = jest.fn();
  const transactionQueryRaw = jest.fn();
  const sendRequirementDueReminder = jest.fn();
  let service: RequirementRemindersService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const prisma = {
      requirement: { findUnique: requirementFindUnique },
      usersOnPrograms: { findMany: usersOnProgramsFindMany },
      requirementReminderDelivery: {
        createMany: deliveryCreateMany,
        updateMany: deliveryUpdateMany,
        findUnique: deliveryFindUnique,
      },
      $transaction: jest.fn((work: (transaction: { $queryRaw: typeof transactionQueryRaw }) => unknown) =>
        work({ $queryRaw: transactionQueryRaw }),
      ),
    };

    service = new RequirementRemindersService(prisma as any, { sendRequirementDueReminder } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reconciles idempotent pending rows for enrolled learners without either completion type', async () => {
    const dueAt = new Date('2027-02-01T17:00:00.000Z');
    requirementFindUnique.mockResolvedValue({
      id: 'requirement-1',
      programId: 'program-1',
      dueAt,
      reminderDaysBefore: 1,
    });
    usersOnProgramsFindMany.mockResolvedValue([
      { userId: 'learner-1', programId: 'program-1', requirementStatus: [] },
      { userId: 'learner-2', programId: 'program-1', requirementStatus: ['other-requirement'] },
      { userId: 'learner-3', programId: 'program-1', requirementStatus: ['requirement-1'] },
    ]);

    await service.reconcileRequirement('requirement-1');
    await service.reconcileRequirement('requirement-1');

    expect(usersOnProgramsFindMany).toHaveBeenCalledWith({
      where: {
        programId: 'program-1',
        requirementCompletions: { none: { requirementId: 'requirement-1' } },
      },
      select: { userId: true, programId: true, requirementStatus: true },
    });
    expect(deliveryCreateMany).toHaveBeenCalledTimes(2);
    for (const [call] of deliveryCreateMany.mock.calls) {
      expect(call.skipDuplicates).toBe(true);
      expect(call.data).toHaveLength(2);
      expect(call.data.map(({ userId }: { userId: string }) => userId)).toEqual(['learner-1', 'learner-2']);
      expect(call.data[0]).toMatchObject({
        requirementId: 'requirement-1',
        dueAtSnapshot: dueAt,
        reminderDaysBefore: 1,
        status: RequirementReminderStatus.PENDING,
      });
      expect(call.data[0].scheduledAt.toISOString()).toBe('2027-01-31T14:00:00.000Z');
    }
    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requirementId: 'requirement-1',
          status: RequirementReminderStatus.PENDING,
          OR: expect.any(Array),
        }),
      }),
    );
    expect(deliveryUpdateMany.mock.calls[0][0].data.status).toBe(RequirementReminderStatus.CANCELLED);
    expect(deliveryUpdateMany.mock.calls[0][0].where.OR).toEqual([
      { dueAtSnapshot: { not: dueAt } },
      { reminderDaysBefore: { not: 1 } },
    ]);
  });

  it('cancels pending rows when the requirement no longer has a due date or reminder', async () => {
    requirementFindUnique.mockResolvedValue({
      id: 'requirement-1',
      programId: 'program-1',
      dueAt: null,
      reminderDaysBefore: null,
    });

    await service.reconcileRequirement('requirement-1');

    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requirementId: 'requirement-1', status: RequirementReminderStatus.PENDING },
        data: expect.objectContaining({ status: RequirementReminderStatus.CANCELLED }),
      }),
    );
    expect(usersOnProgramsFindMany).not.toHaveBeenCalled();
  });

  it('sends a due delivery and marks it sent', async () => {
    const dueAt = new Date(Date.now() + 86_400_000);
    const claimed = {
      id: 'delivery-1',
      userId: 'learner-1',
      programId: 'program-1',
      requirementId: 'requirement-1',
      dueAtSnapshot: dueAt,
      reminderDaysBefore: 1,
    };
    transactionQueryRaw.mockResolvedValueOnce([claimed]);
    deliveryFindUnique.mockResolvedValue({
      ...claimed,
      status: RequirementReminderStatus.PROCESSING,
      attemptCount: 1,
      requirement: {
        id: 'requirement-1',
        name: 'Attend a workshop',
        dueAt,
        reminderDaysBefore: 1,
        program: { name: 'Career Launch' },
      },
      userOnProgram: {
        user: { email: 'learner@example.com', firstName: 'Sam' },
        requirementStatus: [],
        requirementCompletions: [],
      },
    });

    await service.dispatchDue();

    expect(sendRequirementDueReminder).toHaveBeenCalledWith({
      email: 'learner@example.com',
      firstName: 'Sam',
      requirementName: 'Attend a workshop',
      programName: 'Career Launch',
      dueAt,
      programId: 'program-1',
    });
    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1', status: RequirementReminderStatus.PROCESSING },
        data: expect.objectContaining({ status: RequirementReminderStatus.SENT }),
      }),
    );
    expect(transactionQueryRaw.mock.calls[0][0].join(' ')).toContain('FOR UPDATE SKIP LOCKED');
  });

  it('skips delivery for a learner with a legacy completion', async () => {
    const dueAt = new Date(Date.now() + 86_400_000);
    transactionQueryRaw.mockResolvedValueOnce([
      {
        id: 'delivery-1',
        userId: 'learner-1',
        programId: 'program-1',
        requirementId: 'requirement-1',
        dueAtSnapshot: dueAt,
        reminderDaysBefore: 1,
      },
    ]);
    deliveryFindUnique.mockResolvedValue({
      id: 'delivery-1',
      status: RequirementReminderStatus.PROCESSING,
      attemptCount: 1,
      dueAtSnapshot: dueAt,
      reminderDaysBefore: 1,
      programId: 'program-1',
      requirement: { id: 'requirement-1', dueAt, reminderDaysBefore: 1 },
      userOnProgram: {
        user: { email: 'learner@example.com', firstName: 'Sam' },
        requirementStatus: ['requirement-1'],
        requirementCompletions: [],
      },
    });

    await service.dispatchDue();

    expect(sendRequirementDueReminder).not.toHaveBeenCalled();
    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1', status: RequirementReminderStatus.PROCESSING },
        data: expect.objectContaining({ status: RequirementReminderStatus.SKIPPED }),
      }),
    );
  });

  it('skips delivery for a learner with a timestamped completion', async () => {
    const dueAt = new Date(Date.now() + 86_400_000);
    transactionQueryRaw.mockResolvedValueOnce([
      {
        id: 'delivery-1',
        userId: 'learner-1',
        programId: 'program-1',
        requirementId: 'requirement-1',
        dueAtSnapshot: dueAt,
        reminderDaysBefore: 1,
      },
    ]);
    deliveryFindUnique.mockResolvedValue({
      id: 'delivery-1',
      status: RequirementReminderStatus.PROCESSING,
      attemptCount: 1,
      dueAtSnapshot: dueAt,
      reminderDaysBefore: 1,
      programId: 'program-1',
      requirement: { id: 'requirement-1', dueAt, reminderDaysBefore: 1 },
      userOnProgram: {
        user: { email: 'learner@example.com', firstName: 'Sam' },
        requirementStatus: [],
        requirementCompletions: [{ requirementId: 'requirement-1' }],
      },
    });

    await service.dispatchDue();

    expect(sendRequirementDueReminder).not.toHaveBeenCalled();
    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1', status: RequirementReminderStatus.PROCESSING },
        data: expect.objectContaining({ status: RequirementReminderStatus.SKIPPED }),
      }),
    );
  });

  it('returns expired processing rows to pending so a restart can resume them', async () => {
    transactionQueryRaw.mockResolvedValueOnce([]);

    await service.dispatchDue();

    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: RequirementReminderStatus.PROCESSING,
          leaseExpiresAt: { lte: expect.any(Date) },
        },
        data: expect.objectContaining({ status: RequirementReminderStatus.PENDING, leaseExpiresAt: null }),
      }),
    );
    expect(sendRequirementDueReminder).not.toHaveBeenCalled();
  });

  it('reschedules a failed email attempt with retry state', async () => {
    const dueAt = new Date(Date.now() + 86_400_000);
    transactionQueryRaw.mockResolvedValueOnce([
      {
        id: 'delivery-1',
        userId: 'learner-1',
        programId: 'program-1',
        requirementId: 'requirement-1',
        dueAtSnapshot: dueAt,
        reminderDaysBefore: 1,
      },
    ]);
    deliveryFindUnique.mockResolvedValue({
      id: 'delivery-1',
      status: RequirementReminderStatus.PROCESSING,
      attemptCount: 1,
      dueAtSnapshot: dueAt,
      reminderDaysBefore: 1,
      programId: 'program-1',
      requirement: {
        id: 'requirement-1',
        name: 'Requirement',
        dueAt,
        reminderDaysBefore: 1,
        program: { name: 'Program' },
      },
      userOnProgram: {
        user: { email: 'learner@example.com', firstName: 'Sam' },
        requirementStatus: [],
        requirementCompletions: [],
      },
    });
    sendRequirementDueReminder.mockRejectedValueOnce(new Error('mail unavailable'));
    const startedAt = Date.now();

    await service.dispatchDue();

    const retryUpdate = deliveryUpdateMany.mock.calls.find(
      ([call]) => call.where?.id === 'delivery-1' && call.data?.lastError === 'mail unavailable',
    )?.[0];
    expect(retryUpdate).toBeDefined();
    expect(retryUpdate.data.status).toBe(RequirementReminderStatus.PENDING);
    expect(retryUpdate.data.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(startedAt + 59_000);
    expect(retryUpdate.data.nextAttemptAt.getTime()).toBeLessThanOrEqual(Date.now() + 61_000);
  });

  it('retains the final error after the retry limit is exhausted', async () => {
    const dueAt = new Date(Date.now() + 86_400_000);
    transactionQueryRaw.mockResolvedValueOnce([
      {
        id: 'delivery-1',
        userId: 'learner-1',
        programId: 'program-1',
        requirementId: 'requirement-1',
        dueAtSnapshot: dueAt,
        reminderDaysBefore: 1,
      },
    ]);
    deliveryFindUnique.mockResolvedValue({
      id: 'delivery-1',
      status: RequirementReminderStatus.PROCESSING,
      attemptCount: 5,
      dueAtSnapshot: dueAt,
      reminderDaysBefore: 1,
      programId: 'program-1',
      requirement: {
        id: 'requirement-1',
        name: 'Requirement',
        dueAt,
        reminderDaysBefore: 1,
        program: { name: 'Program' },
      },
      userOnProgram: {
        user: { email: 'learner@example.com', firstName: 'Sam' },
        requirementStatus: [],
        requirementCompletions: [],
      },
    });
    sendRequirementDueReminder.mockRejectedValueOnce(new Error('mail permanently unavailable'));

    await service.dispatchDue();

    expect(deliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'delivery-1', status: RequirementReminderStatus.PROCESSING },
        data: expect.objectContaining({
          status: RequirementReminderStatus.FAILED,
          nextAttemptAt: null,
          lastError: 'mail permanently unavailable',
        }),
      }),
    );
  });
});
