-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "destination" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT '';
