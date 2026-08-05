# 🧠 REASONER — SPECIFICATION FILE

Este documento define as regras obrigatórias para geração de código, arquitetura e decisões técnicas do projeto.

---

## 1. OBJETIVO
Criar um sistema com:
- Baixo custo operacional
- Alta qualidade técnica
- Arquitetura limpa
- Segurança por padrão

---

## 2. STACK PERMITIDA

### Frontend (obrigatório)
- TypeScript
- React OU Next.js

### Backend (escolher uma opção)
- Opção A: NestJS (Node + TypeScript)
- Opção B: FastAPI (Python)

🚫 Frameworks proibidos:
- Django
- Qualquer framework não listado acima

---

## 3. IDIOMA DO CÓDIGO (OBRIGATÓRIO)

Todo o código deve ser escrito em **INGLÊS**:
- Variáveis
- Funções
- Classes
- Arquivos
- Componentes
- DTOs
- Schemas
- Tabelas e colunas

📌 Somente textos da interface (labels, mensagens, títulos) podem estar em português.

🚫 É proibido misturar idiomas no mesmo identificador.

---

## 4. PADRÃO DE VALIDAÇÃO (OBRIGATÓRIO)

Nenhuma entrada de dados pode ser aceita sem validação explícita.

### Frontend
- Zod (ou equivalente)

### Backend
- NestJS: Zod (ou equivalente)
- FastAPI: Pydantic

🚫 Nenhuma rota, serviço ou função pode receber dados sem schema definido.

---

## 5. PADRÃO DE ARQUITETURA

### Backend
- Controllers
- Services
- Modules
- DTOs / Schemas

### Frontend
- API Layer (clients/services)
- State Layer (Zustand, Redux ou Context API)
- UI Layer (components/pages)

📌 Regra:
Nenhuma lógica de negócio pode existir em:
- Controllers
- Rotas
- Componentes de UI

---

## 6. CONTRATO DE API

Toda API deve:
- Retornar JSON padronizado
- Possuir contrato formal (OpenAPI/Swagger ou GraphQL Schema)
- Ter exemplos de request/response no README
- Seguir REST ou GraphQL
- Usar versionamento (/api/v1)
- Não retornar estruturas implícitas

### Exemplo:

POST /api/v1/auth/login

Request:
```json
{ "email": "string", "password": "string" }
Response 200:

json
Copiar código
{
  "token": "string",
  "refreshToken": "string",
  "user": { "id": "string", "email": "string", "name": "string" }
}
Response 401:

json
Copiar código
{ "error": "Invalid credentials" }
7. SEGURANÇA (OBRIGATÓRIO)
Todo sistema deve implementar:

JWT com Refresh Token

Hash de senha (bcrypt ou argon2)

Rate limiting (IP e usuário)

CORS restritivo

Helmet (NestJS) ou middleware equivalente

Proteção contra SQL Injection, XSS e CSRF

Validação rigorosa de payloads

Variáveis sensíveis apenas em .env

🚫 Nenhum segredo pode ser hardcoded.

8. BANCO DE DADOS
Banco padrão:

PostgreSQL

ORM (escolher um):

NestJS: Prisma (preferencial) ou TypeORM

FastAPI: SQLAlchemy ou SQLModel

🚫 É proibido misturar ORMs.

Estrutura mínima:
id (UUID ou serial)

created_at

updated_at

deleted_at (opcional)

✔ Migrações obrigatórias

9. CRITÉRIOS DE QUALIDADE
O sistema deve:

Rodar via Docker Compose

Ter serviços separados (app, db, redis se necessário)

Ter scripts: dev, build, start, prod

Ter README completo

Ter lint e format automático

TypeScript: ESLint + Prettier

Python: Ruff + Black

Logging estruturado

Endpoint /health

Separação estrita de responsabilidades

10. PADRÃO DE NAMING (OBRIGATÓRIO)
Código
Variáveis e funções: camelCase

Classes: PascalCase

Constantes: UPPER_SNAKE_CASE

Arquivos: kebab-case

Backend
Controllers: PascalCaseController

Services: PascalCaseService

DTOs: PascalCaseDto

Modules: PascalCaseModule

Banco
Tabelas: snake_case (singular)

Colunas: snake_case

Foreign Keys: <entity>_id

Frontend
Components: PascalCase

Hooks: useSomething

API clients: camelCase

11. TESTES E COBERTURA (OBRIGATÓRIO)
Tipos
Unitários: services, validation, business logic

Integração: controllers, database, auth

E2E: login → protected action → logout

Segurança: JWT inválido, rate limit, payload malicioso

Ferramentas
TS: Jest ou Vitest

Python: pytest

E2E Frontend: Playwright ou Cypress

E2E Backend: Supertest ou HTTPX

📊 Cobertura mínima: 90% (lines + branches)
🚫 Build deve falhar se cobertura < 90%

12. REGRA DE FALHA (OBRIGATÓRIO)
Se alguma regra não puder ser cumprida:

A IA deve explicar claramente o motivo

NÃO gerar código parcial

NÃO improvisar fora do padrão

Qualquer violação destas regras é erro grave.

13. ARQUIVO DE SAÍDA
A IA deve gerar:

REASONER.md ou PROJECT.SPECS.md

E utilizar recursos do MCP DeepSeek sempre que disponíveis.