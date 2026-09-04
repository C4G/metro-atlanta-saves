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

  it('limits Partner Staff candidates to regular users in their partner programs', async () => {
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
    ]);

    const users = await service.getUsers('partner-a');

    expect(findManyUsers).toHaveBeenCalledWith({ where: { id: { in: ['allowed-user', 'staff-user'] }, role: null } });
    expect(users).toEqual([expect.objectContaining({ id: 'allowed-user' })]);
  });
});
