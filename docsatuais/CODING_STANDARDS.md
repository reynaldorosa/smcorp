# 📋 SMCORP - Padrões de Código Obrigatórios

> **ATENÇÃO AGENTES IA**: Este documento é OBRIGATÓRIO. Leia antes de fazer qualquer alteração no código.

## 🎯 Convenção de Idioma

### Regra Principal
```
CÓDIGO = INGLÊS
UI/TEXTOS = PORTUGUÊS
```

### ✅ CORRETO
```typescript
// Tipos, interfaces, variáveis, funções = INGLÊS
interface Student {
  id: string;
  name: string;          // nome interno em inglês
  email: string;
  status: StudentStatus;
}

// UI/Labels = PORTUGUÊS (apenas strings visíveis ao usuário)
<Label>Nome do Aluno</Label>
<Button>Salvar</Button>
toast.success('Aluno cadastrado com sucesso!');
```

### ❌ INCORRETO
```typescript
// NÃO USE português no código
interface Aluno {        // ❌ ERRADO
  nome: string;          // ❌ ERRADO
  turmaId: string;       // ❌ ERRADO
}

// NÃO USE inglês na UI visível ao usuário
<Label>Student Name</Label>  // ❌ ERRADO (usuário é brasileiro)
```

---

## 📁 Estrutura de Tipos

### Localização Única
Todos os tipos devem estar em:
```
frontend/src/types/index.ts
```

### Importação Padrão
```typescript
// ✅ CORRETO
import type { Student, Class, Course, Instructor } from '@/types';

// ❌ INCORRETO - arquivo removido
// import type { Aluno, Turma, Curso } from '@/stores/types'; // DELETED
```

---

## 🧩 Componentes

### Nomenclatura
| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase, inglês | `StudentCard`, `ClassCalendar` |
| Props | PascalCase + Props | `StudentCardProps` |
| Hooks | camelCase, use prefix | `useStudents`, `useClasses` |
| Services | camelCase + Service | `studentsService` |
| Stores | camelCase + Store | `useStudentsStore` |

### Estrutura de Arquivos
```
components/
├── [module]/              # Pasta por módulo
│   ├── index.ts           # Exports públicos
│   ├── component-name.tsx # kebab-case para arquivos
│   └── dialogs/           # Dialogs do módulo
│       └── index.ts
```

### Exemplo de Componente
```typescript
'use client';

import React from 'react';
import type { Student } from '@/types';

// ============================================
// TYPES
// ============================================

interface StudentCardProps {
  student: Student;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string) => void;
  compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function StudentCard({
  student,
  onEdit,
  onDelete,
  compact = false,
}: StudentCardProps) {
  return (
    <div>
      {/* UI em português */}
      <h3>{student.name}</h3>
      <span>Status: {student.status}</span>
      <Button onClick={() => onEdit?.(student)}>
        Editar
      </Button>
    </div>
  );
}
```

---

## 🗂️ Estrutura de Módulos (Páginas)

### Padrão: Slim Page + Components

```
app/(dashboard)/[module]/
├── page.tsx              # Slim: apenas importa e renderiza
└── ...

components/[module]/
├── index.ts              # Exports
├── [module]-dashboard.tsx # Componente principal
├── [sub-component].tsx   # Sub-componentes
└── dialogs/
    └── index.ts          # Re-exports de dialogs
```

### Exemplo de Page Slim
```typescript
// app/(dashboard)/operational/page.tsx
'use client';

import { OperationalDashboard } from '@/components/operational';

export default function OperationalPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Operacional</h1>
      <OperationalDashboard />
    </div>
  );
}
```

---

## 🔤 Mapeamento de Termos

| Português (UI) | Inglês (Código) |
|----------------|-----------------|
| Aluno | Student |
| Turma | Class |
| Curso | Course |
| Sala | Room |
| Instrutor | Instructor |
| Empresa | Company |
| Fornecedor | Supplier |
| Pagamento | Payment |
| Documento | Document |
| Prova | Exam |
| Presença | Attendance |
| Matrícula | Enrollment |
| Fila de Espera | WaitingList |
| Substituição | Replacement |
| Custo | Cost |
| Produto Extra | ExtraProduct |
| Usuário | User |

---

## 📦 Stores (Zustand)

### Estrutura Padrão
```typescript
// stores/students.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student } from '@/types';

interface StudentsState {
  students: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
}

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    { name: 'students-storage' }
  )
);
```

---

## 🌐 Services (API)

### Estrutura Padrão
```typescript
// services/students.service.ts
import { api } from '@/lib/api';
import type { Student, CreateStudentDTO, UpdateStudentDTO } from '@/types';

export const studentsService = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');
    return response.data;
  },
  
  create: async (data: CreateStudentDTO): Promise<Student> => {
    const response = await api.post('/students', data);
    return response.data;
  },
  
  // ... outros métodos
};
```

---

## ✅ Checklist para PRs

Antes de submeter código, verifique:

- [ ] Tipos importados de `@/types` (não de `@/stores/types`)
- [ ] Código em inglês (variáveis, funções, tipos)
- [ ] UI em português (labels, botões, mensagens)
- [ ] Componentes seguem estrutura padrão
- [ ] Sem `any` implícito (TypeScript strict)
- [ ] Arquivo .tsx para componentes, .ts para lógica

---

## 🚫 Arquivos Legados (NÃO USAR)

Os seguintes arquivos serão removidos após migração completa:

```
❌ frontend/src/stores/types.ts           # Tipos em português
❌ frontend/src/components/CardAluno.tsx  # Usar StudentCard
❌ frontend/src/components/dialogs-figma/ # Migrar para dialogs/
```

---

## 📞 Dúvidas?

Consulte os módulos já implementados como referência:
- `components/settings/` - Módulo 00 (padrão)
- `components/courses/` - Módulo 01
- `components/classes/` - Módulo 02

---

*Última atualização: 2026-02-05*
*Versão: 1.0.0*
