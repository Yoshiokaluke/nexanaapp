/*
  Warnings:

  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationProfile" ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "profileImage" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId",
DROP COLUMN "roles",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "snsLinks" JSONB;
