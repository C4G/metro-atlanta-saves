-- AlterTable
ALTER TABLE "UsersOnPrograms" ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "description" TEXT,
ADD COLUMN     "goals" TEXT[];
