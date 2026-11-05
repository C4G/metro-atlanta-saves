import { PrismaClient } from '@mas/prisma-client';

export const seedUpcomingProgram = async (prisma: PrismaClient) => {
  const partner = await prisma.partner.findFirst({
    select: { id: true },
    where: { name: { contains: 'Frontline Housing' } },
  });
  if (!partner?.id) return;

  const name = 'Spring Savings Cohort';
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 3, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 6);

  const existing = await prisma.program.findFirst({ where: { name, partnerId: partner.id } });
  if (existing) {
    if (!existing.startDate || existing.startDate < new Date()) {
      await prisma.program.update({ where: { id: existing.id }, data: { startDate, endDate } });
    }
    return;
  }

  await prisma.program.create({
    data: {
      partnerId: partner.id,
      name,
      description:
        '<p>A six-month cohort for building an emergency fund. Meet monthly with your group, set a savings goal and track your progress with a coach.</p>',
      startDate,
      endDate,
    },
  });
  console.log(`${name} program seeded`);
};
