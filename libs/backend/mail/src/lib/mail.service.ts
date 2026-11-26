import { UserFull } from '@mas/models';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars, { type TemplateDelegate } from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { type CreateBatchEmailOptions, Resend } from 'resend';
import { createEmailUnsubscribeToken } from './email-unsubscribe-token';

export const RESEND_CLIENT_FACTORY = Symbol('RESEND_CLIENT_FACTORY');
export type ResendClientFactory = () => Resend;

const RESEND_BATCH_SIZE = 100;

@Injectable()
export class MailService {
  private readonly templateCache = new Map<string, TemplateDelegate>();

  constructor(
    private configService: ConfigService,
    @Inject(RESEND_CLIENT_FACTORY) private readonly createResendClient: ResendClientFactory,
  ) {}

  async sendForgotPassword(email: string, token: string, resetUrl?: string) {
    const url = resetUrl ?? `${this.getPublicAppUrl()}/reset-password?${new URLSearchParams({ token, email })}`;
    const html = await this.renderTemplate('forgot-password', { url });
    await this.sendIndividual(email, 'Forgot your email? Reset it now!', html);
  }

  async sendCheckpointImageChanged(approved: boolean, email: string, name: string) {
    const html = await this.renderTemplate('checkpoint-image-changed', {
      name,
      status: approved ? 'approved' : 'rejected',
      approved,
    });
    await this.sendIndividual(email, `Your checkpoint submission was ${approved ? 'approved' : 'rejected'}!`, html);
  }

  async sendPartnerStaffImageAdded(partnerEmails: string[], programId: string, { id, firstName, lastName }: UserFull) {
    const url = `${this.getPublicAppUrl()}/partner-staff/programs/${encodeURIComponent(programId)}/users/${encodeURIComponent(id)}`;
    const html = await this.renderTemplate('user-image-added', { url, name: `${firstName} ${lastName}` });
    await this.sendToRecipients(partnerEmails, 'A new image was added and awaiting approval!', html);
  }

  async sendNewEducationalContent(emails: string[], heading: string, body: string) {
    const url = `${this.getPublicAppUrl()}/educational-resources`;
    const html = await this.renderTemplate('new-educational-content', { heading, body, url });
    await this.sendCampaignToRecipients(emails, heading, html);
  }

  async sendRequirementDueReminder({
    email,
    firstName,
    requirementName,
    programName,
    dueAt,
    programId,
  }: {
    email: string;
    firstName: string;
    requirementName: string;
    programName: string;
    dueAt: Date;
    programId: string;
  }) {
    const publicAppUrl = this.getPublicAppUrl();
    const dueDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(dueAt);

    const html = await this.renderTemplate('requirement-due-reminder', {
      firstName,
      requirementName,
      programName,
      dueDate,
      url: `${publicAppUrl}/program-profiles/${encodeURIComponent(programId)}/course-progress`,
    });
    await this.sendIndividual(email, `Reminder: ${requirementName} is due soon`, html);
  }

  async sendBulkEmail(emails: string[], subject: string, body: string) {
    await this.sendToRecipients(emails, subject, this.toEmailHtml(body));
  }

  async sendBulkCampaignEmail(emails: string[], subject: string, body: string) {
    await this.sendCampaignToRecipients(emails, subject, this.toEmailHtml(body));
  }

  private async sendIndividual(recipient: string, subject: string, html: string): Promise<void> {
    const resend = this.createResendClient();
    const { data, error } = await resend.emails.send({
      from: this.getFrom(),
      to: recipient,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend email submission failed: ${error.message}`);
    }
    if (!data?.id) {
      throw new Error('Resend email submission did not return an email ID.');
    }
  }

  private async sendToRecipients(recipients: string[], subject: string, html: string): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    const resend = this.createResendClient();
    const from = this.getFrom();
    const messages: CreateBatchEmailOptions[] = recipients.map((recipient) => ({
      from,
      to: [recipient],
      subject,
      html,
    }));

    for (let start = 0; start < messages.length; start += RESEND_BATCH_SIZE) {
      const batch = messages.slice(start, start + RESEND_BATCH_SIZE);
      const { data, error } = await resend.batch.send(batch, { batchValidation: 'strict' });

      if (error) {
        throw new Error(`Resend batch email submission failed: ${error.message}`);
      }
      const acceptedCount = Array.isArray(data?.data) ? data.data.length : 0;
      if (acceptedCount !== batch.length) {
        throw new Error(`Resend accepted ${acceptedCount} of ${batch.length} batch messages.`);
      }
    }
  }

  private async sendCampaignToRecipients(recipients: string[], subject: string, html: string): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    const resend = this.createResendClient();
    const from = this.getFrom();
    const messages: CreateBatchEmailOptions[] = recipients.map((recipient) => {
      const unsubscribeUrl = this.getUnsubscribeUrl(recipient);
      const safeUrl = Handlebars.Utils.escapeExpression(unsubscribeUrl);
      const campaignHtml = `${html}<p style="margin-top: 24px; color: #6b7280; font-size: 12px;"><a href="${safeUrl}">Unsubscribe from future campaign emails</a></p>`;

      return {
        from,
        to: [recipient],
        subject,
        html: campaignHtml,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    for (let start = 0; start < messages.length; start += RESEND_BATCH_SIZE) {
      const batch = messages.slice(start, start + RESEND_BATCH_SIZE);
      const { data, error } = await resend.batch.send(batch, { batchValidation: 'strict' });

      if (error) {
        throw new Error(`Resend campaign email submission failed: ${error.message}`);
      }
      const acceptedCount = Array.isArray(data?.data) ? data.data.length : 0;
      if (acceptedCount !== batch.length) {
        throw new Error(`Resend accepted ${acceptedCount} of ${batch.length} campaign messages.`);
      }
    }
  }

  private getUnsubscribeUrl(email: string): string {
    const secret = this.configService.get<string>('EMAIL_UNSUBSCRIBE_SECRET')?.trim();
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('EMAIL_UNSUBSCRIBE_SECRET must be configured with at least 32 bytes before sending campaigns.');
    }

    const endpoint =
      this.configService.get<string>('EMAIL_UNSUBSCRIBE_URL')?.trim() ||
      'https://metroatlantasaves.com/api/users/unsubscribe';
    const url = new URL(endpoint);
    const validEndpointPath = url.pathname === '/api/users/unsubscribe';
    const isCanonicalEndpoint = url.origin === 'https://metroatlantasaves.com';
    const isLocalDevelopmentEndpoint =
      this.configService.get<string>('NODE_ENV') === 'development' && url.origin === 'http://localhost:3000';
    if (!validEndpointPath || (!isCanonicalEndpoint && !isLocalDevelopmentEndpoint)) {
      throw new Error('EMAIL_UNSUBSCRIBE_URL must use the canonical production unsubscribe endpoint.');
    }
    url.searchParams.set('token', createEmailUnsubscribeToken(email, secret));
    return url.toString();
  }

  private getFrom(): string {
    const address = this.configService.get<string>('MAIL_FROM')?.trim();
    if (!address) {
      throw new Error('MAIL_FROM is not configured; cannot send email.');
    }
    return `Metro Atlanta Saves <${address}>`;
  }

  private getPublicAppUrl(): string {
    return (this.configService.get<string>('PUBLIC_APP_URL')?.trim() || 'https://metroatlantasaves.com').replace(
      /\/+$/,
      '',
    );
  }

  private async renderTemplate(name: string, context: Record<string, unknown>): Promise<string> {
    let template = this.templateCache.get(name);
    if (!template) {
      const source = await this.readTemplate(name);
      template = Handlebars.compile(source, { strict: true });
      this.templateCache.set(name, template);
    }
    return template(context);
  }

  private async readTemplate(name: string): Promise<string> {
    const filename = `${name}.hbs`;
    const paths = [
      join(__dirname, 'assets', 'templates', filename),
      join(process.cwd(), 'apps', 'backend', 'src', 'assets', 'templates', filename),
    ];

    for (const path of paths) {
      try {
        return await readFile(path, 'utf8');
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Email template "${filename}" could not be found.`);
  }

  private toEmailHtml(body: string): string {
    const publicAppUrl = this.getPublicAppUrl();
    const htmlWithAbsoluteImages = body.replace(/(\bsrc\s*=\s*["'])\/(assets\/rich-text\/)/gi, `$1${publicAppUrl}/$2`);

    const htmlWithTableStyles = htmlWithAbsoluteImages.replace(
      /<(table|th|td)\b([^>]*)>/gi,
      (_tag, element: string, attributes: string) => {
        const styles = {
          table: 'border-collapse: collapse; width: 100%;',
          th: 'border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; vertical-align: top; font-weight: 600; background-color: #f9fafb;',
          td: 'border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; vertical-align: top;',
        } as const;

        return `<${element}${this.addMissingInlineStyles(attributes, styles[element.toLowerCase() as keyof typeof styles])}>`;
      },
    );

    return htmlWithTableStyles.replace(/<(p|h[1-3])\b([^>]*)>/gi, (_tag, element: string, attributes: string) => {
      const indentAttribute = attributes.match(/\bdata-indent\s*=\s*(["'])([1-6])\1/i);
      if (!indentAttribute) {
        return `<${element}${attributes}>`;
      }

      const padding = `${Number(indentAttribute[2]) * 2}em`;
      return `<${element}${this.setInlineStyleProperty(attributes, 'padding-left', padding, 'margin-left')}>`;
    });
  }

  private addMissingInlineStyles(attributes: string, styles: string): string {
    const styleAttribute = attributes.match(/\sstyle\s*=\s*(["'])(.*?)\1/i);
    if (!styleAttribute) {
      return `${attributes} style="${styles}"`;
    }

    const existingStyles = styleAttribute[2];
    const existingProperties = new Set(
      existingStyles
        .split(';')
        .map((declaration) => declaration.split(':', 1)[0]?.trim().toLowerCase())
        .filter(Boolean),
    );
    const missingStyles = styles
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(
        (declaration) => declaration && !existingProperties.has(declaration.split(':', 1)[0].trim().toLowerCase()),
      );

    if (missingStyles.length === 0) {
      return attributes;
    }

    const separator = existingStyles.trim() && !existingStyles.trim().endsWith(';') ? '; ' : ' ';
    const mergedStyles = `${existingStyles}${separator}${missingStyles.join('; ')};`;
    return attributes.replace(styleAttribute[0], ` style=${styleAttribute[1]}${mergedStyles}${styleAttribute[1]}`);
  }

  private setInlineStyleProperty(
    attributes: string,
    property: string,
    value: string,
    propertyToReplace?: string,
  ): string {
    const styleAttribute = attributes.match(/\sstyle\s*=\s*(["'])(.*?)\1/i);
    if (!styleAttribute) {
      return `${attributes} style="${property}: ${value};"`;
    }

    const propertyName = property.toLowerCase();
    const replacementName = propertyToReplace?.toLowerCase();
    let propertySet = false;
    const declarations = styleAttribute[2]
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separatorIndex = declaration.indexOf(':');
        const name = separatorIndex === -1 ? '' : declaration.slice(0, separatorIndex).trim().toLowerCase();

        if (name === propertyName || name === replacementName) {
          if (propertySet) {
            return '';
          }

          propertySet = true;
          return `${property}: ${value}`;
        }

        return declaration;
      })
      .filter(Boolean);

    if (!propertySet) {
      declarations.push(`${property}: ${value}`);
    }

    const mergedStyles = `${declarations.join('; ')};`;
    return attributes.replace(styleAttribute[0], ` style=${styleAttribute[1]}${mergedStyles}${styleAttribute[1]}`);
  }
}
