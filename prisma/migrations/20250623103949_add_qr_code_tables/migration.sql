-- CreateTable
CREATE TABLE "OrganizationProfileQrCode" (
    "id" TEXT NOT NULL,
    "organizationProfileId" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "s3Key" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfileQrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCodeUsageHistory" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "QrCodeUsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfileQrCode_organizationProfileId_key" ON "OrganizationProfileQrCode"("organizationProfileId");

-- AddForeignKey
ALTER TABLE "OrganizationProfileQrCode" ADD CONSTRAINT "OrganizationProfileQrCode_organizationProfileId_fkey" FOREIGN KEY ("organizationProfileId") REFERENCES "OrganizationProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCodeUsageHistory" ADD CONSTRAINT "QrCodeUsageHistory_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "OrganizationProfileQrCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
