-- AlterTable
ALTER TABLE "requirements" ADD COLUMN     "educationalContentId" TEXT;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_educationalContentId_fkey" FOREIGN KEY ("educationalContentId") REFERENCES "educationalContents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
