-- CreateTable
CREATE TABLE "CheckpointName" (
    "name" TEXT NOT NULL,
    CONSTRAINT "CheckpointName_pkey" PRIMARY KEY ("name")
);
-- Insert Default Checkpoint Names
INSERT INTO "CheckpointName" ("name")
VALUES ('Month 1'),
    ('Month 2'),
    ('Month 3'),
    ('Month 4'),
    ('Month 5'),
    ('Month 6'),
    ('Lunch Receipt');
-- AlterTable
ALTER TABLE "checkpoints"
ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Month 1';
-- AddForeignKey
ALTER TABLE "checkpoints"
ADD CONSTRAINT "checkpoints_name_fkey" FOREIGN KEY ("name") REFERENCES "CheckpointName"("name") ON DELETE RESTRICT ON UPDATE CASCADE;