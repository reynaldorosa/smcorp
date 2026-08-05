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
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smcorp_rls') THEN
    CREATE ROLE smcorp_rls NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO smcorp_rls;
GRANT SELECT, INSERT, UPDATE, DELETE ON "students", "student_documents", "payments" TO smcorp_rls;

-- Permite ao role de runtime (smcorp) fazer `SET LOCAL ROLE smcorp_rls`
-- dentro de uma transação.
GRANT smcorp_rls TO smcorp;

ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

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
