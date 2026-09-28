import { UsersService } from '@mas/backend-users';

describe('UsersService impersonation candidates', () => {
  const findManyPrograms = jest.fn();
  const findManyUsers = jest.fn();
  const findUser = jest.fn();
  const createUser = jest.fn();
  const createAccount = jest.fn();
  const requestPasswordReset = jest.fn();
  const transaction = jest.fn((callback: (tx: any) => Promise<unknown>) =>
    callback({ user: { create: createUser }, account: { create: createAccount } }),
  );
  const service = new UsersService(
    {
      program: { findMany: findManyPrograms },
      user: { findMany: findManyUsers, findUnique: findUser },
      $transaction: transaction,
    } as any,
    { api: { requestPasswordReset } } as any,
    { get: jest.fn().mockReturnValue('https://app.example.com') } as any,
    { sendBulkEmail: jest.fn() } as any,
  );

  beforeEach(() => {
    findManyPrograms.mockReset();
    findManyUsers.mockReset();
    findUser.mockReset();
    createUser.mockReset();
    createAccount.mockReset();
    requestPasswordReset.mockReset();
    transaction.mockClear();
  });

  it('creates a Better Auth credential and requests a password setup email', async () => {
    findUser.mockResolvedValue(null);
    createUser.mockResolvedValue({
      id: 'new-user',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      name: 'New User',
      role: null,
      partnerId: null,
    });
    createAccount.mockResolvedValue({});
    requestPasswordReset.mockResolvedValue({ status: true, message: 'ok' });

    await service.createUser({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
    });

    expect(createAccount).toHaveBeenCalledWith({
      data: expect.objectContaining({
        issuer: 'local:credential',
        accountId: 'new-user',
        providerId: 'credential',
        userId: 'new-user',
        password: expect.any(String),
      }),
    });
    expect(requestPasswordReset).toHaveBeenCalledWith({
      body: { email: 'new@example.com', redirectTo: 'https://app.example.com/reset-password' },
    });
  });

  it('returns every user for an Administrator even when they have a partner association', async () => {
    findManyUsers.mockResolvedValue([
      { id: 'admin-target', role: 'Administrator' },
      { id: 'staff-target', role: 'Partner_Staff' },
      { id: 'regular-target', role: null },
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
      },
      {
        id: 'staff-user',
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'Partner_Staff',
        partnerId: 'partner-a',
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
