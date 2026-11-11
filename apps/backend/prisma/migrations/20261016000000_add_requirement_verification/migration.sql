BEGIN;

ALTER TABLE "requirement_completions"
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedById" TEXT;

ALTER TABLE "requirement_completions"
ADD CONSTRAINT "requirement_completions_verifiedById_fkey"
FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
