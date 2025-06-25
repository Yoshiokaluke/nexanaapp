/*
  Warnings:

  - You are about to drop the column `departmentId` on the `OrganizationProfile` table. All the data in the column will be lost.
  - Added the required column `organizationDepartmentId` to the `OrganizationProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrganizationProfile" DROP CONSTRAINT "OrganizationProfile_departmentId_fkey";

-- AlterTable
ALTER TABLE "OrganizationProfile" DROP COLUMN "departmentId",
ADD COLUMN     "organizationDepartmentId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_organizationDepartmentId_fkey" FOREIGN KEY ("organizationDepartmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
