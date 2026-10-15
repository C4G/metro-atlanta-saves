ALTER TABLE "requirements"
ADD COLUMN "reminderDaysBefore" INTEGER;

ALTER TABLE "requirements"
ADD CONSTRAINT "requirements_reminder_days_before_check"
CHECK (
  "reminderDaysBefore" IS NULL
  OR ("reminderDaysBefore" IN (1, 7) AND "dueAt" IS NOT NULL)
);

CREATE TYPE "RequirementReminderStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'SKIPPED',
  'CANCELLED',
  'FAILED'
);

CREATE TABLE "requirement_reminder_deliveries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "dueAtSnapshot" TIMESTAMP(3) NOT NULL,
  "reminderDaysBefore" INTEGER NOT NULL,
  "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
  "status" "RequirementReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ(3),
  "leaseExpiresAt" TIMESTAMPTZ(3),
  "sentAt" TIMESTAMPTZ(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "requirement_reminder_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "requirement_reminder_deliveries_days_before_check"
    CHECK ("reminderDaysBefore" IN (1, 7)),
  CONSTRAINT "requirement_reminder_deliveries_userId_programId_fkey"
    FOREIGN KEY ("userId", "programId")
    REFERENCES "UsersOnPrograms"("userId", "programId")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "requirement_reminder_deliveries_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "requirements"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "requirement_reminder_deliveries_identity_key"
ON "requirement_reminder_deliveries" (
  "userId", "programId", "requirementId", "dueAtSnapshot", "reminderDaysBefore"
);

CREATE INDEX "requirement_reminder_deliveries_pending_schedule_idx"
ON "requirement_reminder_deliveries" ("status", "scheduledAt");

CREATE INDEX "requirement_reminder_deliveries_requirement_status_idx"
ON "requirement_reminder_deliveries" ("requirementId", "status");
