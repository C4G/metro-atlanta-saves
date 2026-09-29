import { prismaAdapter } from '@better-auth/prisma-adapter';
import { MailService } from '@mas/backend-mail';
import { PrismaService } from '@mas/backend-prisma';
import { PrismaClient } from '@mas/prisma-client';
import { ConfigService } from '@nestjs/config';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { oneTap } from 'better-auth/plugins';
import * as argon from 'argon2';
import { createScopedImpersonationPlugin } from './scoped-impersonation';

function trustedOrigins(config: ConfigService): string[] {
  const configuredOrigins = config.get<string>('CORS_ORIGIN');

  return (configuredOrigins ?? 'http://localhost:4200,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function authBaseURL(config: ConfigService): BetterAuthOptions['baseURL'] {
  const fallback = config.get<string>('BETTER_AUTH_URL') ?? 'http://localhost:3000';
  const allowedHosts = (config.get<string>('BETTER_AUTH_ALLOWED_HOSTS') ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  if (!allowedHosts.length) return fallback;
  return {
    allowedHosts,
    protocol: new URL(fallback).protocol === 'https:' ? 'https' : 'http',
    fallback,
  };
}

export function googleCredentials(config: ConfigService): { clientId: string; clientSecret: string } | undefined {
  const clientId = config.get<string>('GOOGLE_CLIENT_ID')?.trim();
  const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
  if (!clientId || !clientSecret) return undefined;
  return { clientId, clientSecret };
}

function googleNames(profile: {
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
}): { firstName: string; lastName: string } | undefined {
  const fullName = typeof profile.name === 'string' ? profile.name.trim() : '';
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = (typeof profile.given_name === 'string' ? profile.given_name.trim() : '') || parts[0];
  const lastName =
    (typeof profile.family_name === 'string' ? profile.family_name.trim() : '') || parts.slice(1).join(' ');
  return firstName && lastName ? { firstName, lastName } : undefined;
}

export function createBetterAuth(
  prisma: PrismaService,
  config: ConfigService,
  mailService?: MailService,
): ReturnType<typeof betterAuth> {
  const google = googleCredentials(config);
  const options: BetterAuthOptions = {
    database: prismaAdapter(prisma as unknown as PrismaClient, {
      provider: 'postgresql',
    }),
    baseURL: authBaseURL(config),
    basePath: '/api/auth',
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    trustedOrigins: trustedOrigins(config),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/one-tap/callback') return;
        const origin = ctx.request?.headers.get('origin');
        if (!origin || !ctx.context.isTrustedOrigin(origin)) {
          throw APIError.fromStatus('FORBIDDEN', { message: 'Invalid One Tap origin' });
        }
      }),
    },
    plugins: [createScopedImpersonationPlugin(prisma), ...(google ? [oneTap({ clientId: google.clientId })] : [])],
    ...(google
      ? {
          socialProviders: {
            google: {
              ...google,
              mapProfileToUser: (profile) => googleNames(profile) ?? {},
            },
          },
          account: {
            accountLinking: {
              // Current password accounts do not require email verification.
              // The incoming Google email is verified by the gate below.
              requireLocalEmailVerified: false,
              updateUserInfoOnLink: false,
            },
          },
        }
      : {}),
    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            if (user['firstName'] && user['lastName']) return;
            // The installed One Tap plugin passes only Google's full name to
            // createUser. Fill these fields after Better Auth parses the
            // provider input, then enforce the same requirement for all paths.
            if (context?.path === '/one-tap/callback') {
              const names = googleNames({ name: user.name });
              if (names) return { data: { ...user, ...names } };
            }
            throw APIError.fromStatus('BAD_REQUEST', { message: 'First and last names are required' });
          },
        },
      },
    },
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
      validateUserInfo: ({ user, source }) => {
        if (source.oauth?.providerId !== 'google') return;
        const profile = source.oauth.profile;
        if (!user.email || profile?.['email_verified'] !== true || user.emailVerified !== true) {
          return {
            error: 'google_email_not_verified',
            errorDescription: 'Google must verify your email before sign-in.',
          };
        }
        if (source.action === 'create-user' && !googleNames({ ...profile, name: user.name })) {
          return {
            error: 'google_name_required',
            errorDescription: 'Your Google account needs a first and last name. You can register with email instead.',
          };
        }
        return;
      },
      additionalFields: {
        firstName: {
          type: 'string',
          required: false,
          input: true,
        },
        lastName: {
          type: 'string',
          required: false,
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
  };
  return betterAuth(options);
}
