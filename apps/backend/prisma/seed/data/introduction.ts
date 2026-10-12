import { PrismaClient } from '@mas/prisma-client';

export const seedIntroduction = async (prisma: PrismaClient) => {
  const hasData = await prisma.introduction.count();

  if (hasData) {
    console.log('No introduction seeded.');
    return;
  }

  const data = await prisma.introduction.createMany({
    data: [
      {
        title: '1000 save $1000: Empowering financial futures together',
        titleEnding: 'Financial Wellbeing Alliance',
        imageText: 'Financial Wellbeing Alliance participants pose together in front of graduation decorations',
        imageUrl: '/assets/background/atlanta-cohort.webp',
      },
    ],
  });

  console.log('intorduction added: ', { data });
};
