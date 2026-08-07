-- ============================================
-- Constraints faltando (achados do database_schema_review, 2026-08-07).
-- Separado da migration anterior (só índices, 100% seguros) porque ESTA
-- PODE FALHAR se já existir dado incompatível em produção:
--   - o unique de class_instructors falha se já houver o mesmo instrutor
--     duas vezes na mesma turma (deletedAt IS NULL);
--   - os CHECK usam NOT VALID (não barra o deploy por dado antigo ruim),
--     mas SEM VALIDATE CONSTRAINT — validar dado existente fica pra depois,
--     manual, só depois de confirmar que não há violação em produção.
--
-- Se esta migration falhar, a 20260807140000 (só índices) já terá sido
-- aplicada antes dela — nada se perde.
-- ============================================

-- Antes só existiam índices simples em class_id/instructor_id — o mesmo
-- instrutor podia ser vinculado à mesma turma mais de uma vez.
CREATE UNIQUE INDEX IF NOT EXISTS "class_instructors_class_instructor_active_uidx"
  ON "class_instructors"("class_id", "instructor_id")
  WHERE "deleted_at" IS NULL;

-- CHECK NOT VALID: não verifica linhas existentes agora (não trava o
-- deploy), mas já vale para todo INSERT/UPDATE novo a partir daqui.
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount" >= 0) NOT VALID;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_discount_non_negative" CHECK ("discount" IS NULL OR "discount" >= 0) NOT VALID;
ALTER TABLE "courses" ADD CONSTRAINT "courses_duration_positive" CHECK ("duration_hours" > 0) NOT VALID;
ALTER TABLE "classes" ADD CONSTRAINT "classes_max_students_positive" CHECK ("max_students" > 0) NOT VALID;
