import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuth } from 'better-auth';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '@mas/backend-prisma';
import { createScopedImpersonationPlugin } from '@mas/backend-auth';

describe('scoped impersonation endpoints', () => {
  let app: NestExpressApplication;
  let auth: ReturnType<typeof betterAuth>;
  let adminId = '';
  let staffId = '';
  let allowedTargetId = '';
  let disallowedTargetId = '';

  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        if (where.id === adminId) return { id: adminId, role: 'Administrator', partnerId: null };
        if (where.id === staffId) return { id: staffId, role: 'Partner_Staff', partnerId: 'partner-a' };
        if (where.id === allowedTargetId) return { id: allowedTargetId, role: null, partnerId: null };
        if (where.id === disallowedTargetId) return { id: disallowedTargetId, role: null, partnerId: null };
        return null;
      }),
    },
    usersOnPrograms: {
      findFirst: jest.fn(({ where }: { where: { userId: string; program: { partnerId: string } } }) =>
        where.userId === allowedTargetId && where.program.partnerId === 'partner-a'
          ? { userId: allowedTargetId }
          : null,
      ),
    },
  };

  beforeAll(async () => {
    auth = betterAuth({
      database: memoryAdapter({ user: [], account: [], session: [], verification: [] }),
      baseURL: 'http://localhost:3000',
      basePath: '/api/auth',
      secret: 'test-secret-that-is-long-enough-for-better-auth',
      trustedOrigins: ['http://localhost:4200'],
      emailAndPassword: { enabled: true },
      session: {
        additionalFields: {
          impersonatedBy: { type: 'string', required: false, input: false },
          impersonationReturnPath: { type: 'string', required: false, input: false },
        },
      },
      plugins: [createScopedImpersonationPlugin(prisma as unknown as PrismaService)],
    });
    const moduleRef = await Test.createTestingModule({
      imports: [BetterAuthModule.forRoot({ auth, disableGlobalAuthGuard: true })],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:4200')
      .send({ name: email, email, password: 'Password123!' });
    return { id: response.body.user.id as string, cookies: response.headers['set-cookie'] as string[] };
  }

  function cookieHeader(setCookies: string[]) {
    const values = new Map<string, string>();
    for (const cookie of setCookies) {
      const [name, value] = cookie.split(';', 1)[0].split('=');
      values.set(name, `${name}=${value}`);
    }
    return [...values.values()].join('; ');
  }

  it('starts for an Administrator and restores the originating session on stop', async () => {
    const admin = await signUp(`admin-${Date.now()}@example.com`);
    const target = await signUp(`target-${Date.now()}@example.com`);
    adminId = admin.id;
    allowedTargetId = target.id;

    const start = await request(app.getHttpServer())
      .post('/api/auth/scoped-impersonate')
      .set('Cookie', cookieHeader(admin.cookies))
      .send({ userId: target.id, returnPath: '/admin/users' });

    expect(start.status).toBe(200);
    expect(start.body.user.id).toBe(target.id);
    const impersonationCookies = start.headers['set-cookie'] as string[];
    expect(start.body.session.impersonatedBy).toBe(admin.id);
    expect(start.body.session.impersonationReturnPath).toBe('/admin/users');
    expect(new Date(start.body.session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(impersonationCookies.join(';')).not.toMatch(/originalToken/i);

    const stop = await request(app.getHttpServer())
      .post('/api/auth/scoped-stop-impersonating')
      .set('Cookie', cookieHeader(impersonationCookies));

    expect(stop.status).toBe(200);
    expect(stop.body.user.id).toBe(admin.id);

    const targetSession = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Cookie', cookieHeader(impersonationCookies));
    expect(targetSession.body).toBeNull();
  });

  it('allows Partner Staff only for a target in a matching partner program', async () => {
    const staff = await signUp(`staff-${Date.now()}@example.com`);
    const allowed = await signUp(`allowed-${Date.now()}@example.com`);
    const disallowed = await signUp(`disallowed-${Date.now()}@example.com`);
    staffId = staff.id;
    allowedTargetId = allowed.id;
    disallowedTargetId = disallowed.id;

    const allowedResponse = await request(app.getHttpServer())
      .post('/api/auth/scoped-impersonate')
      .set('Cookie', cookieHeader(staff.cookies))
      .send({ userId: allowed.id });
    expect(allowedResponse.status).toBe(200);

    const disallowedResponse = await request(app.getHttpServer())
      .post('/api/auth/scoped-impersonate')
      .set('Cookie', cookieHeader(staff.cookies))
      .send({ userId: disallowed.id });
    expect(disallowedResponse.status).toBe(403);
  });

  it('rejects stop requests from a normal non-impersonated session', async () => {
    const user = await signUp(`normal-${Date.now()}@example.com`);

    const response = await request(app.getHttpServer())
      .post('/api/auth/scoped-stop-impersonating')
      .set('Cookie', cookieHeader(user.cookies));

    expect(response.status).toBe(403);
  });

  it('rejects stop requests after the impersonated session expires', async () => {
    const admin = await signUp(`expiring-admin-${Date.now()}@example.com`);
    const target = await signUp(`expiring-target-${Date.now()}@example.com`);
    adminId = admin.id;
    allowedTargetId = target.id;

    const start = await request(app.getHttpServer())
      .post('/api/auth/scoped-impersonate')
      .set('Cookie', cookieHeader(admin.cookies))
      .send({ userId: target.id });
    expect(start.status).toBe(200);

    const context = await auth.$context;
    await context.internalAdapter.updateSession(start.body.session.token, {
      expiresAt: new Date(Date.now() - 1_000),
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/scoped-stop-impersonating')
      .set('Cookie', cookieHeader(start.headers['set-cookie'] as string[]));

    expect(response.status).toBe(403);
  });
});
