DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users" u
    LEFT JOIN "accounts" a
      ON a."issuer" = 'local:credential'
      AND a."accountId" = u."id"
      AND a."providerId" = 'credential'
      AND a."password" IS NOT NULL
    WHERE a."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot remove legacy password hashes: a user has no Better Auth credential account';
  END IF;
END $$;

ALTER TABLE "users"
  DROP COLUMN "hash",
  DROP COLUMN "forgot";
