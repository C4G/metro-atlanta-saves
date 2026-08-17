import { PrismaClient } from '@mas/prisma-client';

export const seedNotificationConfig = async (prisma: PrismaClient) => {
  const hasData = await prisma.notificationConfig.count();

  if (hasData) {
    console.log('No notification config seeded.');
    return;
  }

  const pilotProgram = await prisma.program.findFirst({
    select: { id: true },
    where: { name: { contains: 'Pilot' } },
  });

  const data = await prisma.notificationConfig.create({
    data: {
      heading: 'New Educational Content Available on BRPATL!',
      body: 'We have uploaded new educational content to help you on your journey. Check it out now by clicking the link below.',
      programId: pilotProgram?.id ?? null,
    },
  });

  console.log('Notification config seeded: ', { data });
};
