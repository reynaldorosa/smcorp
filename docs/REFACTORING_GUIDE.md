# 🔧 Guia de Refatoração - Arquivos Grandes

## Objetivo
Este documento lista todos os arquivos com mais de 500 linhas que precisam ser refatorados em arquivos menores antes da migração final.

---

## 📊 Arquivos para Refatorar (ordenados por tamanho)

| # | Arquivo | Linhas | Prioridade | Status |
|---|---------|--------|------------|--------|
| 1 | `SMCorpContext.tsx` | 4.270 | 🔴 CRÍTICO | ⬜ Pendente |
| 2 | `Modulo00.tsx` | 3.364 | 🔴 CRÍTICO | ⬜ Pendente |
| 3 | `Modulo08.tsx` | 3.042 | 🔴 CRÍTICO | ⬜ Pendente |
| 4 | `CardAluno.tsx` | 2.167 | 🔴 CRÍTICO | ⬜ Pendente |
| 5 | `Modulo07.tsx` | 1.984 | 🟡 ALTO | ⬜ Pendente |
| 6 | `Modulo03.tsx` | 1.637 | 🟡 ALTO | ⬜ Pendente |
| 7 | `Modulo05.tsx` | 1.204 | 🟡 ALTO | ⬜ Pendente |
| 8 | `Modulo02.tsx` | 875 | 🟡 MÉDIO | ⬜ Pendente |
| 9 | `Modulo01.tsx` | 785 | 🟡 MÉDIO | ⬜ Pendente |
| 10 | `DialogPagamento.tsx` | 745 | 🟡 MÉDIO | ⬜ Pendente |
| 11 | `DialogRelatorioTurma.tsx` | 726 | 🟡 MÉDIO | ⬜ Pendente |
| 12 | `Modulo09.tsx` | 713 | 🟡 MÉDIO | ⬜ Pendente |
| 13 | `sidebar.tsx` | 672 | 🟢 BAIXO | ⬜ Pendente |
| 14 | `PaginaMatriculaAluno.tsx` | 608 | 🟢 BAIXO | ⬜ Pendente |
| 15 | `DialogEditarClientePJ.tsx` | 578 | 🟢 BAIXO | ⬜ Pendente |
| 16 | `CardLoteModulo08.tsx` | 568 | 🟢 BAIXO | ⬜ Pendente |
| 17 | `DialogPrecificacoesEmpresa.tsx` | 518 | 🟢 BAIXO | ⬜ Pendente |
| 18 | `Modulo06Detalhado.tsx` | 509 | 🟢 BAIXO | ⬜ Pendente |

**Total: ~24.000 linhas para refatorar**

---

## 📋 Instruções de Refatoração

### Regra Geral
- **Máximo 400 linhas por arquivo**
- Cada componente deve ter responsabilidade única
- Extrair hooks customizados quando lógica for complexa
- Mover tipos para `@/types/smcorp.types.ts`

---

## 1️⃣ SMCorpContext.tsx (4.270 linhas) → JÁ FEITO ✅

O Context foi dividido em Zustand stores:
- `settings.store.ts` - Configurações e infraestrutura
- `courses.store.ts` - Cursos
- `classes.store.ts` - Turmas
- `students.store.ts` - Alunos
- `instructors.store.ts` - Instrutores
- `companies.store.ts` - Empresas (PJ)
- `costs.store.ts` - Custos e financeiro

---

## 2️⃣ Modulo00.tsx (3.364 linhas) - Infraestrutura

### Dividir em:
```
src/components/modules/settings/
├── SettingsPage.tsx              # Página principal (layout + tabs)
├── tabs/
│   ├── InstitutionalDataTab.tsx  # Dados institucionais
│   ├── RoomsTab.tsx              # Gestão de salas
│   ├── UsersTab.tsx              # Gestão de usuários
│   ├── CompaniesTab.tsx          # Gestão de empresas PJ
│   ├── SuppliersTab.tsx          # Fornecedores
│   ├── InstructorsTab.tsx        # Instrutores
│   ├── CostsTab.tsx              # Custos auditáveis
│   ├── CostCriteriaTab.tsx       # Critérios de custo
│   ├── ProductsTab.tsx           # Produtos extras
│   ├── EmailConfigTab.tsx        # Config de email
│   └── WhatsAppConfigTab.tsx     # Config WhatsApp
├── forms/
│   ├── RoomForm.tsx
│   ├── UserForm.tsx
│   ├── SupplierForm.tsx
│   └── CostForm.tsx
└── hooks/
    └── useSettingsData.ts        # Hook para carregar dados
```

---

## 3️⃣ Modulo08.tsx (3.042 linhas) - Fluxo Financeiro

### Dividir em:
```
src/components/modules/financial/
├── FinancialPage.tsx             # Página principal
├── tabs/
│   ├── CostEntriesTab.tsx        # Lançamentos de custo
│   ├── PaymentsTab.tsx           # Pagamentos
│   ├── ReportsTab.tsx            # Relatórios
│   └── BatchOperationsTab.tsx    # Operações em lote
├── components/
│   ├── CostEntryCard.tsx
│   ├── PaymentCard.tsx
│   ├── FinancialSummary.tsx
│   └── DateRangeFilter.tsx
├── dialogs/
│   ├── NewCostEntryDialog.tsx
│   └── ConfirmPaymentDialog.tsx
└── hooks/
    ├── useFinancialData.ts
    └── useFinancialFilters.ts
```

---

## 4️⃣ CardAluno.tsx (2.167 linhas)

### Dividir em:
```
src/components/cards/student/
├── StudentCard.tsx               # Card principal (container)
├── sections/
│   ├── StudentHeader.tsx         # Foto, nome, código
│   ├── StudentStatus.tsx         # Status (link, docs, prova)
│   ├── StudentPayments.tsx       # Histórico de pagamentos
│   ├── StudentDocuments.tsx      # Lista de documentos
│   ├── StudentExams.tsx          # Provas agendadas
│   └── StudentActions.tsx        # Botões de ação
├── dialogs/
│   ├── EditStudentDialog.tsx
│   ├── PaymentDialog.tsx
│   └── DocumentDialog.tsx
└── hooks/
    └── useStudentCard.ts
```

---

## 5️⃣ Modulo07.tsx (1.984 linhas) - Gestão de Pagamentos

### Dividir em:
```
src/components/modules/payments/
├── PaymentsPage.tsx
├── components/
│   ├── PaymentsList.tsx
│   ├── PaymentFilters.tsx
│   ├── PaymentSummary.tsx
│   └── PendingApprovalsList.tsx
├── dialogs/
│   ├── ApprovePaymentDialog.tsx
│   ├── BatchApprovalDialog.tsx
│   └── PaymentDetailsDialog.tsx
└── hooks/
    └── usePaymentsData.ts
```

---

## 6️⃣ Modulo03.tsx (1.637 linhas) - Dashboard Operacional

### Dividir em:
```
src/components/modules/operational/
├── OperationalPage.tsx
├── components/
│   ├── ClassesList.tsx
│   ├── StudentsTable.tsx
│   ├── StatusFilters.tsx
│   ├── QuickActions.tsx
│   └── OperationalStats.tsx
└── hooks/
    └── useOperationalData.ts
```

---

## 7️⃣ Modulo05.tsx (1.204 linhas) - Área Cliente PJ

### Dividir em:
```
src/components/modules/client-pj/
├── ClientPJPage.tsx
├── components/
│   ├── CompanySelector.tsx
│   ├── EnrollmentsList.tsx
│   ├── PricingTable.tsx
│   └── AccessManagement.tsx
└── dialogs/
    ├── NewEnrollmentDialog.tsx
    └── EditPricingDialog.tsx
```

---

## 📝 Padrão de Refatoração

### Para cada arquivo grande:

1. **Identificar seções lógicas** (tabs, seções de UI, funcionalidades)
2. **Extrair componentes** menores (máx 400 linhas)
3. **Criar hooks customizados** para lógica complexa
4. **Mover tipos** para `@/types/smcorp.types.ts`
5. **Substituir Context** por Zustand stores
6. **Atualizar imports** para padrão Next.js

### Template de Componente Refatorado:

```tsx
'use client';

import { useState } from 'react';
import { useXxxStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// ... outros imports

interface ComponentProps {
  // props tipadas
}

export function ComponentName({ ...props }: ComponentProps) {
  // hooks do zustand
  const { data, actions } = useXxxStore();
  
  // estado local mínimo
  const [localState, setLocalState] = useState();
  
  // handlers
  const handleAction = () => {
    // lógica
  };
  
  return (
    <div>
      {/* JSX limpo e organizado */}
    </div>
  );
}
```

---

## 🚀 Ordem de Execução

1. ✅ **SMCorpContext** → Zustand stores (FEITO)
2. ⬜ **Modulo00** → settings/ (próximo)
3. ⬜ **Modulo08** → financial/
4. ⬜ **CardAluno** → cards/student/
5. ⬜ **Demais módulos** por ordem de linhas

---

## 📁 Estrutura Final Esperada

```
frontend/src/components/
├── ui/                    # shadcn/ui (não mexer)
├── layout/                # Header, Sidebar (já existe)
├── cards/
│   ├── student/
│   ├── instructor/
│   └── cost/
├── dialogs/
│   ├── student/
│   ├── payment/
│   ├── document/
│   └── company/
├── forms/
│   ├── student/
│   ├── course/
│   └── enrollment/
└── modules/
    ├── dashboard/         # Modulo09
    ├── settings/          # Modulo00
    ├── courses/           # Modulo01
    ├── classes/           # Modulo02
    ├── operational/       # Modulo03
    ├── sales/             # Modulo04
    ├── client-pj/         # Modulo05
    ├── documents/         # Modulo06
    ├── payments/          # Modulo07
    └── financial/         # Modulo08
```

---

## ⚠️ Notas Importantes

1. **Não modificar** os arquivos originais em `portalsmcorpfigma/`
2. **Criar** os novos arquivos em `frontend/src/components/`
3. **Testar** cada componente isoladamente
4. **Marcar** como concluído neste documento após refatorar
5. **Manter** funcionalidade idêntica ao original

---

*Criado em: 04/02/2026*
*Atualizado por: Migração Automatizada*
