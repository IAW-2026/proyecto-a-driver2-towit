/*
  Warnings:

  - You are about to drop the column `deleted` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Tower` table. All the data in the column will be lost.
  - You are about to drop the column `deleted` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "deleted",
ADD COLUMN     "deactivated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "deleted",
ADD COLUMN     "deactivated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tower" DROP COLUMN "deleted",
ADD COLUMN     "deactivated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "deleted",
ADD COLUMN     "deactivated" BOOLEAN NOT NULL DEFAULT false;
