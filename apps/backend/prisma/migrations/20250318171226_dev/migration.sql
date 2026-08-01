-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "checkpoints" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "_CheckpointNameToProgram" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CheckpointNameToProgram_AB_unique" ON "_CheckpointNameToProgram"("A", "B");

-- CreateIndex
CREATE INDEX "_CheckpointNameToProgram_B_index" ON "_CheckpointNameToProgram"("B");

-- AddForeignKey
ALTER TABLE "_CheckpointNameToProgram" ADD CONSTRAINT "_CheckpointNameToProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "CheckpointName"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CheckpointNameToProgram" ADD CONSTRAINT "_CheckpointNameToProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
