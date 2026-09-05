import { UsersController } from '@mas/backend-users';

describe('UsersController managed profile endpoints', () => {
  const patchUser = jest.fn();
  const controller = new UsersController({ patchUser } as any);
  const requestUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'Partner_Staff',
    partnerId: 'partner-a',
  } as any;

  beforeEach(() => patchUser.mockReset());

  it('returns the identity loaded by the managed session guard', () => {
    expect(controller.me({ user: requestUser } as any)).toBe(requestUser);
  });

  it('patches the authenticated profile by session identity', async () => {
    const updatedUser = { ...requestUser, firstName: 'Updated' };
    patchUser.mockResolvedValue(updatedUser);

    await expect(controller.patchMe({ user: requestUser } as any, { firstName: 'Updated' })).resolves.toEqual(
      updatedUser,
    );
    expect(patchUser).toHaveBeenCalledWith('user-1', { id: 'user-1', firstName: 'Updated' });
  });
});
