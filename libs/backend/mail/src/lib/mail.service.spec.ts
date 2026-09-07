import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  it('converts public rich-text image paths to absolute URLs', async () => {
    const mailerService = { sendMail: jest.fn().mockResolvedValue(undefined) } as unknown as MailerService;
    const configService = {
      get: jest.fn().mockReturnValue('https://brpatl.com/'),
    } as unknown as ConfigService;
    const service = new MailService(mailerService, configService);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<p><img src="/assets/rich-text/photo.png"></p><img src="https://cdn.example.com/photo.png">',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: ['member@example.com'],
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: 'Campaign',
      html: '<p><img src="https://brpatl.com/assets/rich-text/photo.png"></p><img src="https://cdn.example.com/photo.png">',
    });
  });

  it('does not rewrite private discussion images or unrelated relative sources', async () => {
    const mailerService = { sendMail: jest.fn().mockResolvedValue(undefined) } as unknown as MailerService;
    const configService = {
      get: jest.fn().mockReturnValue('https://brpatl.com'),
    } as unknown as ConfigService;
    const service = new MailService(mailerService, configService);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<img src="/api/discussion-posts/images/board/photo.png"><img src="/assets/logo/logo.png">',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<img src="/api/discussion-posts/images/board/photo.png"><img src="/assets/logo/logo.png">',
      }),
    );
  });

  it('inlines email-safe table styles without overwriting existing cell styles', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    const mailerService = { sendMail } as unknown as MailerService;
    const configService = { get: jest.fn() } as unknown as ConfigService;
    const service = new MailService(mailerService, configService);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<table><tr><th style="text-align: center">Header</th><td>Cell</td></tr></table>',
    );

    const message = sendMail.mock.calls[0][0] as { html: string };
    expect(message.html).toContain('<table style="border-collapse: collapse; width: 100%;">');
    expect(message.html).toContain(
      '<th style="text-align: center; border: 1px solid #d1d5db; padding: 8px 12px; vertical-align: top; font-weight: 600; background-color: #f9fafb;">',
    );
    expect(message.html).toContain(
      '<td style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; vertical-align: top;">',
    );
  });

  it('converts Tiptap indentation to email-safe padding', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    const mailerService = { sendMail } as unknown as MailerService;
    const configService = { get: jest.fn() } as unknown as ConfigService;
    const service = new MailService(mailerService, configService);

    await service.sendBulkEmail(
      ['member@example.com'],
      'Campaign',
      '<p data-indent="2" style="margin-left: 4em;">Indented paragraph</p><h2 data-indent="1" style="text-align: center; margin-left: 2em;">Indented heading</h2>',
    );

    const message = sendMail.mock.calls[0][0] as { html: string };
    expect(message.html).toContain('<p data-indent="2" style="padding-left: 4em;">Indented paragraph</p>');
    expect(message.html).toContain(
      '<h2 data-indent="1" style="text-align: center; padding-left: 2em;">Indented heading</h2>',
    );
  });
});
