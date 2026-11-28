jest.mock('@mas/backend-shared', () => ({
  ManagedSessionGuard: class ManagedSessionGuard {},
  RoleGuard: class RoleGuard {},
  Roles: jest.fn(() => () => undefined),
}));
jest.mock('./users.service', () => ({ UsersService: class UsersService {} }));
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController campaign recipients', () => {
  it('returns the resolved campaign recipient emails', async () => {
    const usersService = {
      resolveCampaignAudience: jest.fn().mockResolvedValue(['member@example.com']),
    } as unknown as jest.Mocked<UsersService>;
    const controller = new UsersController(usersService);

    const audience = { type: 'users' as const, userIds: ['user-1'] };
    await expect(controller.campaignRecipients({ audience })).resolves.toEqual({
      emails: ['member@example.com'],
    });
    expect(usersService.resolveCampaignAudience).toHaveBeenCalledWith(audience);
  });
});
