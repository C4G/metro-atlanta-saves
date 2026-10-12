import { PrismaClient } from '@mas/prisma-client';

export const seedDescription = async (prisma: PrismaClient) => {
  const hasData = await prisma.description.count();

  if (hasData) {
    console.log('No description seeded.');
    return;
  }

  const data = await prisma.description.createMany({
    data: [
      {
        title: 'Explore our financial programs',
        body: 'Choose a program designed to help you save, learn, connect, and build lasting financial confidence.',
        programsJson: JSON.stringify([
          {
            title: 'Financial Achievement Club',
            description:
              'Financial Achievement Clubs engage families to work as a cohort over 6-8 months. The program requires education, saving and coaching. Upon completion, families that have saved every month for 6 months and attended the required number of learning sessions earn a 1:1 savings match (up to $600) and a $100 incentive for a 30-point improvement in their credit score over the 6 months.',
          },
          {
            title: 'Building Resilient Professionals',
            description:
              'Building Resilient Professionals (BRP) provides participants with the opportunity to save up to $1,200 over six months through a matched savings program, while also building meaningful connections with other professionals through hybrid sessions and networking lunches. Participants receive individualized coaching and support tailored to their goals, as well as leadership development opportunities through in-person learning sessions and introductions to inspirational leaders in the field.',
          },
          {
            title: 'Building Resilient Entrepreneurs',
            description:
              'The Building Resilient Entrepreneurs (BRE) initiative is crafted to assist micro-entrepreneurs and small business owners in establishing and growing their businesses while providing access to capital through matched savings incentives. BRE also offers a curated series of workshops and programming to address the accessibility challenges business owners face in accessing resources that can enhance their technical skills and business acumen.',
          },
          {
            title: 'Wealth Builders United',
            description:
              'Wealth Builders United is a 6-month program focused on teaching strategies and techniques to make investing fun and empowering. Participants will learn the basics of investing with peers and mentors, and upon graduation, they will have up to $1,000 in their brokerage account, which includes a savings match.',
          },
        ]),
        factsJson: JSON.stringify([
          {
            statistic: '37%',
            description: 'of Americans lack enough money to cover a $400 emergency expense.',
          },
          {
            statistic: '7.41%',
            description: 'Personal saving decreased by 7.41% from February 2024 to February 2025.',
          },
          {
            statistic: '2 years',
            description: 'In the last two years, more Americans feel worse off financially than feel better off.',
          },
        ]),
      },
    ],
  });

  console.log('description added: ', { data });
};
