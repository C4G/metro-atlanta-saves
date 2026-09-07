jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(),
}));

import { RichTextImagesController } from './rich-text-images.controller';
import { UPLOAD_DIR } from '@mas/backend-shared';

describe('RichTextImagesController', () => {
  it('returns a public rich-text asset URL for an accepted image', () => {
    const controller = new RichTextImagesController();
    const result = controller.upload({
      mimetype: 'image/png',
      path: `${UPLOAD_DIR}/assets/rich-text/photo.png`,
    } as Express.Multer.File);

    expect(result).toEqual({ url: '/assets/rich-text/photo.png' });
  });

  it('rejects unsupported image types', () => {
    const controller = new RichTextImagesController();

    expect(() =>
      controller.upload({
        mimetype: 'application/pdf',
        path: `${UPLOAD_DIR}/assets/rich-text/file.pdf`,
      } as Express.Multer.File),
    ).toThrow();
  });
});
