ALTER TABLE "requirements"
ADD COLUMN "actionInstructions" TEXT,
ADD COLUMN "dueAt" TIMESTAMP(3);

CREATE TABLE "requirement_completions" (
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_completions_pkey" PRIMARY KEY ("userId", "programId", "requirementId")
);

CREATE INDEX "requirement_completions_requirementId_idx" ON "requirement_completions"("requirementId");

ALTER TABLE "requirement_completions"
ADD CONSTRAINT "requirement_completions_userId_programId_fkey"
FOREIGN KEY ("userId", "programId") REFERENCES "UsersOnPrograms"("userId", "programId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "requirement_completions"
ADD CONSTRAINT "requirement_completions_requirementId_fkey"
FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
