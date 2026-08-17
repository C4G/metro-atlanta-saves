import { PrismaClient } from '@mas/prisma-client';

export const seedDiscussionTags = async (prisma: PrismaClient) => {
  const hasData = await prisma.discussionTag.findFirst();

  if (hasData) {
    console.log('Discussion tags already seeded.');
    return;
  }

  const data = await prisma.discussionTag.createMany({
    data: [
      {
        name: 'General',
        color: 'blue',
      },
      {
        name: 'Questions',
        color: 'green',
      },
      {
        name: 'Announcements',
        color: 'red',
      },
      {
        name: 'Resources',
        color: 'orange',
      },
      {
        name: 'Help',
        color: 'purple',
      },
      {
        name: 'Achievements',
        color: 'yellow',
      },
    ],
  });

  console.log(`Discussion tags seeded: ${data.count} tags created`);
};
