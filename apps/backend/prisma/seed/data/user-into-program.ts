import { PrismaClient } from '@prisma/client';

export const seedUserIntoProgram = async (prisma: PrismaClient) => {
  const program = await prisma.program.findFirst({
    select: { id: true },
    where: { name: { contains: 'Pilot' } },
  });
  if (program?.id) {
    const userCount = await prisma.usersOnPrograms.count({
      where: { programId: program?.id },
    });
    if (userCount !== 0) {
      console.log('User already seeded into program.');
      return;
    }
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'basic@test.com' } },
    });
    if (user?.id) {
      const data = await prisma.usersOnPrograms.createMany({
        data: [
          {
            userId: user.id,
            programId: program.id,
          },
        ],
      });
      console.log('User seeded into program: ', { data });
    }
  }
};
