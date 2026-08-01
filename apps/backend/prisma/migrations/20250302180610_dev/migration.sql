UPDATE "images" AS img
SET "programId" = c."programId"
FROM "checkpoints" AS c
WHERE c."imageId" = img.id
AND img."programId" IS NULL;