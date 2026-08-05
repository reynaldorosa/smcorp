# Migração de Persistência para API — 12/02/2026

## Objetivo
Eliminar dependência de persistência local como fonte de verdade nos módulos críticos e garantir gravação em banco de dados via API.

## Correções aplicadas nesta fase

### 1) Remoção de persist local (domínios críticos)
- `frontend/src/stores/costs.store.ts`
- `frontend/src/stores/students.store.ts`
- `frontend/src/stores/classes.store.ts`
- `frontend/src/stores/exams.store.ts`

A chamada `persist(...)` foi removida desses 4 stores. Agora o estado é de memória/UI.

### 2) Custos (M08) com persistência em banco
- Modelo/tabela de lançamentos criada no backend (`cost_entries`)
- Endpoints CRUD de lançamentos de custo expostos
- Store de custos com sincronização automática (`create/update/delete/pay/cancel`) para backend

Arquivos principais:
- `backend/prisma/schema.prisma`
- `backend/src/modules/costs/costs.controller.ts`
- `backend/src/modules/costs/costs.service.ts`
- `frontend/src/services/costs.service.ts`
- `frontend/src/stores/costs.store.ts`

### 3) Provas (exams) com hidratação 100% API
Foi concluído o fechamento do gap de contrato operacional com endpoint agregado no backend e hidratação API-first no store:
- criação de prova no backend para alunos com `enrollmentId`
- atualização/cancelamento no backend para provas já sincronizadas
- listagem agregada operacional via API (`GET /exams/operational`) para hidratação completa

Arquivos:
- `frontend/src/services/exams.service.ts` (novo)
- `frontend/src/stores/exams.store.ts`
- `frontend/src/components/operational/operational-dashboard.tsx`
- `backend/src/modules/exams/exams.controller.ts`
- `backend/src/modules/exams/exams.service.ts`

## Estado atual por domínio

### Costs
- Situação: **persistência em banco ativa**
- Fonte de verdade: backend

### Students
- Situação: **sem persist local**
- Fonte de verdade: hidratação por API nas telas

### Classes
- Situação: **sem persist local**
- Fonte de verdade: hidratação por API nas telas

### Exams
- Situação: **API-first com hidratação operacional ativa**
- Fonte de verdade: backend (`schedule/update/delete/list operational`)

## Limitação conhecida (exams)
Não há bloqueio técnico de hidratação operacional. O ponto de atenção restante é evoluir o contrato para refletir explicitamente estados avançados de prova (ex.: `IN_PROGRESS`, `APPROVED`, `FAILED`) caso essas visões passem a ser exigidas no fluxo operacional agregado.

## Próximos passos recomendados
1. Evoluir contrato agregado de provas para cenários de status avançado, se necessário ao produto.
2. Migrar stores secundárias ainda com persist local (`courses`, `companies`, `crm`, `certificates`, `settings`, `auth`) conforme prioridade de negócio.

## Verificação executada
- Checagem de erros dos arquivos alterados: sem erros reportados.
- Build backend: concluído com sucesso.
