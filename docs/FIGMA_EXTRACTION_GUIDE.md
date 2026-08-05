# Guia de Extração do Figma → VS Code

## 🎯 Objetivo
Extrair funcionalidades do design Figma e implementar módulo por módulo no PortalSMCorp.

---

## 📋 Checklist de Extração por Módulo

### **Antes de começar:**
1. [ ] Arquivo .fig aberto no Figma Desktop ou Web
2. [ ] Instalar plugin "Figma to Code" (Plugins → Browse)
3. [ ] Criar pasta `docs/figma-extraction/` para screenshots

---

## 🔍 Para CADA Módulo

### **Passo 1: Capturar Layout Geral**
- [ ] Screenshot da tela completa
- [ ] Anotar dimensões (desktop: 1440px, mobile: 375px)
- [ ] Identificar breakpoints responsivos

### **Passo 2: Componentes UI**
No Figma, selecione cada componente e copie:

| Componente | Propriedades | Localização no Código |
|------------|--------------|----------------------|
| Header | cores, altura, logo | `components/layout/Header.tsx` |
| Sidebar | navegação, ícones | `components/layout/Sidebar.tsx` |
| Cards | padding, shadow, border-radius | `components/ui/card.tsx` |
| Buttons | variantes (primary, secondary, ghost) | `components/ui/button.tsx` |
| Forms | campos, validações, labels | `components/forms/` |
| Tabelas | colunas, paginação, filtros | `components/tables/` |
| Modais | overlay, posição, animação | `components/modals/` |

**Como extrair:**
```
1. Selecione componente no Figma
2. Painel direito → aba "Inspect" (</> ícone)
3. Copie CSS ou use plugin "Figma to Code"
4. Adapte para Tailwind:
   - padding: 16px → p-4
   - margin: 24px → m-6
   - border-radius: 8px → rounded-lg
```

### **Passo 3: Design Tokens**
Extraia valores consistentes:

```typescript
// tailwind.config.ts
colors: {
  'sm-primary': '#___',      // Cor primária do Figma
  'sm-secondary': '#___',    // Cor secundária
  'sm-accent': '#___',       // Cor de destaque
  'sm-background': '#___',   // Fundo
  'sm-surface': '#___',      // Cards/superfícies
  'sm-text': '#___',         // Texto principal
  'sm-text-muted': '#___',   // Texto secundário
  'sm-border': '#___',       // Bordas
  'sm-error': '#___',        // Erro
  'sm-success': '#___',      // Sucesso
  'sm-warning': '#___',      // Aviso
}

spacing: {
  'sm-xs': '___px',   // Espaçamento mínimo
  'sm-sm': '___px',   // Pequeno
  'sm-md': '___px',   // Médio
  'sm-lg': '___px',   // Grande
  'sm-xl': '___px',   // Extra grande
}

fontSize: {
  'sm-h1': '___px',   // Título principal
  'sm-h2': '___px',   // Subtítulo
  'sm-body': '___px', // Texto normal
  'sm-small': '___px', // Texto pequeno
}
```

### **Passo 4: Funcionalidades e Interações**
No Figma, veja aba **Prototype** (ícone play):

**Mapear:**
- [ ] Navegação entre telas (onClick → router.push())
- [ ] Estados de hover/active/disabled
- [ ] Animações (Framer Motion)
- [ ] Modais/Drawers (quando abrem/fecham)
- [ ] Validações de formulário (visual → Zod schema)
- [ ] Feedback visual (loading, success, error)

**Documentar:**
```typescript
// Exemplo: Fluxo de Cadastro de Aluno
TELA: Lista de Alunos
  └─ AÇÃO: Clique "Novo Aluno"
      └─ MODAL: Formulário de Cadastro
          ├─ CAMPOS: nome_completo, cpf, email, telefone, data_nascimento
          ├─ VALIDAÇÕES: 
          │   - CPF válido (regex)
          │   - Email único (backend check)
          │   - Data nascimento >= 16 anos
          ├─ SUBMISSÃO:
          │   → POST /api/v1/students (backend)
          │   → Retorno: 201 Created
          │   → Feedback: Toast "Aluno cadastrado com sucesso!"
          │   → Ação: Fecha modal + recarrega lista
          └─ ESTADOS:
              - idle (inicial)
              - loading (salvando...)
              - success (salvo!)
              - error (erro: mensagem)
```

### **Passo 5: Dados e API**
Para cada tela, identifique:

**Dados Exibidos:**
```typescript
// Frontend (camelCase)
interface Student {
  id: number;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Backend (snake_case) - src/modules/students/dto/
interface StudentDto {
  id: number;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  data_nascimento: Date;
  status: 'active' | 'inactive';
  created_at: Date;
}
```

**Endpoints Necessários:**
```yaml
# backend/src/modules/students/students.controller.ts
GET    /api/v1/students          # Lista com paginação
GET    /api/v1/students/:id      # Detalhes de um aluno
POST   /api/v1/students          # Criar aluno
PUT    /api/v1/students/:id      # Atualizar
DELETE /api/v1/students/:id      # Desativar
GET    /api/v1/students/search   # Busca (query: ?q=nome)
```

### **Passo 6: Assets (Ícones, Imagens, Logos)**
No Figma:
```
1. Selecione ícone/imagem
2. Export → SVG (para ícones) ou PNG (para fotos)
3. Salve em:
   - frontend/public/icons/ (ícones SVG)
   - frontend/public/images/ (logos, backgrounds)
   - frontend/public/avatars/ (fotos de perfil)
```

**Usar no código:**
```tsx
import Image from 'next/image';

<Image 
  src="/icons/dashboard-icon.svg" 
  alt="Dashboard" 
  width={24} 
  height={24} 
/>
```

---

## 📦 Estrutura de Documentação

Crie para CADA módulo:

```
docs/figma-extraction/
├── 00-dashboard/
│   ├── README.md              # Visão geral do módulo
│   ├── screenshots/           # Prints de cada tela
│   │   ├── overview.png
│   │   ├── students-tab.png
│   │   └── costs-tab.png
│   ├── components.md          # Lista de componentes UI
│   ├── flows.md               # Fluxos de navegação/interação
│   ├── api-contracts.md       # Endpoints necessários
│   └── assets/                # Ícones/imagens exportados
├── 01-catalogo-cursos/
├── 02-abertura-turmas/
├── 03-dashboard-operacional/
├── 04-central-vendas/
├── 05-area-cliente/
├── 06-validacao-documentos/
├── 07-gestao-pagamentos/
└── 08-fluxo-financeiro/
```

---

## 🚀 Implementação (após extração)

### **Ordem de Implementação:**
1. ✅ **Módulo 00: Dashboard** (já implementado)
2. 🔄 **Módulo 01: Catálogo de Cursos** (próximo)
3. ⏳ **Módulo 02: Abertura de Turmas**
4. ⏳ **Módulo 03: Dashboard Operacional**
5. ⏳ **Módulo 04: Central de Vendas**
6. ⏳ **Módulo 05: Área do Cliente**
7. ⏳ **Módulo 06: Validação de Documentos**
8. ⏳ **Módulo 07: Gestão de Pagamentos**
9. ⏳ **Módulo 08: Fluxo Financeiro**

### **Para cada módulo:**
```bash
# 1. Backend (NestJS)
nest g module modules/cursos
nest g controller modules/cursos
nest g service modules/cursos

# 2. Prisma Schema
# Adicionar models em prisma/schema.prisma

# 3. Frontend (Next.js)
# Criar rotas em src/app/
# Criar componentes em src/components/
# Criar services em src/services/

# 4. Testar
npm run dev  # Frontend
npm run start:dev  # Backend
```

---

## 💡 Dicas

### **Plugins Figma Úteis:**
- **Figma to Code**: Converte componentes em React/HTML
- **Anima**: Código responsivo automático
- **Content Reel**: Popula com dados de exemplo
- **Iconify**: Biblioteca de ícones
- **Stark**: Verificação de acessibilidade

### **Atalhos no Figma:**
- `I` = Selecionar cor (eyedropper)
- `Ctrl+Shift+K` = Exportar seleção
- `Ctrl+D` = Duplicar
- `Alt+Drag` = Medir distância

### **Convenções do Projeto:**
- ✅ Backend: `snake_case` (nome_completo, data_nascimento)
- ✅ Frontend: `camelCase` (nomeCompleto, dataNascimento)
- ✅ Componentes: `PascalCase` (StudentCard, CourseList)
- ✅ Arquivos: `kebab-case` (student-card.tsx, course-list.tsx)

---

## 📝 Template de Documentação de Módulo

Use este template para cada módulo:

```markdown
# Módulo: [Nome do Módulo]

## 📸 Screenshots
![Tela Principal](screenshots/main.png)

## 🎨 Componentes UI

### Header
- **Altura**: 64px
- **Background**: bg-white
- **Shadow**: shadow-sm
- **Elementos**: Logo + Título + User Menu

### Card de Curso
- **Width**: 100% (grid 3 cols desktop, 1 col mobile)
- **Padding**: p-6
- **Border Radius**: rounded-xl
- **Shadow**: shadow-md hover:shadow-lg
- **Elementos**:
  - Imagem do curso (aspect-ratio: 16/9)
  - Título (text-xl font-semibold)
  - Descrição (text-sm text-gray-600, max 2 linhas)
  - Badge de categoria (bg-blue-100)
  - Preço (text-2xl font-bold)
  - Botão "Ver Detalhes" (primary)

## 🔄 Fluxos

### Fluxo: Matrícula em Curso
1. Usuário clica "Ver Detalhes" no card
2. Abre modal com informações completas
3. Usuário clica "Matricular"
4. Validação: usuário autenticado?
   - Não → Redireciona para login
   - Sim → Abre form de matrícula
5. Preenche dados (turma, forma de pagamento)
6. Submit → POST /api/v1/enrollments
7. Success → Toast + Redireciona para "Minhas Matrículas"

## 📡 API Endpoints

### GET /api/v1/cursos
**Response:**
```json
{
  "cursos": [
    {
      "id": 1,
      "nome_curso": "Engenharia Civil",
      "descricao": "Formação completa...",
      "carga_horaria": 3600,
      "preco_base": 1500.00,
      "categoria_id": 2,
      "imagem_url": "/uploads/cursos/1.jpg",
      "status": "active"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "per_page": 12
  }
}
```

## ✅ Checklist de Implementação
- [ ] Backend: Controller + Service criados
- [ ] Backend: Prisma models definidos
- [ ] Backend: Endpoints testados (Postman/Insomnia)
- [ ] Frontend: Página criada
- [ ] Frontend: Componentes UI implementados
- [ ] Frontend: Service API criado
- [ ] Frontend: Integração funcional
- [ ] Testes: Navegação completa
- [ ] Testes: Responsividade (mobile/desktop)
- [ ] Testes: Estados (loading, error, empty, success)
```

---

## 🎯 Próximos Passos

1. **Abrir arquivo .fig no Figma** (Desktop ou Web)
2. **Começar pelo Módulo 01: Catálogo de Cursos**
3. **Seguir template acima** para documentar
4. **Implementar após documentação completa**

Dúvidas? Me avise quando abrir o Figma e podemos extrair juntos!
