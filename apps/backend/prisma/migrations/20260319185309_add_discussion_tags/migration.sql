-- CreateTable
CREATE TABLE "discussionTags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "discussionTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussionPostTags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "discussionPostTags_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "discussionTags_name_key" ON "discussionTags"("name");

-- AddForeignKey
ALTER TABLE "discussionPostTags" ADD CONSTRAINT "discussionPostTags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "discussionPosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussionPostTags" ADD CONSTRAINT "discussionPostTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "discussionTags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
