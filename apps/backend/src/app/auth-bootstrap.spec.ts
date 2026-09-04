import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createBetterAuth } from '@mas/backend-auth';
import { AppModule } from './app.module';
import { PrismaService } from '@mas/backend-prisma';
import { ConfigService } from '@nestjs/config';

describe('Better Auth bootstrap', () => {
  let app: NestExpressApplication;
  let memoryAuthApp: NestExpressApplication;
  const sendResetPassword = jest.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    process.env['BETTER_AUTH_SECRET'] = 'test-secret-that-is-long-enough-for-better-auth';
    process.env['BETTER_AUTH_URL'] = 'http://localhost:3000';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    app.setGlobalPrefix('api');
    await app.init();

    const memoryAuthModule = await Test.createTestingModule({
      imports: [
        BetterAuthModule.forRoot({
          auth: betterAuth({
            database: memoryAdapter({ user: [], account: [], session: [], verification: [] }),
            baseURL: 'http://localhost:3000',
            basePath: '/api/auth',
            secret: 'test-secret-that-is-long-enough-for-better-auth',
            trustedOrigins: ['http://localhost:4200'],
            emailAndPassword: { enabled: true, sendResetPassword },
          }),
          disableGlobalAuthGuard: true,
        }),
      ],
    }).compile();

    memoryAuthApp = memoryAuthModule.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    await memoryAuthApp.init();
  });

  afterAll(async () => {
    await app.close();
    await memoryAuthApp.close();
  });

  it('serves the Better Auth session endpoint through the Nest bootstrap', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/get-session');

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('allows credentialed local auth requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Origin', 'http://localhost:4200');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not treat a legacy bearer token as a Better Auth session', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Authorization', 'Bearer legacy-jwt-token');

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('uses the Better Auth secret separately from the rollback JWT secret', () => {
    const auth = createBetterAuth(
      {} as PrismaService,
      new ConfigService({
        BETTER_AUTH_SECRET: 'new-session-secret',
        JWT_SECRET: 'legacy-signing-secret',
      }),
    );

    expect(auth.options.secret).toBe('new-session-secret');
  });

  it('uses a credentialed HttpOnly session cookie across sign-in, lookup, and sign-out', async () => {
    const email = `better-auth-${Date.now()}@example.com`;
    const signInResponse = await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:4200')
      .send({ name: 'Test User', email, password: 'Password123!' });
    const cookies = signInResponse.headers['set-cookie'];

    expect(signInResponse.status).toBe(200);
    expect(cookies).toEqual(expect.arrayContaining([expect.stringMatching(/HttpOnly/i)]));

    const sessionResponse = await request(memoryAuthApp.getHttpServer())
      .get('/api/auth/get-session')
      .set('Cookie', cookies);
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.user.email).toBe(email);

    const signOutResponse = await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/sign-out')
      .set('Cookie', cookies);
    expect(signOutResponse.status).toBe(200);

    const invalidatedSessionResponse = await request(memoryAuthApp.getHttpServer())
      .get('/api/auth/get-session')
      .set('Cookie', cookies);
    expect(invalidatedSessionResponse.status).toBe(200);
    expect(invalidatedSessionResponse.body).toBeNull();
  });

  it('supports password reset while retaining the managed session flow', async () => {
    const email = `reset-${Date.now()}@example.com`;
    await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:4200')
      .send({ name: 'Reset User', email, password: 'Password123!' });

    sendResetPassword.mockClear();
    const resetRequest = await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/request-password-reset')
      .set('Origin', 'http://localhost:4200')
      .send({ email, redirectTo: '/reset-password' });

    expect(resetRequest.status).toBe(200);
    expect(sendResetPassword).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ email }), token: expect.any(String) }),
      expect.anything(),
    );

    const [{ token }] = sendResetPassword.mock.calls[0];
    const resetResponse = await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewPassword123!' });
    expect(resetResponse.status).toBe(200);

    const signInResponse = await request(memoryAuthApp.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password: 'NewPassword123!' });
    expect(signInResponse.status).toBe(200);
  });
});
