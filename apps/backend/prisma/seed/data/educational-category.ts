import { PrismaClient } from '@prisma/client';

export const seedEducationalCategory = async (prisma: PrismaClient) => {
  const hasData = await prisma.educationalCategory.count();

  if (hasData) {
    console.log('No Educational Category seeded.');
    return;
  }

  const data = await prisma.educationalCategory.createMany({
    data: [{ category: 'Category 1' }, { category: 'Category 2' }],
  });

  console.log('Educational Categories added: ', { data });
};
