import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mas/backend-prisma';
import { timingSafeEqual } from 'node:crypto';
import { readEmailUnsubscribeToken } from '@mas/backend-mail';

const PREFERENCE_LOOKUP_BATCH_SIZE = 500;

@Injectable()
export class EmailPreferencesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  verifyUnsubscribeToken(token: string): string | undefined {
    return readEmailUnsubscribeToken(token, this.getSecret());
  }

  async unsubscribe(token: string): Promise<void> {
    const email = this.verifyUnsubscribeToken(token);
    if (!email) {
      throw new BadRequestException('This unsubscribe link is invalid or expired.');
    }

    await this.prisma.user.updateMany({
      where: { email },
      data: { emailUnsubscribedAt: new Date() },
    });
  }

  assertSharedPreferenceRequest(authorization: string | undefined): void {
    const expected = Buffer.from(`Bearer ${this.getSecret()}`, 'utf8');
    const supplied = Buffer.from(authorization ?? '', 'utf8');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedException();
    }
  }

  async getSuppressedCampaignEmails(emails: string[]): Promise<string[]> {
    if (emails.length === 0) {
      return [];
    }

    const suppressed: string[] = [];
    for (let start = 0; start < emails.length; start += PREFERENCE_LOOKUP_BATCH_SIZE) {
      const batch = emails.slice(start, start + PREFERENCE_LOOKUP_BATCH_SIZE);
      const users = await this.prisma.user.findMany({
        where: {
          email: { in: batch },
          emailUnsubscribedAt: { not: null },
        },
        select: { email: true },
      });
      suppressed.push(...users.map(({ email }) => email));
    }
    return suppressed;
  }

  async filterCampaignRecipients(emails: string[]): Promise<string[]> {
    if (emails.length === 0) {
      return [];
    }

    const suppressed = new Set((await this.getSuppressedCampaignEmails(emails)).map((email) => email.toLowerCase()));
    const sourceUrl = this.config.get<string>('EMAIL_PREFERENCE_SOURCE_URL')?.trim();
    const publicAppUrl = this.config.get<string>('PUBLIC_APP_URL')?.trim();
    const isStaging = publicAppUrl && new URL(publicAppUrl).hostname === 'metro-atlanta-saves.c4g.dev';
    if (isStaging && !sourceUrl) {
      throw new Error('EMAIL_PREFERENCE_SOURCE_URL is required for staging campaign sends.');
    }

    if (sourceUrl) {
      const endpoint = new URL(sourceUrl);
      if (
        endpoint.origin !== 'https://metroatlantasaves.com' ||
        endpoint.pathname !== '/api/users/campaign-suppressions'
      ) {
        throw new Error('EMAIL_PREFERENCE_SOURCE_URL must use the canonical production preference endpoint.');
      }
      const secret = this.getSecret();

      for (let start = 0; start < emails.length; start += PREFERENCE_LOOKUP_BATCH_SIZE) {
        const batch = emails.slice(start, start + PREFERENCE_LOOKUP_BATCH_SIZE);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${secret}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ emails: batch }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          throw new Error(`Shared campaign preference lookup failed with status ${response.status}.`);
        }

        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('suppressedEmails' in payload) ||
          !Array.isArray(payload.suppressedEmails) ||
          !payload.suppressedEmails.every((email) => typeof email === 'string')
        ) {
          throw new Error('Shared campaign preference lookup returned an invalid response.');
        }
        for (const email of payload.suppressedEmails) {
          suppressed.add(email.toLowerCase());
        }
      }
    }

    return emails.filter((email) => !suppressed.has(email.toLowerCase()));
  }

  private getSecret(): string {
    const secret = this.config.get<string>('EMAIL_UNSUBSCRIBE_SECRET')?.trim();
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('EMAIL_UNSUBSCRIBE_SECRET must be configured with at least 32 bytes.');
    }
    return secret;
  }
}
