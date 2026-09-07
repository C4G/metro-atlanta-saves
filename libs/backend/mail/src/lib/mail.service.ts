import { UserFull } from '@mas/models';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendForgotPassword(email: string, token: string, resetUrl?: string) {
    const url = resetUrl ?? `https://brpatl.com/reset-password?token=${token}&email=${email}`;

    await this.mailerService.sendMail({
      to: email,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: 'Forgot your email? Reset it now!',
      template: './forgot-password',
      context: {
        url,
      },
    });
  }

  async sendAccountCreated(email: string, token: string) {
    const url = `https://brpatl.com/reset-password?token=${token}&email=${email}&set=true`;

    await this.mailerService.sendMail({
      to: email,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: 'Your account was created! Create a password now',
      template: './account-created',
      context: {
        url,
      },
    });
  }

  async sendCheckpointImageChanged(approved: boolean, email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: `Your checkpoint submission was ${approved ? 'approved' : 'rejected'}!`,
      template: './checkpoint-image-changed',
      context: { name, status: approved ? 'approved' : 'rejected', approved },
    });
  }

  async sendPartnerStaffImageAdded(partnerEmails: string[], programId: string, { id, firstName, lastName }: UserFull) {
    const url = `https://www.brpatl.com/partner-staff/programs/${programId}/users/${id}`;

    await this.mailerService.sendMail({
      to: partnerEmails,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: 'A new image was added and awaiting approval!',
      template: './user-image-added',
      context: { url, name: `${firstName} ${lastName}` },
    });
  }

  async sendNewEducationalContent(emails: string[], heading: string, body: string) {
    const url = 'https://brpatl.com/educational-resources';

    await this.mailerService.sendMail({
      to: emails,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject: heading,
      template: './new-educational-content',
      context: { heading, body, url },
    });
  }

  async sendBulkEmail(emails: string[], subject: string, body: string) {
    await this.mailerService.sendMail({
      to: emails,
      from: '"BRPATL" <no-reply@brpatl.com>',
      subject,
      html: this.toEmailHtml(body),
    });
  }

  private toEmailHtml(body: string): string {
    const publicAppUrl = (this.configService.get<string>('PUBLIC_APP_URL') ?? 'https://brpatl.com').replace(/\/+$/, '');
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
