import { PrismaClient } from '@prisma/client';

export const seedDescription = async (prisma: PrismaClient) => {
  const hasData = await prisma.description.count();

  if (hasData) {
    console.log('No description seeded.');
    return;
  }

  const data = await prisma.description.createMany({
    data: [
      {
        title: 'FINANCIAL WELLBEING ALLIANCE',
        body: `<p>United Way and its partners offer several innovative financial wellbeing programs:</p>
        <ol>
          <li>Financial Achievement Club (FAC)</li>
          <li>Wealth Builders United (WBU) Investment Club</li>
          <li>Building Resilient Professionals (BRP)</li>
          <li>Building Resilient Entrepreneurs (BRE)</li>
          <li>Credit Club</li>
          <li>Loans Club</li>
        </ol>`,
        buttonText: 'Enroll Now',
        buttonLink: 'https://forms.gle/BReECEU3cD6c2Ybh7',
      },
    ],
  });

  console.log('description added: ', { data });
};
