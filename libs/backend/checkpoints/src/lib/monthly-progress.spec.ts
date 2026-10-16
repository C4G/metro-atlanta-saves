import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { CheckpointsService } from './checkpoints.service';
import { SaveMonthlyProgressDto } from './dto/save-monthly-progress.dto';

jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-mail', () => ({ MailService: class {} }));

describe('Participant monthly progress', () => {
  const enrollment = jest.fn();
  const entries = jest.fn();
  const update = jest.fn();
  const create = jest.fn();
  const transaction = jest.fn();
  let service: CheckpointsService;
  const body = { savedMoney: 200, creditScore: 640, application: ' Made progress ' };
  beforeEach(() => {
    jest.resetAllMocks();
    const tx = { usersOnPrograms: { findUnique: enrollment }, checkpoint: { findMany: entries, update, create } };
    transaction.mockImplementation((callback) => callback(tx));
    service = new CheckpointsService({ ...tx, $transaction: transaction } as never, {} as never);
    enrollment.mockResolvedValue({ program: { checkpointNames: [{ name: 'Month 3', type: 'Savings' }] } });
    entries.mockResolvedValue([]);
  });

  it('updates the enrolled participant’s existing blank month instead of creating another entry', async () => {
    entries.mockResolvedValue([{ id: 'existing-month', images: [] }]);
    await service.saveParticipantProgress('participant-1', 'program-1', 'Month 3', body);
    expect(enrollment).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_programId: { userId: 'participant-1', programId: 'program-1' } } }),
    );
    expect(entries).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'participant-1', programId: 'program-1', name: 'Month 3' } }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: 'existing-month' },
      data: { savedMoney: 200, creditScore: 640, application: 'Made progress' },
      include: { images: true },
    });
    expect(create).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('creates a missing configured month for the signed-in participant', async () => {
    await service.saveParticipantProgress('participant-1', 'program-1', 'Month 3', { savedMoney: 0 });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'participant-1',
        programId: 'program-1',
        name: 'Month 3',
        savedMoney: 0,
        creditScore: null,
        application: null,
      },
      include: { images: true },
    });
  });

  it('rejects access outside the participant’s enrollment', async () => {
    enrollment.mockResolvedValue(null);
    await expect(service.getParticipantProgress('participant-1', 'other-program')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.saveParticipantProgress('participant-1', 'other-program', 'Month 3', body),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a month that is not configured for the program', async () => {
    enrollment.mockResolvedValue({ program: { checkpointNames: [] } });
    await expect(
      service.saveParticipantProgress('participant-1', 'program-1', 'Month 99', body),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not overwrite verified progress', async () => {
    entries.mockResolvedValue([{ id: 'verified-month', images: [{ imageVerified: true }] }]);
    await expect(service.saveParticipantProgress('participant-1', 'program-1', 'Month 3', body)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('retries serialization conflicts to avoid concurrent duplicate entries', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    await service.saveParticipantProgress('participant-1', 'program-1', 'Month 3', body);
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it.each([-1, 1.001, NaN, Infinity])('rejects invalid savings amount %s', async (savedMoney) => {
    const dto = Object.assign(new SaveMonthlyProgressDto(), { savedMoney });
    expect((await validate(dto)).some((error) => error.property === 'savedMoney')).toBe(true);
  });
});
