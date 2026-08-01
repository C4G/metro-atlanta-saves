-- CreateTable
CREATE TABLE "learnings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "learnings_pkey" PRIMARY KEY ("id")
);
