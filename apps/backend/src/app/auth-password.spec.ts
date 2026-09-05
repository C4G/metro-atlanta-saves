import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@mas/backend-prisma';
import { createBetterAuth } from '@mas/backend-auth';

describe('Better Auth password compatibility', () => {
  const auth = createBetterAuth(
    {} as PrismaService,
    new ConfigService({
      BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-for-better-auth',
    }),
  );
  const password = auth.options.emailAndPassword?.password;

  it('verifies an existing Argon2 credential hash', async () => {
    const hash = await argon.hash('ExistingPassword123!');

    expect(password).toBeDefined();
    await expect(password?.verify({ hash, password: 'ExistingPassword123!' })).resolves.toBe(true);
    await expect(password?.verify({ hash, password: 'WrongPassword123!' })).resolves.toBe(false);
  });

  it('uses Argon2 for newly created credential hashes', async () => {
    expect(password).toBeDefined();

    const hash = await password?.hash('NewPassword123!');

    expect(hash).toBeDefined();
    await expect(argon.verify(hash as string, 'NewPassword123!')).resolves.toBe(true);
  });
});
