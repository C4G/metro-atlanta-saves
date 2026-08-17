import { Prisma } from '@mas/prisma-client/browser';
export type ExtendedProgram = Prisma.ProgramGetPayload<{
  include: {
    checkpointNames: true;
  };
}>;
