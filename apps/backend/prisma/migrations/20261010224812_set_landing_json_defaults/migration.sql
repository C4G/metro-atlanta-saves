-- AlterTable
ALTER TABLE "Description" ALTER COLUMN "programsJson" SET DEFAULT '[]',
ALTER COLUMN "factsJson" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "WhatWeAre" ALTER COLUMN "partnersJson" SET DEFAULT '[]';
