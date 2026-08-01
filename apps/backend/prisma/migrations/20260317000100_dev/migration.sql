CREATE TABLE "discussionPosts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "discussionPosts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discussionComments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "discussionComments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discussionPosts_createdAt_idx" ON "discussionPosts"("createdAt");
CREATE INDEX "discussionPosts_authorId_idx" ON "discussionPosts"("authorId");
CREATE INDEX "discussionComments_postId_createdAt_idx" ON "discussionComments"("postId", "createdAt");
CREATE INDEX "discussionComments_authorId_idx" ON "discussionComments"("authorId");

ALTER TABLE "discussionPosts" ADD CONSTRAINT "discussionPosts_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "discussionComments" ADD CONSTRAINT "discussionComments_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "discussionPosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussionComments" ADD CONSTRAINT "discussionComments_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
