import { User } from '@prisma/client';

export type UserFull = Omit<User, 'hash' | 'forgot'> & { accessToken?: string; firstProgramId?: string };
