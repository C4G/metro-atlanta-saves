-- AlterTable
ALTER TABLE "discussionPosts" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "discussionPosts_isPinned_idx" ON "discussionPosts"("isPinned");
