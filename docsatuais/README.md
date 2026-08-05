# 🏢 SMCORP - Sistema de Gestão de Treinamentos

> Sistema SaaS para gerenciamento de centros de treinamento offshore

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Development-yellow.svg)

---

## 📋 Sobre o Projeto

SMCORP é uma plataforma completa para gestão de centros de treinamento especializados em:

- 🔧 **Treinamentos Offshore** (NR-35)
- 🧗 **Escalada e Acesso por Corda**
- 🔥 **Soldagem e Caldeiraria**
- 🎨 **Pintura Industrial**

### Funcionalidades Principais

- 📊 **Dashboard Executivo** - Visão estratégica em tempo real
- 🏗️ **Infraestrutura** - Gestão de salas e equipamentos
- 📚 **Catálogo de Cursos** - CRUD completo de cursos
- 📅 **Abertura de Turmas** - Criação e gestão de turmas
- 💰 **Sistema Financeiro** - Fluxo de caixa completo
- 📄 **Validação de Documentos** - Certificados e comprovantes
- 👤 **Área do Cliente** - Portal self-service

---

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone <repository-url>
cd PORTALSMCORP

# 2. Copie o arquivo de ambiente
cp .env.example .env

# 3. Suba os containers
docker compose up -d

# 4. Acesse a aplicação
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Adminer:  http://localhost:8080
```

### Credenciais Padrão

| Serviço | Usuário | Senha |
|---------|---------|-------|
| Database | smcorp | smcorp123 |
| Admin (após seed) | admin@smcorp.com.br | Admin@123 |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      NGINX (443/80)                     │
│                    Reverse Proxy + SSL                  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌───────────────┐
│   Frontend    │           │    Backend    │
│   Next.js     │◄─────────►│    NestJS     │
│   :3000       │   REST    │    :3001      │
└───────────────┘           └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  PostgreSQL   │
                            │    :5432      │
                            └───────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma, Zod |
| Database | PostgreSQL 16 |
| Infra | Docker, Nginx, Certbot |

---

## 📁 Estrutura de Pastas

```
PORTALSMCORP/
├── backend/              # API NestJS
│   ├── prisma/           # Schema e migrations
│   └── src/
│       ├── common/       # Shared utilities
│       ├── config/       # Configurations
│       ├── prisma/       # Prisma module
│       └── modules/      # Feature modules
│
├── frontend/             # App Next.js
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities
│       ├── services/     # API clients
│       ├── stores/       # Zustand stores
│       └── types/        # TypeScript types
│
├── shared/               # Shared types
├── docs/                 # Documentation
├── nginx/                # Nginx configs
│
├── docker-compose.yml    # Development
├── docker-compose.prod.yml # Production
├── .env.example          # Environment template
└── README.md
```

---

## 🔧 Comandos Úteis

### Docker

```bash
# Subir ambiente
docker compose up -d

# Ver logs
docker compose logs -f backend

# Reiniciar serviço
docker compose restart backend

# Parar tudo
docker compose down

# Limpar volumes (⚠️ apaga dados)
docker compose down -v
```

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:cov

# Prisma
npx prisma migrate dev      # Criar migration
npx prisma generate         # Gerar client
npx prisma studio           # Interface visual
npx prisma db seed          # Rodar seeds
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 🔐 Níveis de Acesso

| Role | Descrição | Permissões |
|------|-----------|------------|
| `ADMIN` | Administrador | Acesso total |
| `COLLABORATOR` | Colaborador | Operacional |
| `CLIENT_PF` | Pessoa Física | Área do cliente |
| `CLIENT_PJ` | Pessoa Jurídica | Área do cliente + funcionários |
| `CLIENT_MOV` | Cliente Mobile | Acesso limitado |

---

## 📚 Documentação

- [REASONER.md](./REASONER.md) - Regras e padrões do projeto
- [PROJECT.SPECS.md](./PROJECT.SPECS.md) - Especificações técnicas
- [API Docs](http://localhost:3001/api/docs) - Swagger (após subir backend)

---

## 🧪 Testes

```bash
# Backend - Unitários
cd backend && npm run test

# Backend - Cobertura
cd backend && npm run test:cov

# Frontend - Unitários
cd frontend && npm run test

# E2E (futuro)
npm run test:e2e
```

**Cobertura mínima exigida:** 90%

---

## 🚢 Deploy (VPS)

```bash
# 1. Configurar .env com valores de produção
cp .env.example .env
nano .env

# 2. Build e deploy
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verificar status
docker compose -f docker-compose.prod.yml ps

# 4. Configurar SSL (primeira vez)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d seudominio.com.br
```

---

## 📝 Changelog

### v1.0.0 (Em desenvolvimento)
- 🎉 Estrutura inicial do projeto
- 🔐 Sistema de autenticação
- 📊 Dashboard Executivo (em progresso)

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 👥 Equipe

- **Product Owner:** -
- **Tech Lead:** -
- **Desenvolvimento:** Em definição

---

**SMCORP © 2026** - Todos os direitos reservados
