-- CreateTable
CREATE TABLE "frequent_tasks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "educationalContentId" TEXT,

    CONSTRAINT "frequent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "frequent_tasks_partnerId_name_key" ON "frequent_tasks"("partnerId", "name");

-- AddForeignKey
ALTER TABLE "frequent_tasks" ADD CONSTRAINT "frequent_tasks_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequent_tasks" ADD CONSTRAINT "frequent_tasks_educationalContentId_fkey" FOREIGN KEY ("educationalContentId") REFERENCES "educationalContents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
