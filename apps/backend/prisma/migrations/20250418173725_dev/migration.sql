UPDATE "images" AS img
SET "userId" = c."userId"
FROM "checkpoints" AS c
WHERE c."imageId" = img.id
AND img."userId" IS NULL;