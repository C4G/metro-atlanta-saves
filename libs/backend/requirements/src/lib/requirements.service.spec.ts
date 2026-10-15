jest.mock('@mas/backend-prisma', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@mas/backend-mail', () => ({ MailService: class MailService {} }));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_MINUTE: '* * * * *' },
}));

import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { RequirementsService } from './requirements.service';

describe('RequirementsService reminders', () => {
  const requirementCreate = jest.fn();
  const requirementFindUnique = jest.fn();
  const requirementUpdate = jest.fn();
  const reconcileRequirement = jest.fn();
  let service: RequirementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequirementsService(
      {
        requirement: {
          create: requirementCreate,
          findUnique: requirementFindUnique,
          update: requirementUpdate,
        },
      } as any,
      { reconcileRequirement } as any,
    );
  });

  it('saves the selected reminder and reconciles after requirement creation', async () => {
    const dueAt = '2027-02-01T17:00:00.000Z';
    requirementCreate.mockResolvedValue({ id: 'requirement-1', dueAt, reminderDaysBefore: 7 });

    await service.create('program-1', {
      name: 'Attend a workshop',
      dueAt,
      reminderDaysBefore: 7,
    });

    expect(requirementCreate).toHaveBeenCalledWith({
      data: {
        name: 'Attend a workshop',
        dueAt,
        reminderDaysBefore: 7,
        programId: 'program-1',
      },
    });
    expect(reconcileRequirement).toHaveBeenCalledWith('requirement-1');
  });

  it('rejects a reminder without a due date', async () => {
    await expect(
      service.create('program-1', { name: 'Attend a workshop', reminderDaysBefore: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(requirementCreate).not.toHaveBeenCalled();
  });

  it('validates a partial reminder update against the existing due timestamp', async () => {
    requirementFindUnique.mockResolvedValue({ dueAt: new Date('2027-02-01T17:00:00.000Z') });
    requirementUpdate.mockResolvedValue({ id: 'requirement-1', reminderDaysBefore: 1 });

    await service.update('requirement-1', { reminderDaysBefore: 1 });

    expect(requirementUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'requirement-1' },
        data: expect.objectContaining({ reminderDaysBefore: 1 }),
      }),
    );
    expect(requirementUpdate.mock.calls[0][0].data.dueAt).toBeUndefined();
    expect(reconcileRequirement).toHaveBeenCalledWith('requirement-1');
  });

  it('clears the reminder when the due timestamp is removed', async () => {
    requirementFindUnique.mockResolvedValue({ dueAt: new Date('2027-02-01T17:00:00.000Z') });
    requirementUpdate.mockResolvedValue({ id: 'requirement-1', dueAt: null, reminderDaysBefore: null });

    await service.update('requirement-1', { dueAt: null });

    expect(requirementUpdate.mock.calls[0][0].data).toMatchObject({ dueAt: null, reminderDaysBefore: null });
    expect(reconcileRequirement).toHaveBeenCalledWith('requirement-1');
  });

  it('rejects unsupported reminder offsets', async () => {
    requirementFindUnique.mockResolvedValue({ dueAt: new Date('2027-02-01T17:00:00.000Z') });

    await expect(service.update('requirement-1', { reminderDaysBefore: 3 as any })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(requirementUpdate).not.toHaveBeenCalled();
  });

  it('rejects enabling a reminder when the persisted requirement has no due date', async () => {
    requirementFindUnique.mockResolvedValue({ dueAt: null });

    await expect(service.update('requirement-1', { reminderDaysBefore: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(requirementUpdate).not.toHaveBeenCalled();
  });

  it('validates the DTO offset as one, seven, or null', async () => {
    const invalid = Object.assign(new CreateRequirementDto(), { name: 'Requirement', reminderDaysBefore: 3 });
    const disabled = Object.assign(new CreateRequirementDto(), { name: 'Requirement', reminderDaysBefore: null });
    const oneDay = Object.assign(new CreateRequirementDto(), { name: 'Requirement', reminderDaysBefore: 1 });

    expect((await validate(invalid)).map(({ property }) => property)).toContain('reminderDaysBefore');
    expect(await validate(disabled)).toEqual([]);
    expect(await validate(oneDay)).toEqual([]);
  });
});
