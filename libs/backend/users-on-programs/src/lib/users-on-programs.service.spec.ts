import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('@mas/backend-checkpoints', () => ({ CheckpointsService: class CheckpointsService {} }));
jest.mock('@mas/backend-prisma', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@mas/backend-requirements', () => ({
  RequirementRemindersService: class RequirementRemindersService {},
}));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_MINUTE: '* * * * *' },
}));
jest.mock('@mas/backend-shared', () => ({ formatCurrency: { format: (value: number) => String(value) } }));
jest.mock('@mas/models', () => ({}));

import { UsersOnProgramsService } from './users-on-programs.service';

describe('UsersOnProgramsService requirement actions', () => {
  const findEnrollment = jest.fn();
  const findRequirement = jest.fn();
  const upsertCompletion = jest.fn();
  const deleteManyCompletions = jest.fn();
  const findManyUsersOnPrograms = jest.fn();
  const getTotalAmountSaved = jest.fn();
  const reconcileUserProgram = jest.fn();
  const userFindFirst = jest.fn();
  const findAllyOnProgram = jest.fn();
  const createUserOnProgram = jest.fn();
  const findCheckpointNames = jest.fn();
  const createCheckpoints = jest.fn();

  let service: UsersOnProgramsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersOnProgramsService(
      {
        usersOnPrograms: {
          findUnique: findEnrollment,
          findMany: findManyUsersOnPrograms,
          create: createUserOnProgram,
        },
        requirement: { findUnique: findRequirement },
        requirementCompletion: { deleteMany: deleteManyCompletions, upsert: upsertCompletion },
        user: { findFirst: userFindFirst },
        alliesOnPrograms: { findUnique: findAllyOnProgram },
        checkpointName: { findMany: findCheckpointNames },
        checkpoint: { createMany: createCheckpoints },
      } as any,
      { getTotalAmountSaved } as any,
      { reconcileUserProgram } as any,
    );
  });

  it('records an action completion once and returns its persisted timestamp', async () => {
    const completedAt = new Date('2026-10-12T18:30:00.000Z');
    findEnrollment.mockResolvedValue({ userId: 'learner-1' });
    findRequirement.mockResolvedValue({ programId: 'program-1', actionInstructions: 'Attend the meetup.' });
    upsertCompletion.mockResolvedValue({ requirementId: 'requirement-1', completedAt });

    await expect(service.completeRequirement('learner-1', 'program-1', 'requirement-1')).resolves.toEqual({
      requirementId: 'requirement-1',
      completedAt,
    });

    expect(upsertCompletion).toHaveBeenCalledWith({
      where: {
        userId_programId_requirementId: {
          userId: 'learner-1',
          programId: 'program-1',
          requirementId: 'requirement-1',
        },
      },
      create: { userId: 'learner-1', programId: 'program-1', requirementId: 'requirement-1' },
      update: {},
      select: { requirementId: true, completedAt: true },
    });
  });

  it('rejects learners who are not enrolled before looking up the requirement', async () => {
    findEnrollment.mockResolvedValue(null);

    await expect(service.completeRequirement('learner-1', 'program-1', 'requirement-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(findRequirement).not.toHaveBeenCalled();
    expect(upsertCompletion).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing requirement', null],
    ['a requirement from another program', { programId: 'program-2', actionInstructions: 'Attend the meetup.' }],
    ['a requirement without action instructions', { programId: 'program-1', actionInstructions: null }],
    ['a requirement with blank action instructions', { programId: 'program-1', actionInstructions: '  \n ' }],
  ])('rejects %s', async (_description, requirement) => {
    findEnrollment.mockResolvedValue({ userId: 'learner-1' });
    findRequirement.mockResolvedValue(requirement);

    await expect(service.completeRequirement('learner-1', 'program-1', 'requirement-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(upsertCompletion).not.toHaveBeenCalled();
  });

  it('combines legacy requirement status with timestamped completions without duplicates', async () => {
    findManyUsersOnPrograms.mockResolvedValue([
      {
        userId: 'learner-1',
        programId: 'program-1',
        requirementStatus: ['legacy-requirement', 'shared-requirement'],
        requirementCompletions: [{ requirementId: 'action-requirement' }, { requirementId: 'shared-requirement' }],
        user: { firstName: 'Learner', lastName: 'One' },
      },
    ]);
    getTotalAmountSaved.mockResolvedValue({ 'learner-1': 250 });

    const result = await service.getUsersOnPrograms('program-1');

    expect(result[0].completedRequirementIds).toEqual([
      'legacy-requirement',
      'shared-requirement',
      'action-requirement',
    ]);
    expect(result[0].totalAmountSaved).toBe(250);
  });

  it('returns due requirements only from programs in which the participant is enrolled', async () => {
    const dueAt = new Date('2026-10-20T23:59:00.000Z');
    findManyUsersOnPrograms.mockResolvedValue([
      {
        program: {
          id: 'program-1',
          name: 'Savings foundations',
          Requirement: [
            { id: 'requirement-1', name: 'Create a budget', dueAt, actionInstructions: 'Upload your budget.' },
          ],
        },
        requirementCompletions: [{ requirementId: 'requirement-1' }],
        requirementStatus: [],
      },
    ]);

    await expect(service.getParticipantRequirements('learner-1')).resolves.toEqual([
      {
        id: 'requirement-1',
        name: 'Create a budget',
        programId: 'program-1',
        programName: 'Savings foundations',
        dueAt,
        isCompleted: true,
        canComplete: true,
      },
    ]);
    expect(findManyUsersOnPrograms).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'learner-1' } }));
  });

  it('removes a completion only when the participant is enrolled in that program', async () => {
    findEnrollment.mockResolvedValue({ userId: 'learner-1' });
    deleteManyCompletions.mockResolvedValue({ count: 1 });

    await expect(service.uncompleteRequirement('learner-1', 'program-1', 'requirement-1')).resolves.toEqual({
      requirementId: 'requirement-1',
    });
    expect(deleteManyCompletions).toHaveBeenCalledWith({
      where: { userId: 'learner-1', programId: 'program-1', requirementId: 'requirement-1' },
    });
  });

  it('rejects an uncomplete request for a program the participant is not enrolled in', async () => {
    findEnrollment.mockResolvedValue(null);

    await expect(service.uncompleteRequirement('learner-1', 'program-1', 'requirement-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(deleteManyCompletions).not.toHaveBeenCalled();
  });

  it('reconciles requirement reminders after a learner enrolls', async () => {
    userFindFirst.mockResolvedValue({ id: 'learner-1' });
    findAllyOnProgram.mockResolvedValue(null);
    findEnrollment.mockResolvedValue(null);
    createUserOnProgram.mockResolvedValue({
      userId: 'learner-1',
      programId: 'program-1',
      requirementStatus: [],
      user: { email: 'learner@example.com', firstName: 'Sam', lastName: 'Learner' },
    });
    findCheckpointNames.mockResolvedValue([{ name: 'Initial Deposit' }]);
    createCheckpoints.mockResolvedValue({ count: 1 });

    await service.addUsersOnPrograms({ userId: 'learner-1', programId: 'program-1' } as any);

    expect(reconcileUserProgram).toHaveBeenCalledWith('program-1', 'learner-1');
  });
});
