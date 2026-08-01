-- AlterTable
ALTER TABLE "Description" ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "WhatWeAre" (
    "id" TEXT NOT NULL,
    "whoWeAreDescription" TEXT NOT NULL,
    "whatWeDoDescription" TEXT NOT NULL,

    CONSTRAINT "WhatWeAre_pkey" PRIMARY KEY ("id")
);
