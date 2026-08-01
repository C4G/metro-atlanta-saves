import { Prisma } from '@prisma/client';
export type ExtendedProgram = Prisma.ProgramGetPayload<{
  include: {
    checkpointNames: true;
  };
}>;
