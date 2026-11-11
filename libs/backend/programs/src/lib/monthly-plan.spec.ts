import { BadRequestException, ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SaveMonthlyPlanDto } from './dto/save-monthly-plan.dto';
import { ProgramsService } from './programs.service';

describe('ProgramsService.saveMonthlyPlan', () => {
  const findUnique = jest.fn();
  const updateProgram = jest.fn();
  const updateRequirement = jest.fn();
  const createNames = jest.fn();
  const createRequirement = jest.fn();
  const deleteRequirements = jest.fn();
  let service: ProgramsService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue({
      checkpointNames: [{ name: 'Month 1' }, { name: 'Month 2' }, { name: 'Month 3' }, { name: 'Lunch Receipt' }],
      Requirement: [
        { id: 'task-1', month: 1 },
        { id: 'task-2', month: 3 },
      ],
    });
    const tx = {
      program: { findUnique, update: updateProgram },
      requirement: { update: updateRequirement, create: createRequirement, deleteMany: deleteRequirements },
      checkpointName: { createMany: createNames },
    };
    createRequirement.mockImplementation(({ data }) => Promise.resolve({ id: 'new-task', ...data }));
    service = new ProgramsService({ $transaction: jest.fn((callback) => callback(tx)) } as never);
  });

  it('sets the program months, keeps other checkpoints and moves tasks', async () => {
    await service.saveMonthlyPlan('program-1', {
      months: 2,
      assignments: [
        { requirementId: 'task-1', month: 2 },
        { requirementId: 'task-2', month: null },
      ],
    });

    expect(createNames).toHaveBeenCalledWith({
      data: [
        { name: 'Month 1', type: 'Savings', sequence: 1 },
        { name: 'Month 2', type: 'Savings', sequence: 2 },
      ],
      skipDuplicates: true,
    });
    expect(updateProgram.mock.calls[0][0].data.checkpointNames).toEqual({
      set: [{ name: 'Lunch Receipt' }, { name: 'Month 1' }, { name: 'Month 2' }],
    });
    expect(updateRequirement).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({ month: 2 }),
    });
    expect(updateRequirement).toHaveBeenCalledWith({
      where: { id: 'task-2' },
      data: expect.objectContaining({ month: null }),
    });
  });

  it('refuses to shorten the program past months that still have tasks', async () => {
    await expect(service.saveMonthlyPlan('program-1', { months: 2, assignments: [] })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(updateProgram).not.toHaveBeenCalled();
  });

  it.each([
    { requirementId: 'task-1', month: 4 },
    { requirementId: 'other-program-task', month: 1 },
  ])('rejects an assignment the program cannot hold: %p', async (assignment) => {
    await expect(service.saveMonthlyPlan('program-1', { months: 3, assignments: [assignment] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(updateRequirement).not.toHaveBeenCalled();
  });

  it('creates, edits and removes tasks in the same save', async () => {
    const result = await service.saveMonthlyPlan('program-1', {
      months: 3,
      assignments: [{ requirementId: 'task-1', month: 1, name: ' Budget review ', dueAt: null }],
      newTasks: [{ name: 'Upload bank statement', month: 2, educationalContentId: 'content-1' }],
      removedRequirementIds: ['task-2'],
    });

    expect(deleteRequirements).toHaveBeenCalledWith({ where: { id: { in: ['task-2'] }, programId: 'program-1' } });
    expect(updateRequirement).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({ month: 1, name: 'Budget review', dueAt: null, reminderDaysBefore: null }),
    });
    expect(createRequirement.mock.calls[0][0].data).toEqual({
      programId: 'program-1',
      name: 'Upload bank statement',
      month: 2,
      dueAt: null,
      educationalContentId: 'content-1',
    });
    expect(result.created).toHaveLength(1);
    expect(result.removedRequirementIds).toEqual(['task-2']);
  });

  it('lets a removed task free up the months being cut', async () => {
    await expect(
      service.saveMonthlyPlan('program-1', { months: 2, assignments: [], removedRequirementIds: ['task-2'] }),
    ).resolves.toEqual(expect.objectContaining({ months: 2 }));
  });

  it.each([{ newTasks: [{ name: 'Late task', month: 4 }] }, { removedRequirementIds: ['other-program-task'] }])(
    'rejects a plan change the program cannot hold: %p',
    async (change) => {
      await expect(
        service.saveMonthlyPlan('program-1', { months: 3, assignments: [], ...change }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(createRequirement).not.toHaveBeenCalled();
      expect(deleteRequirements).not.toHaveBeenCalled();
    },
  );

  it.each([
    { months: 0, assignments: [] },
    { months: 37, assignments: [] },
    { months: 2, assignments: [{ requirementId: 'task-1', month: 0 }] },
    { months: 2 },
    { months: 2, assignments: [], newTasks: [{ name: '', month: 1 }] },
    { months: 2, assignments: [], newTasks: [{ name: 'Task', month: 0 }] },
  ])('validates the incoming plan %p', async (body) => {
    expect((await validate(plainToInstance(SaveMonthlyPlanDto, body))).length).toBeGreaterThan(0);
  });
});

describe('ProgramsService frequently used tasks', () => {
  const upsert = jest.fn();
  const deleteMany = jest.fn();
  let service: ProgramsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProgramsService({
      program: { findUnique: jest.fn().mockResolvedValue({ partnerId: 'partner-1' }) },
      frequentTask: { upsert, deleteMany, findMany: jest.fn().mockResolvedValue([]) },
    } as never);
  });

  it('saves a starred task once per partner', async () => {
    await service.addFrequentTask('program-1', { name: '  Budgeting  ' });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { partnerId_name: { partnerId: 'partner-1', name: 'Budgeting' } },
        create: { partnerId: 'partner-1', name: 'Budgeting', educationalContentId: null },
      }),
    );
  });

  it('only removes a task that belongs to the program partner', async () => {
    deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.removeFrequentTask('program-1', 'task-9')).rejects.toBeInstanceOf(BadRequestException);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'task-9', partnerId: 'partner-1' } });
  });
});
