import { PrismaClient } from '@mas/prisma-client';

export const seedContentsOnCategories = async (prisma: PrismaClient) => {
  const hasData = await prisma.educationalContentsOnEducationalCategories.count();

  if (hasData) {
    console.log('No EducationalContentsOnCategories seeded.');
    return;
  }

  const category1 = await prisma.educationalCategory.findFirst({
    select: { id: true },
    where: { category: 'Category 1' },
  });

  const category2 = await prisma.educationalCategory.findFirst({
    select: { id: true },
    where: { category: 'Category 2' },
  });

  const content1 = await prisma.educationalContent.findFirst({
    select: { id: true },
    where: { title: 'Test Content 1' },
  });

  const content2 = await prisma.educationalContent.findFirst({
    select: { id: true },
    where: { title: 'Test Content 2' },
  });

  if (category1 && content1 && category2 && content2) {
    const data = await prisma.educationalContentsOnEducationalCategories.createMany({
      data: [
        { categoryId: category1.id, contentId: content1.id },
        { categoryId: category2.id, contentId: content2.id },
      ],
    });

    console.log('EducationalContentsOnCategories added: ', { data });
  }
};
