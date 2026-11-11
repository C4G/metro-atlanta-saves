BEGIN;

ALTER TABLE "requirement_completions"
ADD COLUMN "completedById" TEXT;

ALTER TABLE "requirement_completions"
ADD CONSTRAINT "requirement_completions_completedById_fkey"
FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "participant_payments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "checkNumber" TEXT,
    "paidBy" TEXT,
    "note" TEXT,
    "proofName" TEXT NOT NULL,
    "proofType" TEXT NOT NULL,
    "proofPath" TEXT NOT NULL,
    "recordedById" TEXT,

    CONSTRAINT "participant_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "participant_payments_programId_userId_idx" ON "participant_payments"("programId", "userId");

ALTER TABLE "participant_payments" ADD CONSTRAINT "participant_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "participant_payments" ADD CONSTRAINT "participant_payments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "participant_payments" ADD CONSTRAINT "participant_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
