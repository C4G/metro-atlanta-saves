-- AlterTable
ALTER TABLE "Introduction" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Introduction" ADD COLUMN "imageHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Description" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WhatWeAre" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "learnings" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "stories" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
