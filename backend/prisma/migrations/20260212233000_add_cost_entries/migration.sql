DO $$
BEGIN
  CREATE TYPE "CostEntryStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "cost_entries" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "auditable_cost_id" TEXT NOT NULL,
  "cost_criterion_id" TEXT,
  "student_id" TEXT,
  "class_id" TEXT,
  "supplier_id" TEXT,
  "instructor_id" TEXT,
  "company_id" TEXT,
  "exam_number" TEXT,
  "exam_name" TEXT,
  "value" DECIMAL(10,2) NOT NULL,
  "generated_at" TIMESTAMP(3) NOT NULL,
  "due_date" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "status" "CostEntryStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "auto_generated" BOOLEAN NOT NULL DEFAULT false,
  "trigger_action" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "cost_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cost_entries_code_key" ON "cost_entries"("code");
CREATE INDEX IF NOT EXISTS "cost_entries_code_idx" ON "cost_entries"("code");
CREATE INDEX IF NOT EXISTS "cost_entries_auditable_cost_id_idx" ON "cost_entries"("auditable_cost_id");
CREATE INDEX IF NOT EXISTS "cost_entries_cost_criterion_id_idx" ON "cost_entries"("cost_criterion_id");
CREATE INDEX IF NOT EXISTS "cost_entries_student_id_idx" ON "cost_entries"("student_id");
CREATE INDEX IF NOT EXISTS "cost_entries_class_id_idx" ON "cost_entries"("class_id");
CREATE INDEX IF NOT EXISTS "cost_entries_supplier_id_idx" ON "cost_entries"("supplier_id");
CREATE INDEX IF NOT EXISTS "cost_entries_instructor_id_idx" ON "cost_entries"("instructor_id");
CREATE INDEX IF NOT EXISTS "cost_entries_company_id_idx" ON "cost_entries"("company_id");
CREATE INDEX IF NOT EXISTS "cost_entries_status_idx" ON "cost_entries"("status");
CREATE INDEX IF NOT EXISTS "cost_entries_due_date_idx" ON "cost_entries"("due_date");
CREATE INDEX IF NOT EXISTS "cost_entries_deleted_at_idx" ON "cost_entries"("deleted_at");

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_auditable_cost_id_fkey"
    FOREIGN KEY ("auditable_cost_id") REFERENCES "costs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_cost_criterion_id_fkey"
    FOREIGN KEY ("cost_criterion_id") REFERENCES "cost_criteria"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_class_id_fkey"
    FOREIGN KEY ("class_id") REFERENCES "classes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cost_entries"
    ADD CONSTRAINT "cost_entries_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
