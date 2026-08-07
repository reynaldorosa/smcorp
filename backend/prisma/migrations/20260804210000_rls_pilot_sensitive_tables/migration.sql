-- ============================================
-- RLS PILOTO — segunda camada de isolamento em Student, StudentDocument,
-- Payment (as tabelas mais sensíveis: PII de aluno, documentos pessoais,
-- dados financeiros).
--
-- POR QUÊ ISTO NÃO É DECORATIVO: o app conecta ao Postgres com o role dono
-- das tabelas (confirmado: tableowner = current_user = 'smcorp'). Por
-- padrão o Postgres deixa o DONO da tabela ignorar qualquer RLS policy —
-- só FORCE ROW LEVEL SECURITY mudaria isso, e forçar sem migrar TODO
-- código que toca essas 3 tabelas (dashboard, matrículas, exames, CRM,
-- certificados...) quebraria essas rotas na hora (RLS sem app.tenant_id
-- setado = zero linhas, não vazamento — mas quebra a rota mesmo assim).
--
-- Por isso: um role SEM privilégio de dono (`smcorp_rls`), usado só DENTRO
-- de uma transação explícita (TenantRlsService.withTenantRls) via
-- `SET LOCAL ROLE`. RLS já se aplica a role não-dono por padrão, sem
-- precisar de FORCE. Fora dessa transação (99% do código), o app continua
-- conectado como `smcorp` — comportamento idêntico ao de antes desta
-- migration, zero risco de regressão no que não foi migrado.
--
-- PRÉ-REQUISITO (rodar antes desta migration, uma vez, manualmente):
-- backend/prisma/manual/2026-08-04_create_smcorp_rls_role.sql
-- CREATE ROLE e GRANT USAGE ON SCHEMA exigem CREATEROLE (ou dono do
-- schema) — privilégio que `smcorp` não tem no Postgres compartilhado.
-- Esta migration só faz o que o DONO DAS TABELAS já pode fazer sem
-- privilégio extra: GRANT nas 3 tabelas, ENABLE RLS, CREATE POLICY.
-- (Falhou em produção em 2026-08-07 com "permission denied to create
-- role" antes desse split — ver P3009 / _prisma_migrations.logs.)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smcorp_rls') THEN
    RAISE EXCEPTION 'Role smcorp_rls não existe. Rode primeiro backend/prisma/manual/2026-08-04_create_smcorp_rls_role.sql com um usuário que tenha CREATEROLE (ver comentário no topo desta migration).';
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON "students", "student_documents", "payments" TO smcorp_rls;

ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- Idempotente: se um retry anterior já criou a policy (ex: transação que
-- falhou depois deste ponto em uma versão futura), evita erro "already
-- exists" numa nova tentativa.
DROP POLICY IF EXISTS tenant_isolation ON "students";
DROP POLICY IF EXISTS tenant_isolation ON "student_documents";
DROP POLICY IF EXISTS tenant_isolation ON "payments";

-- USING: filtra linhas visíveis em SELECT/UPDATE/DELETE.
-- WITH CHECK: valida linhas em INSERT/UPDATE (não deixa gravar noutro tenant).
-- tenant_id NULL nunca casa com a comparação (NULL = x é NULL, não true) —
-- fail-closed por padrão, igual ao middleware Prisma já se comporta.
CREATE POLICY tenant_isolation ON "students"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON "student_documents"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation ON "payments"
  USING ("tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true));
