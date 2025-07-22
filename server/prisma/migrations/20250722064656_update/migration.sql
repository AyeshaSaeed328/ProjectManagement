/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `productOwnerId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `projectManagerId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_productOwnerId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_projectManagerId_fkey";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "createdAt",
DROP COLUMN "productOwnerId",
DROP COLUMN "projectManagerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "teamLeadId" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
