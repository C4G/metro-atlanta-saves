import { Prisma } from '@prisma/client';

export type ExtendedCheckpoint = Prisma.CheckpointGetPayload<{
  include: {
    images: true;
  };
}>;
