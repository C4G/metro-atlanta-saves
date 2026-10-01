import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@mas/prisma-client';
import {
  seedAlliesIntoProgram,
  seedBlogs,
  seedCheckpointNames,
  seedCohorts,
  seedContentsOnCategories,
  seedDescription,
  seedDiscussionTags,
  seedEducationalCategory,
  seedEducationalContent,
  seedFirstPartners,
  seedFirstProgram,
  seedFirstRequirements,
  seedIntroduction,
  seedLearnings,
  seedNotificationConfig,
  seedPeerEvaluationGuide,
  seedStories,
  seedUserCheckpoints,
  seedUserGuide,
  seedUserIntoProgram,
  seedUsers,
  seedWhatWeAre,
} from './data';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed PostgreSQL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seedDatabase(seedPrisma: PrismaClient) {
  // Initial seeds
  console.log('----- Starting to seed initial data -----');
  await seedUsers(seedPrisma);
  await seedEducationalCategory(seedPrisma);
  await seedEducationalContent(seedPrisma);
  await seedContentsOnCategories(seedPrisma);
  await seedCohorts(seedPrisma);
  await seedStories(seedPrisma);
  await seedLearnings(seedPrisma);
  await seedBlogs(seedPrisma);
  await seedDescription(seedPrisma);
  await seedIntroduction(seedPrisma);
  await seedUserGuide(seedPrisma);
  await seedDiscussionTags(seedPrisma);
  await seedPeerEvaluationGuide(seedPrisma);
  await seedFirstPartners(seedPrisma);
  await seedFirstProgram(seedPrisma);
  await seedNotificationConfig(seedPrisma);
  await seedFirstRequirements(seedPrisma);
  await seedUserIntoProgram(seedPrisma);
  await seedAlliesIntoProgram(seedPrisma);
  await seedCheckpointNames(seedPrisma);
  await seedUserCheckpoints(seedPrisma);
  await seedWhatWeAre(seedPrisma);
}

async function main() {
  await prisma.$transaction(
    async (transaction) => {
      // Nx runs atomized E2E tasks in parallel. Each task starts its own web
      // server and invokes this seed against the same agent database. Serialize
      // the complete check-and-insert sequence so those tasks cannot race.
      await transaction.$queryRaw`
        WITH seed_lock AS (SELECT pg_advisory_xact_lock(782741519))
        SELECT 1 AS acquired FROM seed_lock
      `;
      await seedDatabase(transaction as unknown as PrismaClient);
    },
    { maxWait: 60_000, timeout: 60_000 },
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
