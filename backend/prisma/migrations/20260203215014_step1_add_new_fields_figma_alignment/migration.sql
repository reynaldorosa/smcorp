/*
  Warnings:

  - You are about to drop the column `instructor_name` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `daily_rate` on the `instructors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[enrollment_token]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'COMPLETE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MASTER';

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "instructor_name",
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "custom_price" DECIMAL(10,2),
ADD COLUMN     "instructor_id" TEXT;

-- AlterTable
ALTER TABLE "costs" ADD COLUMN     "is_auditable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "allow_weekends" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "break_duration" INTEGER DEFAULT 60,
ADD COLUMN     "default_end_time" TEXT,
ADD COLUMN     "default_start_time" TEXT,
ADD COLUMN     "hours_per_day" INTEGER DEFAULT 8,
ADD COLUMN     "required_documents" JSONB DEFAULT '[]',
ADD COLUMN     "syllabus" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "discount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "discount_approved_at" TIMESTAMP(3),
ADD COLUMN     "discount_approved_by" TEXT,
ADD COLUMN     "documents_status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "enrollment_token" TEXT,
ADD COLUMN     "token_expires_at" TIMESTAMP(3),
ADD COLUMN     "token_used_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "instructors" DROP COLUMN "daily_rate",
ADD COLUMN     "class_hourly_rate" DECIMAL(10,2),
ADD COLUMN     "exam_hourly_rate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zip_code" TEXT;

-- CreateTable
CREATE TABLE "course_costs" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "cost_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "course_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "exam_number" TEXT NOT NULL,
    "exam_type" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "duration" INTEGER,
    "status" "ExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "score" DECIMAL(5,2),
    "passed" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_extra_products" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "extra_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "enrollment_extra_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_costs_course_id_idx" ON "course_costs"("course_id");

-- CreateIndex
CREATE INDEX "course_costs_cost_id_idx" ON "course_costs"("cost_id");

-- CreateIndex
CREATE INDEX "course_costs_deleted_at_idx" ON "course_costs"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_costs_course_id_cost_id_key" ON "course_costs"("course_id", "cost_id");

-- CreateIndex
CREATE INDEX "student_documents_student_id_idx" ON "student_documents"("student_id");

-- CreateIndex
CREATE INDEX "student_documents_document_type_idx" ON "student_documents"("document_type");

-- CreateIndex
CREATE INDEX "student_documents_status_idx" ON "student_documents"("status");

-- CreateIndex
CREATE INDEX "student_documents_validated_by_idx" ON "student_documents"("validated_by");

-- CreateIndex
CREATE INDEX "student_documents_deleted_at_idx" ON "student_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "exams_enrollment_id_idx" ON "exams"("enrollment_id");

-- CreateIndex
CREATE INDEX "exams_course_id_idx" ON "exams"("course_id");

-- CreateIndex
CREATE INDEX "exams_instructor_id_idx" ON "exams"("instructor_id");

-- CreateIndex
CREATE INDEX "exams_scheduled_date_idx" ON "exams"("scheduled_date");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exams_deleted_at_idx" ON "exams"("deleted_at");

-- CreateIndex
CREATE INDEX "enrollment_extra_products_enrollment_id_idx" ON "enrollment_extra_products"("enrollment_id");

-- CreateIndex
CREATE INDEX "enrollment_extra_products_extra_product_id_idx" ON "enrollment_extra_products"("extra_product_id");

-- CreateIndex
CREATE INDEX "enrollment_extra_products_deleted_at_idx" ON "enrollment_extra_products"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_extra_products_enrollment_id_extra_product_id_key" ON "enrollment_extra_products"("enrollment_id", "extra_product_id");

-- CreateIndex
CREATE INDEX "classes_instructor_id_idx" ON "classes"("instructor_id");

-- CreateIndex
CREATE INDEX "classes_company_id_idx" ON "classes"("company_id");

-- CreateIndex
CREATE INDEX "costs_is_auditable_idx" ON "costs"("is_auditable");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_enrollment_token_key" ON "enrollments"("enrollment_token");

-- CreateIndex
CREATE INDEX "enrollments_enrollment_token_idx" ON "enrollments"("enrollment_token");

-- CreateIndex
CREATE INDEX "enrollments_documents_status_idx" ON "enrollments"("documents_status");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_discount_approved_by_fkey" FOREIGN KEY ("discount_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_costs" ADD CONSTRAINT "course_costs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_costs" ADD CONSTRAINT "course_costs_cost_id_fkey" FOREIGN KEY ("cost_id") REFERENCES "costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_extra_products" ADD CONSTRAINT "enrollment_extra_products_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_extra_products" ADD CONSTRAINT "enrollment_extra_products_extra_product_id_fkey" FOREIGN KEY ("extra_product_id") REFERENCES "extra_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
