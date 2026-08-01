import { PrismaClient } from '@prisma/client';

export const seedAlliesIntoProgram = async (prisma: PrismaClient) => {
  const program = await prisma.program.findFirst({
    select: { id: true },
    where: { name: { contains: 'Pilot' } },
  });
  if (program?.id) {
    const userCount = await prisma.alliesOnPrograms.count({
      where: { programId: program?.id },
    });
    if (userCount !== 0) {
      console.log('Allies already seeded into program.');
      return;
    }
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'partner@test.com' } },
    });
    if (user?.id) {
      const data = await prisma.alliesOnPrograms.createMany({
        data: [
          {
            userId: user.id,
            programId: program.id,
          },
        ],
      });
      console.log('Allies seeded into program: ', { data });
    }
  }
};
