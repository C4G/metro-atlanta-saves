/*
  Warnings:

  - You are about to drop the column `budget` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `postHouseMonths` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `preHouseMonths` on the `programs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "programs" DROP COLUMN "budget",
DROP COLUMN "postHouseMonths",
DROP COLUMN "preHouseMonths";
