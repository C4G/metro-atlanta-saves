import { PrismaClient } from '@prisma/client';

export const seedUserCheckpoints = async (prisma: PrismaClient) => {
  const hasData = await prisma.checkpoint.count();
  if (hasData) {
    console.log('No checkpoints seeded.');
    return;
  }
  const program = await prisma.program.findFirst({
    select: { id: true },
    where: { name: { contains: 'Pilot' } },
  });
  if (program?.id) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'basic@test.com' } },
    });
    if (user?.id) {
      const data = await prisma.checkpoint.createMany({
        data: [
          {
            userId: user.id,
            name: 'Month 1',
            programId: program.id,
            savedMoney: 100,
            creditScore: 620,
          },
          {
            userId: user.id,
            name: 'Month 2',
            programId: program.id,
            savedMoney: 200,
            creditScore: 630,
          },
        ],
      });
      console.log('Checkpoints seeded: ', { data });
    }
  }
};
