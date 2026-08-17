import { PrismaClient } from '@mas/prisma-client';

export const seedCheckpointNames = async (prisma: PrismaClient) => {
  const hasData = await prisma.checkpointName.findFirst();

  if (hasData) {
    console.log('No checkpoint names seeded.');
    return;
  }

  const data = await prisma.checkpointName.createMany({
    data: [
      {
        name: 'Month 1',
        type: 'Savings',
      },
      {
        name: 'Month 2',
        type: 'Savings',
      },
      {
        name: 'Month 3',
        type: 'Savings',
      },
      {
        name: 'Month 4',
        type: 'Savings',
      },
      {
        name: 'Month 5',
        type: 'Savings',
      },
      {
        name: 'Month 6',
        type: 'Savings',
      },
      {
        name: 'Credit Check 1',
        type: 'Credit_Score',
      },
      {
        name: 'Credit Check 2',
        type: 'Credit_Score',
      },
      {
        name: 'Lunch Receipt',
        type: 'Receipt',
      },
      {
        name: 'Bonus',
        type: 'Other',
      },
    ],
  });

  console.log('checkpoint names added: ', { data });
};
