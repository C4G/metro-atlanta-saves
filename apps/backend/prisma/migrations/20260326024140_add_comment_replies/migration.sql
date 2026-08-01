-- AlterTable
ALTER TABLE "discussionComments" ADD COLUMN     "parentCommentId" TEXT;

-- CreateIndex
CREATE INDEX "discussionComments_parentCommentId_idx" ON "discussionComments"("parentCommentId");

-- AddForeignKey
ALTER TABLE "discussionComments" ADD CONSTRAINT "discussionComments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "discussionComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
