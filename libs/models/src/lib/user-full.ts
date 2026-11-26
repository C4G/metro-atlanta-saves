import { User } from '@mas/prisma-client/browser';

export type UserFull = Omit<User, 'emailUnsubscribedAt'> & { firstProgramId?: string };
