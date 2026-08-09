# ARQUITETURA — CAISO SaaS Multi-tenant

> Estado: Fases 0–3 + F1.6 + plataforma superadmin implementadas.
> Última atualização: 2026-08-04

## 1. Visão geral

Sistema de gestão de treinamentos offshore transformado em **SaaS multi-tenant**:
cada centro de treinamento é um **tenant** isolado. O SMCORP (slug `smcorp`) é **mais um tenant**
(slug `smcorp`, id fixo `00000000-0000-4000-8000-000000000001`) — não há código
especial para ele.

| Camada | Stack |
|---|---|
| Backend | NestJS 10 + Prisma 5.8 + PostgreSQL 16 (Docker) |
| Frontend | Next.js 14 (App Router, standalone) + Zustand + React Query + Tailwind |
| Pagamentos | Mercado Pago (assinatura `preapproval` + PIX) |
| Comunicação | Uniq Suporte Connect API (e-mail/SMS/WhatsApp) + SMTP por tenant |
| Testes | Jest (backend, 243) + Vitest (frontend, 262) |

## 2. Multi-tenancy

### 2.1 Identidade

- **MASTER** = usuário de plataforma (`tenantId` **nulo**). Não pertence a tenant;
  opera a área `/platform` (superadmin). Papéis por tenant: `ADMIN`, `COLLABORATOR`,
  `CLIENT_PF`, `CLIENT_PJ`, `CLIENT_MOV`.
- O JWT carrega `tenantId` do usuário (`undefined` para MASTER).

### 2.2 Isolamento (3 camadas)

1. **TenantContextService** (`common/services/tenant-context.service.ts`) —
   `AsyncLocalStorage` guarda `{ tenantId, system? }` por requisição.
   `system: true` ignora isolamento (jobs, webhooks, seed, CLI).
2. **TenantInterceptor** (global, `APP_INTERCEPTOR`) — injeta `tenantId` do JWT no
   contexto e bloqueia tenants `SUSPENDED`/`CANCELLED` com 403 (cache de status
   com TTL de 60s — suspensão leva até 60s para valer).
3. **Middleware Prisma** (`prisma/prisma.service.ts`) — injeta `where.tenantId` em
   reads e `data.tenantId` em writes para a whitelist `tenantScopedModels`
   (24 modelos). **`Tenant`/`Subscription` não são escopados** (são da plataforma).
   Bypass quando: sem `tenantId` (MASTER/público), `system: true`, ou modelo fora
   da whitelist. Onde o caller já definiu `tenantId` no `where`, não sobrescreve.

### 2.3 Provisionamento

- `POST /tenant/signup` (público, throttled 5/min): Tenant `TRIAL` (14 dias) +
  Subscription `TRIAL` + usuário `ADMIN` + tokens de auto-login + e-mail de
  boas-vindas (fire-and-forget).
- `POST /tenant` (MASTER): mesmo provisionamento pela plataforma, sem auto-login.
- Núcleo compartilhado: `TenantsService.provisionTenantCore()`.

### 2.4 Segunda camada — RLS do Postgres (piloto em 3 tabelas)

Além do middleware Prisma (camada de aplicação), `students`, `student_documents`
e `payments` (PII + dados financeiros) têm **Row-Level Security** como camada
independente no banco:

- **Desenho**: o app conecta como DONO das tabelas (`smcorp`), e dono ignora RLS
  por padrão. Por isso o RLS é armado por um role auxiliar **`smcorp_rls`**
  (NOLOGIN, sem privilégio de dono) usado via `SET LOCAL SESSION AUTHORIZATION`
  **dentro de transação explícita** (`TenantRlsService.withTenantRls`). RLS já se
  aplica a role não-dono sem `FORCE`. `SESSION AUTHORIZATION` (e não `SET ROLE`)
  impede `RESET ROLE` de reverter para o dono no meio da transação.
- **Policy** `tenant_isolation`: `tenant_id = current_setting('app.tenant_id', true)`
  em USING + WITH CHECK — fail-closed (NULL nunca casa).
- **Uso**: os 3 services do piloto (`StudentsService`, `StudentDocumentsService`,
  `PaymentsService`) rodam via helper `runTenantScoped`: com tenantId no contexto
  → transação RLS; sem tenantId (MASTER/plataforma/jobs) → Prisma direto,
  comportamento atual preservado. `findMany`+`count` compartilham o MESMO client
  transacional. Transação com timeout 15s (acima do default 5s).
- **Pré-requisito de ambiente** (UMA vez, com usuário CREATEROLE — o app `smcorp`
  não pode criar roles):
  `backend/prisma/manual/2026-08-04_create_smcorp_rls_role.sql` (cria `smcorp_rls`,
  `GRANT smcorp_rls TO smcorp`, `GRANT USAGE ON SCHEMA public`).
  A migration `20260804210000_rls_pilot_sensitive_tables` aplica o resto (GRANTs
  nas tabelas, ENABLE RLS, policies — idempotente) e **falha propositalmente**
  (RAISE) se o role não existir. Foi o que causou o P3009 em produção em
  2026-08-07: primeiro faltava CREATEROLE; depois o registro failed precisou de
  `migrate resolve --rolled-back` (ou `UPDATE _prisma_migrations SET
  rolled_back_at=now()`).
- **Evolução planejada** (quando todos os fluxos sensíveis estiverem no wrapper):
  `FORCE ROW LEVEL SECURITY` nas 3 tabelas + role `BYPASSRLS` para fluxos de
  plataforma, eliminando o "opt-in" do piloto.

## 3. Plataforma superadmin (MASTER)

- Frontend: `/platform` (layout próprio, guard MASTER-only; MASTER digitando
  `/dashboard` é redirecionado para `/platform`).
- Backend (todos `@Roles(MASTER)`):
  - `GET /tenant/all` — tenants + assinatura + contagens + métricas
    (total/trial/ativos/suspensos/cancelados/faturas do mês).
  - `GET /tenant/:id` — detalhe + últimas 12 faturas.
  - `POST /tenant` — criar tenant manualmente.
  - `PATCH /tenant/:id/status` — TRIAL/ACTIVE/SUSPENDED/CANCELLED + auditoria.
- Não há impersonação ("entrar no tenant") — decisão de produto (fase futura).

## 4. Billing (Mercado Pago)

- `Subscription` 1:1 com `Tenant` (`tenantId` unique). Preço **customizado por
  tenant** (definido na ativação).
- `POST /tenant/billing/subscribe` → `PreApproval.create` (external_reference =
  tenantId, notification_url webhook) → retorna `initPoint` (link MP) ou
  checkout PIX (`pix-checkout-dialog` no frontend).
- Webhooks (`/mercadopago/webhook`): assinatura HMAC verificada
  (`timingSafeEqual`); `payment.*` marca PAID + tenta confirmar matrícula;
  `subscription_preapproval.*` mapeia `authorized→ACTIVE` etc.;
  `subscription_authorized_payment.*` renova período + cria fatura.
- Jobs diários (03:00, `@nestjs/schedule`): expiração de trial, suspensão de
  cancelados, `markOverdue`.
- Faturas: `Payment` com `description` contendo "Assinatura" e `enrollmentId null`.

## 5. Comunicação

- **E-mail**: SMTP do tenant (CompanySettings criptografado via EncryptionService)
  com **fallback** para Uniq Suporte Connect API (`MESSAGING_API_KEY`).
- **WhatsApp/SMS**: Uniq Suporte Connect API (`POST /api/whatsapp/send`,
  `/api/sms/send`); polling de entrega a cada 5 min
  (`GET /api/get/{channel}/{message_id}`) atualiza `NotificationLog`.
- `GET /communication/status` (autenticado): `uniqSuporteConfigured`,
  `smtpConfigured` (resolvido por tenant) e `channels {whatsapp, sms, email}`.
- `CommunicationService.send()` **nunca lança** — falha vira `sent:false` + log
  (o frontend faz fallback para deep-link `wa.me`/`mailto`).

## 6. Certificados e arquivos

- PDFs de certificado: pdfmake 0.3.11 server-side (A4 landscape, fonte Roboto via
  vfs_fonts). Rota pública de verificação (`/certificates/verify`).
- **Storage atual**: arquivos (fotos de alunos, documentos, logos) são gravados
  como **base64 data-URL no Postgres** (`StudentDocument.fileUrl`,
  `Student.photoUrl`). Volume atual irrisório (~70 docs, ~3KB; 0 fotos).

### 6.1 Plano F4 — storage S3/MinIO (pendente, decisão de produto)

Recomendação: `StorageService` em **dual-mode** —
- Se `S3_ENDPOINT`/`S3_BUCKET`/credenciais configurados (ex.: MinIO como serviço
  no docker-compose), novos uploads vão para o bucket (chave `{tenantId}/{uuid}`);
- Senão, mantém o comportamento atual (base64).
- `fileUrl` passa a guardar a chave S3 ou a data-URL (fallback na leitura).
- **Sem migração de dados** necessária (volume atual desprezível); os dados
  antigos continuam legíveis pelo fallback.
- Alternativas: S3 AWS externo (`@aws-sdk/client-s3`) — não adiciona serviço
  Docker, exige conta AWS.

## 7. Deploy

- `docker-compose.yml`: `postgres` (16, healthcheck) → `backend` (Nest, porta
  3001) → `frontend` (Next standalone, porta 3005). Build do frontend ocorre no
  start do container (`npm run build && node .next/standalone/server.js`).
- Backend roda `dist/src/main.js` (sem tsconfig-paths — o `nest build` reescreve
  o alias `@/*` para caminhos relativos; `tsconfig.json` sem `baseUrl`, só
  `"@/*": ["./src/*"]`).
- Variáveis: `DATABASE_URL`, `JWT_SECRET`/`JWT_REFRESH_SECRET`,
  `ENCRYPTION_KEY`/`SALT`, `MERCADO_PAGO_*`, `MESSAGING_API_KEY`,
  `NEXT_PUBLIC_API_URL`.
- **Nginx (plano F4)**: ingress opcional (profile) para produção — TLS e rota
  dedicada aos webhooks (`/api/v1/mercadopago/webhook`,
  `/api/v1/communication/...`). Config de exemplo em `deploy/nginx.conf.example`.

## 8. Segurança

- Guardas: `JwtAuthGuard` + `RolesGuard` por controller (não há APP_GUARD global);
  rotas sensíveis exigem `@Roles(...)` explícito.
- Refresh token: bcrypt-hashed no banco; logout revoga.
- Webhook MP: assinatura HMAC (timing-safe); `notification_url` por tenant.
- Master PIN (`/auth/master-pin/authorize`, throttled) para ações sensíveis
  (pagamentos, exclusão de custos, resultados de exames).
- Senhas: bcrypt cost 12. `ENCRYPTION_KEY` para dados sensíveis (SMTP, bancos).
- Dependências: overrides npm (multer 2.2.0, body-parser 1.20.6, qs 6.15.3);
  imagens com `images.unoptimized: true` (mitigação para next sem patch na linha 14).

## 9. Pendências conhecidas

1. **F4 storage** (seção 6.1) — aguarda decisão MinIO vs S3 vs manter base64.
2. **F4 nginx** — config de exemplo/documentação para produção.
3. Impersonação MASTER→tenant (decisão de produto, não planejada).
4. Rotação da chave `MESSAGING_API_KEY` antes de produção (aparece em logs/env
   local) e mover segredos para secret manager.
5. `no-explicit-any` (65 warnings) — técnico, aceito (warn por design).
