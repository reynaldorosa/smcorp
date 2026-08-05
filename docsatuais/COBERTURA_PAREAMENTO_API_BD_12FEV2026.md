# Cobertura de Testes — Pareamento Figma vs Frontend + Persistência API/BD

**Data:** 12/02/2026  
**Objetivo:** validar cobertura funcional com foco em (1) pareamento Figma↔Frontend e (2) operação API/BD (não localStorage como fonte de verdade nos módulos críticos).

---

## 1) Escopo desta rodada

- Validação de ambiente oficial Docker (`3001` backend / `3005` frontend).
- Smoke tests em endpoints críticos orientados a BD.
- Execução de testes automatizados existentes (frontend + backend).
- Auditoria de persistência local remanescente.
- Revisão de evidências de pareamento Figma↔Frontend em documentação e estrutura de páginas/componentes.

---

## 2) Evidências de API/BD (smoke tests)

### 2.1 Leitura de dados em módulos críticos

Executado com autenticação (`/auth/login`) no backend oficial `http://localhost:3001/api/v1`:

- `CLASSES_COUNT=7`
- `STUDENTS_COUNT=20`
- `COSTS_COUNT=8`
- `COST_ENTRIES_COUNT=2`
- `EXAMS_OPERATIONAL_COUNT=24` (rodada subsequente: `25`)

### 2.2 Escrita em provas (M03)

Ciclo validado em `3001` anteriormente nesta sessão:
- `create exam`
- `update exam`
- `delete exam` (cancelamento lógico)
- verificação final de status `CANCELLED` no registro
- item refletido em listagem operacional agregada

### 2.3 Escrita em custos (M08)

Ciclo executado em `3001`:
- `ENTRY_CREATED=6d2e4d66-6203-4aac-a9d7-3db369fab158`
- `ENTRY_PAID_STATUS=PAID`
- consulta posterior retornou `404` para GET por id (esperado após delete lógico do endpoint)

Resultado: persistência e mutações confirmadas em API/BD para os fluxos críticos testados.

---

## 3) Testes automatizados

## Frontend (Vitest)

Comando: `npm run test -- --run`

- **8/8 arquivos de teste passados**
- **19/19 testes passados**

Arquivos cobertos incluem:
- serviços (`auth`, `students`, `classes`, `operations`)
- rota de módulo
- páginas de login e portal cliente

## Backend (Jest)

Comando: `npm test -- --runInBand`

- **3/4 suites passadas**
- **18/19 testes passados**
- **1 falha legada** em `payments.service.spec.ts`:
  - `TypeError: Cannot read properties of undefined (reading 'companyId')`
  - ponto: `src/modules/payments/payments.service.ts` (cenário de mock incompleto no spec)

Resultado: cobertura automatizada majoritariamente verde, com um gap isolado de teste em pagamentos.

---

## 4) Auditoria de persistência local (frontend)

Busca por `persist(` / `localStorage` / `sessionStorage` no frontend:

### 4.1 Módulos críticos já migrados (sem `persist` no store)
- `students.store.ts`
- `classes.store.ts`
- `costs.store.ts`
- `exams.store.ts`

### 4.2 Persistência local ainda presente (domínios secundários)
- `auth.store.ts`
- `settings.store.ts`
- `courses.store.ts`
- `companies.store.ts`
- `crm.store.ts`
- `certificates.store.ts`
- `sidebar.store.ts`

### 4.3 Uso utilitário de storage
- `use-persisted-state.ts` (estado de UI)
- tema no `header.tsx`
- sessão do portal cliente via `sessionStorage`

Resultado: premissa “não localStorage e sim BD” está atendida no bloco crítico alvo; ainda há persist local em domínios não migrados nesta rodada.

---

## 5) Pareamento Figma ↔ Frontend (evidência)

Base de auditoria:
- `docsatuais/AUDITORIA_FIGMA_VS_FRONTEND.md`

Indicadores encontrados:
- cobertura geral reportada: **~99%**
- histórico de fechamento de gaps por módulo
- indicação explícita de pontos ainda não 100% em persistência de alguns fluxos operacionais

Evidência de presença estrutural no frontend:
- páginas dashboard incluem `timeline`, `operacional`, `documents`, `pagamentos`, `costs`, `crm`, etc.
- componentes operacionais incluem `class-calendar`, `weekly-view`, `operational-dashboard`

Resultado: pareamento alto, porém não comprovado como 100% absoluto nesta rodada.

---

## 6) Conclusão técnica da rodada

- **API/BD (módulos críticos):** validado com sucesso por leitura + escrita.
- **Testes automatizados:** frontend 100% verde; backend com 1 falha legada em suite de pagamentos.
- **Pareamento Figma↔Frontend:** alto (~99% conforme auditoria), mas sem evidência para afirmar 100% absoluto.
- **Declaração final:** ainda **não é seguro declarar 100%** (pareamento e funcionalidade total), mas o núcleo crítico está operacional e persistindo em banco.

---

## 7) Próximos passos para fechamento 100%

1. Corrigir/ajustar `payments.service.spec.ts` para zerar falha backend de testes.
2. Reduzir passivo de warnings/lint que ainda bloqueia `npm run build` do frontend.
3. Executar checklist final de paridade visual/comportamental Figma tela-a-tela (com evidência por módulo).
4. Planejar migração dos stores secundários ainda com `persist`, conforme prioridade do negócio.
