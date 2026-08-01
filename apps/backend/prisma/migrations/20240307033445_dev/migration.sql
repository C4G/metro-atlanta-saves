-- AlterTable
ALTER TABLE "users" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "UsersOnPrograms" (
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirementStatus" BOOLEAN[],
    "locationEntry" TEXT,
    "married" BOOLEAN NOT NULL DEFAULT false,
    "educationStatus" TEXT,
    "militaryStatus" BOOLEAN NOT NULL DEFAULT false,
    "incomeSource" TEXT,
    "employmentType" TEXT,
    "adultCount" INTEGER,
    "kidsCount" INTEGER,
    "monthlyIncome" DOUBLE PRECISION,
    "address" TEXT,
    "adultNamesAndAge" JSONB[],
    "kidsNameAndAge" JSONB[],
    "prehousingDate" TIMESTAMP(3),
    "landlordName" TEXT,
    "sureImpactStatus" TEXT,
    "prehousingAddress" TEXT,
    "prehousingCity" TEXT,
    "prehousingState" TEXT,
    "prehousingZip" TEXT,
    "start" TIMESTAMP(3),
    "end" TIMESTAMP(3),
    "birthdate" TIMESTAMP(3),
    "phone" TEXT,
    "gender" TEXT,
    "race" TEXT,
    "graduated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UsersOnPrograms_pkey" PRIMARY KEY ("userId","programId")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "linkedIn" TEXT,
    "tiktok" TEXT,
    "website" TEXT,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "preHouseMonths" INTEGER,
    "postHouseMonths" INTEGER,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedMoney" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "creditScore" INTEGER,
    "application" TEXT,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnPrograms" ADD CONSTRAINT "UsersOnPrograms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnPrograms" ADD CONSTRAINT "UsersOnPrograms_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_userId_programId_fkey" FOREIGN KEY ("userId", "programId") REFERENCES "UsersOnPrograms"("userId", "programId") ON DELETE RESTRICT ON UPDATE CASCADE;
