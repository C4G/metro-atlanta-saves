-- Add Better Auth identity fields to the existing users table.
ALTER TABLE "users"
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image" TEXT,
ALTER COLUMN "firstName" SET DEFAULT '',
ALTER COLUMN "lastName" SET DEFAULT '',
ALTER COLUMN "hash" SET DEFAULT '';

-- Give existing users the identity name required by Better Auth while retaining
-- firstName and lastName as the application's canonical profile fields.
UPDATE "users"
SET "name" = trim(concat_ws(' ', "firstName", "lastName")),
    "emailVerified" = true
WHERE "name" = '';

-- Create Better Auth's database-backed session and credential persistence.
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "impersonationReturnPath" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- Reuse every existing Argon2 hash as the Better Auth credential password.
-- The legacy hash column remains available for verification and rollback.
INSERT INTO "accounts" (
    "id",
    "issuer",
    "accountId",
    "providerId",
    "userId",
    "password",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    'local:credential',
    u."id",
    'credential',
    u."id",
    u."hash",
    u."createdAt",
    u."updatedAt"
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1
    FROM "accounts" a
    WHERE a."issuer" = 'local:credential'
      AND a."accountId" = u."id"
);

CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "accounts"("issuer", "accountId");
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
