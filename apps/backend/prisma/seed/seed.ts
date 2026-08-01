import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

async function main() {
  // Initial seeds
  console.log('----- Starting to seed initial data -----');
  await seedUsers(prisma);
  await seedEducationalCategory(prisma);
  await seedEducationalContent(prisma);
  await seedContentsOnCategories(prisma);
  await seedCohorts(prisma);
  await seedStories(prisma);
  await seedLearnings(prisma);
  await seedBlogs(prisma);
  await seedDescription(prisma);
  await seedIntroduction(prisma);
  await seedUserGuide(prisma);
  await seedDiscussionTags(prisma);
  await seedPeerEvaluationGuide(prisma);
  await seedFirstPartners(prisma);
  await seedFirstProgram(prisma);
  await seedNotificationConfig(prisma);
  await seedFirstRequirements(prisma);
  await seedUserIntoProgram(prisma);
  await seedAlliesIntoProgram(prisma);
  await seedCheckpointNames(prisma);
  await seedUserCheckpoints(prisma);
  await seedWhatWeAre(prisma);
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
