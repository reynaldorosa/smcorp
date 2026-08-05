/*
  Warnings:

  - A unique constraint covering the columns `[exam_code]` on the table `exams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exam_code` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "exam_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "exams_exam_code_key" ON "exams"("exam_code");

-- CreateIndex
CREATE INDEX "exams_exam_code_idx" ON "exams"("exam_code");
