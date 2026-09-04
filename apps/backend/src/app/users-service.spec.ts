import { UsersService } from '@mas/backend-users';

describe('UsersService impersonation candidates', () => {
  const findManyPrograms = jest.fn();
  const findManyUsers = jest.fn();
  const service = new UsersService(
    {
      program: { findMany: findManyPrograms },
      user: { findMany: findManyUsers },
    } as any,
    {} as any,
  );

  beforeEach(() => {
    findManyPrograms.mockReset();
    findManyUsers.mockReset();
  });

  it('returns every user for an Administrator even when they have a partner association', async () => {
    findManyUsers.mockResolvedValue([
      { id: 'admin-target', role: 'Administrator', hash: 'hash', forgot: null },
      { id: 'staff-target', role: 'Partner_Staff', hash: 'hash', forgot: null },
      { id: 'regular-target', role: null, hash: 'hash', forgot: null },
    ]);

    const users = await service.getUsers({ role: 'Administrator', partnerId: 'partner-a' } as any);

    expect(findManyPrograms).not.toHaveBeenCalled();
    expect(findManyUsers).toHaveBeenCalledWith({
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    expect(users).toHaveLength(3);
  });

  it('returns same-partner staff and regular users in the partner programs for Partner Staff', async () => {
    findManyPrograms.mockResolvedValue([{ UsersOnPrograms: [{ userId: 'allowed-user' }, { userId: 'staff-user' }] }]);
    findManyUsers.mockResolvedValue([
      {
        id: 'allowed-user',
        email: 'allowed@example.com',
        firstName: 'Allowed',
        lastName: 'User',
        role: null,
        partnerId: null,
        hash: 'hash',
        forgot: null,
      },
      {
        id: 'staff-user',
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'Partner_Staff',
        partnerId: 'partner-a',
        hash: 'hash',
        forgot: null,
      },
    ]);

    const users = await service.getUsers({ role: 'Partner_Staff', partnerId: 'partner-a' } as any);

    expect(findManyUsers).toHaveBeenCalledWith({
      where: {
        OR: [
          { role: 'Partner_Staff', partnerId: 'partner-a' },
          {
            role: null,
            UsersOnPrograms: { some: { program: { partnerId: 'partner-a' } } },
          },
        ],
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    expect(users).toEqual([
      expect.objectContaining({ id: 'allowed-user' }),
      expect.objectContaining({ id: 'staff-user' }),
    ]);
  });
});
