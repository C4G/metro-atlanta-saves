import { Prisma } from '@prisma/client';

export type UserOnProgramAgg = Prisma.UsersOnProgramsGetPayload<{
  include: {
    user: {
      select: { firstName: true; lastName: true };
    };
    program: {
      select: { name: true; Requirement: { include: { EducationalContent: true } } };
    };
    checkpoints: {
      include: { checkpointName: true; images: true };
      orderBy: [{ createdAt: 'desc' }];
    };
  };
}>;
