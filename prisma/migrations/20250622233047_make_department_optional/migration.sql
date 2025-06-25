-- DropForeignKey
ALTER TABLE "OrganizationProfile" DROP CONSTRAINT "OrganizationProfile_organizationDepartmentId_fkey";

-- AlterTable
ALTER TABLE "OrganizationProfile" ALTER COLUMN "organizationDepartmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_organizationDepartmentId_fkey" FOREIGN KEY ("organizationDepartmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
