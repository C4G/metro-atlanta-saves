import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mas/backend-prisma';
import { createEmailUnsubscribeToken } from '@mas/backend-mail';
import { EmailPreferencesService } from './email-preferences.service';

const SECRET = 'a-test-unsubscribe-secret-that-is-at-least-32-bytes';

const createService = (config: Record<string, string | undefined> = {}) => {
  const user = {
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
  };
  const prisma = { user } as unknown as PrismaService;
  const configService = {
    get: jest.fn((key: string) => (key === 'EMAIL_UNSUBSCRIBE_SECRET' ? SECRET : config[key])),
  } as unknown as ConfigService;
  return { service: new EmailPreferencesService(prisma, configService), user };
};

describe('EmailPreferencesService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('verifies signed unsubscribe tokens and persists the matching opt-out', async () => {
    const { service, user } = createService();
    const token = createEmailUnsubscribeToken('member@example.com', SECRET);

    expect(service.verifyUnsubscribeToken(token)).toBe('member@example.com');
    await service.unsubscribe(token);

    expect(user.updateMany).toHaveBeenCalledWith({
      where: { email: 'member@example.com' },
      data: { emailUnsubscribedAt: expect.any(Date) },
    });
  });

  it('rejects invalid unsubscribe tokens without changing preferences', async () => {
    const { service, user } = createService();

    await expect(service.unsubscribe('v1.invalid.signature')).rejects.toBeInstanceOf(BadRequestException);
    expect(user.updateMany).not.toHaveBeenCalled();
  });

  it('accepts only the shared bearer secret for staging preference checks', () => {
    const { service } = createService();

    expect(() => service.assertSharedPreferenceRequest(`Bearer ${SECRET}`)).not.toThrow();
    expect(() => service.assertSharedPreferenceRequest('Bearer wrong-secret')).toThrow(UnauthorizedException);
  });

  it('returns local suppression records in bounded lookup batches', async () => {
    const { service, user } = createService();
    const emails = Array.from({ length: 501 }, (_, index) => `member${index}@example.com`);
    user.findMany
      .mockResolvedValueOnce([{ email: 'member1@example.com' }])
      .mockResolvedValueOnce([{ email: 'member500@example.com' }]);

    await expect(service.getSuppressedCampaignEmails(emails)).resolves.toEqual([
      'member1@example.com',
      'member500@example.com',
    ]);
    expect(user.findMany).toHaveBeenCalledTimes(2);
    expect(user.findMany.mock.calls[0][0].where.email.in).toHaveLength(500);
    expect(user.findMany.mock.calls[1][0].where.email.in).toEqual(['member500@example.com']);
  });

  it('removes local and production opt-outs from staging campaign recipients', async () => {
    const { service, user } = createService({
      PUBLIC_APP_URL: 'https://metro-atlanta-saves.c4g.dev',
      EMAIL_PREFERENCE_SOURCE_URL: 'https://metroatlantasaves.com/api/users/campaign-suppressions',
    });
    user.findMany.mockResolvedValue([{ email: 'localopt@example.com' }]);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ suppressedEmails: ['RemoteOpt@Example.com'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      service.filterCampaignRecipients(['keep@example.com', 'localopt@example.com', 'remoteopt@example.com']),
    ).resolves.toEqual(['keep@example.com']);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://metroatlantasaves.com/api/users/campaign-suppressions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: `Bearer ${SECRET}` }),
        body: JSON.stringify({ emails: ['keep@example.com', 'localopt@example.com', 'remoteopt@example.com'] }),
      }),
    );
  });

  it('fails closed on staging when the shared preference source is missing or unavailable', async () => {
    const withoutSource = createService({ PUBLIC_APP_URL: 'https://metro-atlanta-saves.c4g.dev' });
    await expect(withoutSource.service.filterCampaignRecipients(['member@example.com'])).rejects.toThrow(
      'EMAIL_PREFERENCE_SOURCE_URL is required for staging campaign sends.',
    );

    const withSource = createService({
      PUBLIC_APP_URL: 'https://metro-atlanta-saves.c4g.dev',
      EMAIL_PREFERENCE_SOURCE_URL: 'https://metroatlantasaves.com/api/users/campaign-suppressions',
    });
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network unavailable'));
    await expect(withSource.service.filterCampaignRecipients(['member@example.com'])).rejects.toThrow(
      'network unavailable',
    );
  });
});
