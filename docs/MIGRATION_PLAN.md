# 🚀 Plano de Migração: Figma → Frontend Estruturado

## Resumo Executivo

Migração do frontend do projeto `portalsmcorpfigma` (Vite + React SPA) para o projeto estruturado `frontend` (Next.js 14 + API Backend NestJS).

---

## 📊 Análise Comparativa

### Projeto Origem: `portalsmcorpfigma`
| Aspecto | Tecnologia |
|---------|------------|
| Framework | Vite + React SPA |
| UI Libraries | MUI + Radix UI + shadcn/ui |
| Estado | Context API (SMCorpContext.tsx - **4478 linhas**) |
| Dados | LocalStorage (mock data) |
| Componentes UI | 48 componentes em `/ui` |
| Componentes de Negócio | ~60 componentes (Módulos, Dialogs, Cards) |

### Projeto Destino: `frontend`
| Aspecto | Tecnologia |
|---------|------------|
| Framework | Next.js 14 (App Router) |
| UI Libraries | Radix UI + shadcn/ui + Tailwind |
| Estado | Zustand + React Query |
| Dados | API Backend (NestJS + PostgreSQL) |
| Componentes UI | 23 componentes em `/ui` |
| Services | auth, dashboard, operations |

---

## 🔴 Desafios Identificados

1. **Context Gigante (4478 linhas)** → Dividir em Zustand stores por domínio
2. **LocalStorage** → Migrar para chamadas API ao backend
3. **MUI Components** → Substituir por shadcn/ui puro
4. **Módulos 00-09** → Converter para rotas Next.js (App Router)
5. **25 Componentes UI Extras** → Adicionar via `npx shadcn@latest add`
6. **Imports `@/app/components`** → Mudar para `@/components`

---

## 📦 Inventário de Componentes UI

### Componentes no Figma (48) vs Frontend (23)

| Componente | Figma | Frontend | Ação |
|------------|:-----:|:--------:|------|
| accordion | ✅ | ❌ | Adicionar |
| alert-dialog | ✅ | ✅ | OK |
| alert | ✅ | ❌ | Adicionar |
| aspect-ratio | ✅ | ❌ | Adicionar |
| avatar | ✅ | ✅ | OK |
| badge | ✅ | ✅ | OK |
| breadcrumb | ✅ | ❌ | Adicionar |
| button | ✅ | ✅ | OK |
| calendar | ✅ | ✅ | OK |
| card | ✅ | ✅ | OK |
| carousel | ✅ | ❌ | Adicionar |
| chart | ✅ | ❌ | Adicionar |
| checkbox | ✅ | ✅ | OK |
| collapsible | ✅ | ❌ | Adicionar |
| command | ✅ | ❌ | Adicionar |
| context-menu | ✅ | ❌ | Adicionar |
| dialog | ✅ | ✅ | OK |
| drawer | ✅ | ❌ | Adicionar |
| dropdown-menu | ✅ | ✅ | OK |
| form | ✅ | ❌ | Adicionar |
| hover-card | ✅ | ❌ | Adicionar |
| input-otp | ✅ | ❌ | Adicionar |
| input | ✅ | ✅ | OK |
| label | ✅ | ✅ | OK |
| menubar | ✅ | ❌ | Adicionar |
| navigation-menu | ✅ | ❌ | Adicionar |
| pagination | ✅ | ❌ | Adicionar |
| popover | ✅ | ✅ | OK |
| progress | ✅ | ✅ | OK |
| radio-group | ✅ | ❌ | Adicionar |
| resizable | ✅ | ❌ | Adicionar |
| scroll-area | ✅ | ❌ | Adicionar |
| select | ✅ | ✅ | OK |
| separator | ✅ | ❌ | Adicionar |
| sheet | ✅ | ❌ | Adicionar |
| sidebar | ✅ | ❌ | Adicionar |
| skeleton | ✅ | ✅ | OK |
| slider | ✅ | ❌ | Adicionar |
| sonner | ✅ | ✅ | OK |
| switch | ✅ | ✅ | OK |
| table | ✅ | ✅ | OK |
| tabs | ✅ | ✅ | OK |
| textarea | ✅ | ✅ | OK |
| toggle-group | ✅ | ❌ | Adicionar |
| toggle | ✅ | ❌ | Adicionar |
| tooltip | ✅ | ❌ | Adicionar |

**Total a adicionar: 25 componentes**

---

## 🗂️ Módulos a Migrar

| Módulo | Descrição | Linhas | Prioridade |
|--------|-----------|--------|------------|
| Modulo00 | Dashboard Executivo | ~3510 | 🔴 Alta |
| Modulo01 | Gestão de Cursos | - | 🟡 Média |
| Modulo02 | Gestão de Turmas | - | 🟡 Média |
| Modulo03 | Gestão de Alunos | - | 🔴 Alta |
| Modulo04 | Documentos | - | 🟡 Média |
| Modulo05 | Portal Empresas (B2B) | - | 🟢 Baixa |
| Modulo06 | Financeiro | - | 🟡 Média |
| Modulo07 | Instrutores | - | 🟡 Média |
| Modulo08 | Custos/Fornecedores | - | 🟡 Média |
| Modulo09 | Configurações | - | 🟢 Baixa |

---

## 📋 FASES DE MIGRAÇÃO

---

### 🟦 FASE 0: Preparação do Ambiente (1-2 dias)

#### Tarefa 0.1: Instalar Componentes UI Faltantes
```powershell
cd c:\Users\uniqs\Desktop\PORTALSMCORP\frontend

# Instalar todos os componentes faltantes
npx shadcn@latest add accordion alert aspect-ratio breadcrumb carousel chart collapsible command context-menu drawer form hover-card input-otp menubar navigation-menu pagination radio-group resizable scroll-area separator sheet sidebar slider toggle toggle-group tooltip
```

#### Tarefa 0.2: Instalar Dependências Extras
```powershell
npm install sonner recharts embla-carousel-react cmdk input-otp vaul
```

#### Tarefa 0.3: Verificar Estrutura de Pastas
```
frontend/src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── courses/      # Modulo01
│   │   ├── classes/      # Modulo02
│   │   ├── students/     # Modulo03
│   │   ├── documents/    # Modulo04
│   │   ├── companies/    # Modulo05
│   │   ├── financial/    # Modulo06
│   │   ├── instructors/  # Modulo07
│   │   ├── costs/        # Modulo08
│   │   └── settings/     # Modulo09
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard específicos
│   ├── forms/            # Formulários
│   ├── dialogs/          # Todos os dialogs
│   └── cards/            # Todos os cards
├── stores/
│   ├── auth.store.ts
│   ├── dashboard.store.ts
│   ├── courses.store.ts
│   ├── classes.store.ts
│   ├── students.store.ts
│   └── ...
├── services/
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── courses.service.ts
│   └── ...
└── lib/
    └── utils.ts
```

**Critério de Aceite:**
- [ ] Todos os componentes UI instalados
- [ ] Projeto compila sem erros
- [ ] Estrutura de pastas criada

---

### 🟦 FASE 1: Criar Zustand Stores (2-3 dias)

O `SMCorpContext.tsx` (4478 linhas) precisa ser dividido em stores menores.

#### Tarefa 1.1: Analisar e Mapear o Context

**Entidades identificadas no SMCorpContext:**
- `DadosInstitucionais` → `settings.store.ts`
- `Curso` → `courses.store.ts`
- `Turma` → `classes.store.ts`
- `Aluno` → `students.store.ts`
- `Instrutor` → `instructors.store.ts`
- `ClientePJ` → `companies.store.ts`
- `LancamentoCusto` → `costs.store.ts`
- `Usuario` → `auth.store.ts` (já existe, expandir)
- `Sala`, `Fornecedor`, `ProdutoExtra` → `settings.store.ts`

#### Tarefa 1.2: Criar Store de Cursos
```typescript
// frontend/src/stores/courses.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Course {
  id: string;
  code: string;
  name: string;
  // ... campos do backend
}

interface CoursesState {
  courses: Course[];
  loading: boolean;
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set) => ({
      courses: [],
      loading: false,
      setCourses: (courses) => set({ courses }),
      addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
      updateCourse: (id, course) => set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? { ...c, ...course } : c)),
      })),
      deleteCourse: (id) => set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
      })),
    }),
    { name: 'courses-storage' }
  )
);
```

#### Tarefa 1.3: Criar Stores para cada módulo
Repetir o padrão acima para:
- `students.store.ts`
- `classes.store.ts`
- `instructors.store.ts`
- `companies.store.ts`
- `costs.store.ts`
- `settings.store.ts`
- `dashboard.store.ts`

**Critério de Aceite:**
- [ ] Todas as stores criadas
- [ ] Tipagem TypeScript correta
- [ ] Persistência configurada onde necessário

---

### 🟦 FASE 2: Criar Services de API (2-3 dias)

#### Tarefa 2.1: Expandir Services Existentes

```typescript
// frontend/src/services/courses.service.ts
import { api } from '@/lib/api';
import type { Course } from '@/stores/courses.store';

export const coursesService = {
  getAll: async (): Promise<Course[]> => {
    const response = await api.get('/courses');
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: Omit<Course, 'id'>): Promise<Course> => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Course>): Promise<Course> => {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};
```

#### Tarefa 2.2: Criar Services para cada módulo
- `students.service.ts`
- `classes.service.ts`
- `instructors.service.ts`
- `companies.service.ts`
- `costs.service.ts`
- `settings.service.ts`

**Critério de Aceite:**
- [ ] Todos os services criados
- [ ] Endpoints mapeados com o backend
- [ ] Tratamento de erros implementado

---

### 🟦 FASE 3: Migrar Componentes de Negócio (5-7 dias)

#### Tarefa 3.1: Migrar Dialogs (prioridade alta)
Dialogs são reutilizados em vários módulos.

| Dialog | Arquivo Origem | Destino |
|--------|----------------|---------|
| DialogAdicionarAlunoIndividual | ✅ | `/components/dialogs/` |
| DialogAgendarProva | ✅ | `/components/dialogs/` |
| DialogConfirmarPagamento | ✅ | `/components/dialogs/` |
| DialogDocumentosAluno | ✅ | `/components/dialogs/` |
| DialogEmpresa | ✅ | `/components/dialogs/` |
| DialogPermissoesUsuario | ✅ | `/components/dialogs/` |
| ... (mais 20+) | | |

**Processo de migração para cada Dialog:**
1. Copiar arquivo de `portalsmcorpfigma/src/app/components/`
2. Atualizar imports:
   - `@/app/components/ui/` → `@/components/ui/`
   - `@/app/contexts/SMCorpContext` → `@/stores/xxx.store`
3. Substituir `useSMCorp()` por hooks de Zustand e React Query
4. Remover dependências de MUI (se houver)
5. Testar o componente

#### Tarefa 3.2: Migrar Cards
| Card | Arquivo Origem | Destino |
|------|----------------|---------|
| CardAluno | ✅ | `/components/cards/` |
| CardInstrutorTurma | ✅ | `/components/cards/` |
| CardLancamentoAgrupado | ✅ | `/components/cards/` |
| CardLoteModulo08 | ✅ | `/components/cards/` |

**Critério de Aceite:**
- [ ] Todos os dialogs migrados
- [ ] Todos os cards migrados
- [ ] Nenhum import de MUI
- [ ] Funcionando com stores Zustand

---

### 🟦 FASE 4: Migrar Módulo 09 - Dashboard (3-4 dias)

O Módulo09 é o dashboard principal e deve ser migrado primeiro.

#### Tarefa 4.1: Criar página do Dashboard
```
frontend/src/app/(dashboard)/dashboard/page.tsx
```

#### Tarefa 4.2: Dividir Modulo09.tsx em componentes menores
O arquivo original tem ~3500 linhas. Dividir em:
- `DashboardStats.tsx` - Cards de estatísticas
- `DashboardCharts.tsx` - Gráficos
- `DashboardTables.tsx` - Tabelas
- `DashboardFilters.tsx` - Filtros

#### Tarefa 4.3: Conectar com API
Usar React Query para buscar dados do backend.

**Critério de Aceite:**
- [ ] Dashboard renderizando
- [ ] Dados vindos da API
- [ ] Gráficos funcionando
- [ ] Responsivo

---

### 🟦 FASE 5-12: Migrar Módulos Restantes (2-3 dias cada)

Repetir o processo para cada módulo:

| Fase | Módulo | Rota Next.js | Prioridade |
|------|--------|--------------|------------|
| 5 | Modulo01 - Cursos | `/courses` | 🟡 |
| 6 | Modulo02 - Turmas | `/classes` | 🟡 |
| 7 | Modulo03 - Alunos | `/students` | 🔴 |
| 8 | Modulo04 - Documentos | `/documents` | 🟡 |
| 9 | Modulo05 - Empresas | `/companies` | 🟢 |
| 10 | Modulo06 - Financeiro | `/financial` | 🟡 |
| 11 | Modulo07 - Instrutores | `/instructors` | 🟡 |
| 12 | Modulo08 - Custos | `/costs` | 🟡 |
| 13 | Modulo00 - Config | `/settings` | 🟢 |

---

### 🟦 FASE 14: Validação e Testes (3-4 dias)

#### Tarefa 14.1: Testes de Integração
- Testar fluxos completos
- Verificar comunicação com backend

#### Tarefa 14.2: Testes de UI
- Verificar responsividade
- Testar em diferentes navegadores

#### Tarefa 14.3: Performance
- Lighthouse audit
- Bundle size analysis

---

## ⏱️ Cronograma Estimado

| Fase | Duração | Acumulado |
|------|---------|-----------|
| Fase 0: Preparação | 1-2 dias | 2 dias |
| Fase 1: Stores | 2-3 dias | 5 dias |
| Fase 2: Services | 2-3 dias | 8 dias |
| Fase 3: Componentes | 5-7 dias | 15 dias |
| Fase 4: Dashboard | 3-4 dias | 19 dias |
| Fases 5-13: Módulos | 18-27 dias | 46 dias |
| Fase 14: Testes | 3-4 dias | 50 dias |

**Total estimado: 6-8 semanas**

---

## 🛠️ Comandos Úteis

### Instalar componentes shadcn/ui
```powershell
cd c:\Users\uniqs\Desktop\PORTALSMCORP\frontend
npx shadcn@latest add [component-name]
```

### Copiar arquivo do Figma para Frontend
```powershell
# Exemplo: copiar Dialog
Copy-Item "c:\Users\uniqs\Desktop\PORTALSMCORP\portalsmcorpfigma\src\app\components\DialogAgendarProva.tsx" -Destination "c:\Users\uniqs\Desktop\PORTALSMCORP\frontend\src\components\dialogs\"
```

### Script para atualizar imports em arquivo copiado
```powershell
# Substituir imports
(Get-Content arquivo.tsx) -replace '@/app/components/ui/', '@/components/ui/' -replace '@/app/contexts/SMCorpContext', '@/stores' | Set-Content arquivo.tsx
```

---

## 📝 Checklist Geral

### Preparação
- [ ] Componentes UI instalados (25)
- [ ] Dependências extras instaladas
- [ ] Estrutura de pastas criada

### Stores
- [ ] courses.store.ts
- [ ] classes.store.ts
- [ ] students.store.ts
- [ ] instructors.store.ts
- [ ] companies.store.ts
- [ ] costs.store.ts
- [ ] settings.store.ts
- [ ] dashboard.store.ts

### Services
- [ ] courses.service.ts
- [ ] classes.service.ts
- [ ] students.service.ts
- [ ] instructors.service.ts
- [ ] companies.service.ts
- [ ] costs.service.ts
- [ ] settings.service.ts

### Componentes
- [ ] Todos os Dialogs migrados
- [ ] Todos os Cards migrados
- [ ] Layouts atualizados

### Módulos
- [ ] Dashboard (Modulo09)
- [ ] Cursos (Modulo01)
- [ ] Turmas (Modulo02)
- [ ] Alunos (Modulo03)
- [ ] Documentos (Modulo04)
- [ ] Empresas (Modulo05)
- [ ] Financeiro (Modulo06)
- [ ] Instrutores (Modulo07)
- [ ] Custos (Modulo08)
- [ ] Configurações (Modulo00)

### Qualidade
- [ ] Sem erros TypeScript
- [ ] Testes passando
- [ ] Responsivo
- [ ] Performance OK

---

## 🔗 Referências

- [shadcn/ui Docs](https://ui.shadcn.com)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
