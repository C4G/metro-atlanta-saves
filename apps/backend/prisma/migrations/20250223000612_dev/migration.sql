-- AlterTable
ALTER TABLE "educationalContents" ADD COLUMN     "file" TEXT,
ALTER COLUMN "link" DROP NOT NULL;
