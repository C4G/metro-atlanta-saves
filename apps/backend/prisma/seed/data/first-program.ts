import { PrismaClient } from '@mas/prisma-client';

export const seedFirstProgram = async (prisma: PrismaClient) => {
  const partner = await prisma.partner.findFirst({
    select: { id: true },
    where: { name: { contains: 'Frontline Housing' } },
  });
  if (!partner?.id) return;

  // Seed Pilot program only if no programs exist yet
  const hasData = await prisma.program.count();
  if (!hasData) {
    await prisma.program.create({
      data: {
        partnerId: partner.id,
        name: 'Pilot',
        description: 'This is the pilot program. Here is a description about the program.',
      },
    });
    console.log('Pilot program seeded');
  }

  // Always ensure DEFAULT and TEMPLATE programs exist
  const templatePrograms = [
    {
      name: 'DEFAULT',
      description: 'Default template program. Clone this to create a new program with standard requirements.',
    },
    {
      name: 'TEMPLATE',
      description: 'Template program. Clone this to create a new program with standard requirements.',
    },
  ];

  for (const tmpl of templatePrograms) {
    const existing = await prisma.program.findFirst({
      where: { name: tmpl.name, partnerId: partner.id },
    });
    if (!existing) {
      await prisma.program.create({
        data: {
          partnerId: partner.id,
          name: tmpl.name,
          description: tmpl.description,
          isTemplate: true,
          checkpointNames: { connect: { name: 'Month 5' } },
        },
      });
      console.log(`${tmpl.name} program seeded`);
    }
  }
};
