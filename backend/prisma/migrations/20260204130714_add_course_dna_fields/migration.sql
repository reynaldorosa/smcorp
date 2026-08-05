-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "certification_info" TEXT,
ADD COLUMN     "learning_time" INTEGER,
ADD COLUMN     "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[];
