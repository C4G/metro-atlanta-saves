import { CheckpointsService } from './checkpoints.service';

jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-mail', () => ({ MailService: class {} }));

describe('Receipt review notifications', () => {
  it.each([true, false])('persists reviewed=%s even when notification delivery fails', async (reviewed) => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const sendCheckpointImageChanged = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const checkpoint = { id: 'month-id', userId: 'participant', name: 'Month 1', images: [] };
    const service = new CheckpointsService(
      {
        checkpoint: { findUnique: jest.fn().mockResolvedValue(checkpoint) },
        image: { updateMany },
        user: { findUnique: jest.fn().mockResolvedValue({ email: 'participant@example.com' }) },
      } as never,
      { sendCheckpointImageChanged } as never,
    );
    await expect(reviewed ? service.approve('month-id') : service.reject('month-id')).resolves.toEqual(checkpoint);
    expect(updateMany).toHaveBeenCalledWith({ where: { checkpointId: 'month-id' }, data: { imageVerified: reviewed } });
    expect(sendCheckpointImageChanged).toHaveBeenCalledWith(reviewed, 'participant@example.com', 'Month 1');
  });
});
