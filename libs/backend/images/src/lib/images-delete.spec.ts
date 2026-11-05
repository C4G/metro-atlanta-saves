jest.mock('@thallesp/nestjs-better-auth', () => ({ AuthService: class AuthService {} }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));
jest.mock('node:fs', () => ({ ...jest.requireActual('node:fs'), unlink: jest.fn() }));

import { ForbiddenException } from '@nestjs/common';
import { ImagesController } from './images.controller';

describe('Receipt deletion authorization', () => {
  const findByImageId = jest.fn();
  const deleteImage = jest.fn().mockResolvedValue({ path: 'test-receipt.pdf' });
  const findCheckpoint = jest.fn();
  let controller: ImagesController;
  beforeEach(() => {
    jest.clearAllMocks();
    findByImageId.mockResolvedValue({
      id: 'receipt-1',
      userId: 'owner',
      checkpointId: 'month-1',
      programId: 'program-1',
      imageVerified: false,
    });
    findCheckpoint.mockResolvedValue({ id: 'month-1', userId: 'owner' });
    controller = new ImagesController(
      { findByImageId, deleteImage } as unknown as ConstructorParameters<typeof ImagesController>[0],
      { findOne: findCheckpoint } as unknown as ConstructorParameters<typeof ImagesController>[1],
      { findOne: async () => ({ partnerId: 'partner-1' }) } as unknown as ConstructorParameters<
        typeof ImagesController
      >[2],
      {} as ConstructorParameters<typeof ImagesController>[3],
      {} as ConstructorParameters<typeof ImagesController>[4],
    );
  });
  const request = (id: string, role: string | null = null, partnerId: string | null = null) =>
    ({ user: { id, role, partnerId } }) as Parameters<ImagesController['deleteImage']>[0];
  it('rejects another participant and unrelated partner staff', async () => {
    await expect(controller.deleteImage(request('other-person'), 'receipt-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      controller.deleteImage(request('staff', 'Partner_Staff', 'other-partner'), 'receipt-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(deleteImage).not.toHaveBeenCalled();
  });
  it('allows the owner, the program’s partner staff, and administrators', async () => {
    for (const actor of [
      request('owner'),
      request('staff', 'Partner_Staff', 'partner-1'),
      request('admin', 'Administrator'),
    ]) {
      await controller.deleteImage(actor, 'receipt-1');
    }
    expect(deleteImage).toHaveBeenCalledTimes(3);
  });
  it('supports legacy checkpoint ownership and own unassigned receipts', async () => {
    findByImageId.mockResolvedValueOnce({ userId: null, checkpointId: 'month-1', programId: 'program-1' });
    await controller.deleteImage(request('owner'), 'receipt-1');
    findByImageId.mockResolvedValueOnce({ userId: 'owner', checkpointId: null, programId: 'program-1' });
    await controller.deleteImage(request('owner'), 'receipt-1');
    expect(deleteImage).toHaveBeenCalledTimes(2);
  });
  it('allows only administrators to delete verified receipts', async () => {
    findByImageId.mockResolvedValue({
      userId: 'owner',
      checkpointId: 'month-1',
      programId: 'program-1',
      imageVerified: true,
    });
    await expect(controller.deleteImage(request('owner'), 'receipt-1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.deleteImage(request('staff', 'Partner_Staff', 'partner-1'), 'receipt-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await controller.deleteImage(request('admin', 'Administrator'), 'receipt-1');
    expect(deleteImage).toHaveBeenCalledTimes(1);
  });
});
