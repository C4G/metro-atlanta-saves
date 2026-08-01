-- CreateTable
CREATE TABLE "educationalCategories" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "educationalCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educationalContents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "educationalContents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalContentsOnEducationalCategories" (
    "categoryId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "EducationalContentsOnEducationalCategories_pkey" PRIMARY KEY ("categoryId","contentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "educationalCategories_category_key" ON "educationalCategories"("category");

-- AddForeignKey
ALTER TABLE "EducationalContentsOnEducationalCategories" ADD CONSTRAINT "EducationalContentsOnEducationalCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "educationalCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationalContentsOnEducationalCategories" ADD CONSTRAINT "EducationalContentsOnEducationalCategories_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "educationalContents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
