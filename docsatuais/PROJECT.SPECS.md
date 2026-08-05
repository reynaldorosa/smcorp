# 📋 PROJECT.SPECS — Especificações Técnicas do Projeto

> **Projeto:** SMCORP - Sistema de Gestão de Treinamentos Offshore  
> **Versão:** 1.0.0  
> **Data:** 03/02/2026

---

## 1. Visão Geral

### 1.1 Descrição
Sistema SaaS para gerenciamento completo de centros de treinamento offshore, incluindo:
- Gestão de alunos e empresas
- Catálogo de cursos (NR-35, soldagem, pintura, etc.)
- Abertura e controle de turmas
- Fluxo financeiro completo
- Validação de documentos e certificados
- Dashboards executivo e operacional

### 1.2 Público-Alvo
- Centros de treinamento offshore
- Empresas de capacitação industrial
- Organizações que oferecem cursos regulatórios

---

## 2. Requisitos Funcionais

### 2.1 Dashboard Executivo

#### RF-001: Cards de Métricas Principais
- **Total de Alunos:** Contagem total e ativos
- **Fluxo de Caixa:** Receitas - Despesas
- **Taxa de Ocupação:** % de vagas preenchidas
- **Empresas Parceiras:** Total cadastradas

#### RF-002: Sub-aba Alunos
- Distribuição por status (Agendado, Confirmar, Confirmado, Presente)
- Gráfico de tendência de matrículas
- Top empresas por número de alunos

#### RF-003: Sub-aba Financeiro
- Receitas x Despesas (gráfico)
- Pagamentos pendentes
- Pagamentos em atraso
- Projeção mensal

#### RF-004: Sub-aba Operacional
- Turmas ativas vs total
- Salas disponíveis
- Cursos ativos
- Produtos extras
- Taxa de ocupação por sala

#### RF-005: Sub-aba Custos
- Custos por categoria
- Custos fixos vs variáveis
- Tendência de custos

### 2.2 Autenticação e Autorização

#### RF-010: Login
- Login com e-mail e senha
- JWT com expiração de 15 minutos
- Refresh token com expiração de 7 dias

#### RF-011: Níveis de Acesso
- ADMIN: Acesso total
- COLLABORATOR: Operacional
- CLIENT_PF: Área do cliente (pessoa física)
- CLIENT_PJ: Área do cliente (pessoa jurídica)
- CLIENT_MOV: Acesso mobile

#### RF-012: Recuperação de Senha
- Envio de e-mail com link
- Token expira em 1 hora
- Histórico de alterações

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance
| Métrica | Requisito |
|---------|-----------|
| Tempo de resposta API | < 200ms (p95) |
| Tempo de carregamento página | < 3s |
| Consultas ao banco | < 100ms |

### 3.2 Segurança
| Requisito | Implementação |
|-----------|--------------|
| Autenticação | JWT + Refresh Token |
| Senha | bcrypt (12 rounds) |
| Rate Limiting | 100 req/min por IP |
| HTTPS | Obrigatório em produção |

### 3.3 Disponibilidade
- SLA: 99.5%
- Backup diário do banco
- Monitoramento 24/7 (futuro)

### 3.4 Escalabilidade
- Suportar 1000 usuários simultâneos
- Suportar 100.000 registros por tabela
- Preparado para horizontal scaling (futuro)

---

## 4. Modelo de Dados

### 4.0 Status do Banco de Dados

```
✅ 8 migrations aplicadas
✅ Schema sincronizado com backend e frontend
✅ Prisma Client gerado e funcional
✅ Seed completo disponível (popula todas entidades)
```

**Última verificação:** 04/02/2026

### 4.1 Arquitetura de Sincronização

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    13 Services                            │   │
│  │  auth, users, students, classes, courses, rooms,         │   │
│  │  instructors, suppliers, extra-products, dashboard,      │   │
│  │  companies, costs, operations                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST (106 endpoints)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    18 Modules                             │   │
│  │  auth, users, students, classes, courses, rooms,         │   │
│  │  instructors, suppliers, extra-products, dashboard,      │   │
│  │  companies, company-settings, costs, enrollments,        │   │
│  │  exams, payments, student-documents, health              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    18 Models                              │   │
│  │  User, Company, CompanySettings, Student, Course,        │   │
│  │  Room, Class, Enrollment, Payment, Cost, ExtraProduct,   │   │
│  │  Supplier, Instructor, CourseCost, StudentDocument,      │   │
│  │  Exam, EnrollmentExtraProduct, AuditLog                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Mapeamento Completo: Database ↔ Backend ↔ Frontend

| # | Model (Prisma) | Tabela | Módulo Backend | Service Frontend | Status |
|---|----------------|--------|----------------|------------------|--------|
| 1 | `User` | users | users/ | users.service.ts | ✅ |
| 2 | `Company` | companies | companies/ | companies.service.ts | ✅ |
| 3 | `CompanySettings` | company_settings | company-settings/ | companies.service.ts | ✅ |
| 4 | `Student` | students | students/ | students.service.ts | ✅ |
| 5 | `Course` | courses | courses/ | courses.service.ts | ✅ |
| 6 | `Room` | rooms | rooms/ | rooms.service.ts | ✅ |
| 7 | `Class` | classes | classes/ | classes.service.ts | ✅ |
| 8 | `Enrollment` | enrollments | enrollments/ | operations.service.ts | ✅ |
| 9 | `Payment` | payments | payments/ | operations.service.ts | ✅ |
| 10 | `Cost` | costs | costs/ | costs.service.ts | ✅ |
| 11 | `ExtraProduct` | extra_products | extra-products/ | extra-products.service.ts | ✅ |
| 12 | `Supplier` | suppliers | suppliers/ | suppliers.service.ts | ✅ |
| 13 | `Instructor` | instructors | instructors/ | instructors.service.ts | ✅ |
| 14 | `CourseCost` | course_costs | costs/ (nested) | costs.service.ts | ✅ |
| 15 | `StudentDocument` | student_documents | student-documents/ | operations.service.ts | ✅ |
| 16 | `Exam` | exams | exams/ | operations.service.ts | ✅ |
| 17 | `EnrollmentExtraProduct` | enrollment_extra_products | enrollments/ (nested) | operations.service.ts | ✅ |
| 18 | `AuditLog` | audit_logs | Interceptor automático | N/A (interno) | ✅ |

### 4.3 Entidades Principais (Diagrama Atualizado)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Company   │     │   Student   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ email       │     │ name        │     │ name        │
│ password    │     │ cnpj        │     │ cpf         │
│ name        │     │ email       │     │ email       │
│ role        │     │ phone       │     │ phone       │
│ isActive    │     │ address     │     │ companyId   │◄──┐
│ createdAt   │     │ createdAt   │     │ createdAt   │   │
└─────────────┘     └──────┬──────┘     └─────────────┘   │
                           │                              │
                           └──────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Course    │     │    Room     │     │    Class    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ name        │     │ name        │     │ code        │
│ code        │     │ code        │     │ courseId    │◄──┐
│ duration    │     │ capacity    │     │ roomId      │◄──┤
│ price       │     │ location    │     │ startDate   │   │
│ validity    │     │ createdAt   │     │ endDate     │   │
│ createdAt   │     └──────┬──────┘     │ maxStudents │   │
└──────┬──────┘            │            │ status      │   │
       │                   │            │ createdAt   │   │
       └───────────────────┴────────────┴─────────────┘   │
                                                          │
┌─────────────┐     ┌─────────────┐                      │
│ Enrollment  │     │   Payment   │                      │
├─────────────┤     ├─────────────┤                      │
│ id          │     │ id          │                      │
│ studentId   │     │ enrollmentId│                      │
│ classId     │◄────┤ companyId   │                      │
│ status      │     │ amount      │                      │
│ enrolledAt  │     │ type        │                      │
│ createdAt   │     │ status      │                      │
└─────────────┘     │ createdAt   │                      │
                    └─────────────┘                      │
                                                         │
┌─────────────┐     ┌─────────────┐                      │
│    Cost     │     │ExtraProduct │                      │
├─────────────┤     ├─────────────┤                      │
│ id          │     │ id          │                      │
│ category    │     │ name        │                      │
│ description │     │ price       │                      │
│ amount      │     │ stock       │                      │
│ period      │     │ isActive    │                      │
│ createdAt   │     │ createdAt   │                      │
└─────────────┘     └─────────────┘                      │
```

### 4.2 Enums

```typescript
// Roles de usuário
enum UserRole {
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
  CLIENT_PF = 'CLIENT_PF',
  CLIENT_PJ = 'CLIENT_PJ',
  CLIENT_MOV = 'CLIENT_MOV',
}

// Status de matrícula
enum EnrollmentStatus {
  SCHEDULED = 'SCHEDULED',     // Agendado
  TO_CONFIRM = 'TO_CONFIRM',   // Confirmar
  CONFIRMED = 'CONFIRMED',     // Confirmado
  PRESENT = 'PRESENT',         // Presente
  ABSENT = 'ABSENT',           // Ausente
  CANCELLED = 'CANCELLED',     // Cancelado
}

// Status de turma
enum ClassStatus {
  SCHEDULED = 'SCHEDULED',     // Agendada
  IN_PROGRESS = 'IN_PROGRESS', // Em andamento
  COMPLETED = 'COMPLETED',     // Concluída
  CANCELLED = 'CANCELLED',     // Cancelada
}

// Tipo de pagamento
enum PaymentType {
  INCOME = 'INCOME',           // Receita
  EXPENSE = 'EXPENSE',         // Despesa
}

// Status de pagamento
enum PaymentStatus {
  PENDING = 'PENDING',         // Pendente
  PAID = 'PAID',               // Pago
  OVERDUE = 'OVERDUE',         // Atrasado
  CANCELLED = 'CANCELLED',     // Cancelado
}
```

---

## 5. API Endpoints

### 5.1 Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Registro (admin only) |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/forgot-password` | Solicitar reset |
| POST | `/api/v1/auth/reset-password` | Resetar senha |

### 5.2 Dashboard

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/dashboard/summary` | Cards principais |
| GET | `/api/v1/dashboard/students` | Aba alunos |
| GET | `/api/v1/dashboard/financial` | Aba financeiro |
| GET | `/api/v1/dashboard/operational` | Aba operacional |
| GET | `/api/v1/dashboard/costs` | Aba custos |

### 5.3 Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/users` | Listar usuários |
| GET | `/api/v1/users/:id` | Buscar por ID |
| POST | `/api/v1/users` | Criar usuário |
| PATCH | `/api/v1/users/:id` | Atualizar |
| DELETE | `/api/v1/users/:id` | Soft delete |

### 5.4 Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do serviço |
| GET | `/health/db` | Status do banco |

---

## 6. Estrutura de Pastas

### 6.1 Raiz do Projeto

```
PORTALSMCORP/
├── 📄 README.md
├── 📄 REASONER.md
├── 📄 PROJECT.SPECS.md
├── 📄 docker-compose.yml
├── 📄 docker-compose.prod.yml
├── 📄 .env.example
├── 📄 .gitignore
│
├── 📁 backend/
│   ├── 📄 Dockerfile
│   ├── 📄 Dockerfile.prod
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 nest-cli.json
│   ├── 📁 prisma/
│   │   ├── 📄 schema.prisma
│   │   └── 📁 migrations/
│   ├── 📁 src/
│   │   ├── 📄 main.ts
│   │   ├── 📄 app.module.ts
│   │   ├── 📁 common/
│   │   ├── 📁 config/
│   │   ├── 📁 prisma/
│   │   └── 📁 modules/
│   └── 📁 test/
│
├── 📁 frontend/
│   ├── 📄 Dockerfile
│   ├── 📄 Dockerfile.prod
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 next.config.js
│   ├── 📄 tailwind.config.ts
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   ├── 📁 components/
│   │   ├── 📁 hooks/
│   │   ├── 📁 lib/
│   │   ├── 📁 services/
│   │   ├── 📁 stores/
│   │   └── 📁 types/
│   └── 📁 public/
│
├── 📁 shared/
│   └── 📁 types/
│
├── 📁 docs/
│   └── 📁 api/
│
└── 📁 nginx/
    └── 📄 nginx.conf
```

---

## 7. Variáveis de Ambiente

### 7.1 Backend

```env
# Aplicação
NODE_ENV=development
PORT=3001

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/smcorp_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 7.2 Frontend

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App
NEXT_PUBLIC_APP_NAME=SMCORP
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 8. Deploy

### 8.1 Desenvolvimento Local

```bash
# Clonar repositório
git clone <repo-url>
cd PORTALSMCORP

# Copiar variáveis de ambiente
cp .env.example .env

# Subir containers
docker compose up -d

# Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Adminer: http://localhost:8080
```

### 8.2 Produção (VPS)

```bash
# Configurar .env com valores de produção
# Usar docker-compose.prod.yml

docker compose -f docker-compose.prod.yml up -d

# Configurar SSL com Certbot
# Configurar Nginx como reverse proxy
```

---

## 9. Cronograma de Fases

| Fase | Descrição | Duração Estimada | Status |
|------|-----------|------------------|--------|
| 1 | Fundação + Auth | 1 semana | 🔄 Em andamento |
| 2 | Dashboard Executivo | 2 semanas | ⏳ Aguardando |
| 3 | Catálogo + Turmas | 2 semanas | ⏳ Aguardando |
| 4 | Sistema de Vendas | 2 semanas | ⏳ Aguardando |
| 5 | Financeiro | 2 semanas | ⏳ Aguardando |
| 6 | Documentos | 1 semana | ⏳ Aguardando |
| 7 | Área do Cliente | 1 semana | ⏳ Aguardando |
| 8 | Infraestrutura | 1 semana | ⏳ Aguardando |
| 9 | Refinamentos + Deploy | 1 semana | ⏳ Aguardando |

**Total Estimado:** 13 semanas (~3 meses)

---

## 10. Contatos e Responsáveis

| Função | Nome | Contato |
|--------|------|---------|
| Product Owner | - | - |
| Tech Lead | - | - |
| Backend | - | - |
| Frontend | - | - |

---

**Última atualização:** 03/02/2026  
**Versão do documento:** 1.0.0
