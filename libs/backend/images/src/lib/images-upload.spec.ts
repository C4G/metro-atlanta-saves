jest.mock('@thallesp/nestjs-better-auth', () => ({ AuthService: class AuthService {} }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));

import { ImagesController } from './images.controller';
import { ForbiddenException, Logger } from '@nestjs/common';

describe('Monthly receipt ownership', () => {
  const addOrReplaceImage = jest.fn().mockResolvedValue({ id: 'receipt-1' });
  const findOne = jest.fn();
  const sendPartnerStaffImageAdded = jest.fn().mockResolvedValue(undefined);
  const getPartnerEmails = jest.fn().mockResolvedValue(['staff@example.com']);
  const controller = new ImagesController(
    { addOrReplaceImage } as unknown as ConstructorParameters<typeof ImagesController>[0],
    { findOne } as unknown as ConstructorParameters<typeof ImagesController>[1],
    {
      getProgramsForUser: async () => [{ id: 'program-1' }],
      findOne: async () => ({ partnerId: 'partner-1' }),
    } as unknown as ConstructorParameters<typeof ImagesController>[2],
    { sendPartnerStaffImageAdded } as unknown as ConstructorParameters<typeof ImagesController>[3],
    { getPartnerEmails } as unknown as ConstructorParameters<typeof ImagesController>[4],
  );
  const request = { user: { id: 'participant-1', role: 'Participant' } } as Parameters<
    ImagesController['addImages']
  >[0];
  beforeEach(() => jest.clearAllMocks());
  it.each([
    null,
    { programId: 'other-program', userId: 'participant-1' },
    { programId: 'program-1', userId: 'other-person' },
  ])('rejects a missing, cross-program, or another participant’s checkpoint', async (checkpoint) => {
    findOne.mockResolvedValue(checkpoint);
    await expect(controller.addImages(request, [], 'program-1', 'month-1')).rejects.toThrow(ForbiddenException);
    expect(addOrReplaceImage).not.toHaveBeenCalled();
  });
  it('stores receipts with the authenticated owner and their monthly checkpoint', async () => {
    findOne.mockResolvedValue({ id: 'month-1', programId: 'program-1', userId: 'participant-1' });
    const file = { mimetype: 'application/pdf' } as Express.Multer.File;
    await controller.addImages(request, [file], 'program-1', 'month-1');
    expect(addOrReplaceImage).toHaveBeenCalledWith(file, 'program-1', 'month-1', 'participant-1');
  });
  it('preserves a saved receipt and handles email rejection without terminating the process', async () => {
    findOne.mockResolvedValue({ id: 'month-1', programId: 'program-1', userId: 'participant-1' });
    sendPartnerStaffImageAdded.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    try {
      await expect(
        controller.addImages(request, [{ mimetype: 'application/pdf' } as Express.Multer.File], 'program-1', 'month-1'),
      ).resolves.toEqual([{ id: 'receipt-1' }]);
      expect(sendPartnerStaffImageAdded).toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('Receipt saved, but the staff notification could not be delivered.');
    } finally {
      warn.mockRestore();
    }
  });
  it('does not attempt to send a notification without recipients', async () => {
    getPartnerEmails.mockResolvedValueOnce([]);
    await controller.addImages(
      request,
      [{ mimetype: 'application/pdf' } as Express.Multer.File],
      'program-1',
      'month-1',
    );
    expect(sendPartnerStaffImageAdded).not.toHaveBeenCalled();
  });
});
