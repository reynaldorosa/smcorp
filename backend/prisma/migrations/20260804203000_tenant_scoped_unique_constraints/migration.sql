-- ============================================
-- Índices únicos por tenant (code/cpf/cnpj)
--
-- Antes destes campos eram @unique GLOBALMENTE — dois tenants (centros de
-- treinamento sem nenhuma relação entre si) não podiam ter, por exemplo,
-- um aluno "A0001" cada, e um mesmo CPF só podia ser aluno em UM tenant de
-- toda a plataforma para sempre. Isso é RELAXAMENTO puro de constraint:
-- todo dado que satisfazia o unique global antigo já satisfaz o novo unique
-- composto (tenantId, campo) — não há conflito possível, confirmado por
-- consulta direta ao banco antes de escrever esta migration (zero
-- duplicatas reais; as únicas linhas com valor repetido têm `code IS NULL`,
-- que o Postgres nunca trata como conflito em índice único).
--
-- Prisma não suporta índice único PARCIAL (`WHERE deleted_at IS NULL`) no
-- schema — por isso o índice aqui é composto simples, sem filtro. Um
-- registro soft-deleted ainda ocupa o par (tenantId, code)/(tenantId, cpf)
-- — mesma limitação que já existia com o unique global antes desta
-- migration, não é uma regressão.
-- ============================================

-- companies.cnpj
DROP INDEX "companies_cnpj_key";
CREATE UNIQUE INDEX "companies_tenant_id_cnpj_key" ON "companies"("tenant_id", "cnpj");

-- students.code / students.cpf
DROP INDEX "students_code_key";
DROP INDEX "students_cpf_key";
CREATE UNIQUE INDEX "students_tenant_id_code_key" ON "students"("tenant_id", "code");
CREATE UNIQUE INDEX "students_tenant_id_cpf_key" ON "students"("tenant_id", "cpf");

-- courses.code
DROP INDEX "courses_code_key";
CREATE UNIQUE INDEX "courses_tenant_id_code_key" ON "courses"("tenant_id", "code");

-- rooms.code
DROP INDEX "rooms_code_key";
CREATE UNIQUE INDEX "rooms_tenant_id_code_key" ON "rooms"("tenant_id", "code");

-- classes.code
DROP INDEX "classes_code_key";
CREATE UNIQUE INDEX "classes_tenant_id_code_key" ON "classes"("tenant_id", "code");

-- cost_criteria.code
DROP INDEX "cost_criteria_code_key";
CREATE UNIQUE INDEX "cost_criteria_tenant_id_code_key" ON "cost_criteria"("tenant_id", "code");

-- cost_entries.code
DROP INDEX "cost_entries_code_key";
CREATE UNIQUE INDEX "cost_entries_tenant_id_code_key" ON "cost_entries"("tenant_id", "code");

-- extra_products.code (nullable)
DROP INDEX "extra_products_code_key";
CREATE UNIQUE INDEX "extra_products_tenant_id_code_key" ON "extra_products"("tenant_id", "code");

-- suppliers.code / suppliers.cnpj (nullable)
DROP INDEX "suppliers_code_key";
DROP INDEX "suppliers_cnpj_key";
CREATE UNIQUE INDEX "suppliers_tenant_id_code_key" ON "suppliers"("tenant_id", "code");
CREATE UNIQUE INDEX "suppliers_tenant_id_cnpj_key" ON "suppliers"("tenant_id", "cnpj");

-- instructors.cpf (nullable)
DROP INDEX "instructors_cpf_key";
CREATE UNIQUE INDEX "instructors_tenant_id_cpf_key" ON "instructors"("tenant_id", "cpf");

-- exams.exam_code
DROP INDEX "exams_exam_code_key";
CREATE UNIQUE INDEX "exams_tenant_id_exam_code_key" ON "exams"("tenant_id", "exam_code");

-- certificates.code / certificates.certificate_number
DROP INDEX "certificates_code_key";
DROP INDEX "certificates_certificate_number_key";
CREATE UNIQUE INDEX "certificates_tenant_id_code_key" ON "certificates"("tenant_id", "code");
CREATE UNIQUE INDEX "certificates_tenant_id_certificate_number_key" ON "certificates"("tenant_id", "certificate_number");

-- crm_contacts.code
DROP INDEX "crm_contacts_code_key";
CREATE UNIQUE INDEX "crm_contacts_tenant_id_code_key" ON "crm_contacts"("tenant_id", "code");

-- crm_deals.code
DROP INDEX "crm_deals_code_key";
CREATE UNIQUE INDEX "crm_deals_tenant_id_code_key" ON "crm_deals"("tenant_id", "code");
