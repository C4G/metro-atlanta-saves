/*
  Warnings:

  - You are about to drop the column `imageId` on the `checkpoints` table. All the data in the column will be lost.
  - You are about to drop the column `imageVerified` on the `checkpoints` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "checkpoints" DROP CONSTRAINT "checkpoints_imageId_fkey";

-- DropIndex
DROP INDEX "checkpoints_imageId_key";

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "checkpointId" TEXT,
ADD COLUMN     "imageVerified" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: Link images to checkpoints and preserve imageVerified status
UPDATE "images"
SET "checkpointId" = c."id",
    "imageVerified" = c."imageVerified"
FROM "checkpoints" c
WHERE "images"."id" = c."imageId";

-- AlterTable
ALTER TABLE "checkpoints" DROP COLUMN "imageId",
DROP COLUMN "imageVerified";

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "checkpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
