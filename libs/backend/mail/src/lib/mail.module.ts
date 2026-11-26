import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService, RESEND_CLIENT_FACTORY, type ResendClientFactory } from './mail.service';

const resendClientFactoryProvider: Provider = {
  provide: RESEND_CLIENT_FACTORY,
  inject: [ConfigService],
  useFactory: (config: ConfigService): ResendClientFactory => {
    let client: Resend | undefined;
    let clientKey: string | undefined;

    return () => {
      const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured; cannot send email.');
      }

      if (!client || clientKey !== apiKey) {
        client = new Resend(apiKey);
        clientKey = apiKey;
      }

      return client;
    };
  },
};

@Global()
@Module({
  providers: [resendClientFactoryProvider, MailService],
  exports: [MailService],
})
export class MailModule {}
