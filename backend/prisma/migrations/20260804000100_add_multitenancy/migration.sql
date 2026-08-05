-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "tenant_id" TEXT,
ADD COLUMN     "transaction_id" TEXT;

-- AlterTable
ALTER TABLE "costs" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "cost_criteria" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "cost_entries" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "extra_products" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "instructors" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "course_costs" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "student_documents" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "enrollment_extra_products" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "certificate_templates" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "crm_contacts" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "crm_activities" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "crm_pipeline_stages" ADD COLUMN     "tenant_id" TEXT;

-- AlterTable
ALTER TABLE "crm_deals" ADD COLUMN     "tenant_id" TEXT;

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "branding" JSONB DEFAULT '{}',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT,
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "plan_name" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_deleted_at_idx" ON "tenants"("deleted_at");

-- CreateIndex
CREATE INDEX "notification_logs_tenant_id_idx" ON "notification_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_logs_channel_idx" ON "notification_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_deleted_at_idx" ON "subscriptions"("deleted_at");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");

-- CreateIndex
CREATE INDEX "company_settings_tenant_id_idx" ON "company_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "students_tenant_id_idx" ON "students"("tenant_id");

-- CreateIndex
CREATE INDEX "courses_tenant_id_idx" ON "courses"("tenant_id");

-- CreateIndex
CREATE INDEX "rooms_tenant_id_idx" ON "rooms"("tenant_id");

-- CreateIndex
CREATE INDEX "classes_tenant_id_idx" ON "classes"("tenant_id");

-- CreateIndex
CREATE INDEX "enrollments_tenant_id_idx" ON "enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE INDEX "costs_tenant_id_idx" ON "costs"("tenant_id");

-- CreateIndex
CREATE INDEX "cost_criteria_tenant_id_idx" ON "cost_criteria"("tenant_id");

-- CreateIndex
CREATE INDEX "cost_entries_tenant_id_idx" ON "cost_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "extra_products_tenant_id_idx" ON "extra_products"("tenant_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "instructors_tenant_id_idx" ON "instructors"("tenant_id");

-- CreateIndex
CREATE INDEX "course_costs_tenant_id_idx" ON "course_costs"("tenant_id");

-- CreateIndex
CREATE INDEX "student_documents_tenant_id_idx" ON "student_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "exams_tenant_id_idx" ON "exams"("tenant_id");

-- CreateIndex
CREATE INDEX "enrollment_extra_products_tenant_id_idx" ON "enrollment_extra_products"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "certificates_tenant_id_idx" ON "certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "certificate_templates_tenant_id_idx" ON "certificate_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_idx" ON "crm_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_idx" ON "crm_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_pipeline_stages_tenant_id_idx" ON "crm_pipeline_stages"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_idx" ON "crm_deals"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_criteria" ADD CONSTRAINT "cost_criteria_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_products" ADD CONSTRAINT "extra_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_costs" ADD CONSTRAINT "course_costs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_extra_products" ADD CONSTRAINT "enrollment_extra_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipeline_stages" ADD CONSTRAINT "crm_pipeline_stages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================
-- BACKFILL MULTI-TENANT (SaaS)
-- A SMCORP vira o TENANT RAIZ e todos os registros
-- existentes são vinculados a ele.
-- ============================================

-- 1) Tenant raiz (UUID fixo/determinístico)
INSERT INTO "tenants" ("id", "slug", "name", "status", "branding", "trial_ends_at", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000001', 'smcorp', 'SMCORP', 'ACTIVE', '{}', NULL, now(), now());

-- 2) Assinatura raiz (plataforma, nunca cobrada)
INSERT INTO "subscriptions" ("id", "tenant_id", "provider", "plan_name", "price", "status", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'PLATAFORMA', 'Tenant Raiz (SMCORP)', 0, 'ACTIVE', now(), now());

-- 3) Usuários não-MASTER pertencem ao tenant raiz
--    (MASTER = plataforma, permanece sem tenant)
UPDATE "users" SET "tenant_id" = '00000000-0000-4000-8000-000000000001'
WHERE "tenant_id" IS NULL AND "role" <> 'MASTER';

-- 4) Backfill dos registros de negócio existentes
UPDATE "companies" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "company_settings" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "company_settings" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "students" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "students" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "courses" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "courses" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "rooms" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "rooms" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "classes" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "classes" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "enrollments" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "enrollments" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "payments" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "costs" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "costs" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "cost_criteria" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "cost_criteria" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "cost_entries" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "cost_entries" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "extra_products" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "extra_products" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "suppliers" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "suppliers" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "instructors" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "instructors" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "course_costs" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "course_costs" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "student_documents" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "student_documents" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "exams" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "exams" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "enrollment_extra_products" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "enrollment_extra_products" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "certificates" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "certificates" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "certificate_templates" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "certificate_templates" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "crm_contacts" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "crm_contacts" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "crm_activities" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "crm_activities" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "crm_pipeline_stages" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "crm_pipeline_stages" ALTER COLUMN "tenant_id" SET NOT NULL;
UPDATE "crm_deals" SET "tenant_id" = '00000000-0000-4000-8000-000000000001' WHERE "tenant_id" IS NULL;
ALTER TABLE "crm_deals" ALTER COLUMN "tenant_id" SET NOT NULL;
