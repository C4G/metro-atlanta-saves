import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'apps/backend/prisma',
  migrations: {
    path: 'apps/backend/prisma/migrations',
    seed: 'tsx apps/backend/prisma/seed/seed.ts',
  },
  datasource: {
    // `prisma generate` does not connect to the database, and Docker builds do
    // not receive production secrets. Commands that connect will still fail
    // clearly if DATABASE_URL is absent or empty.
    url: process.env['DATABASE_URL'] ?? '',
  },
});
