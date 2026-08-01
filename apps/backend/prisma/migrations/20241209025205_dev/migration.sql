-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('Savings', 'Credit_Score', 'Receipt', 'Other');

-- AlterTable
ALTER TABLE "CheckpointName" ADD COLUMN     "type" "CheckpointType" NOT NULL DEFAULT 'Other';
