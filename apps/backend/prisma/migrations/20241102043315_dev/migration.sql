-- CreateEnum
CREATE TYPE "YesNoMaybe" AS ENUM ('Yes', 'No', 'Maybe');

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "race" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "placeOfEmployment" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "monthsEmployed" INTEGER NOT NULL,
    "zipCode" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "annualIncome" DOUBLE PRECISION NOT NULL,
    "meetingAvailablility" "YesNoMaybe" NOT NULL,
    "employerCommitted" "YesNoMaybe" NOT NULL,
    "interest" TEXT NOT NULL,
    "gain" TEXT NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_programId_key" ON "enrollments"("userId", "programId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
