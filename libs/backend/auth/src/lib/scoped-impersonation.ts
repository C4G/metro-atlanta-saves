import { PrismaService } from '@mas/backend-prisma';
import { APIError, createAuthEndpoint, getSessionFromCtx } from 'better-auth/api';
import { deleteSessionCookie, expireCookie, setSessionCookie } from 'better-auth/cookies';
import type { BetterAuthPlugin } from 'better-auth';
import { z } from 'zod';

const IMPERSONATION_DURATION_SECONDS = 60 * 60;

async function canImpersonate(prisma: PrismaService, requesterId: string, targetId: string): Promise<boolean> {
  const [requester, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, role: true, partnerId: true },
    }),
    prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, partnerId: true },
    }),
  ]);

  if (!requester || !target || requester.id === target.id) return false;
  if (requester.role === 'Administrator') return true;
  if (requester.role !== 'Partner_Staff' || !requester.partnerId) return false;

  if (target.role === 'Partner_Staff') {
    return target.partnerId === requester.partnerId;
  }

  if (target.role !== null) return false;

  const membership = await prisma.usersOnPrograms.findFirst({
    where: {
      userId: target.id,
      program: { partnerId: requester.partnerId },
    },
    select: { userId: true },
  });

  return Boolean(membership);
}

export function createScopedImpersonationPlugin(prisma: PrismaService): BetterAuthPlugin {
  return {
    id: 'scoped-impersonation',
    schema: {
      session: {
        fields: {
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
    },
    endpoints: {
      startImpersonation: createAuthEndpoint(
        '/scoped-impersonate',
        {
          method: 'POST',
          requireHeaders: true,
          body: z.object({
            userId: z.string(),
            returnPath: z.string().optional(),
          }),
        },
        async (ctx) => {
          const originatingSession = await getSessionFromCtx(ctx, { disableCookieCache: true });
          if (!originatingSession) throw APIError.fromStatus('UNAUTHORIZED');

          const allowed = await canImpersonate(prisma, originatingSession.user.id, ctx.body.userId);
          if (!allowed) throw APIError.fromStatus('FORBIDDEN');

          const targetUser = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
          if (!targetUser) throw APIError.fromStatus('NOT_FOUND');

          const session = await ctx.context.internalAdapter.createSession(
            targetUser.id,
            true,
            {
              impersonatedBy: originatingSession.user.id,
              impersonationReturnPath: ctx.body.returnPath ?? '/',
              expiresAt: new Date(Date.now() + IMPERSONATION_DURATION_SECONDS * 1000),
            },
            true,
          );
          if (!session) throw APIError.fromStatus('INTERNAL_SERVER_ERROR');

          const originCookie = ctx.context.createAuthCookie('mas_impersonator_session');
          await ctx.setSignedCookie(
            originCookie.name,
            originatingSession.session.token,
            ctx.context.secret,
            ctx.context.authCookies.sessionToken.attributes,
          );
          deleteSessionCookie(ctx);
          await setSessionCookie(ctx, { session, user: targetUser }, true);

          return ctx.json({
            session,
            user: targetUser,
          });
        },
      ),
      stopImpersonation: createAuthEndpoint(
        '/scoped-stop-impersonating',
        { method: 'POST', requireHeaders: true },
        async (ctx) => {
          const impersonatedSession = await getSessionFromCtx(ctx, { disableCookieCache: true });
          if (!impersonatedSession?.session['impersonatedBy']) throw APIError.fromStatus('FORBIDDEN');

          const originCookie = ctx.context.createAuthCookie('mas_impersonator_session');
          const originToken = await ctx.getSignedCookie(originCookie.name, ctx.context.secret);
          if (!originToken) throw APIError.fromStatus('FORBIDDEN');

          const originatingSession = await ctx.context.internalAdapter.findSession(originToken);
          if (
            !originatingSession ||
            originatingSession.session.userId !== impersonatedSession.session['impersonatedBy']
          ) {
            throw APIError.fromStatus('FORBIDDEN');
          }

          await ctx.context.internalAdapter.deleteSession(impersonatedSession.session.token);
          await setSessionCookie(ctx, originatingSession, false);
          expireCookie(ctx, originCookie);

          return ctx.json({
            session: originatingSession.session,
            user: originatingSession.user,
          });
        },
      ),
    },
  };
}

export { canImpersonate, IMPERSONATION_DURATION_SECONDS };
