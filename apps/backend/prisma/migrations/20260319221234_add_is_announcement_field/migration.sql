-- AlterTable
ALTER TABLE "discussionPosts" ADD COLUMN     "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "discussionPosts_isAnnouncement_idx" ON "discussionPosts"("isAnnouncement");
