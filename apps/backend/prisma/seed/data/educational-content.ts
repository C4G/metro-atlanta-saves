import { PrismaClient } from '@prisma/client';

export const seedEducationalContent = async (prisma: PrismaClient) => {
  const hasData = await prisma.educationalContent.count();

  if (hasData) {
    console.log('No Educational Comtent seeded.');
    return;
  }

  const data = await prisma.educationalContent.createMany({
    data: [
      {
        title: 'Test Content 1',
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled",
        link: 'https://medium.com/',
        image: 'https://via.placeholder.com/150',
      },
      {
        title: 'Test Content 2',
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled",
        link: 'https://google.com/',
        image: 'https://via.placeholder.com/150',
      },
    ],
  });

  console.log('Educational Comtents added: ', { data });
};
