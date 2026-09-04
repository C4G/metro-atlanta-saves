import { PrismaService } from '@mas/backend-prisma';
import { repairMissingCredentialAccounts, verifyCredentialMigration } from '@mas/backend-auth';

describe('Better Auth credential migration verification', () => {
  it('reports missing accounts and hash mismatches without changing valid mappings', async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'valid-user', hash: 'argon-valid' },
          { id: 'missing-user', hash: 'argon-missing' },
          { id: 'mismatch-user', hash: 'argon-current' },
        ]),
      },
      account: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'account-1',
            userId: 'valid-user',
            issuer: 'local:credential',
            accountId: 'valid-user',
            password: 'argon-valid',
          },
          {
            id: 'account-2',
            userId: 'mismatch-user',
            issuer: 'local:credential',
            accountId: 'mismatch-user',
            password: 'argon-old',
          },
        ]),
      },
    } as unknown as PrismaService;

    await expect(verifyCredentialMigration(prisma)).resolves.toMatchObject({
      userCount: 3,
      credentialAccountCount: 2,
      missingUserIds: ['missing-user'],
      hashMismatches: ['mismatch-user'],
      duplicateMappings: [],
      ok: false,
    });
  });

  it('repairs only missing credential accounts', async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'missing-user', hash: 'argon-missing' }]),
      },
      account: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaService;

    await expect(repairMissingCredentialAccounts(prisma)).resolves.toMatchObject({
      repairedUserIds: ['missing-user'],
      skippedUserIds: [],
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        issuer: 'local:credential',
        accountId: 'missing-user',
        providerId: 'credential',
        userId: 'missing-user',
        password: 'argon-missing',
      },
    });
  });
});
