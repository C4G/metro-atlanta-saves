import { PrismaService } from '@mas/backend-prisma';
import { repairMissingCredentialAccounts, verifyCredentialMigration } from '@mas/backend-auth';

const prisma = new PrismaService();
const shouldRepair = process.argv.includes('--repair');

try {
  let report = await verifyCredentialMigration(prisma);
  if (shouldRepair && report.missingUserIds.length > 0 && report.hashMismatches.length === 0) {
    await repairMissingCredentialAccounts(prisma);
    report = await verifyCredentialMigration(prisma);
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
