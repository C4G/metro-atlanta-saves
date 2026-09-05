import { prismaAdapter } from '@better-auth/prisma-adapter';
import { MailService } from '@mas/backend-mail';
import { PrismaService } from '@mas/backend-prisma';
import { PrismaClient } from '@mas/prisma-client';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import * as argon from 'argon2';
import { createScopedImpersonationPlugin } from './scoped-impersonation';

function trustedOrigins(config: ConfigService): string[] {
  const configuredOrigins = config.get<string>('CORS_ORIGIN');

  return (configuredOrigins ?? 'http://localhost:4200,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createBetterAuth(prisma: PrismaService, config: ConfigService, mailService?: MailService) {
  return betterAuth({
    database: prismaAdapter(prisma as unknown as PrismaClient, {
      provider: 'postgresql',
    }),
    baseURL: config.get<string>('BETTER_AUTH_URL') ?? 'http://localhost:3000',
    basePath: '/api/auth',
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    trustedOrigins: trustedOrigins(config),
    plugins: [createScopedImpersonationPlugin(prisma)],
    session: {
      additionalFields: {
        impersonatedBy: {
          type: 'string',
          required: false,
          input: false,
          returned: true,
        },
        impersonationReturnPath: {
          type: 'string',
          required: false,
          input: false,
          returned: true,
        },
      },
    },
    user: {
      additionalFields: {
        firstName: {
          type: 'string',
          required: true,
          input: true,
        },
        lastName: {
          type: 'string',
          required: true,
          input: true,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      ...(mailService
        ? {
            sendResetPassword: ({ user, token, url }: { user: { email: string }; token: string; url: string }) =>
              mailService.sendForgotPassword(user.email, token, url),
          }
        : {}),
      password: {
        hash: (password: string) => argon.hash(password),
        verify: ({ hash, password }: { hash: string; password: string }) => argon.verify(hash, password),
      },
    },
  });
}
