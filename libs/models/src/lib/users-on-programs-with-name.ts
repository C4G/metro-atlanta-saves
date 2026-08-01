import { UsersOnPrograms } from '@prisma/client';

export type UsersOnProgramsWithName = UsersOnPrograms & {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLogin?: Date | null;
  bio?: string | null;
  totalAmountSaved?: number;
};
