# SMCORP — Módulos Adicionais: Certificados & CRM

> **Data**: 06/02/2026  
> **Versão**: 1.0  
> **Status**: Em implementação

---

## Índice

1. [Módulo de Certificados](#1-módulo-de-certificados)
2. [Módulo CRM](#2-módulo-crm)
3. [Roadmap de Implementação](#3-roadmap-de-implementação)
4. [Relação com Módulos Existentes](#4-relação-com-módulos-existentes)

---

## 1. Módulo de Certificados

### 1.1 Visão Geral

| Item | Detalhe |
|------|---------|
| **Objetivo** | Emitir, rastrear e gerenciar certificados de conclusão de cursos |
| **Rota frontend** | `/certificados` |
| **Backend module** | `certificates/` |
| **Prioridade** | Alta — requisito regulatório NR (validade, rastreabilidade) |

#### Pré-requisitos já existentes no projeto

- `Course.validityMonths` — validade em meses (schema.prisma L155)
- `Course.certificationInfo` — texto descritivo (schema.prisma L152)
- Custo auditável `"Certificado Emitido"` — (costs-tab.tsx L148)
- Tipo de documento `"Certificado de Escolaridade"` — (edit-course-modal-v2.tsx L53)
- Produto extra `"Certificado Digital"` R$ 50 — (course-list.tsx L36)

### 1.2 Modelo de Dados (Prisma)

```prisma
// ============================================
// CERTIFICADOS
// ============================================
model Certificate {
  id                String            @id @default(uuid())
  code              String            @unique // CERT0001, CERT0002...
  certificateNumber String            @unique @map("certificate_number") // Número oficial
  enrollmentId      String            @map("enrollment_id")
  studentId         String            @map("student_id")
  courseId           String            @map("course_id")
  templateId        String?           @map("template_id")
  status            CertificateStatus @default(DRAFT)
  issuedAt          DateTime?         @map("issued_at")
  expiresAt         DateTime?         @map("expires_at")
  validityMonths    Int               @map("validity_months")
  fileUrl           String?           @map("file_url") // URL do PDF gerado
  metadata          Json?             @default("{}") // Dados extras (nota, carga horária, etc.)
  revokedAt         DateTime?         @map("revoked_at")
  revokedReason     String?           @map("revoked_reason")
  issuedById        String?           @map("issued_by_id") // FK User que emitiu
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  deletedAt         DateTime?         @map("deleted_at")

  enrollment Enrollment          @relation(fields: [enrollmentId], references: [id])
  student    Student             @relation(fields: [studentId], references: [id])
  course     Course              @relation(fields: [courseId], references: [id])
  template   CertificateTemplate? @relation(fields: [templateId], references: [id])
  issuedBy   User?               @relation("CertificateIssuer", fields: [issuedById], references: [id])

  @@index([code])
  @@index([certificateNumber])
  @@index([enrollmentId])
  @@index([studentId])
  @@index([courseId])
  @@index([status])
  @@index([issuedAt])
  @@index([deletedAt])
  @@map("certificates")
}

model CertificateTemplate {
  id               String    @id @default(uuid())
  name             String
  courseId          String?   @map("course_id") // NULL = template genérico
  htmlTemplate     String    @map("html_template") @db.Text
  headerImageUrl   String?   @map("header_image_url")
  footerImageUrl   String?   @map("footer_image_url")
  signatureImageUrl String?  @map("signature_image_url")
  logoUrl          String?   @map("logo_url")
  isDefault        Boolean   @default(false) @map("is_default")
  isActive         Boolean   @default(true) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  certificates Certificate[]

  @@index([courseId])
  @@index([isDefault])
  @@index([isActive])
  @@index([deletedAt])
  @@map("certificate_templates")
}

enum CertificateStatus {
  DRAFT     // Rascunho — dados preenchidos, não emitido
  ISSUED    // Emitido — PDF gerado, válido
  EXPIRED   // Expirado — passou a validade
  REVOKED   // Revogado — cancelado por motivo
}
```

### 1.3 Backend NestJS

#### Estrutura

```
backend/src/modules/certificates/
├── dto/
│   ├── create-certificate.dto.ts
│   ├── update-certificate.dto.ts
│   ├── issue-certificate.dto.ts
│   └── revoke-certificate.dto.ts
├── certificates.controller.ts
├── certificates.module.ts
└── certificates.service.ts
```

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/certificates` | Listar certificados (paginado, filtros) |
| `GET` | `/certificates/:id` | Detalhe de um certificado |
| `POST` | `/certificates` | Criar rascunho |
| `PATCH` | `/certificates/:id` | Atualizar dados |
| `DELETE` | `/certificates/:id` | Soft delete |
| `POST` | `/certificates/:id/issue` | **Emitir** (gerar PDF, mudar status) |
| `POST` | `/certificates/:id/revoke` | **Revogar** (requer motivo) |
| `GET` | `/certificates/:id/download` | Download do PDF |
| `GET` | `/certificates/verify/:number` | Verificar autenticidade pelo número |

### 1.4 Frontend

#### Store (`certificates.store.ts`)

```typescript
export interface Certificate {
  id: string;
  code: string;
  certificateNumber: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  templateId?: string;
  status: 'DRAFT' | 'ISSUED' | 'EXPIRED' | 'REVOKED';
  issuedAt?: string;
  expiresAt?: string;
  validityMonths: number;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  revokedAt?: string;
  revokedReason?: string;
  issuedById?: string;
  // Populated
  studentName?: string;
  courseName?: string;
  courseCode?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  courseId?: string;
  htmlTemplate: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  signatureImageUrl?: string;
  logoUrl?: string;
  isDefault: boolean;
  isActive: boolean;
}
```

#### Componentes UI

| Componente | Descrição |
|-----------|-----------|
| `CertificateList` | Tabela com filtros (status, curso, aluno, período) |
| `CertificateBadge` | Badge colorido por status (DRAFT=cinza, ISSUED=verde, EXPIRED=amarelo, REVOKED=vermelho) |
| `IssueCertificateDialog` | Modal de emissão com preview |
| `RevokeCertificateDialog` | Modal de revogação com campo de motivo |
| `CertificatePreview` | Preview do certificado antes da emissão |
| `CertificateStats` | Cards com métricas (total emitidos, expirando, revogados) |
| `VerifyCertificateCard` | Widget público de verificação por número |

#### Página `/certificados`

Layout com 3 seções:
1. **Header** — Título + botão "Emitir Certificado" + campo de busca
2. **Stats Cards** — Total emitidos, Expirando em 30 dias, Revogados, Rascunhos
3. **Tabela Principal** — Lista de certificados com ações (emitir, revogar, download, preview)

### 1.5 Regras de Negócio

| # | Regra | Detalhe |
|---|-------|---------|
| R1 | **Pré-requisitos para emissão** | Enrollment.status = `PRESENT` ou `CONFIRMED` + todos os exames aprovados + documentos com status `COMPLETE` |
| R2 | **Validade automática** | `expiresAt` = `issuedAt` + `Course.validityMonths` meses |
| R3 | **Código sequencial** | CERT0001, CERT0002... (global, não por curso) |
| R4 | **Número único** | Formato: `SMCORP-{ANO}-{SEQUENCIAL}` (ex: SMCORP-2026-00001) |
| R5 | **Revogação auditada** | Requer motivo obrigatório + registra em `AuditLog` |
| R6 | **Expiração automática** | Cronjob/check que marca `EXPIRED` quando `expiresAt < now()` |
| R7 | **Um certificado por matrícula** | Relação 1:1 com Enrollment (não pode emitir 2x para mesma matrícula) |
| R8 | **Template herança** | Usa template do curso se existir, senão usa template `isDefault` |
| R9 | **Custo auditável** | Ao emitir, gera registro de custo "Certificado Emitido" automaticamente |

---

## 2. Módulo CRM

### 2.1 Visão Geral

| Item | Detalhe |
|------|---------|
| **Objetivo** | CRM completo com contatos como entidade própria, funil de vendas, atividades e histórico |
| **Rota frontend** | `/crm` (novo) — a Central de Vendas `/vendas` continua como interface de comunicação |
| **Backend module** | `crm/` |
| **Prioridade** | Média — melhora conversão e rastreabilidade comercial |

#### O que existe hoje (Central de Vendas — Módulo 04)

- Interface tipo WhatsApp Web em `/vendas` (854 linhas)
- Tipos em `components/sales/types.ts`: `Contact`, `Message`, `LeadStats`
- Contatos **derivados** de `students.store` + `companies.store` (sem persistência própria)
- Status simples: `lead` → `interested` → `enrolled`
- Mensagens em estado local (sem persistência)
- Sem funil de vendas, sem pipeline, sem atividades, sem histórico

### 2.2 Modelo de Dados (Prisma)

```prisma
// ============================================
// CRM — CONTATOS
// ============================================
model CRMContact {
  id           String           @id @default(uuid())
  code         String           @unique // C0001, C0002...
  name         String
  email        String?
  phone        String?
  company      String? // Nome da empresa (texto livre)
  cpfCnpj      String?          @map("cpf_cnpj")
  source       CRMContactSource @default(MANUAL)
  status       CRMContactStatus @default(LEAD)
  assignedToId String?          @map("assigned_to_id") // FK User responsável
  studentId    String?          @map("student_id") // Vinculado a aluno (quando convertido)
  companyId    String?          @map("company_id") // Vinculado a empresa
  tags         String[]         @default([])
  notes        String?          @db.Text
  customFields Json?            @default("{}") @map("custom_fields")
  lastContactAt DateTime?       @map("last_contact_at")
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")
  deletedAt    DateTime?        @map("deleted_at")

  assignedTo  User?         @relation("CRMAssignedContacts", fields: [assignedToId], references: [id])
  student     Student?      @relation(fields: [studentId], references: [id])
  companyRef  Company?      @relation(fields: [companyId], references: [id])
  activities  CRMActivity[]
  deals       CRMDeal[]

  @@index([code])
  @@index([name])
  @@index([email])
  @@index([phone])
  @@index([source])
  @@index([status])
  @@index([assignedToId])
  @@index([studentId])
  @@index([companyId])
  @@index([deletedAt])
  @@map("crm_contacts")
}

// ============================================
// CRM — ATIVIDADES / INTERAÇÕES
// ============================================
model CRMActivity {
  id           String          @id @default(uuid())
  contactId    String          @map("contact_id")
  type         CRMActivityType
  title        String
  description  String?         @db.Text
  scheduledAt  DateTime?       @map("scheduled_at") // Para follow-ups agendados
  completedAt  DateTime?       @map("completed_at")
  createdById  String          @map("created_by_id")
  metadata     Json?           @default("{}") // Dados extras (duração chamada, etc.)
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  deletedAt    DateTime?       @map("deleted_at")

  contact   CRMContact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  createdBy User       @relation("CRMActivityCreator", fields: [createdById], references: [id])

  @@index([contactId])
  @@index([type])
  @@index([scheduledAt])
  @@index([completedAt])
  @@index([createdById])
  @@index([deletedAt])
  @@map("crm_activities")
}

// ============================================
// CRM — ETAPAS DO FUNIL
// ============================================
model CRMPipelineStage {
  id        String    @id @default(uuid())
  name      String    // "Novo Lead", "Qualificado", "Proposta", "Negociação", "Fechado"
  order     Int       // Ordem no funil (1, 2, 3...)
  color     String    @default("#6366f1") // Cor hex
  isDefault Boolean   @default(false) @map("is_default")
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  deals CRMDeal[]

  @@index([order])
  @@index([isActive])
  @@index([deletedAt])
  @@map("crm_pipeline_stages")
}

// ============================================
// CRM — NEGÓCIOS / OPORTUNIDADES
// ============================================
model CRMDeal {
  id                String        @id @default(uuid())
  code              String        @unique // D0001, D0002...
  contactId         String        @map("contact_id")
  stageId           String        @map("stage_id")
  title             String
  value             Decimal       @db.Decimal(10, 2) // Valor estimado
  expectedCloseDate DateTime?     @map("expected_close_date")
  status            CRMDealStatus @default(OPEN)
  courseId           String?      @map("course_id") // Curso de interesse
  classId            String?      @map("class_id") // Turma de interesse
  wonAt             DateTime?     @map("won_at")
  lostAt            DateTime?     @map("lost_at")
  lostReason        String?       @map("lost_reason")
  notes             String?       @db.Text
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")
  deletedAt         DateTime?     @map("deleted_at")

  contact CRMContact       @relation(fields: [contactId], references: [id], onDelete: Cascade)
  stage   CRMPipelineStage @relation(fields: [stageId], references: [id])

  @@index([code])
  @@index([contactId])
  @@index([stageId])
  @@index([status])
  @@index([courseId])
  @@index([expectedCloseDate])
  @@index([deletedAt])
  @@map("crm_deals")
}

// ============================================
// ENUMS CRM
// ============================================
enum CRMContactSource {
  MANUAL    // Cadastro manual
  IMPORT    // Importação CSV/XLSX
  WEBSITE   // Formulário do site
  WHATSAPP  // Via WhatsApp
  REFERRAL  // Indicação
  COMPANY   // Via empresa parceira
}

enum CRMContactStatus {
  LEAD        // Novo contato
  QUALIFIED   // Qualificado
  INTERESTED  // Demonstrou interesse
  NEGOTIATION // Em negociação
  ENROLLED    // Matriculado (convertido)
  LOST        // Perdido
}

enum CRMActivityType {
  CALL      // Ligação
  EMAIL     // E-mail
  WHATSAPP  // Mensagem WhatsApp
  MEETING   // Reunião
  NOTE      // Nota/observação
  TASK      // Tarefa/to-do
  FOLLOW_UP // Follow-up agendado
}

enum CRMDealStatus {
  OPEN  // Em andamento
  WON   // Ganho — virou matrícula
  LOST  // Perdido
}

// Adicionar enum CertificateStatus (já descrito na seção 1.2)
```

### 2.3 Backend NestJS

#### Estrutura

```
backend/src/modules/crm/
├── dto/
│   ├── create-contact.dto.ts
│   ├── update-contact.dto.ts
│   ├── create-activity.dto.ts
│   ├── create-deal.dto.ts
│   ├── update-deal.dto.ts
│   └── move-deal.dto.ts
├── crm-contacts.controller.ts
├── crm-activities.controller.ts
├── crm-deals.controller.ts
├── crm-pipeline.controller.ts
├── crm.module.ts
└── crm.service.ts
```

#### Endpoints — Contatos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/crm/contacts` | Listar contatos (paginado, filtros por status/source/tag) |
| `GET` | `/crm/contacts/:id` | Detalhe com atividades e deals |
| `POST` | `/crm/contacts` | Criar contato |
| `PATCH` | `/crm/contacts/:id` | Atualizar |
| `DELETE` | `/crm/contacts/:id` | Soft delete |
| `POST` | `/crm/contacts/:id/convert` | Converter para aluno (cria em `students`) |
| `POST` | `/crm/contacts/import` | Importação CSV/XLSX |

#### Endpoints — Atividades

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/crm/contacts/:id/activities` | Atividades de um contato |
| `POST` | `/crm/contacts/:id/activities` | Registrar atividade |
| `PATCH` | `/crm/activities/:id` | Atualizar (completar, reagendar) |
| `DELETE` | `/crm/activities/:id` | Remover |

#### Endpoints — Deals (Oportunidades)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/crm/deals` | Listar deals (kanban view) |
| `POST` | `/crm/deals` | Criar deal |
| `PATCH` | `/crm/deals/:id` | Atualizar |
| `PATCH` | `/crm/deals/:id/move` | Mover entre stages |
| `POST` | `/crm/deals/:id/won` | Marcar como ganho |
| `POST` | `/crm/deals/:id/lost` | Marcar como perdido (requer motivo) |

#### Endpoints — Pipeline

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/crm/pipeline` | Listar stages |
| `POST` | `/crm/pipeline` | Criar stage |
| `PATCH` | `/crm/pipeline/:id` | Atualizar |
| `PATCH` | `/crm/pipeline/reorder` | Reordenar stages |

### 2.4 Frontend

#### Store (`crm.store.ts`)

```typescript
export interface CRMContact {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  cpfCnpj?: string;
  source: 'MANUAL' | 'IMPORT' | 'WEBSITE' | 'WHATSAPP' | 'REFERRAL' | 'COMPANY';
  status: 'LEAD' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATION' | 'ENROLLED' | 'LOST';
  assignedToId?: string;
  studentId?: string;
  companyId?: string;
  tags: string[];
  notes?: string;
  customFields?: Record<string, unknown>;
  lastContactAt?: string;
  // Populated
  assignedToName?: string;
  studentName?: string;
  companyName?: string;
  activitiesCount?: number;
  dealsCount?: number;
  dealsValue?: number;
}

export interface CRMActivity {
  id: string;
  contactId: string;
  type: 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP';
  title: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdById: string;
  createdByName?: string;
  metadata?: Record<string, unknown>;
}

export interface CRMPipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  dealsCount?: number;
  dealsValue?: number;
}

export interface CRMDeal {
  id: string;
  code: string;
  contactId: string;
  stageId: string;
  title: string;
  value: number;
  expectedCloseDate?: string;
  status: 'OPEN' | 'WON' | 'LOST';
  courseId?: string;
  classId?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  notes?: string;
  // Populated
  contactName?: string;
  stageName?: string;
  stageColor?: string;
  courseName?: string;
}
```

#### Componentes UI

| Componente | Descrição |
|-----------|-----------|
| `ContactList` | Tabela filterable (status, source, tags, responsável) |
| `ContactDetailDrawer` | Drawer lateral com dados + timeline de atividades + deals |
| `ContactFormDialog` | Formulário de criação/edição de contato |
| `ActivityTimeline` | Timeline vertical de interações (ícone + hora + descrição) |
| `AddActivityDialog` | Modal para registrar atividade (tipo, título, descrição, agendamento) |
| `PipelineKanban` | Board kanban com drag-and-drop entre stages |
| `DealCard` | Card no kanban (contato, valor, curso, data esperada) |
| `DealFormDialog` | Modal de criação/edição de deal |
| `CRMDashboard` | Métricas: leads por origem, conversão, tempo médio no funil, valor por stage |
| `ImportContactsDialog` | Import CSV/XLSX com mapeamento de colunas |
| `ConvertToStudentDialog` | Modal de conversão contato → aluno |
| `TagInput` | Input de tags com autocomplete |

#### Página `/crm`

Layout com abas:
1. **Contatos** — Lista com filtros + botão "Novo Contato" + "Importar"
2. **Pipeline** — Kanban visual do funil de vendas
3. **Atividades** — Agenda e follow-ups pendentes
4. **Dashboard** — Métricas e gráficos do CRM

### 2.5 Regras de Negócio

| # | Regra | Detalhe |
|---|-------|---------|
| R1 | **Conversão contato → aluno** | Ao marcar deal como WON, opção de criar Student automaticamente com dados do contato |
| R2 | **Funil configurável** | Admin pode criar/editar/reordenar stages do pipeline |
| R3 | **Follow-up automático** | Atividades com `scheduledAt` futuro aparecem como alertas na dashboard |
| R4 | **Histórico completo** | Toda interação gera `CRMActivity` — sem exceção |
| R5 | **Código sequencial** | Contatos: C0001+, Deals: D0001+ |
| R6 | **Vinculação bidirecional** | Contato pode ser vinculado a `Student` e/ou `Company` existente |
| R7 | **Tags livres** | Array de strings, sem vocabulário controlado (flexível) |
| R8 | **Responsável (assignedTo)** | Cada contato tem um User responsável para follow-up |
| R9 | **Dashboard métricas** | Taxa conversão = enrolled / total, Tempo médio = avg dias lead→enrolled |
| R10 | **Importação em massa** | CSV/XLSX com mapeamento de colunas, detecção de duplicatas por email/phone |

---

## 3. Roadmap de Implementação

### Fase 1 — Fundação (Semana 1)

| # | Tarefa | Módulo | Estimativa |
|---|--------|--------|------------|
| 1.1 | Models Prisma + migration | Ambos | 2h |
| 1.2 | Backend certificates (CRUD + issue/revoke) | Certificados | 4h |
| 1.3 | Backend CRM contacts + activities | CRM | 4h |
| 1.4 | Backend CRM pipeline + deals | CRM | 3h |

### Fase 2 — Frontend Core (Semana 2)

| # | Tarefa | Módulo | Estimativa |
|---|--------|--------|------------|
| 2.1 | Stores + services frontend | Ambos | 3h |
| 2.2 | Página `/certificados` + componentes | Certificados | 6h |
| 2.3 | Página `/crm` aba Contatos | CRM | 4h |
| 2.4 | Página `/crm` aba Pipeline (kanban) | CRM | 6h |

### Fase 3 — Features Avançadas (Semana 3)

| # | Tarefa | Módulo | Estimativa |
|---|--------|--------|------------|
| 3.1 | Geração de PDF com templates | Certificados | 8h |
| 3.2 | Verificação pública de certificado | Certificados | 2h |
| 3.3 | CRM Dashboard com gráficos | CRM | 4h |
| 3.4 | Importação CSV/XLSX de contatos | CRM | 3h |
| 3.5 | Conversão contato → aluno | CRM | 2h |

### Fase 4 — Integrações (Semana 4)

| # | Tarefa | Módulo | Estimativa |
|---|--------|--------|------------|
| 4.1 | Auto-emissão pós-conclusão de turma | Certificados | 3h |
| 4.2 | Integração com Central de Vendas (`/vendas`) | CRM | 4h |
| 4.3 | Notificações de follow-up | CRM | 2h |
| 4.4 | Relatórios exportáveis | Ambos | 3h |

**Total estimado**: ~63 horas (~3 semanas com 1 dev)

---

## 4. Relação com Módulos Existentes

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Course     │────▶│  Enrollment  │────▶│ Certificate  │
│ (valididade) │     │  (matrícula) │     │ (emissão)    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    ▼                     │
       │             ┌──────────────┐             │
       │             │   Student    │◀────────────┘
       │             └──────────────┘
       │                    ▲
       │                    │ (conversão)
       │             ┌──────────────┐
       └────────────▶│ CRM Contact  │
                     │  (funil)     │
                     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌────────────┐ ┌──────────┐ ┌──────────────┐
       │ CRM Deal   │ │ Activity │ │  Company     │
       │(oportunid.)│ │(histórico)│ │ (vinculação) │
       └────────────┘ └──────────┘ └──────────────┘
              │
              ▼
       ┌────────────────┐
       │Pipeline Stage  │
       │ (funil visual) │
       └────────────────┘
```

### Mapa de Foreign Keys

| Model Novo | FK Para | Tipo | Obrigatório |
|-----------|---------|------|-------------|
| `Certificate` | `Enrollment` | 1:1 | ✅ |
| `Certificate` | `Student` | N:1 | ✅ |
| `Certificate` | `Course` | N:1 | ✅ |
| `Certificate` | `User` (emissor) | N:1 | ❌ |
| `Certificate` | `CertificateTemplate` | N:1 | ❌ |
| `CRMContact` | `User` (responsável) | N:1 | ❌ |
| `CRMContact` | `Student` | 1:1 | ❌ |
| `CRMContact` | `Company` | N:1 | ❌ |
| `CRMActivity` | `CRMContact` | N:1 | ✅ |
| `CRMActivity` | `User` (autor) | N:1 | ✅ |
| `CRMDeal` | `CRMContact` | N:1 | ✅ |
| `CRMDeal` | `CRMPipelineStage` | N:1 | ✅ |

---

> **Próximos passos**: Implementar Fase 1 (models Prisma) e Fase 2 (frontend stores/services/pages).
