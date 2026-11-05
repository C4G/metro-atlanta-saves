import { PrismaClient } from '@mas/prisma-client';
import * as argon from 'argon2';

const SAMPLE_PARTICIPANTS: [firstName: string, lastName: string][] = [
  ['Avery', 'Johnson'],
  ['Brianna', 'Lee'],
  ['Carlos', 'Mendez'],
  ['Dana', 'Whitfield'],
  ['Eli', 'Okafor'],
  ['Farah', 'Nasser'],
  ['Gabriel', 'Ortiz'],
  ['Hannah', 'Kim'],
  ['Isaiah', 'Brooks'],
  ['Jasmine', 'Patel'],
];

export const seedSampleParticipants = async (prisma: PrismaClient) => {
  const program = await prisma.program.findFirst({
    where: { name: 'Pilot', isTemplate: false },
    select: { id: true, checkpointNames: { select: { name: true } } },
  });
  if (!program) {
    console.log('Pilot program not found; sample participants not seeded.');
    return;
  }

  const password = await argon.hash('P@ssw0rd123!');
  let enrolled = 0;
  for (const [firstName, lastName] of SAMPLE_PARTICIPANTS) {
    const email = `${firstName}.${lastName}@test.com`.toLowerCase();
    const userData = { firstName, lastName, email, name: `${firstName} ${lastName}`, emailVerified: true };
    const user = await prisma.user.upsert({ where: { email }, create: userData, update: userData });
    await prisma.account.upsert({
      where: { account_issuer_accountId_uidx: { issuer: 'local:credential', accountId: user.id } },
      create: { issuer: 'local:credential', accountId: user.id, providerId: 'credential', userId: user.id, password },
      update: { providerId: 'credential', userId: user.id, password },
    });

    const existing = await prisma.usersOnPrograms.findUnique({
      where: { userId_programId: { userId: user.id, programId: program.id } },
      select: { userId: true },
    });
    if (existing) continue;
    await prisma.usersOnPrograms.create({ data: { userId: user.id, programId: program.id } });
    await prisma.checkpoint.createMany({
      data: program.checkpointNames.map(({ name }) => ({ name, userId: user.id, programId: program.id })),
    });
    enrolled++;
  }

  console.log('Sample participants ensured in Pilot: ', { total: SAMPLE_PARTICIPANTS.length, newlyEnrolled: enrolled });
};
