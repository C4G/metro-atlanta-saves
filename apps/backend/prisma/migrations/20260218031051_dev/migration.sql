-- CreateTable
CREATE TABLE "AlliesOnPrograms" (
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlliesOnPrograms_pkey" PRIMARY KEY ("userId","programId")
);

-- AddForeignKey
ALTER TABLE "AlliesOnPrograms" ADD CONSTRAINT "AlliesOnPrograms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlliesOnPrograms" ADD CONSTRAINT "AlliesOnPrograms_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
