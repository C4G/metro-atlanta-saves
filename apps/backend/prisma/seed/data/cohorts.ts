import { PrismaClient } from '@prisma/client';

export const seedCohorts = async (prisma: PrismaClient) => {
  const hasData = await prisma.cohort.count();

  if (hasData) {
    console.log('No cohorts seeded.');
    return;
  }

  const data = await prisma.cohort.createMany({
    data: [
      {
        name: 'Pilot',
        description: 'This is the first pilot cohort',
        imageUrl: 'https://via.placeholder.com/150',
      },
    ],
  });

  console.log('cohorts added: ', { data });
};
