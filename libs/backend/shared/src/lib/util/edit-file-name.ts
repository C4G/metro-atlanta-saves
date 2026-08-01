import { extname } from 'path';

export const editFileName = (
  _: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  const name = file.originalname
    .split('.')[0]
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase();
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};
