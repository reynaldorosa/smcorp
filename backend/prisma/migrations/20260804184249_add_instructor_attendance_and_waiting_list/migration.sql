-- ============================================
-- M03: presença de instrutor + fila de espera
--
-- Escopo deliberadamente restrito às mudanças desta feature. O diff automático
-- do Prisma também sugeria `ALTER COLUMN tenant_id DROP NOT NULL` em 24 tabelas
-- e o DROP de uma FK em certificate_templates — drift pré-existente entre o
-- schema.prisma e o histórico de migrations, que não pertence a esta mudança.
-- ============================================

-- 1) Novo status de matrícula: fila de espera.
--    O valor NÃO pode ser usado na mesma migration em que é criado
--    (Postgres: "unsafe use of new value of enum type") — o backfill dos
--    registros antigos vai na migration seguinte.
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'WAITING_LIST';

-- 2) class_instructors passa a ser um modelo Prisma de verdade.
--    A tabela já existia (20260213190000), criada e manipulada por SQL cru.
ALTER TABLE "class_instructors" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

-- Backfill: o tenant do vínculo é o tenant da turma.
UPDATE "class_instructors" ci
SET "tenant_id" = c."tenant_id"
FROM "classes" c
WHERE ci."class_id" = c."id"
  AND ci."tenant_id" IS NULL;

CREATE INDEX IF NOT EXISTS "class_instructors_tenant_id_idx"
  ON "class_instructors"("tenant_id");

CREATE INDEX IF NOT EXISTS "class_instructors_deleted_at_idx"
  ON "class_instructors"("deleted_at");

ALTER TABLE "class_instructors"
  ADD CONSTRAINT "class_instructors_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) Presença do instrutor por dia de aula (antes não era persistida:
--    o service devolvia `attendances: []` fixo).
CREATE TABLE "instructor_attendances" (
    "id" TEXT NOT NULL,
    "class_instructor_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_by" TEXT NOT NULL,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "instructor_attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "instructor_attendances_class_instructor_id_date_key"
  ON "instructor_attendances"("class_instructor_id", "date");

CREATE INDEX "instructor_attendances_tenant_id_idx"
  ON "instructor_attendances"("tenant_id");

CREATE INDEX "instructor_attendances_deleted_at_idx"
  ON "instructor_attendances"("deleted_at");

ALTER TABLE "instructor_attendances"
  ADD CONSTRAINT "instructor_attendances_class_instructor_id_fkey"
  FOREIGN KEY ("class_instructor_id") REFERENCES "class_instructors"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "instructor_attendances"
  ADD CONSTRAINT "instructor_attendances_confirmed_by_fkey"
  FOREIGN KEY ("confirmed_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_attendances"
  ADD CONSTRAINT "instructor_attendances_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
