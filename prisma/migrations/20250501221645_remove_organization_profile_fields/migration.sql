/*
  Warnings:

  - You are about to drop the column `birthday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `snsLinks` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "birthday",
DROP COLUMN "gender",
DROP COLUMN "profileImage",
DROP COLUMN "snsLinks",
ADD COLUMN     "systemRole" "SystemRole";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "birthday" TIMESTAMP(3),
    "gender" TEXT,
    "snsLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_clerkId_key" ON "Profile"("clerkId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_clerkId_fkey" FOREIGN KEY ("clerkId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
