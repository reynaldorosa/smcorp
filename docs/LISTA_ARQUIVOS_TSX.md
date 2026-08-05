# 📁 LISTA COMPLETA DE ARQUIVOS .TSX - PLATAFORMA SMCORP

## 🎯 Estrutura Completa do Projeto

### 📂 **Arquivos Principais**

#### `/src/main.tsx`
- **Descrição**: Ponto de entrada da aplicação React
- **Função**: Renderiza o App no DOM

#### `/src/app/App.tsx`
- **Descrição**: Componente principal da aplicação
- **Função**: Gerencia navegação entre módulos e modos (admin/aluno)

---

## 🗂️ **CONTEXTS (Gerenciamento de Estado)**

### `/src/app/contexts/SMCorpContext.tsx`
- **Descrição**: Context principal do sistema SMCORP
- **Função**: Gerencia todos os dados globais (alunos, turmas, instrutores, custos, etc.)
- **Hook**: `useSMCorp()`

### `/src/app/contexts/ThemeContext.tsx`
- **Descrição**: Context de tema (dark/light mode)
- **Função**: Controla o tema visual da aplicação
- **Hook**: `useTheme()`

---

## 📦 **MÓDULOS PRINCIPAIS (00-09)**

### `/src/app/components/Modulo00.tsx`
- **Nome**: Módulo 00 - Cadastros Base
- **Função**: Cadastro de cursos, empresas, produtos, instrutores, usuários

### `/src/app/components/Modulo01.tsx`
- **Nome**: Módulo 01 - Criação de Turmas
- **Função**: Criação e configuração de turmas

### `/src/app/components/Modulo02.tsx`
- **Nome**: Módulo 02 - Gestão de Alunos
- **Função**: Adicionar alunos às turmas (individual ou via planilha)

### `/src/app/components/Modulo03.tsx`
- **Nome**: Módulo 03 - Gestão de Turmas Ativas
- **Função**: Visualização em cards de alunos e instrutores por turma

### `/src/app/components/Modulo04.tsx`
- **Nome**: Módulo 04 - Controle de Presença
- **Função**: Lista de presença e controle de status

### `/src/app/components/Modulo05.tsx`
- **Nome**: Módulo 05 - Gestão de Documentos
- **Função**: Upload e controle de documentos dos alunos

### `/src/app/components/Modulo06.tsx`
- **Nome**: Módulo 06 - Dashboard de Custos (Resumido)
- **Função**: Visão macro dos custos por status

### `/src/app/components/Modulo06Detalhado.tsx`
- **Nome**: Módulo 06 - Dashboard de Custos (Detalhado)
- **Função**: Visão completa e detalhada de custos com agrupamentos

### `/src/app/components/Modulo07.tsx`
- **Nome**: Módulo 07 - Gestão de Substituições
- **Função**: Substituir alunos entre turmas

### `/src/app/components/Modulo08.tsx`
- **Nome**: Módulo 08 - Autorização de Pagamentos
- **Função**: Autorização e confirmação de pagamentos em lote

### `/src/app/components/Modulo09.tsx`
- **Nome**: Módulo 09 - Dashboard Executivo
- **Função**: Visão estratégica com KPIs e gráficos executivos

---

## 🧩 **COMPONENTES DE INTERFACE**

### **Layout e Estrutura**

#### `/src/app/components/Layout.tsx`
- **Função**: Layout base com sidebar e navegação entre módulos

#### `/src/app/components/ErrorBoundary.tsx`
- **Função**: Captura e exibe erros da aplicação

#### `/src/app/components/ContextGuard.tsx`
- **Função**: Protege componentes que dependem do SMCorpContext

---

### **CARDS (Visualização de Dados)**

#### `/src/app/components/CardAluno.tsx`
- **Função**: Card individual do aluno com status e ações
- **Usado em**: Módulo 03, 04, 07

#### `/src/app/components/CardInstrutorTurma.tsx`
- **Função**: Card do instrutor com WhatsApp, provas e custos
- **Usado em**: Módulo 03
- **Features**: Botão WhatsApp, gestão de provas e custos

#### `/src/app/components/CardLancamentoAgrupado.tsx`
- **Função**: Card de lançamento de custo agrupado
- **Usado em**: Módulo 06 Detalhado

#### `/src/app/components/CardLoteModulo08.tsx`
- **Função**: Card de lote de pagamento
- **Usado em**: Módulo 08

---

### **DIALOGS (Modais e Formulários)**

#### `/src/app/components/DialogAdicionarAlunoIndividual.tsx`
- **Função**: Adicionar aluno individual à turma
- **Usado em**: Módulo 02

#### `/src/app/components/DialogAdicionarFilaEspera.tsx`
- **Função**: Adicionar aluno à fila de espera
- **Usado em**: Módulo 02

#### `/src/app/components/DialogAdicionarInstrutor.tsx`
- **Função**: Cadastrar novo instrutor
- **Usado em**: Módulo 00
- **Features**: Código automático (IN0001), telefone com WhatsApp

#### `/src/app/components/DialogAgendarProva.tsx`
- **Função**: Agendar provas para alunos
- **Usado em**: CardAluno, CardInstrutorTurma

#### `/src/app/components/DialogAprovarAlunosImportados.tsx`
- **Função**: Aprovar alunos importados via planilha
- **Usado em**: Módulo 02

#### `/src/app/components/DialogAutorizarLotePagamento.tsx`
- **Função**: Autorizar lote de pagamentos
- **Usado em**: Módulo 08

#### `/src/app/components/DialogAutorizarPagamento.tsx`
- **Função**: Autorizar pagamento individual
- **Usado em**: Módulo 06

#### `/src/app/components/DialogConfirmarPagamento.tsx`
- **Função**: Confirmar pagamento individual
- **Usado em**: Módulo 08

#### `/src/app/components/DialogCustosInstrutor.tsx`
- **Função**: Visualizar e gerenciar custos do instrutor
- **Usado em**: CardInstrutorTurma

#### `/src/app/components/DialogDocumentosAluno.tsx`
- **Função**: Visualizar documentos do aluno
- **Usado em**: Módulo 05

#### `/src/app/components/DialogEditarClientePJ.tsx`
- **Função**: Editar dados de empresa (Pessoa Jurídica)
- **Usado em**: Módulo 00

#### `/src/app/components/DialogEmpresa.tsx`
- **Função**: Cadastrar nova empresa
- **Usado em**: Módulo 00

#### `/src/app/components/DialogExcluirLancamento.tsx`
- **Função**: Excluir lançamento de custo
- **Usado em**: Módulo 06

#### `/src/app/components/DialogListaPresenca.tsx`
- **Função**: Lista de presença da turma
- **Usado em**: Módulo 04

#### `/src/app/components/DialogPagamento.tsx`
- **Função**: Dialog genérico de pagamento
- **Usado em**: Diversos módulos

#### `/src/app/components/DialogPermissoesUsuario.tsx`
- **Função**: Gerenciar permissões de usuários
- **Usado em**: Módulo 00

#### `/src/app/components/DialogPrecificacoesEmpresa.tsx`
- **Função**: Gerenciar múltiplas precificações por empresa
- **Usado em**: Módulo 00

#### `/src/app/components/DialogProvasInstrutor.tsx`
- **Função**: Visualizar provas agendadas do instrutor
- **Usado em**: CardInstrutorTurma

#### `/src/app/components/DialogRelatorioInstrutor.tsx`
- **Função**: Relatório completo do instrutor
- **Usado em**: Módulo 03

#### `/src/app/components/DialogRelatorioTurma.tsx`
- **Função**: Relatório completo da turma
- **Usado em**: Módulo 03

#### `/src/app/components/DialogResultadoProva.tsx`
- **Função**: Registrar resultado da prova
- **Usado em**: CardAluno

#### `/src/app/components/DialogSelecionarSubstituto.tsx`
- **Função**: Selecionar aluno substituto
- **Usado em**: Módulo 07

#### `/src/app/components/DialogTransferirTurma.tsx`
- **Função**: Transferir aluno para outra turma
- **Usado em**: CardAluno

#### `/src/app/components/DialogUploadPlanilha.tsx`
- **Função**: Upload de planilha com alunos
- **Usado em**: Módulo 02

---

### **COMPONENTES FUNCIONAIS**

#### `/src/app/components/AbaLancamentosCusto.tsx`
- **Função**: Aba de lançamentos de custos
- **Usado em**: Módulo 06

#### `/src/app/components/AvisoArmazenamentoLocal.tsx`
- **Função**: Aviso sobre uso de localStorage
- **Usado em**: App.tsx

#### `/src/app/components/BackupDados.tsx`
- **Função**: Backup e restore de dados
- **Usado em**: Módulo 00

#### `/src/app/components/DiagnosticoPersistencia.tsx`
- **Função**: Diagnóstico de persistência de dados
- **Usado em**: Módulo 00

#### `/src/app/components/DocumentoAdministrativo.tsx`
- **Função**: Visualizador de documentos administrativos
- **Usado em**: Módulo 05

#### `/src/app/components/EditorFoto.tsx`
- **Função**: Editor de foto de perfil
- **Usado em**: FormularioMatricula

#### `/src/app/components/FormularioMatricula.tsx`
- **Função**: Formulário de matrícula do aluno
- **Usado em**: PaginaMatriculaAluno

#### `/src/app/components/LimparDados.tsx`
- **Função**: Limpar todos os dados do localStorage
- **Usado em**: Módulo 00

#### `/src/app/components/MigracaoDadosIRATA.tsx`
- **Função**: Migração de dados do sistema IRATA
- **Usado em**: Módulo 00

#### `/src/app/components/PaginaMatriculaAluno.tsx`
- **Função**: Página pública de matrícula do aluno
- **Usado em**: App.tsx (modo aluno)

---

## 🎨 **COMPONENTES UI (shadcn/ui)**

### Localização: `/src/app/components/ui/`

#### **Componentes de Formulário**

- **`button.tsx`** - Botões
- **`input.tsx`** - Campos de texto
- **`textarea.tsx`** - Área de texto
- **`select.tsx`** - Seletores dropdown
- **`checkbox.tsx`** - Caixas de seleção
- **`radio-group.tsx`** - Grupos de rádio
- **`switch.tsx`** - Interruptores toggle
- **`slider.tsx`** - Controles deslizantes
- **`label.tsx`** - Labels de formulário
- **`form.tsx`** - Componente de formulário
- **`input-otp.tsx`** - Input de código OTP
- **`calendar.tsx`** - Calendário/datepicker

#### **Componentes de Layout**

- **`card.tsx`** - Cards
- **`separator.tsx`** - Separadores/dividers
- **`tabs.tsx`** - Abas/tabs
- **`accordion.tsx`** - Acordeões expansíveis
- **`collapsible.tsx`** - Conteúdo colapsável
- **`scroll-area.tsx`** - Área de scroll customizada
- **`resizable.tsx`** - Painéis redimensionáveis
- **`aspect-ratio.tsx`** - Container com proporção fixa

#### **Componentes de Navegação**

- **`navigation-menu.tsx`** - Menu de navegação
- **`menubar.tsx`** - Barra de menu
- **`breadcrumb.tsx`** - Breadcrumbs/migalhas de pão
- **`pagination.tsx`** - Paginação
- **`sidebar.tsx`** - Barra lateral

#### **Componentes de Overlay**

- **`dialog.tsx`** - Diálogos/modais
- **`sheet.tsx`** - Painéis laterais deslizantes
- **`drawer.tsx`** - Gavetas mobile
- **`popover.tsx`** - Popovers
- **`tooltip.tsx`** - Tooltips/dicas
- **`hover-card.tsx`** - Cards no hover
- **`alert-dialog.tsx`** - Diálogos de alerta
- **`command.tsx`** - Paleta de comandos
- **`context-menu.tsx`** - Menu de contexto
- **`dropdown-menu.tsx`** - Menus dropdown

#### **Componentes de Feedback**

- **`alert.tsx`** - Alertas/avisos
- **`toast.tsx` / `sonner.tsx`** - Notificações toast
- **`progress.tsx`** - Barras de progresso
- **`skeleton.tsx`** - Skeletons de carregamento

#### **Componentes de Visualização**

- **`avatar.tsx`** - Avatares
- **`badge.tsx`** - Badges/etiquetas
- **`table.tsx`** - Tabelas
- **`carousel.tsx`** - Carrosséis
- **`chart.tsx`** - Gráficos
- **`toggle.tsx`** - Botões toggle
- **`toggle-group.tsx`** - Grupos de toggle

---

## 🛠️ **UTILITÁRIOS**

### `/src/app/components/ui/utils.ts`
- **Função**: Funções utilitárias de UI (cn, etc.)

### `/src/app/components/ui/use-mobile.ts`
- **Função**: Hook para detectar dispositivos móveis

### `/src/app/components/gerarReciboHelper.ts`
- **Função**: Helper para gerar recibos de pagamento

### `/src/app/utils/gerarCustosInteligentes.ts`
- **Função**: Lógica de geração inteligente de custos

### `/src/app/utils/permissoes.ts`
- **Função**: Sistema de permissões granulares

---

## 🔧 **HOOKS CUSTOMIZADOS**

### `/src/app/hooks/usePersistedState.ts`
- **Função**: Hook de persistência automática no localStorage
- **Usado em**: SMCorpContext

---

## 🎭 **COMPONENTES FIGMA**

### `/src/app/components/figma/ImageWithFallback.tsx`
- **Função**: Componente de imagem com fallback
- **Status**: PROTEGIDO - Não deve ser editado

---

## 📊 **RESUMO QUANTITATIVO**

### **Total de Arquivos .tsx: 95 arquivos**

#### **Por Categoria:**
- **Módulos Principais**: 10 arquivos (Modulo00 a Modulo09)
- **Contexts**: 2 arquivos
- **Dialogs**: 22 arquivos
- **Cards**: 4 arquivos
- **Componentes Funcionais**: 11 arquivos
- **Componentes UI (shadcn)**: 44 arquivos
- **Layout**: 3 arquivos
- **Hooks**: 1 arquivo
- **Utilitários**: 2 arquivos (.ts mas relacionados)

---

## 🎯 **ARQUIVOS ESSENCIAIS PARA DEPLOY**

### **Obrigatórios:**
1. `/src/main.tsx`
2. `/src/app/App.tsx`
3. `/src/app/contexts/SMCorpContext.tsx`
4. `/src/app/contexts/ThemeContext.tsx`
5. `/src/app/hooks/usePersistedState.ts`
6. Todos os 10 módulos (Modulo00 a Modulo09)
7. `/src/app/components/Layout.tsx`

### **Importantes:**
- Todos os Dialogs (funcionalidades principais)
- Todos os Cards (visualização de dados)
- Componentes UI do shadcn (interface)

---

## 🔄 **DEPENDÊNCIAS ENTRE ARQUIVOS**

### **Fluxo de Dependências:**

```
main.tsx
  └─ App.tsx
      ├─ ThemeProvider (ThemeContext.tsx)
      └─ SMCorpProvider (SMCorpContext.tsx)
          ├─ usePersistedState (usePersistedState.ts)
          └─ Layout.tsx
              └─ Modulo00 a Modulo09
                  ├─ Dialogs (22 componentes)
                  ├─ Cards (4 componentes)
                  ├─ Componentes Funcionais (11 componentes)
                  └─ UI Components (44 componentes)
```

---

## 📦 **COMO EXPORTAR O PROJETO COMPLETO**

### **Método 1: Via Git**

```bash
# Clonar o repositório
git clone <seu-repositorio>

# Todos os arquivos .tsx estão em:
# - /src/app/**/*.tsx
# - /src/main.tsx
```

### **Método 2: Download Direto**

Se estiver usando o projeto localmente, copie as seguintes pastas:

```
/src/
  ├─ app/
  │   ├─ components/ (todos os .tsx)
  │   ├─ contexts/ (2 .tsx)
  │   ├─ hooks/ (1 .ts)
  │   └─ utils/ (2 .ts)
  └─ main.tsx
```

### **Método 3: Arquivo ZIP**

Criar um arquivo com todos os .tsx:

```bash
# No terminal, na raiz do projeto:
zip -r smcorp-tsx.zip src/app src/main.tsx -i "*.tsx"
```

---

## 🚀 **PRÓXIMOS PASSOS PARA DEPLOY**

1. ✅ Todos os arquivos .tsx estão listados acima
2. ✅ Verifique que todos estão no diretório `/src/`
3. ✅ Siga o guia de deploy (Vercel/Netlify)
4. ✅ Faça o build: `npm run build`
5. ✅ Faça o deploy: `vercel --prod`

---

## 📞 **CONTATO E SUPORTE**

- **Versão**: SMCORP v2.5.2
- **Data**: 2025
- **Tecnologias**: React 18, TypeScript, Tailwind CSS, Vite
- **Total de Linhas**: ~40.000+ linhas de código TypeScript

---

## 🔐 **ARQUIVOS PROTEGIDOS**

❌ **NÃO EDITAR:**
- `/src/app/components/figma/ImageWithFallback.tsx`

---

**FIM DA LISTA COMPLETA DE ARQUIVOS .TSX**
