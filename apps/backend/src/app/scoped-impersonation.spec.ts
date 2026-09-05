import { PrismaService } from '@mas/backend-prisma';
import { canImpersonate } from '@mas/backend-auth';

describe('scoped impersonation authorization', () => {
  const users = new Map([
    ['admin', { id: 'admin', role: 'Administrator', partnerId: null }],
    ['staff-a', { id: 'staff-a', role: 'Partner_Staff', partnerId: 'partner-a' }],
    ['staff-b', { id: 'staff-b', role: 'Partner_Staff', partnerId: 'partner-a' }],
    ['staff-other', { id: 'staff-other', role: 'Partner_Staff', partnerId: 'partner-b' }],
    ['staff-unassigned', { id: 'staff-unassigned', role: 'Partner_Staff', partnerId: null }],
    ['user-a', { id: 'user-a', role: null, partnerId: 'partner-a' }],
    ['user-b', { id: 'user-b', role: null, partnerId: 'partner-b' }],
    ['other-admin', { id: 'other-admin', role: 'Administrator', partnerId: null }],
  ]);
  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => users.get(where.id)),
    },
    usersOnPrograms: {
      findFirst: jest.fn(({ where }: { where: { userId: string; program: { partnerId: string } } }) =>
        where.userId === 'user-a' && where.program.partnerId === 'partner-a' ? { userId: 'user-a' } : null,
      ),
    },
  } as unknown as PrismaService;

  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['admin', 'user-b', true],
    ['staff-a', 'user-a', true],
    ['staff-a', 'staff-b', true],
    ['staff-a', 'user-b', false],
    ['staff-a', 'staff-other', false],
    ['staff-a', 'other-admin', false],
    ['staff-unassigned', 'user-a', false],
    ['user-a', 'user-b', false],
  ])('returns %s -> %s as %s', async (requesterId, targetId, expected) => {
    await expect(canImpersonate(prisma, requesterId, targetId)).resolves.toBe(expected);
  });
});
