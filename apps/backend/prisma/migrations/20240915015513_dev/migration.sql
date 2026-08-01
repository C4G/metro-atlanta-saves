/*
  Warnings:

  - A unique constraint covering the columns `[imageId]` on the table `checkpoints` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "checkpoints" ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "imageVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_imageId_key" ON "checkpoints"("imageId");

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
