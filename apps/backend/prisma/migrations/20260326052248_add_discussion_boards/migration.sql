-- DropIndex
DROP INDEX "discussionTags_name_key";

-- AlterTable
ALTER TABLE "discussionPosts" ADD COLUMN     "boardId" TEXT;

-- AlterTable
ALTER TABLE "discussionTags" ADD COLUMN     "boardId" TEXT;

-- CreateTable
CREATE TABLE "discussionBoards" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "programId" TEXT,
    "cohortId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "discussionBoards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussionBoardMembers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "discussionBoardMembers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discussionBoards_programId_idx" ON "discussionBoards"("programId");

-- CreateIndex
CREATE INDEX "discussionBoards_cohortId_idx" ON "discussionBoards"("cohortId");

-- CreateIndex
CREATE INDEX "discussionBoards_createdById_idx" ON "discussionBoards"("createdById");

-- CreateIndex
CREATE INDEX "discussionBoardMembers_boardId_idx" ON "discussionBoardMembers"("boardId");

-- CreateIndex
CREATE INDEX "discussionBoardMembers_userId_idx" ON "discussionBoardMembers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "discussionBoardMembers_boardId_userId_key" ON "discussionBoardMembers"("boardId", "userId");

-- CreateIndex
CREATE INDEX "discussionPosts_boardId_idx" ON "discussionPosts"("boardId");

-- CreateIndex
CREATE INDEX "discussionTags_boardId_idx" ON "discussionTags"("boardId");

-- AddForeignKey
ALTER TABLE "discussionPosts" ADD CONSTRAINT "discussionPosts_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "discussionBoards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionTags" ADD CONSTRAINT "discussionTags_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "discussionBoards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionBoards" ADD CONSTRAINT "discussionBoards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionBoards" ADD CONSTRAINT "discussionBoards_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionBoards" ADD CONSTRAINT "discussionBoards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionBoardMembers" ADD CONSTRAINT "discussionBoardMembers_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "discussionBoards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionBoardMembers" ADD CONSTRAINT "discussionBoardMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
