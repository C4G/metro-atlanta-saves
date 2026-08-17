import { PrismaClient } from '@mas/prisma-client';

export const seedStories = async (prisma: PrismaClient) => {
  const hasData = await prisma.story.count();

  if (hasData) {
    console.log('No stories seeded.');
    return;
  }

  const data = await prisma.story.createMany({
    data: [
      {
        name: 'Anita Wilson (participant)',
        description:
          'In class I learned the importance of networking and asking the right questions. Questions about the steps that person in the position that you want to be in one day and how they got there. The biggest takeaway is that I need to get on my grind if I expect to make any money in this business.',
        imageUrl: '/assets/about_us/Anita-Wilson.webp',
      },
      {
        name: 'Erika Howard (participant)',
        description:
          "Something new I learned was about the style of communication I have as well as my other coworkers and boss. I learned a lot about public speaking. I also learned that I am capable of saving. It always seemed impossible to do, but I did it and it wasn't that hard to do.",
        imageUrl: '/assets/about_us/Erika-Howard.webp',
      },
    ],
  });

  console.log('stories added: ', { data });
};
