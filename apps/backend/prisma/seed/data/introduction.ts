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
        title: 'Financial wellbeing programs for Atlanta communities',
        titleEnding: 'Financial Wellbeing Alliance',
        imageText: 'Financial Wellbeing Alliance participants pose together in front of graduation decorations',
        imageUrl: '/assets/background/atlanta-cohort.webp',
      },
    ],
  });

  console.log('intorduction added: ', { data });
};
