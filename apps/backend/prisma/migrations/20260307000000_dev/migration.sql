-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "programId" TEXT,
    "userId" TEXT,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);
