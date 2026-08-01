-- CreateEnum
CREATE TYPE "CommentVoteType" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "discussionComments" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "discussionCommentVotes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CommentVoteType" NOT NULL,

    CONSTRAINT "discussionCommentVotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discussionCommentVotes_commentId_idx" ON "discussionCommentVotes"("commentId");

-- CreateIndex
CREATE INDEX "discussionCommentVotes_userId_idx" ON "discussionCommentVotes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "discussionCommentVotes_commentId_userId_key" ON "discussionCommentVotes"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "discussionCommentVotes" ADD CONSTRAINT "discussionCommentVotes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "discussionComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionCommentVotes" ADD CONSTRAINT "discussionCommentVotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
