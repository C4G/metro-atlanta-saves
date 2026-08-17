import { User } from '@mas/prisma-client/browser';

export type UserFull = Omit<User, 'hash' | 'forgot'> & { accessToken?: string; firstProgramId?: string };
