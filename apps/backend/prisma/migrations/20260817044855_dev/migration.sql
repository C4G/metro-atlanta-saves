-- AlterTable
ALTER TABLE "_CheckpointNameToProgram" ADD CONSTRAINT "_CheckpointNameToProgram_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CheckpointNameToProgram_AB_unique";
