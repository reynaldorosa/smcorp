-- Create missing enums safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostFrequency') THEN
    CREATE TYPE "CostFrequency" AS ENUM ('MONTHLY', 'DAILY', 'ONE_TIME');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostLinkage') THEN
    CREATE TYPE "CostLinkage" AS ENUM ('ENROLLED_STUDENT', 'NOT_LINKED', 'INSTRUCTOR');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostDueCriterion') THEN
    CREATE TYPE "CostDueCriterion" AS ENUM ('COURSE_END_DATE', 'THIRTY_DAYS_AFTER_END', 'MONTHLY_CLOSING', 'SPECIFIC_DATE', 'NO_DUE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CRMContactSource') THEN
    CREATE TYPE "CRMContactSource" AS ENUM ('MANUAL', 'IMPORT', 'WEBSITE', 'WHATSAPP', 'REFERRAL', 'COMPANY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CRMContactStatus') THEN
    CREATE TYPE "CRMContactStatus" AS ENUM ('LEAD', 'QUALIFIED', 'INTERESTED', 'NEGOTIATION', 'ENROLLED', 'LOST');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CRMActivityType') THEN
    CREATE TYPE "CRMActivityType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'TASK', 'FOLLOW_UP');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CRMDealStatus') THEN
    CREATE TYPE "CRMDealStatus" AS ENUM ('OPEN', 'WON', 'LOST');
  END IF;
END $$;

-- Create missing table: cost_criteria
CREATE TABLE IF NOT EXISTS "cost_criteria" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "frequency" "CostFrequency" NOT NULL,
  "linkage" "CostLinkage" NOT NULL,
  "due_criterion" "CostDueCriterion" NOT NULL,
  "days_until_due" INTEGER,
  "monthly_closing_day" INTEGER,
  "days_after_closing" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "cost_criteria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cost_criteria_code_key" ON "cost_criteria"("code");
CREATE INDEX IF NOT EXISTS "cost_criteria_code_idx" ON "cost_criteria"("code");
CREATE INDEX IF NOT EXISTS "cost_criteria_frequency_idx" ON "cost_criteria"("frequency");
CREATE INDEX IF NOT EXISTS "cost_criteria_is_active_idx" ON "cost_criteria"("is_active");
CREATE INDEX IF NOT EXISTS "cost_criteria_deleted_at_idx" ON "cost_criteria"("deleted_at");

-- Create missing table: crm_contacts
CREATE TABLE IF NOT EXISTS "crm_contacts" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "cpf_cnpj" TEXT,
  "source" "CRMContactSource" NOT NULL DEFAULT 'MANUAL',
  "status" "CRMContactStatus" NOT NULL DEFAULT 'LEAD',
  "assigned_to_id" TEXT,
  "student_id" TEXT,
  "company_id" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "custom_fields" JSONB DEFAULT '{}'::jsonb,
  "last_contact_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_contacts_code_key" ON "crm_contacts"("code");
CREATE INDEX IF NOT EXISTS "crm_contacts_code_idx" ON "crm_contacts"("code");
CREATE INDEX IF NOT EXISTS "crm_contacts_name_idx" ON "crm_contacts"("name");
CREATE INDEX IF NOT EXISTS "crm_contacts_email_idx" ON "crm_contacts"("email");
CREATE INDEX IF NOT EXISTS "crm_contacts_phone_idx" ON "crm_contacts"("phone");
CREATE INDEX IF NOT EXISTS "crm_contacts_source_idx" ON "crm_contacts"("source");
CREATE INDEX IF NOT EXISTS "crm_contacts_status_idx" ON "crm_contacts"("status");
CREATE INDEX IF NOT EXISTS "crm_contacts_assigned_to_id_idx" ON "crm_contacts"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "crm_contacts_student_id_idx" ON "crm_contacts"("student_id");
CREATE INDEX IF NOT EXISTS "crm_contacts_company_id_idx" ON "crm_contacts"("company_id");
CREATE INDEX IF NOT EXISTS "crm_contacts_deleted_at_idx" ON "crm_contacts"("deleted_at");

-- Create missing table: crm_pipeline_stages
CREATE TABLE IF NOT EXISTS "crm_pipeline_stages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_pipeline_stages_order_idx" ON "crm_pipeline_stages"("order");
CREATE INDEX IF NOT EXISTS "crm_pipeline_stages_is_active_idx" ON "crm_pipeline_stages"("is_active");
CREATE INDEX IF NOT EXISTS "crm_pipeline_stages_deleted_at_idx" ON "crm_pipeline_stages"("deleted_at");

-- Create missing table: crm_activities
CREATE TABLE IF NOT EXISTS "crm_activities" (
  "id" TEXT NOT NULL,
  "contact_id" TEXT NOT NULL,
  "type" "CRMActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduled_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_activities_contact_id_idx" ON "crm_activities"("contact_id");
CREATE INDEX IF NOT EXISTS "crm_activities_type_idx" ON "crm_activities"("type");
CREATE INDEX IF NOT EXISTS "crm_activities_scheduled_at_idx" ON "crm_activities"("scheduled_at");
CREATE INDEX IF NOT EXISTS "crm_activities_completed_at_idx" ON "crm_activities"("completed_at");
CREATE INDEX IF NOT EXISTS "crm_activities_created_by_id_idx" ON "crm_activities"("created_by_id");
CREATE INDEX IF NOT EXISTS "crm_activities_deleted_at_idx" ON "crm_activities"("deleted_at");

-- Create missing table: crm_deals
CREATE TABLE IF NOT EXISTS "crm_deals" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "contact_id" TEXT NOT NULL,
  "stage_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "expected_close_date" TIMESTAMP(3),
  "status" "CRMDealStatus" NOT NULL DEFAULT 'OPEN',
  "course_id" TEXT,
  "class_id" TEXT,
  "won_at" TIMESTAMP(3),
  "lost_at" TIMESTAMP(3),
  "lost_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_deals_code_key" ON "crm_deals"("code");
CREATE INDEX IF NOT EXISTS "crm_deals_code_idx" ON "crm_deals"("code");
CREATE INDEX IF NOT EXISTS "crm_deals_contact_id_idx" ON "crm_deals"("contact_id");
CREATE INDEX IF NOT EXISTS "crm_deals_stage_id_idx" ON "crm_deals"("stage_id");
CREATE INDEX IF NOT EXISTS "crm_deals_status_idx" ON "crm_deals"("status");
CREATE INDEX IF NOT EXISTS "crm_deals_course_id_idx" ON "crm_deals"("course_id");
CREATE INDEX IF NOT EXISTS "crm_deals_expected_close_date_idx" ON "crm_deals"("expected_close_date");
CREATE INDEX IF NOT EXISTS "crm_deals_deleted_at_idx" ON "crm_deals"("deleted_at");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contacts_assigned_to_id_fkey') THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_assigned_to_id_fkey"
      FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contacts_student_id_fkey') THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contacts_company_id_fkey') THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_company_id_fkey"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_activities_contact_id_fkey') THEN
    ALTER TABLE "crm_activities"
      ADD CONSTRAINT "crm_activities_contact_id_fkey"
      FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_activities_created_by_id_fkey') THEN
    ALTER TABLE "crm_activities"
      ADD CONSTRAINT "crm_activities_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_contact_id_fkey') THEN
    ALTER TABLE "crm_deals"
      ADD CONSTRAINT "crm_deals_contact_id_fkey"
      FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_stage_id_fkey') THEN
    ALTER TABLE "crm_deals"
      ADD CONSTRAINT "crm_deals_stage_id_fkey"
      FOREIGN KEY ("stage_id") REFERENCES "crm_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
