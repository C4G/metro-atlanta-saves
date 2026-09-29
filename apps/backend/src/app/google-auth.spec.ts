import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mas/backend-prisma';
import { createBetterAuth, googleCredentials } from '@mas/backend-auth';
import { GoogleAuthConfigController } from '@mas/backend-auth';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createSign, generateKeyPairSync } from 'node:crypto';

const credentials = {
  BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-for-better-auth',
  BETTER_AUTH_URL: 'http://localhost:3000',
  CORS_ORIGIN: 'http://localhost:4200',
  GOOGLE_CLIENT_ID: 'google-client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'private-google-secret',
};

function configuredAuth() {
  return createBetterAuth({} as PrismaService, new ConfigService(credentials));
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const googlePublicKey = { ...publicKey.export({ format: 'jwk' }), kid: 'test-google-key', alg: 'RS256', use: 'sig' };

function signedGoogleToken(claims: Record<string, unknown>): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-google-key' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'https://accounts.google.com',
      aud: credentials.GOOGLE_CLIENT_ID,
      iat: now,
      exp: now + 3600,
      sub: 'google-subject',
      email: 'person@example.com',
      email_verified: true,
      name: 'Test User',
      ...claims,
    }),
  ).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

async function withGooglePublicKey<T>(run: () => Promise<T>): Promise<T> {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    if (String(input) !== 'https://www.googleapis.com/oauth2/v3/certs') throw new Error(`Unexpected request: ${input}`);
    return Response.json({ keys: [googlePublicKey] });
  }) as typeof fetch;
  try {
    return await run();
  } finally {
    global.fetch = originalFetch;
  }
}

function oneTapRequest(idToken: string, origin = 'http://localhost:4200'): Request {
  return new Request('http://localhost:3000/api/auth/one-tap/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ idToken }),
  });
}

describe('Google authentication configuration', () => {
  it('enables Google only when both server credentials exist and exposes only the client ID', () => {
    const config = new ConfigService(credentials);
    const auth = configuredAuth();
    expect(googleCredentials(config)).toEqual({
      clientId: credentials.GOOGLE_CLIENT_ID,
      clientSecret: credentials.GOOGLE_CLIENT_SECRET,
    });
    expect(auth.options.socialProviders?.google).toMatchObject({ clientId: credentials.GOOGLE_CLIENT_ID });
    expect(auth.options.plugins?.some((plugin) => plugin.id === 'one-tap')).toBe(true);
    expect(new GoogleAuthConfigController(config).getConfig()).toEqual({ clientId: credentials.GOOGLE_CLIENT_ID });

    const disabledConfig = new ConfigService({ ...credentials, GOOGLE_CLIENT_SECRET: '' });
    const disabledAuth = createBetterAuth({} as PrismaService, disabledConfig);
    expect(disabledAuth.options.socialProviders?.google).toBeUndefined();
    expect(disabledAuth.options.plugins?.some((plugin) => plugin.id === 'one-tap')).toBe(false);
    expect(new GoogleAuthConfigController(disabledConfig).getConfig()).toEqual({ clientId: null });
  });

  it('starts the managed OAuth flow with the configured callback URI', async () => {
    const auth = betterAuth({
      ...configuredAuth().options,
      database: memoryAdapter({ user: [], account: [], session: [], verification: [] }),
    });
    const response = await auth.handler(
      new Request('http://localhost:3000/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:4200' },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: 'http://localhost:4200/login?google=success',
          errorCallbackURL: 'http://localhost:4200/login',
          disableRedirect: true,
        }),
      }),
    );
    expect(response.status).toBe(200);
    const { url } = await response.json();
    expect(url).toContain(`client_id=${credentials.GOOGLE_CLIENT_ID}`);
    expect(decodeURIComponent(url)).toContain('http://localhost:3000/api/auth/callback/google');
  });

  it('uses each allowed production hostname for its own OAuth callback', async () => {
    const config = new ConfigService({
      ...credentials,
      BETTER_AUTH_URL: 'https://brpatl.com',
      BETTER_AUTH_ALLOWED_HOSTS: 'brpatl.com,www.brpatl.com',
      CORS_ORIGIN: 'https://brpatl.com,https://www.brpatl.com',
    });
    const db = { user: [], account: [], session: [], verification: [] };
    const auth = betterAuth({
      ...createBetterAuth({} as PrismaService, config).options,
      database: memoryAdapter(db),
    });

    for (const origin of ['https://brpatl.com', 'https://www.brpatl.com']) {
      const response = await auth.handler(
        new Request(`${origin}/api/auth/sign-in/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: origin },
          body: JSON.stringify({
            provider: 'google',
            callbackURL: `${origin}/login?google=success`,
            disableRedirect: true,
          }),
        }),
      );
      expect(response.status).toBe(200);
      const { url } = await response.json();
      expect(decodeURIComponent(url)).toContain(`${origin}/api/auth/callback/google`);
    }
  });

  it('rejects unverified Google identities before creating or linking a user', async () => {
    const validate = configuredAuth().options.user?.validateUserInfo;
    expect(validate).toBeDefined();
    for (const action of ['create-user', 'link-account', 'sign-in'] as const) {
      const result = await validate?.(
        {
          user: { email: 'person@example.com', emailVerified: false, name: 'Test User' },
          source: { method: 'oauth', action, oauth: { providerId: 'google', profile: { email_verified: false } } },
        },
        {} as never,
      );
      expect(result).toMatchObject({ error: 'google_email_not_verified' });
    }
  });

  it('maps names for new Google users without accepting authorization claims', async () => {
    const auth = configuredAuth();
    const google = auth.options.socialProviders?.google;
    if (!google || typeof google === 'function') throw new Error('Google provider is unavailable');
    const mapped = await google.mapProfileToUser?.({
      id: 'google-user',
      sub: 'google-user',
      email: 'person@example.com',
      email_verified: true,
      given_name: 'Test',
      family_name: 'User',
      name: 'Test User',
      role: 'Administrator',
      partnerId: 'partner-1',
    } as never);
    expect(mapped).toEqual({ firstName: 'Test', lastName: 'User' });
    expect(auth.options.account?.accountLinking).toMatchObject({
      requireLocalEmailVerified: false,
      updateUserInfoOnLink: false,
    });

    const validate = auth.options.user?.validateUserInfo;
    const missingName = await validate?.(
      {
        user: { email: 'person@example.com', emailVerified: true, name: 'Test' },
        source: {
          method: 'oauth',
          action: 'create-user',
          oauth: { providerId: 'google', profile: { email_verified: true, name: 'Test' } },
        },
      },
      {} as never,
    );
    expect(missingName).toMatchObject({ error: 'google_name_required' });
  });

  it('rejects invalid and unauthorized-origin One Tap submissions without a session', async () => {
    const auth = configuredAuth();
    for (const origin of ['http://localhost:4200', 'https://unauthorized.example']) {
      const response = await auth.handler(oneTapRequest('invalid-token', origin));
      expect(response.status).toBe(origin === 'http://localhost:4200' ? 400 : 403);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('rejects a valid One Tap token from an untrusted origin before creating a user', async () => {
    const db = { user: [], account: [], session: [], verification: [] };
    const auth = betterAuth({ ...configuredAuth().options, database: memoryAdapter(db) });
    const response = await auth.handler(oneTapRequest(signedGoogleToken({}), 'https://unauthorized.example'));
    expect(response.status).toBe(403);
    expect(db.user).toHaveLength(0);
    expect(db.session).toHaveLength(0);
  });

  it('links a verified returning user without replacing application authorization or profile', async () => {
    const existing = {
      id: 'existing-user',
      name: 'Existing Person',
      firstName: 'Existing',
      lastName: 'Person',
      email: 'person@example.com',
      emailVerified: false,
      image: null,
      role: 'Administrator',
      partnerId: 'partner-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const db = { user: [existing], account: [], session: [], verification: [] };
    const auth = betterAuth({ ...configuredAuth().options, database: memoryAdapter(db) });

    const response = await withGooglePublicKey(() =>
      auth.handler(
        oneTapRequest(
          signedGoogleToken({
            name: 'Changed Google Name',
            role: 'Partner_Staff',
            partnerId: 'other-partner',
          }),
        ),
      ),
    );

    expect(response.status).toBe(200);
    expect(db.user).toHaveLength(1);
    expect(db.user[0]).toMatchObject({
      id: 'existing-user',
      firstName: 'Existing',
      lastName: 'Person',
      role: 'Administrator',
      partnerId: 'partner-1',
    });
    expect(db.account).toEqual([expect.objectContaining({ userId: 'existing-user', providerId: 'google' })]);
    expect(db.session).toEqual([expect.objectContaining({ userId: 'existing-user' })]);
  });

  it('creates a least-privilege user with required names and a managed session', async () => {
    const db = { user: [], account: [], session: [], verification: [] };
    const auth = betterAuth({ ...configuredAuth().options, database: memoryAdapter(db) });

    const response = await withGooglePublicKey(() =>
      auth.handler(
        oneTapRequest(
          signedGoogleToken({
            role: 'Administrator',
            partnerId: 'partner-1',
          }),
        ),
      ),
    );

    expect(response.status).toBe(200);
    expect(db.user).toHaveLength(1);
    expect(db.user[0]).toMatchObject({ firstName: 'Test', lastName: 'User', email: 'person@example.com' });
    expect(db.user[0]).not.toHaveProperty('role');
    expect(db.user[0]).not.toHaveProperty('partnerId');
    expect(db.session).toEqual([expect.objectContaining({ userId: db.user[0].id })]);
  });

  it('rejects an unverified One Tap email before creating an account or session', async () => {
    const db = { user: [], account: [], session: [], verification: [] };
    const auth = betterAuth({ ...configuredAuth().options, database: memoryAdapter(db) });
    const response = await withGooglePublicKey(() =>
      auth.handler(oneTapRequest(signedGoogleToken({ email_verified: false }))),
    );

    expect(response.status).toBe(403);
    expect(db.user).toHaveLength(0);
    expect(db.account).toHaveLength(0);
    expect(db.session).toHaveLength(0);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects incomplete Google names and still requires names on email registration', async () => {
    const db = { user: [], account: [], session: [], verification: [] };
    const auth = betterAuth({ ...configuredAuth().options, database: memoryAdapter(db) });
    const oneTap = await withGooglePublicKey(() => auth.handler(oneTapRequest(signedGoogleToken({ name: 'Test' }))));
    expect(oneTap.status).toBe(403);

    const email = await auth.handler(
      new Request('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:4200' },
        body: JSON.stringify({ name: 'Email User', email: 'email@example.com', password: 'Password123!' }),
      }),
    );
    expect(email.status).toBe(400);
    expect(db.user).toHaveLength(0);
    expect(db.session).toHaveLength(0);
  });
});
