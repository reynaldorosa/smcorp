-- ============================================
-- FIX: smcorp_rls sem SELECT nas tabelas relacionadas
-- ============================================
-- A migration `20260804210000_rls_pilot_sensitive_tables` só concedeu
-- SELECT/INSERT/UPDATE/DELETE em students/student_documents/payments —
-- mas as queries reais (StudentsService.findAll/findOne,
-- PaymentsService.findAll, etc.) fazem `include` de tabelas relacionadas
-- (companies, enrollments, classes, courses...) DENTRO da mesma transação
-- com `SET LOCAL ROLE smcorp_rls` (TenantRlsService.withTenantRls).
--
-- Resultado em produção (2026-08-07): "permission denied for table
-- companies" / "permission denied for table enrollments" em toda listagem
-- de aluno/pagamento pra usuários de tenant (ADMIN/COLLABORATOR/CLIENT_PJ).
--
-- Por que isto é seguro: RLS só filtra linhas em tabelas onde
-- ENABLE ROW LEVEL SECURITY + CREATE POLICY foram explicitamente feitos
-- (só students/student_documents/payments). Dar SELECT amplo ao
-- smcorp_rls nas demais tabelas não abre nenhum acesso que `smcorp`
-- (dono) já não tivesse — smcorp_rls continua bloqueado pelas policies
-- nas 3 tabelas sensíveis, que é a única coisa que este role existe pra
-- fazer.
--
-- ALTER DEFAULT PRIVILEGES cobre tabelas de migrations futuras
-- automaticamente (criadas por `smcorp`, que é quem roda as migrations)
-- — não deve ser necessário repetir isto de novo.
-- ============================================

GRANT SELECT ON ALL TABLES IN SCHEMA public TO smcorp_rls;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO smcorp_rls;
