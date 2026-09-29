import { User } from '@mas/prisma-client/browser';

export type UserFull = User & { firstProgramId?: string };
