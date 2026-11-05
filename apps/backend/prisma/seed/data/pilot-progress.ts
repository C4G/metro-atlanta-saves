import { PrismaClient } from '@mas/prisma-client';

const MONTHS = 6;

type Profile = {
  saved: number[];
  credit: [start: number, step: number] | null;
  tasksThrough: number;
  reviewedThrough: number;
};

const PROFILES: Record<string, Profile> = {
  'avery.johnson@test.com': {
    saved: [150, 175, 200, 200, 225, 250],
    credit: [612, 7],
    tasksThrough: 6,
    reviewedThrough: 5,
  },
  'brianna.lee@test.com': { saved: [80, 90, 110, 95, 120, 130], credit: [655, 4], tasksThrough: 5, reviewedThrough: 4 },
  'carlos.mendez@test.com': {
    saved: [200, 250, 250, 300, 300, 325],
    credit: [701, 3],
    tasksThrough: 6,
    reviewedThrough: 6,
  },
  'dana.whitfield@test.com': { saved: [40, 0, 60, 0, 50], credit: [580, -2], tasksThrough: 3, reviewedThrough: 2 },
  'eli.okafor@test.com': {
    saved: [100, 120, 140, 160, 180, 200],
    credit: [630, 6],
    tasksThrough: 6,
    reviewedThrough: 4,
  },
  'farah.nasser@test.com': { saved: [30, 45, 60], credit: [598, 5], tasksThrough: 2, reviewedThrough: 1 },
  'gabriel.ortiz@test.com': { saved: [], credit: null, tasksThrough: 0, reviewedThrough: 0 },
  'hannah.kim@test.com': {
    saved: [210, 180, 220, 240, 260, 280],
    credit: [688, 5],
    tasksThrough: 6,
    reviewedThrough: 5,
  },
  'isaiah.brooks@test.com': {
    saved: [95, 110, 0, 130, 140, 150],
    credit: [645, -1],
    tasksThrough: 4,
    reviewedThrough: 3,
  },
  'jasmine.patel@test.com': {
    saved: [60, 75, 90, 105, 120, 135],
    credit: [615, 8],
    tasksThrough: 5,
    reviewedThrough: 5,
  },
};

const DEFAULT_PROFILE: Profile = {
  saved: [100, 200, 150, 175, 180, 190],
  credit: [620, 4],
  tasksThrough: 4,
  reviewedThrough: 3,
};

const TASK_MONTHS: Record<string, number> = {
  Orientation: 1,
  Budgeting: 1,
  Savings: 2,
  'Credit/Debit': 2,
  Review: 3,
  'Buyer Awareness': 4,
};
const EXTRA_TASKS = [
  { name: 'Emergency fund plan', month: 5 },
  { name: 'Homebuyer readiness check', month: 6 },
];

const addMonths = (date: Date, months: number, day = date.getDate()) =>
  new Date(date.getFullYear(), date.getMonth() + months, day, 12);

export const seedPilotProgress = async (prisma: PrismaClient) => {
  const program = await prisma.program.findFirst({
    where: { name: 'Pilot', isTemplate: false },
    select: { id: true, partnerId: true, startDate: true },
  });
  if (!program) {
    console.log('Pilot program not found; monthly progress not seeded.');
    return;
  }

  const now = new Date();
  const startDate = program.startDate ?? addMonths(now, -(MONTHS - 1), 1);
  await prisma.program.update({
    where: { id: program.id },
    data: {
      startDate,
      checkpointNames: { connect: Array.from({ length: MONTHS }, (_, index) => ({ name: `Month ${index + 1}` })) },
    },
  });

  const requirements = await prisma.requirement.findMany({
    where: { programId: program.id },
    select: { id: true, name: true, month: true },
  });
  for (const requirement of requirements) {
    if (requirement.month === null && TASK_MONTHS[requirement.name]) {
      await prisma.requirement.update({
        where: { id: requirement.id },
        data: { month: TASK_MONTHS[requirement.name] },
      });
      requirement.month = TASK_MONTHS[requirement.name];
    }
  }
  for (const task of EXTRA_TASKS) {
    if (requirements.some(({ month }) => month === task.month)) continue;
    requirements.push(
      await prisma.requirement.create({
        data: { programId: program.id, name: task.name, month: task.month },
        select: { id: true, name: true, month: true },
      }),
    );
  }

  const reviewer =
    (await prisma.user.findFirst({
      where: { role: 'Partner_Staff', partnerId: program.partnerId },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ where: { role: 'Administrator' }, select: { id: true } }));
  const participants = await prisma.usersOnPrograms.findMany({
    where: { programId: program.id },
    select: { userId: true, user: { select: { email: true } } },
  });

  let months = 0;
  let completions = 0;
  for (const { userId, user } of participants) {
    const profile = PROFILES[user.email.toLowerCase()] ?? DEFAULT_PROFILE;

    for (let month = 1; month <= MONTHS; month++) {
      const saved = profile.saved[month - 1];
      if (saved === undefined) continue;
      const name = `Month ${month}`;
      const creditScore = profile.credit ? profile.credit[0] + profile.credit[1] * (month - 1) : null;
      const updatedAt = addMonths(startDate, month - 1, Math.min(20, startDate.getDate() + 18));
      const existing = await prisma.checkpoint.findFirst({
        where: { userId, programId: program.id, name },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, savedMoney: true, creditScore: true },
      });
      if (existing && (existing.savedMoney !== null || existing.creditScore !== null)) continue;
      if (existing) {
        await prisma.checkpoint.update({
          where: { id: existing.id },
          data: { savedMoney: saved, creditScore, updatedAt },
        });
      } else {
        await prisma.checkpoint.create({
          data: {
            userId,
            programId: program.id,
            name,
            savedMoney: saved,
            creditScore,
            createdAt: updatedAt,
            updatedAt,
          },
        });
      }
      months++;
    }

    const finished = requirements.filter(({ month }) => month !== null && month <= profile.tasksThrough);
    const { count } = await prisma.requirementCompletion.createMany({
      skipDuplicates: true,
      data: finished.map(({ id, month }) => {
        const planned = addMonths(startDate, (month ?? 1) - 1, 10);
        const completedAt = planned > now ? now : planned;
        const reviewedAt = addMonths(completedAt, 0, completedAt.getDate() + 3);
        const reviewed = (month ?? 1) <= profile.reviewedThrough && !!reviewer;
        return {
          userId,
          programId: program.id,
          requirementId: id,
          completedAt,
          verifiedAt: reviewed ? (reviewedAt > now ? now : reviewedAt) : null,
          verifiedById: reviewed ? reviewer?.id : null,
        };
      }),
    });
    completions += count;
  }

  console.log('Pilot monthly progress ensured: ', {
    participants: participants.length,
    monthsFilled: months,
    tasksCompleted: completions,
  });
};
