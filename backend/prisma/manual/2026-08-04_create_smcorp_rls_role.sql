-- ============================================
-- SETUP MANUAL (rodar UMA VEZ, fora do `prisma migrate deploy`)
-- ============================================
-- Pré-requisito da migration `20260804210000_rls_pilot_sensitive_tables`.
--
-- POR QUÊ ISTO NÃO ESTÁ NA MIGRATION: CREATE ROLE e GRANT USAGE ON SCHEMA
-- exigem o privilégio CREATEROLE (ou ser dono do schema). O usuário de
-- runtime da aplicação (`smcorp`) não tem esse privilégio no Postgres
-- compartilhado (postgresgeral) — só é dono das TABELAS que criou, não
-- pode criar roles nem necessariamente é dono do schema `public`.
-- Confirmado em produção: "ERROR: permission denied to create role —
-- Only roles with the CREATEROLE attribute may create roles" (P3009,
-- 2026-08-07).
--
-- Rode este script conectado como um usuário com CREATEROLE (ou
-- superuser) no Postgres — normalmente quem administra o `postgresgeral`
-- (ex: o usuário `postgres`, ou o painel de hospedagem). Depois disso, a
-- migration do Prisma (que só precisa de privilégio de DONO das 3
-- tabelas, que `smcorp` já tem) aplica normalmente.
--
-- Exemplo: psql "postgresql://<usuario_admin>:<senha>@postgresgeral:5432/smcorp" -f 2026-08-04_create_smcorp_rls_role.sql
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smcorp_rls') THEN
    CREATE ROLE smcorp_rls NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

-- Permite ao role de runtime (smcorp) fazer `SET LOCAL ROLE smcorp_rls`
-- dentro de uma transação (usado por TenantRlsService.withTenantRls).
GRANT smcorp_rls TO smcorp;

-- Grant de schema exige ser dono do schema (ou CREATEROLE/superuser) —
-- por isso também está aqui e não na migration do Prisma.
GRANT USAGE ON SCHEMA public TO smcorp_rls;
