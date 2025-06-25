-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "ScanTogetherSession" (
    "id" TEXT NOT NULL,
    "scannerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanTogetherSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanTogetherRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organizationProfileId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanTogetherRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GetItemRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GetItemRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScanTogetherSession" ADD CONSTRAINT "ScanTogetherSession_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "QrScanner"("scannerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanTogetherSession" ADD CONSTRAINT "ScanTogetherSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanTogetherRecord" ADD CONSTRAINT "ScanTogetherRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScanTogetherSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanTogetherRecord" ADD CONSTRAINT "ScanTogetherRecord_organizationProfileId_fkey" FOREIGN KEY ("organizationProfileId") REFERENCES "OrganizationProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GetItemRecord" ADD CONSTRAINT "GetItemRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScanTogetherSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
