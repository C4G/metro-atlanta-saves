import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { betterAuth } from 'better-auth';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '@mas/backend-prisma';
import { ManagedSessionGuard } from '@mas/backend-shared';

@Controller('managed-protected')
@UseGuards(ManagedSessionGuard)
class ManagedProtectedController {
  @Get()
  get(@Req() req: Request & { user: { id: string } }) {
    return { userId: req.user.id };
  }
}

describe('managed session protection', () => {
  let app: NestExpressApplication;
  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => ({
        id: where.id,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: null,
        partnerId: null,
        hash: 'legacy-hash',
        forgot: null,
      })),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BetterAuthModule.forRoot({
          auth: betterAuth({
            database: memoryAdapter({ user: [], account: [], session: [], verification: [] }),
            baseURL: 'http://localhost:3000',
            basePath: '/api/auth',
            secret: 'test-secret-that-is-long-enough-for-better-auth',
            trustedOrigins: ['http://localhost:4200'],
            emailAndPassword: { enabled: true },
          }),
          disableGlobalAuthGuard: true,
        }),
      ],
      controllers: [ManagedProtectedController],
      providers: [PrismaService, ManagedSessionGuard],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid managed session and loads the application user', async () => {
    const email = `managed-${Date.now()}@example.com`;
    const signUp = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:4200')
      .send({ name: 'Test User', email, password: 'Password123!' });

    const response = await request(app.getHttpServer())
      .get('/managed-protected')
      .set('Cookie', signUp.headers['set-cookie']);

    expect(signUp.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: expect.any(String) });
  });

  it('rejects a legacy bearer JWT on protected routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/managed-protected')
      .set('Authorization', 'Bearer legacy-jwt-token');

    expect(response.status).toBe(401);
  });
});
