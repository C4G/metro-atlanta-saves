import { PrismaClient } from '@prisma/client';

export const seedIntroduction = async (prisma: PrismaClient) => {
  const hasData = await prisma.introduction.count();

  if (hasData) {
    console.log('No introduction seeded.');
    return;
  }

  const data = await prisma.introduction.createMany({
    data: [
      {
        title: 'BUILDING RESILIENT PROFESSIONALS',
        imageText: 'Atlanta Cohort Graduates',
        imageUrl: '/assets/background/atlanta-cohort.webp',
      },
    ],
  });

  console.log('intorduction added: ', { data });
};
