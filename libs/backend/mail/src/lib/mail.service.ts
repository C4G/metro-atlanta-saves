import { UserFull } from '@mas/models';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendForgotPassword(email: string, token: string) {
    const url = `https://brpatl.com/reset-password?token=${token}&email=${email}`;

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
      html: body,
    });
  }
}
