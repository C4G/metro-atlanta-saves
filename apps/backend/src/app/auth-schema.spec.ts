import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Better Auth Prisma schema', () => {
  const prismaDir = join(process.cwd(), 'apps/backend/prisma');
  const schema = [
    readFileSync(join(prismaDir, 'schema.prisma'), 'utf8'),
    ...readdirSync(join(prismaDir, 'models'))
      .filter((file) => file.endsWith('.prisma'))
      .map((file) => readFileSync(join(prismaDir, 'models', file), 'utf8')),
  ].join('\n');

  it('contains Better Auth identity and persistence models without replacing the existing User model', () => {
    expect(schema).toMatch(/model User\s*\{/);
    expect(schema).toMatch(/firstName\s+String/);
    expect(schema).toMatch(/lastName\s+String/);
    expect(schema).toMatch(/partnerId\s+String\?/);
    expect(schema).toMatch(/model Account\s*\{/);
    expect(schema).toMatch(/model Session\s*\{/);
    expect(schema).toMatch(/model Verification\s*\{/);
    expect(schema).toMatch(/name\s+String/);
    expect(schema).toMatch(/emailVerified\s+Boolean/);
  });
});
