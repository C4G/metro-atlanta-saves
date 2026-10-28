import { UsersOnPrograms } from '@mas/prisma-client/browser';

export type UsersOnProgramsWithName = UsersOnPrograms & {
  /** API compatibility projection derived from RequirementCompletion, never stored. */
  requirementStatus: string[];
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLogin?: Date | null;
  bio?: string | null;
  totalAmountSaved?: number;
  completedRequirementIds?: string[];
};
