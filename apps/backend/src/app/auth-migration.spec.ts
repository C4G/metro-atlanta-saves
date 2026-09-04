import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Better Auth database migration', () => {
  const migrationsDir = join(process.cwd(), 'apps/backend/prisma/migrations');
  const migrationDir = readdirSync(migrationsDir).find((directory) => directory.includes('better_auth'));

  it('adds auth persistence and identity fields without dropping application data', () => {
    expect(migrationDir).toBeDefined();

    const migration = readFileSync(join(migrationsDir, migrationDir as string, 'migration.sql'), 'utf8');

    expect(migration).toMatch(/ALTER TABLE "users"\s+ADD COLUMN/);
    expect(migration).toContain('CREATE TABLE "accounts"');
    expect(migration).toContain('CREATE TABLE "sessions"');
    expect(migration).toContain('CREATE TABLE "verifications"');
    expect(migration).toMatch(/UPDATE "users"[\s\S]*concat_ws\(' ', "firstName", "lastName"\)/);
    expect(migration).toMatch(/"emailVerified"\s*=\s*true/);
    expect(migration).toMatch(/INSERT INTO "accounts"/);
    expect(migration).toMatch(/u\."hash"/);
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN|INDEX)/i);
  });
});
