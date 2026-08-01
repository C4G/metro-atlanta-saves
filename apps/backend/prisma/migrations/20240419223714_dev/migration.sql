/*
  Warnings:

  - You are about to drop the column `bio` on the `UsersOnPrograms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UsersOnPrograms" DROP COLUMN "bio",
ADD COLUMN     "inactive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT;
