import { Prisma } from '@prisma/client';
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
