-- Preserve valid historical completions before retiring array-based storage.
INSERT INTO "requirement_completions" ("userId", "programId", "requirementId", "completedAt")
SELECT DISTINCT enrollment."userId", enrollment."programId", requirement."id", enrollment."updatedAt"
FROM "UsersOnPrograms" enrollment
CROSS JOIN LATERAL unnest(enrollment."requirementStatus") AS legacy("requirementId")
JOIN "requirements" requirement
  ON requirement."id" = legacy."requirementId"
 AND requirement."programId" = enrollment."programId"
ON CONFLICT ("userId", "programId", "requirementId") DO NOTHING;

-- Keep the empty column temporarily for generated-client compatibility.
-- All application writes and reads now use requirement_completions.
UPDATE "UsersOnPrograms" SET "requirementStatus" = ARRAY[]::TEXT[];
