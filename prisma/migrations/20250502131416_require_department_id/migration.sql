/*
  Warnings:

  - Made the column `departmentId` on table `OrganizationProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OrganizationProfile" DROP CONSTRAINT "OrganizationProfile_departmentId_fkey";

-- AlterTable
ALTER TABLE "OrganizationProfile" ALTER COLUMN "departmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
