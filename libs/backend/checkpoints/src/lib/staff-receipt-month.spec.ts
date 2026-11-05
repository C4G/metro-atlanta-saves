jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-mail', () => ({ MailService: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({ AuthService: class AuthService {} }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));

import { UnauthorizedException } from '@nestjs/common';
import { CheckpointsController } from './checkpoints.controller';

type Args = ConstructorParameters<typeof CheckpointsController>;

describe('Staff receipt months', () => {
  const ensureParticipantReceiptMonth = jest.fn().mockResolvedValue({ id: 'entry-6', images: [] });
  const controller = new CheckpointsController(
    { ensureParticipantReceiptMonth } as unknown as Args[0],
    { findOne: async () => ({ partnerId: 'partner-1' }) } as unknown as Args[1],
    {} as Args[2],
    {} as Args[3],
  );
  const request = (role: string, partnerId: string | null) =>
    ({ user: { id: 'staff', role, partnerId } }) as Parameters<CheckpointsController['ensureReceiptMonth']>[0];

  beforeEach(() => jest.clearAllMocks());

  it('finds or creates the participant month for the program partner’s staff', async () => {
    await expect(
      controller.ensureReceiptMonth(request('Partner_Staff', 'partner-1'), 'program-1', 'person-1', 'Month 6'),
    ).resolves.toEqual({ id: 'entry-6', images: [] });
    expect(ensureParticipantReceiptMonth).toHaveBeenCalledWith('person-1', 'program-1', 'Month 6');
  });

  it('refuses staff from another partner', async () => {
    await expect(
      controller.ensureReceiptMonth(request('Partner_Staff', 'other'), 'program-1', 'person-1', 'Month 6'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(ensureParticipantReceiptMonth).not.toHaveBeenCalled();
  });
});
