-- ============================================
-- Índices faltando em FKs (achados do database_schema_review via MCP
-- Reasoner, 2026-08-07). 100% aditivo e seguro: apenas CREATE INDEX,
-- sem validar dado existente, não pode falhar por causa de duplicatas.
--
-- NOTA: sugestão do reviewer de índice em users.refresh_token foi
-- REJEITADA após checar o código real (auth.service.ts) — o refresh token
-- nunca é buscado por igualdade (é hash bcrypt comparado em memória,
-- lookup real é sempre por userId). Adicionar seria desperdício.
-- ============================================

CREATE INDEX IF NOT EXISTS "enrollments_discount_approved_by_idx" ON "enrollments"("discount_approved_by");
CREATE INDEX IF NOT EXISTS "certificates_issued_by_id_idx" ON "certificates"("issued_by_id");
CREATE INDEX IF NOT EXISTS "certificates_template_id_idx" ON "certificates"("template_id");
CREATE INDEX IF NOT EXISTS "instructor_attendances_confirmed_by_idx" ON "instructor_attendances"("confirmed_by");
CREATE INDEX IF NOT EXISTS "crm_deals_class_id_idx" ON "crm_deals"("class_id");
