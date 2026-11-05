jest.mock('@thallesp/nestjs-better-auth', () => ({ AuthService: class AuthService {} }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ImagesController } from './images.controller';

type Args = ConstructorParameters<typeof ImagesController>;

describe('Filing a receipt under a month', () => {
  const findByImageId = jest.fn();
  const updateImage = jest.fn().mockResolvedValue({ id: 'receipt-1', checkpointId: 'entry-2' });
  const ensureParticipantReceiptMonth = jest.fn().mockResolvedValue({ id: 'entry-2' });
  let controller: ImagesController;
  beforeEach(() => {
    jest.clearAllMocks();
    findByImageId.mockResolvedValue({ id: 'receipt-1', userId: 'owner', checkpointId: null, programId: 'program-1' });
    controller = new ImagesController(
      { findByImageId, updateImage } as unknown as Args[0],
      { ensureParticipantReceiptMonth } as unknown as Args[1],
      { getPartnerId: async () => 'partner-1' } as unknown as Args[2],
      {} as Args[3],
      {} as Args[4],
    );
  });
  const request = (role: string | null, partnerId: string | null) =>
    ({ user: { id: 'staff', role, partnerId } }) as Parameters<ImagesController['assignMonth']>[0];

  it('creates the owner’s month entry when needed and files the receipt there', async () => {
    await controller.assignMonth(request('Partner_Staff', 'partner-1'), 'receipt-1', { month: 2 });

    expect(ensureParticipantReceiptMonth).toHaveBeenCalledWith('owner', 'program-1', 'Month 2');
    expect(updateImage).toHaveBeenCalledWith('receipt-1', undefined, 'entry-2');
  });

  it('only lets the program partner’s staff file receipts', async () => {
    await expect(
      controller.assignMonth(request('Partner_Staff', 'other-partner'), 'receipt-1', { month: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.assignMonth(request(null, null), 'receipt-1', { month: 2 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(updateImage).not.toHaveBeenCalled();
  });

  it('refuses a shared program file that has no participant', async () => {
    findByImageId.mockResolvedValue({ id: 'guide', userId: null, checkpointId: null, programId: 'program-1' });

    await expect(
      controller.assignMonth(request('Partner_Staff', 'partner-1'), 'guide', { month: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
