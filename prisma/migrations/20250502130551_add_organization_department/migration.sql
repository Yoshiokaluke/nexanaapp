/*
  Warnings:

  - You are about to drop the column `department` on the `OrganizationProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationProfile" DROP COLUMN "department",
ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "OrganizationDepartment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationDepartment_organizationId_name_key" ON "OrganizationDepartment"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "OrganizationDepartment" ADD CONSTRAINT "OrganizationDepartment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
