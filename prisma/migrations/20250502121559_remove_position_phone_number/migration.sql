/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `OrganizationProfile` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `OrganizationProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationProfile" DROP COLUMN "phoneNumber",
DROP COLUMN "position";
