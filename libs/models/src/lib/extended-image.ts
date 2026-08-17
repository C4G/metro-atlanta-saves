import { Prisma } from '@mas/prisma-client/browser';
export type ExtendedImage = Prisma.ImageGetPayload<{
  include: {
    user: {
      select: { firstName: true; lastName: true };
    };
    checkpoint: {
      select: { id: true; name: true };
    };
  };
}>;
