-- Permissões granulares por módulo (modulo00..modulo09), persistidas por
-- usuário. Antes só existiam no localStorage do frontend — o backend não
-- tinha como aplicá-las em nenhuma rota. NULL = usa os defaults do role
-- (ver backend/src/modules/auth/permissions.ts).
ALTER TABLE "users" ADD COLUMN "permissions" JSONB;
