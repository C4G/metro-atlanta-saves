import { BadRequestException, Controller, Get, Headers, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EmailPreferencesService } from './email-preferences.service';

@Controller('users')
export class EmailPreferencesController {
  constructor(private emailPreferences: EmailPreferencesService) {}

  @Get('unsubscribe')
  showUnsubscribeConfirmation(@Query('token') token: string | undefined, @Res() response: Response): void {
    if (!token || !this.emailPreferences.verifyUnsubscribeToken(token)) {
      response.status(400).type('html').send(this.renderPage('This unsubscribe link is invalid or expired.'));
      return;
    }

    const action = `/api/users/unsubscribe?token=${encodeURIComponent(token)}`;
    const html = this.renderPage(
      'Confirm that you want to stop receiving campaign emails.',
      `<form method="post" action="${action}"><button type="submit">Unsubscribe</button></form>`,
    );
    response.status(200).type('html').send(html);
  }

  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Query('token') token: string | undefined, @Res() response: Response): Promise<void> {
    if (!token) {
      throw new BadRequestException('This unsubscribe link is invalid or expired.');
    }
    await this.emailPreferences.unsubscribe(token);
    response.type('html').send(this.renderPage('You have been unsubscribed from future campaign emails.'));
  }

  @Post('campaign-suppressions')
  @HttpCode(200)
  async campaignSuppressions(
    @Headers('authorization') authorization: string | undefined,
    @Req() request: Request,
  ): Promise<{ suppressedEmails: string[] }> {
    this.emailPreferences.assertSharedPreferenceRequest(authorization);
    const emails = await this.readEmails(request);
    if (!Array.isArray(emails) || !emails.every((email) => typeof email === 'string') || emails.length > 500) {
      throw new BadRequestException('Provide at most 500 email addresses.');
    }
    return { suppressedEmails: await this.emailPreferences.getSuppressedCampaignEmails(emails) };
  }

  private async readEmails(request: Request): Promise<unknown> {
    const bufferedBody = (request as Request & { body?: unknown }).body;
    if (bufferedBody && typeof bufferedBody === 'object' && 'emails' in bufferedBody) {
      return bufferedBody.emails;
    }

    const chunks: Buffer[] = [];
    let byteLength = 0;
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      byteLength += buffer.length;
      if (byteLength > 256_000) {
        throw new BadRequestException('Preference request is too large.');
      }
      chunks.push(buffer);
    }

    try {
      const payload: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (payload && typeof payload === 'object' && 'emails' in payload) {
        return payload.emails;
      }
    } catch {
      throw new BadRequestException('Preference request must contain a JSON email list.');
    }
    throw new BadRequestException('Preference request must contain a JSON email list.');
  }

  private renderPage(message: string, action = ''): string {
    const safeMessage = message.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return entities[character];
    });
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Email preferences | Metro Atlanta Saves</title></head><body style="font-family:Arial,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#1f2937"><h1>Email preferences</h1><p>${safeMessage}</p>${action}</body></html>`;
  }
}
