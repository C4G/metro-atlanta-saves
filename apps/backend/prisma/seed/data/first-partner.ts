import { PrismaClient } from '@prisma/client';

export const seedFirstPartners = async (prisma: PrismaClient) => {
  const hasData = await prisma.partner.count();
  if (hasData) {
    console.log('No first partners seeded');
    return;
  }
  const data = await prisma.partner.createMany({
    data: [
      {
        name: 'Frontline Housing',
        address: '2585 Gresham Rd S E, Atlanta, GA 30316',
        facebook: 'https://www.facebook.com/Frontlinehousing/',
        website: 'https://frontlinehousing.org/',
      },
    ],
  });
  console.log('First Partner added: ', { data });
  const partner = await prisma.partner.findFirst({
    select: { id: true },
    where: { name: { contains: 'Frontline Housing' } },
  });
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'partner@test.com' } },
  });
  if (user?.id && partner?.id) {
    const data = await prisma.user.updateMany({
      data: {
        partnerId: partner.id,
      },
      where: { id: user.id },
    });
    console.log('Partner added to partner test user: ', { data });
  }
};
