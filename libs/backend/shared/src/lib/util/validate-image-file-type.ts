import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Validates if the uploaded file has an allowed MIME type for images
 */
export const validateImageFileType = (file: Express.Multer.File): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new UnprocessableEntityException([
      `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    ]);
  }
};
