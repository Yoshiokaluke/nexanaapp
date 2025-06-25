/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `OrganizationInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "token" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");
