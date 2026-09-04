import { PrismaService } from '@mas/backend-prisma';

const CREDENTIAL_ISSUER = 'local:credential';
const CREDENTIAL_PROVIDER = 'credential';

type MigrationUser = { id: string; hash: string };
type CredentialAccount = {
  id: string;
  userId: string;
  issuer: string;
  accountId: string;
  password: string | null;
};

export type CredentialMigrationReport = {
  userCount: number;
  credentialAccountCount: number;
  missingUserIds: string[];
  hashMismatches: string[];
  duplicateMappings: string[];
  ok: boolean;
};

async function loadMigrationData(prisma: PrismaService) {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, hash: true } }),
    prisma.account.findMany({
      where: { providerId: CREDENTIAL_PROVIDER, issuer: CREDENTIAL_ISSUER },
      select: { id: true, userId: true, issuer: true, accountId: true, password: true },
    }),
  ]);

  return { users: users as MigrationUser[], accounts: accounts as CredentialAccount[] };
}

export async function verifyCredentialMigration(prisma: PrismaService): Promise<CredentialMigrationReport> {
  const { users, accounts } = await loadMigrationData(prisma);
  const accountsByUser = new Map<string, CredentialAccount[]>();
  const duplicateMappings = new Set<string>();

  for (const account of accounts) {
    const userAccounts = accountsByUser.get(account.userId) ?? [];
    userAccounts.push(account);
    accountsByUser.set(account.userId, userAccounts);
    if (userAccounts.length > 1 || account.accountId !== account.userId) {
      duplicateMappings.add(account.userId);
    }
  }

  const missingUserIds: string[] = [];
  const hashMismatches: string[] = [];
  for (const user of users) {
    const userAccounts = accountsByUser.get(user.id) ?? [];
    if (userAccounts.length === 0) {
      missingUserIds.push(user.id);
      continue;
    }
    if (userAccounts.some((account) => account.password !== user.hash)) hashMismatches.push(user.id);
  }

  return {
    userCount: users.length,
    credentialAccountCount: accounts.length,
    missingUserIds,
    hashMismatches,
    duplicateMappings: [...duplicateMappings],
    ok: missingUserIds.length === 0 && hashMismatches.length === 0 && duplicateMappings.size === 0,
  };
}

export async function repairMissingCredentialAccounts(prisma: PrismaService) {
  const { users, accounts } = await loadMigrationData(prisma);
  const accountUserIds = new Set(accounts.map((account) => account.userId));
  const repairedUserIds: string[] = [];
  const skippedUserIds: string[] = [];

  for (const user of users) {
    if (accountUserIds.has(user.id)) {
      skippedUserIds.push(user.id);
      continue;
    }
    await prisma.account.create({
      data: {
        issuer: CREDENTIAL_ISSUER,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
        userId: user.id,
        password: user.hash,
      },
    });
    repairedUserIds.push(user.id);
  }

  return { repairedUserIds, skippedUserIds };
}
