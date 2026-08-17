import { PrismaClient } from '@mas/prisma-client';

export const seedWhatWeAre = async (prisma: PrismaClient) => {
  const hasData = await prisma.whatWeAre.count();

  if (hasData) {
    console.log('No whatWeAre seeded.');
    return;
  }

  const data = await prisma.whatWeAre.createMany({
    data: [
      {
        whoWeAreDescription:
          'Building Resilient Professionals is a coalition of champions and agencies who can lead discussions and engage others.',
        whatWeDoDescription:
          'Our goal is to initiate pilot programs that assist households and frontline staff in saving.',
      },
    ],
  });

  console.log('whatWeAre added: ', { data });
};
