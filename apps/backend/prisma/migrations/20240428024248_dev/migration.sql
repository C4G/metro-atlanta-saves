/*
  Warnings:

  - You are about to drop the column `adultCount` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `adultNamesAndAge` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `employmentType` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `incomeSource` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `kidsCount` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `kidsNameAndAge` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `landlordName` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `locationEntry` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyIncome` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `prehousingAddress` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `prehousingCity` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `prehousingDate` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `prehousingState` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `prehousingZip` on the `UsersOnPrograms` table. All the data in the column will be lost.
  - You are about to drop the column `sureImpactStatus` on the `UsersOnPrograms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UsersOnPrograms" DROP COLUMN "adultCount",
DROP COLUMN "adultNamesAndAge",
DROP COLUMN "employmentType",
DROP COLUMN "incomeSource",
DROP COLUMN "kidsCount",
DROP COLUMN "kidsNameAndAge",
DROP COLUMN "landlordName",
DROP COLUMN "locationEntry",
DROP COLUMN "monthlyIncome",
DROP COLUMN "prehousingAddress",
DROP COLUMN "prehousingCity",
DROP COLUMN "prehousingDate",
DROP COLUMN "prehousingState",
DROP COLUMN "prehousingZip",
DROP COLUMN "sureImpactStatus",
ADD COLUMN     "annualIncome" DOUBLE PRECISION,
ADD COLUMN     "creditScoreIncentive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthsEmployed" INTEGER,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "placeOfEmployment" TEXT,
ADD COLUMN     "totalAmountPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0.00;
