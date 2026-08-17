import { Prisma } from '@mas/prisma-client/browser';

export type ExtendedCheckpoint = Prisma.CheckpointGetPayload<{
  include: {
    images: true;
  };
}>;
