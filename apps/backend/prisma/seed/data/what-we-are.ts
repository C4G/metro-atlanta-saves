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
          'Founded in Atlanta, the Housing and Savings Collaborative is dedicated to providing financial solutions that uplift communities and foster economic stability for those in need. We are a collaborative group of Atlanta nonprofits.',
        whatWeDoDescription:
          'Our goal is to initiate pilot programs that assist households and frontline staff in saving.',
        partnersJson: JSON.stringify([
          {
            name: 'Community Restoration Project',
            shortName: 'CRP',
            description:
              'CRP sees underserved communities as an opportunity to provide the resources necessary to influence and ensure families and individuals have the tools they need to become self-sufficient and maintain productive and successful lives.',
          },
          {
            name: 'Frontline Housing Inc.',
            shortName: 'Frontline Housing',
            description:
              'Frontline Housing Inc. is a 501(c)(3) nonprofit organization that aims to make the experience of homelessness rare, brief and non-recurring. They meet individuals where they are through regular outreach events in Atlanta.',
          },
          {
            name: 'Housing Plus Inc.',
            shortName: 'Housing Plus',
            description:
              'Housing Plus delivers equitable housing solutions, economic wellness programs, and financial assistance for low-income households.',
          },
          {
            name: 'Los Vecinos de Buford Highway',
            shortName: 'Los Vecinos',
            description:
              'Los Vecinos de Buford Highway serves as a conduit of information and social capital in an effort to bridge the gap between residents in the Buford Highway area and government, housing, schools, and non-profit organizations by providing resources such as education, advocacy, food, and community events.',
          },
          {
            name: 'Single Parent Alliance and Resource Center',
            shortName: 'SPARC',
            description:
              'SPARC’s mission is to empower and equip single parents with the necessary tools, resources and support to enable them to create a healthy home environment and nurture their children into productive and successful adults.',
          },
        ]),
      },
    ],
  });

  console.log('whatWeAre added: ', { data });
};
