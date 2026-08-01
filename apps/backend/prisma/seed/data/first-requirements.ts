import { PrismaClient } from '@prisma/client';

export const seedFirstRequirements = async (prisma: PrismaClient) => {
  const hasData = await prisma.requirement.count();
  if (hasData) {
    console.log('No first requirements seeded');
    return;
  }
  const programs = await prisma.program.findMany({
    select: { id: true, name: true },
    where: { name: { in: ['Pilot', 'DEFAULT', 'TEMPLATE'] } },
  });
  const educationalContent = await prisma.educationalContent.findFirst({
    select: { id: true },
  });
  if (programs.length && educationalContent?.id) {
    const requirementTemplates = (programId: string) => [
      { programId, name: 'Orientation' },
      { programId, name: 'Budgeting', educationalContentId: educationalContent.id },
      { programId, name: 'Savings' },
      { programId, name: 'Credit/Debit' },
      { programId, name: 'Buyer Awareness' },
      { programId, name: 'Review' },
    ];
    const data = await prisma.requirement.createMany({
      data: programs.flatMap((program) => requirementTemplates(program.id)),
    });
    console.log('First Requirements added: ', { data });
  }
};
