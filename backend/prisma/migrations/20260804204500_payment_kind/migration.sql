-- ============================================
-- Payment.kind — discriminador de domínio
--
-- Antes, "isto é uma fatura de assinatura SaaS" era inferido por
-- `description.contains('Assinatura')` — texto livre, sem garantia nenhuma
-- (uma renomeação de descrição quebra o filtro silenciosamente). kind é o
-- campo de verdade agora; description continua livre só para exibição.
-- ============================================

CREATE TYPE "PaymentKind" AS ENUM ('ENROLLMENT', 'SUBSCRIPTION_FEE', 'OTHER');

-- Default ENROLLMENT: cobre corretamente as linhas com enrollment_id
-- (a maioria dos pagamentos) sem precisar de backfill nelas.
ALTER TABLE "payments" ADD COLUMN "kind" "PaymentKind" NOT NULL DEFAULT 'ENROLLMENT';

CREATE INDEX "payments_kind_idx" ON "payments"("kind");

-- Backfill 1: faturas de assinatura — mesmo critério textual que o código
-- usava até agora (única forma de reconstruir o dado histórico).
UPDATE "payments"
SET "kind" = 'SUBSCRIPTION_FEE'
WHERE "enrollment_id" IS NULL
  AND "description" ILIKE '%Assinatura%';

-- Backfill 2: o que sobrar sem enrollment_id e sem bater no critério acima
-- são lançamentos manuais (createIncome/createExpense), não matrícula nem
-- assinatura.
UPDATE "payments"
SET "kind" = 'OTHER'
WHERE "enrollment_id" IS NULL
  AND "kind" = 'ENROLLMENT';
