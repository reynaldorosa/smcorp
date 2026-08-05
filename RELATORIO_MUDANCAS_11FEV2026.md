# Relatório de Mudanças — 11/02/2026

## Objetivo
- Bater módulo por módulo para máxima paridade com o Figma.
- Remover **mocks**, **fallbacks que inventam dados** e **hardcodes de host** no frontend.
- Manter regra: **sem hardcode e sem mock** — **única exceção permitida: WhatsApp** (preferindo ação real, ex.: abrir WhatsApp Web).

## Resumo Executivo
- Frontend migrou para postura **API-first/API-only**: em caso de falha de API, **não** cria entidades locais falsas.
- Foram removidos mocks explícitos (ex.: upload simulado, listas fictícias, progresso aleatório) e hardcodes `http://localhost:3001/...`.
- Ajustes no backend e mapeamento de dados no frontend para suportar fluxo real (ex.: `enrollmentId` real para certificados).

## Descobertas (releitura do “Figma code” — M07/M08)

- **M07 (Pagamentos)**: contém regras operacionais reais (Master-only para confirmar/ações sensíveis, **NF PJ obrigatória**, lote PJ-only, PIN Master para editar/excluir confirmados).
- **M08 (Fluxo Financeiro)**: o próprio arquivo contém **“DADOS MOCKADOS”** e geração automática de NF; portanto é **referência de UX/fluxo**, mas **não** deve ser tratado como fonte de dados.

## Mudanças adicionadas nesta rodada (sem mock, com ação real)

- **Portal público de matrícula (aluno)**: removidas ações de simulação (ex.: “Simular Pagamento” e upload fake) e substituídas por **WhatsApp real** (abrir WhatsApp Web com mensagem pré-preenchida).
  - Arquivo: `frontend/src/components/enrollment/student-enrollment-page.tsx`
- **Backend `/costs` (contrato para suportar M08 via API)**:
  - `isAuditable?: boolean` aceito na criação.
  - `GET /costs` aceita filtro opcional `isAuditable`.
  - Paginação padronizada para `meta.totalPages`.
  - Arquivos: `backend/src/modules/costs/dto/create-cost.dto.ts`, `backend/src/modules/costs/costs.controller.ts`, `backend/src/modules/costs/costs.service.ts`

## Changelog (curto)
- **Backend**: students `findAll()` agora expõe `enrollments.id` para viabilizar fluxo real de certificados.
- **Students (frontend)**: store/type + mapper passaram a carregar `enrollmentId` real.
- **Certificados**: operações em modo **API-only** (sem criação/alteração simulada no estado local).
- **Documentos (M06)**: upload real (multipart), reject com `rejectedReason`, status alinhado (`PENDING|COMPLETE|REJECTED`).
- **Portal público (Matrícula PF)**: removidos botões/fluxos de simulação; WhatsApp virou o canal real de envio/solicitação.
- **Costs (backend)**: suporte a `isAuditable` + paginação `meta.totalPages`.
- **Backup**: removida simulação (sem histórico/contagens fictícias) e export/copy com dados reais via API.
- **Turmas**: removido fallback de cursos hardcoded (UI depende apenas da API).
- **Hardcodes**: removidos `fetch('http://localhost:3001/...')` e substituídos por `api`/operations/services.
- **HTTP client**: `NEXT_PUBLIC_API_URL` ou fallback relativo `'/api/v1'` (sem `localhost` hardcoded).

## Auditoria (rodada atual) — pontos críticos

- Remoção de `Math.random()` no frontend:
  - Recibos: `generateReceiptNumber()` passou a ser determinístico (timestamp + sequência em memória).
  - Operacional: `approvalBatchId` de aprovação de importação agora usa `crypto.randomUUID()`.
  - Settings: migração IRATA agora usa `crypto.randomUUID()` para ids.

- Remoção de data hardcoded em geração de custos:
  - `generate-smart-costs.ts` não usa mais fallback fixo `2026-03-31`; o cálculo deriva de `classInfo.endDate`/`classInfo.startDate`.

- Pagamentos (frontend) — consolidação API-only:
  - Removida a função legada `getPaymentStatus()` (placeholder não utilizado) para evitar regressões e reforçar que o status vem apenas de `getPaymentStatusApi()` + dados da API.

- Usuários / Permissões — paridade com Figma:
  - Ao alterar o perfil (role) de um usuário, o frontend agora **reseta as permissões** para o padrão do novo nível (mesma regra do Figma ao mudar `nivel`).
  - Arquivo: `frontend/src/components/settings/users-tab.tsx`.

- Sessão / Usuário atual (currentUser):
  - O app agora sincroniza `settings.currentUser` com o usuário autenticado (`auth-storage`) via `/users/profile`, evitando `currentUser` ficar `null` durante o uso e reduzindo fallbacks como `"Sistema"` em ações sensíveis.
  - Arquivo: `frontend/src/app/providers.tsx`.

- Auditoria (sem risco) — mapa canônico rotas → módulos:
  - Foi levantado onde o frontend realmente faz gating hoje (Auth Guard + Sidebar por `role`) e proposto o mapa rotas → `modulo00..08` com pontos de ambiguidade pós-refactor.
  - Documento: `docsatuais/MAPA_CANONICO_MODULOS_FRONTEND_11FEV2026.md`.
  - Camada de mapeamento em inglês (sem alterar runtime): `frontend/src/lib/route-module-map.ts`.

- Gating por módulo (incremental, sem ambiguidade financeira):
  - Sidebar agora também filtra itens mapeados por `currentUser.permissions.modulos[moduloXX]` (mantendo o filtro anterior por `auth.user.role`).
  - Layout do dashboard adicionou guard leve para bloquear acesso direto às rotas mapeadas quando o módulo estiver desativado.
  - Arquivos: `frontend/src/components/layout/sidebar.tsx`, `frontend/src/app/(dashboard)/layout.tsx`.

- Decisão financeira (documentada):
  - As rotas `/pagamentos`, `/costs`, `/financial` foram tratadas como **visualização** e liberadas quando o usuário tem **`modulo07` OU `modulo08`**.
  - Implementação no mapa canônico: `frontend/src/lib/route-module-map.ts`.


## Observações de arquitetura (para migração API-only)

- Módulos **Pagamentos** e **Custos** ainda têm comportamento legado baseado em `zustand persist` e atualização local de entidades.
- Backend já possui APIs reais para **payments** e **costs** (inclui `costs/criteria`). Próximo passo é migrar as páginas para consumir essas APIs diretamente (React Query + services), evitando que o frontend seja a “fonte de verdade”.

## Contratos de API (base para migração do M08 para API-only)

> Objetivo: ter um “contrato mínimo” (request/response) para orientar o frontend a consumir **somente dados reais**.

### 1) `GET /costs` (paginado + filtro `isAuditable`)

**Query params suportados hoje (backend):**
- `page` (number, default `1`)
- `limit` (number, default `10` no backend; no frontend geralmente `20`)
- `isAuditable` (string): aceita `true|1` para `true`, qualquer outro valor vira `false`.

**Response (shape):**
```json
{
  "data": [
    {
      "id": "...",
      "category": "FIXED",
      "description": "...",
      "amount": 0,
      "period": "2026-02-11T00:00:00.000Z",
      "isRecurring": false,
      "isAuditable": false,
      "notes": null,
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null
    }
  ],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

> Nota: o service do frontend já envia `category`, `startDate`, `endDate`, mas **o backend ainda não filtra por esses campos**. Se quiser, isso vira próximo ajuste de contrato.

### 2) `POST /costs` (criação)

**Body (mínimo):**
```json
{
  "category": "FIXED",
  "description": "...",
  "amount": 0,
  "period": "2026-02-11",
  "isRecurring": false,
  "isAuditable": false,
  "notes": "..."
}
```

**Regras (backend):**
- `isRecurring` e `isAuditable` fazem default para `false` quando ausentes.

### 3) `GET /costs/criteria` (paginado)

**Query params suportados hoje (backend):**
- `page` (string → number, default `1`)
- `limit` (string → number, default `20`)

**Response (shape):**
```json
{
  "data": [
    {
      "id": "...",
      "code": "CR0001",
      "name": "...",
      "frequency": "MONTHLY",
      "linkage": "...",
      "dueCriterion": "...",
      "daysUntilDue": null,
      "monthlyClosingDay": null,
      "daysAfterClosing": null,
      "notes": null,
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null
    }
  ],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

## Alterações no Backend (NestJS/Prisma)

### 1) Exposição de `enrollmentId` no payload de Students
**Por quê:** o fluxo de certificados passou a exigir `enrollmentId` real (sem inventar matrícula no frontend).

**Mudança:**
- `findAll()` de students passou a incluir `enrollments.select.id: true` (além dos campos já existentes), garantindo que o frontend possa usar a matrícula real.

**Arquivo:**
- backend/src/modules/students/students.service.ts

---

## Alterações no Frontend (Next.js)

### 1) Normalização de `Student` para suportar `enrollmentId`
**Mudança:**
- Tipo `Student` passou a ter `enrollmentId?: string`.
- Mapper de API passou a mapear `enrollmentId` com base na última matrícula (`enrollments[0].id`).

**Arquivos:**
- frontend/src/stores/students.store.ts
- frontend/src/services/students.service.ts

---

### 2) Módulo Certificados — API-only (sem fallback local)
**Mudança:**
- Revogar/verificar/criar certificados sem simulação local.
- Criação passou a usar `certificatesService.create()` com `enrollmentId` real.

**Arquivo:**
- frontend/src/app/(dashboard)/certificados/page.tsx

---

### 3) Módulo 06 (Validação de Documentos) — remoção de mock e alinhamento com backend
**Mudanças relevantes:**
- Remoção de trecho marcado como mock: “simular upload”.
- Upload passou a ser **real (multipart)** via service.
- Rejeição passou a enviar `rejectedReason` (contrato do backend), removendo uso de `reason`.
- Status padronizado para `PENDING | COMPLETE | REJECTED` (alinhado ao backend).

**Arquivo:**
- frontend/src/components/dashboard/document-modal.tsx

---

### 4) Settings > Backup — remoção total de simulação
**Mudanças relevantes:**
- Removidos arrays fictícios (histórico fake, contagens fake) e progresso aleatório.
- Passou a carregar contagens e dados via chamadas reais (services).
- Export/copy passou a gerar JSON real (e `backupHistory` apenas da sessão atual).

**Arquivo:**
- frontend/src/components/settings/backup-tab.tsx

---

### 5) Turmas — remover fallback de cursos hardcoded
**Mudança:**
- Removida lista hardcoded de cursos como fallback.
- Se API não retornar cursos, o select fica desabilitado e a UI informa indisponibilidade (sem inventar cursos).

**Arquivo:**
- frontend/src/components/dashboard/create-class-form.tsx

---

### 6) Remoção de hardcode de host (`http://localhost:3001/...`)
**Mudança geral:**
- Substituição de `fetch('http://localhost:3001/...')` por `api`/services/operations existentes.
- Resultado: **nenhuma dependência de host** hardcoded em componentes.

**Arquivos ajustados:**
- frontend/src/components/dashboard/resend-link-dialog.tsx
  - geração de token via `enrollmentOperations.generateToken(...)`

- frontend/src/components/dashboard/qrcode-modal.tsx
  - QRCode via `enrollmentOperations.getQRCode(enrollmentId, format)`

- frontend/src/components/dashboard/exam-modal.tsx
  - cancelamento/atualização via `examOperations.delete(...)` e `examOperations.update(...)`
  - busca de enrollment via `enrollmentOperations.getById(...)`

- frontend/src/components/dashboard/edit-course-modal.tsx
  - update via `api.patch('/courses/:id', ...)`

- frontend/src/components/dashboard/edit-course-modal-v2.tsx
  - update via `api.patch('/courses/:id', ...)`

- frontend/src/components/dashboard/edit-class-full-form.tsx
  - cursos/salas/empresas via `api.get(...)` (sem host hardcoded)
  - cálculo de data final via `classOperations.calculateEndDate(...)`

---

### 7) Ajuste do client HTTP (`api`) para não depender de localhost
**Mudança:**
- `API_URL` agora usa `process.env.NEXT_PUBLIC_API_URL || '/api/v1'`.

**Motivo:**
- evitar hardcode de host no runtime do frontend.

**Arquivo:**
- frontend/src/lib/api.ts

> Observação: isso pressupõe que em dev/prod exista proxy/NGINX/Next rewrites atendendo `'/api/v1'`, ou então que `NEXT_PUBLIC_API_URL` seja definido.

---

### 8) Ajustes em operations para consistência
**Mudanças:**
- `enrollmentOperations.getQRCode(...)` passou a tratar como JSON (conforme backend retorna).
- `examOperations` ganhou método `delete(examId)` (DELETE `/exams/:id`).

**Arquivo:**
- frontend/src/services/operations.service.ts

---

### 9) Vendas (M04) — remoção de mocks
**Mudança:**
- Removidos `CONTACTS_MOCK` e `MESSAGES_MOCK`.
- Mantido apenas `READY_MESSAGES` (templates de mensagens).
- Atualizado barrel export.

**Arquivos:**
- frontend/src/components/sales/constants.ts
- frontend/src/components/sales/index.ts

---

## Auditoria de “mocks/hardcodes” (status)

### Hardcode `http://localhost:3001`
- **Status:** removido do frontend (componentes e lib) nesta rodada.

### Mocks explícitos
- **Status:** removidos onde encontrados (DocumentModal, BackupTab, Sales constants, fallbackCourses).

### WhatsApp (exceção permitida)
- Permanecem apenas referências relacionadas a abrir WhatsApp Web (ação real), conforme política do projeto.

---

## Qualidade (Lint/Typecheck)
- Foi executado `npm run lint` no frontend.
- Resultado: várias **warnings** (imports não usados, `any`, `next/no-img-element`, deps de hooks), e o comando terminou com **exit code 1** no ambiente atual.

> Observação: as mudanças desta rodada focaram em remover mocks/hardcodes e alinhar contratos; os warnings de lint parecem preexistentes em grande parte, mas podem ser tratados depois se você quiser.

---

## Checklist rápido (para validação manual)
- Documentos: upload/validar/rejeitar (sem simulação).
- Certificados: criar/verificar/revogar sem fallback local.
- QRCode: abrir modal e validar retorno do endpoint.
- Provas: agendar, editar, cancelar (DELETE via API).
- Turmas: criar/editar com cursos vindos da API (sem fallback hardcoded).

---

## Próximos Passos sugeridos
- Garantir `NEXT_PUBLIC_API_URL` em todos os ambientes **ou** confirmar proxy/rewrite para `'/api/v1'`.
- Se quiser “zerar o lint”: limpar imports não usados e ajustar warnings (sem alterar UX).
