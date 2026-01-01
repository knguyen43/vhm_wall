-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('CANDLE', 'FLOWER', 'INCENSE', 'PRAYER');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('ONCE', 'YEARLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('PERSON_CREATE', 'PERSON_UPDATE', 'REMEMBRANCE', 'OFFERING');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "memorials" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "memorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remembrances" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorName" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remembrances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_offerings" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "offeringType" "OfferingType" NOT NULL,
    "message" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorial_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "frequency" "ReminderFrequency" NOT NULL DEFAULT 'ONCE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memorial_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "personId" TEXT,
    "type" "ContributionType" NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memorials_personId_key" ON "memorials"("personId");

-- AddForeignKey
ALTER TABLE "memorials" ADD CONSTRAINT "memorials_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remembrances" ADD CONSTRAINT "remembrances_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_offerings" ADD CONSTRAINT "virtual_offerings_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorial_reminders" ADD CONSTRAINT "memorial_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorial_reminders" ADD CONSTRAINT "memorial_reminders_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "memorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
