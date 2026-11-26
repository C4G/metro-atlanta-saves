import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { readEmailUnsubscribeToken } from './email-unsubscribe-token';
import { MailService, type ResendClientFactory } from './mail.service';

type CampaignMessage = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  headers: Record<string, string>;
  html: string;
};

const createResendFactory = () => {
  const send = jest.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null });
  const sendBatch = jest
    .fn()
    .mockImplementation((messages: unknown[]) =>
      Promise.resolve({ data: { data: messages.map(() => ({ id: 'email-id' })) }, error: null }),
    );
  const client = { emails: { send }, batch: { send: sendBatch } } as unknown as Resend;
  const factory = (() => client) as ResendClientFactory;
  return { client, factory, send, sendBatch };
};

const createConfigService = (publicAppUrl?: string, extraConfig: Record<string, string | undefined> = {}) =>
  ({
    get: jest.fn((key: string) => {
      if (key === 'MAIL_FROM') return 'no-reply@metroatlantasaves.com';
      if (key === 'PUBLIC_APP_URL') return publicAppUrl;
      return extraConfig[key];
    }),
  }) as unknown as ConfigService;

describe('MailService', () => {
  it('sends an individual reminder with the Eastern due date and learner progress link', async () => {
    const { send, factory } = createResendFactory();
    const service = new MailService(createConfigService('https://app.example.com/'), factory);

    await service.sendRequirementDueReminder({
      email: 'learner@example.com',
      firstName: 'Sam',
      requirementName: 'Attend a workshop',
      programName: 'Career Launch',
      dueAt: new Date('2027-01-01T02:00:00.000Z'),
      programId: 'program-1',
    });

    expect(send).toHaveBeenCalledWith({
      to: 'learner@example.com',
      from: 'Metro Atlanta Saves <no-reply@metroatlantasaves.com>',
      subject: 'Reminder: Attend a workshop is due soon',
      html: expect.stringContaining('https://app.example.com/program-profiles/program-1/course-progress'),
    });
    expect(send.mock.calls[0][0].html).toContain('December 31, 2026 at 9:00 PM');
    expect(send.mock.calls[0][0].html).toContain('Hi Sam');
  });

  it('converts public rich-text image paths to absolute URLs', async () => {
    const { sendBatch, factory } = createResendFactory();
    const service = new MailService(createConfigService('https://metroatlantasaves.com/'), factory);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<p><img src="/assets/rich-text/photo.png"></p><img src="https://cdn.example.com/photo.png">',
    );

    expect(sendBatch).toHaveBeenCalledWith(
      [
        {
          to: ['member@example.com'],
          from: 'Metro Atlanta Saves <no-reply@metroatlantasaves.com>',
          subject: 'Campaign',
          html: '<p><img src="https://metroatlantasaves.com/assets/rich-text/photo.png"></p><img src="https://cdn.example.com/photo.png">',
        },
      ],
      { batchValidation: 'strict' },
    );
  });

  it('does not rewrite private discussion images or unrelated relative sources', async () => {
    const { sendBatch, factory } = createResendFactory();
    const service = new MailService(createConfigService('https://metroatlantasaves.com'), factory);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<img src="/api/discussion-posts/images/board/photo.png"><img src="/assets/logo/logo.png">',
    );

    expect(sendBatch).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          to: ['member@example.com'],
          html: '<img src="/api/discussion-posts/images/board/photo.png"><img src="/assets/logo/logo.png">',
        }),
      ],
      { batchValidation: 'strict' },
    );
  });

  it('inlines email-safe table styles without overwriting existing cell styles', async () => {
    const { sendBatch, factory } = createResendFactory();
    const service = new MailService(createConfigService(), factory);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<table><tr><th style="text-align: center">Header</th><td>Cell</td></tr></table>',
    );

    const message = sendBatch.mock.calls[0][0][0] as { html: string };
    expect(message.html).toContain('<table style="border-collapse: collapse; width: 100%;">');
    expect(message.html).toContain(
      '<th style="text-align: center; border: 1px solid #d1d5db; padding: 8px 12px; vertical-align: top; font-weight: 600; background-color: #f9fafb;">',
    );
    expect(message.html).toContain(
      '<td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; vertical-align: top;">',
    );
  });

  it('converts Tiptap indentation to email-safe padding', async () => {
    const { sendBatch, factory } = createResendFactory();
    const service = new MailService(createConfigService(), factory);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<p data-indent="2" style="margin-left: 4em;">Indented paragraph</p><h2 data-indent="1" style="text-align: center; margin-left: 2em;">Indented heading</h2>',
    );

    const message = sendBatch.mock.calls[0][0][0] as { html: string };
    expect(message.html).toContain('<p data-indent="2" style="padding-left: 4em;">Indented paragraph</p>');
    expect(message.html).toContain(
      '<h2 data-indent="1" style="text-align: center; padding-left: 2em;">Indented heading</h2>',
    );
  });

  it('sends individually addressed campaign messages with signed visible and one-click unsubscribe links', async () => {
    const { sendBatch, factory } = createResendFactory();
    const secret = 'a-test-unsubscribe-secret-that-is-at-least-32-bytes';
    const service = new MailService(
      createConfigService('https://metroatlantasaves.com', { EMAIL_UNSUBSCRIBE_SECRET: secret }),
      factory,
    );

    await service.sendBulkCampaignEmail(['first@example.com', 'second@example.com'], 'Campaign', '<p>Update</p>');

    const [messages] = sendBatch.mock.calls[0] as [CampaignMessage[]];
    expect(messages).toHaveLength(2);
    for (const [index, message] of messages.entries()) {
      expect(message.to).toEqual([index === 0 ? 'first@example.com' : 'second@example.com']);
      expect(message.cc).toBeUndefined();
      expect(message.bcc).toBeUndefined();
      expect(message.headers).toEqual({
        'List-Unsubscribe': expect.stringMatching(
          /^<https:\/\/metroatlantasaves\.com\/api\/users\/unsubscribe\?token=/,
        ),
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      });
      expect(message.html).toContain('Unsubscribe from future campaign emails');
      const link = message.html.match(/href="([^"]+)">Unsubscribe from future campaign emails/);
      if (!link) throw new Error('Campaign email did not include a visible unsubscribe link.');
      const unsubscribeUrl = new URL(link[1].replace(/&amp;/g, '&').replace(/&#x3D;/g, '='));
      expect(unsubscribeUrl.origin).toBe('https://metroatlantasaves.com');
      const token = unsubscribeUrl.searchParams.get('token');
      expect(token).not.toBeNull();
      if (!token) throw new Error('Campaign unsubscribe URL did not include a token.');
      expect(readEmailUnsubscribeToken(token, secret)).toBe(message.to[0]);
    }
  });

  it('fails campaign sends before contacting Resend when the unsubscribe secret is missing', async () => {
    const { sendBatch, factory } = createResendFactory();
    const service = new MailService(createConfigService(), factory);

    await expect(service.sendBulkCampaignEmail(['member@example.com'], 'Campaign', 'Update')).rejects.toThrow(
      'EMAIL_UNSUBSCRIBE_SECRET must be configured',
    );
    expect(sendBatch).not.toHaveBeenCalled();
  });

  it('allows a localhost unsubscribe URL only when running in development', async () => {
    const secret = 'a-test-unsubscribe-secret-that-is-at-least-32-bytes';
    const local = createResendFactory();
    const localConfig = createConfigService('http://localhost:4200', {
      NODE_ENV: 'development',
      EMAIL_UNSUBSCRIBE_SECRET: secret,
      EMAIL_UNSUBSCRIBE_URL: 'http://localhost:3000/api/users/unsubscribe',
    });

    await new MailService(localConfig, local.factory).sendBulkCampaignEmail(
      ['member@example.com'],
      'Campaign',
      'Update',
    );
    expect(local.sendBatch.mock.calls[0][0][0].headers['List-Unsubscribe']).toMatch(
      /^<http:\/\/localhost:3000\/api\/users\/unsubscribe\?token=/,
    );

    const production = createResendFactory();
    const productionConfig = createConfigService('https://metroatlantasaves.com', {
      NODE_ENV: 'production',
      EMAIL_UNSUBSCRIBE_SECRET: secret,
      EMAIL_UNSUBSCRIBE_URL: 'http://localhost:3000/api/users/unsubscribe',
    });
    await expect(
      new MailService(productionConfig, production.factory).sendBulkCampaignEmail(
        ['member@example.com'],
        'Campaign',
        'Update',
      ),
    ).rejects.toThrow('EMAIL_UNSUBSCRIBE_URL must use the canonical production unsubscribe endpoint.');
    expect(production.sendBatch).not.toHaveBeenCalled();
  });
});
