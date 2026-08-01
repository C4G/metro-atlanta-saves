import { extname } from 'path';
import { v4 } from 'uuid';

export const guidFileName = (
  _: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  const fileExtName = extname(file.originalname);
  const randomName = v4();
  callback(null, `${randomName}${fileExtName}`);
};
