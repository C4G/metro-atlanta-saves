import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('@mas/backend-checkpoints', () => ({ CheckpointsService: class CheckpointsService {} }));
jest.mock('@mas/backend-prisma', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@mas/backend-shared', () => ({ formatCurrency: { format: (value: number) => String(value) } }));
jest.mock('@mas/models', () => ({}));

import { UsersOnProgramsService } from './users-on-programs.service';

describe('UsersOnProgramsService requirement actions', () => {
  const findEnrollment = jest.fn();
  const findRequirement = jest.fn();
  const upsertCompletion = jest.fn();
  const findManyUsersOnPrograms = jest.fn();
  const getTotalAmountSaved = jest.fn();

  let service: UsersOnProgramsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersOnProgramsService(
      {
        usersOnPrograms: {
          findUnique: findEnrollment,
          findMany: findManyUsersOnPrograms,
        },
        requirement: { findUnique: findRequirement },
        requirementCompletion: { upsert: upsertCompletion },
      } as any,
      { getTotalAmountSaved } as any,
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
});
