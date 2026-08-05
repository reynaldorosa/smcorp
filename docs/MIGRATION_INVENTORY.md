# 📋 Inventário de Migração - Figma → Frontend

## 🎯 ENTENDENDO A MIGRAÇÃO

### O que vai acontecer:
1. **53 componentes** do Figma serão importados para o projeto `frontend`
2. O **menu lateral** do frontend será mantido (já está pronto e melhor estruturado)
3. Cada **Módulo (00-09)** virará uma **rota Next.js** (página separada)
4. O **Context gigante** (4478 linhas) será substituído por **Zustand stores**
5. Os **dados de LocalStorage** virão da **API backend**

### Diferença de Navegação:

| Figma (SPA) | Frontend (Next.js) |
|-------------|-------------------|
| Navegação por estado (`moduloAtivo`) | Navegação por URL (`/dashboard/courses`) |
| Menu horizontal no topo | Menu lateral (sidebar) |
| Tudo em uma página | Cada módulo = página separada |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Como saber que tudo foi migrado corretamente:

Execute este comando no terminal para verificar:
```powershell
# Verificar se todos os componentes foram migrados
.\scripts\validate-migration.ps1
```

---

## 📦 INVENTÁRIO COMPLETO

### 🔷 MÓDULOS (10 arquivos)
Cada módulo vira uma página em `/app/(dashboard)/[modulo]/page.tsx`

| # | Componente Figma | Rota Next.js | Status |
|---|------------------|--------------|--------|
| 1 | `Modulo00.tsx` (Infraestrutura) | `/dashboard/settings` | ⬜ Pendente |
| 2 | `Modulo01.tsx` (Catálogo Cursos) | `/dashboard/courses` | ⬜ Pendente |
| 3 | `Modulo02.tsx` (Turmas) | `/dashboard/classes` | ⬜ Pendente |
| 4 | `Modulo03.tsx` (Operacional) | `/dashboard/operacional` | ⬜ Pendente |
| 5 | `Modulo04.tsx` (Vendas) | `/dashboard/vendas` | ⬜ Pendente |
| 6 | `Modulo05.tsx` (Cliente PJ) | `/dashboard/cliente-pj` | ⬜ Pendente |
| 7 | `Modulo06.tsx` (Documentos) | `/dashboard/documents` | ⬜ Pendente |
| 8 | `Modulo06Detalhado.tsx` | `/dashboard/documents/[id]` | ⬜ Pendente |
| 9 | `Modulo07.tsx` (Pagamentos) | `/dashboard/pagamentos` | ⬜ Pendente |
| 10 | `Modulo08.tsx` (Financeiro) | `/dashboard/financial` | ⬜ Pendente |
| 11 | `Modulo09.tsx` (Dashboard) | `/dashboard` | ⬜ Pendente |

---

### 🔷 DIALOGS (23 arquivos)
Destino: `/frontend/src/components/dialogs/`

| # | Componente | Descrição | Status |
|---|------------|-----------|--------|
| 1 | `DialogAdicionarAlunoIndividual.tsx` | Adicionar aluno avulso | ✅ Migrado |
| 2 | `DialogAdicionarFilaEspera.tsx` | Fila de espera | ⬜ Pendente |
| 3 | `DialogAdicionarInstrutor.tsx` | Cadastrar instrutor | ✅ Migrado |
| 4 | `DialogAgendarProva.tsx` | Agendar prova | ✅ Migrado |
| 5 | `DialogAprovarAlunosImportados.tsx` | Aprovar importação | ⬜ Pendente |
| 6 | `DialogAutorizarLotePagamento.tsx` | Autorizar lote | ⬜ Pendente |
| 7 | `DialogAutorizarPagamento.tsx` | Autorizar pagamento | ⬜ Pendente |
| 8 | `DialogConfirmarPagamento.tsx` | Confirmar pagamento | ✅ Migrado |
| 9 | `DialogCustosInstrutor.tsx` | Custos do instrutor | 🔄 Refatorar |
| 10 | `DialogDocumentosAluno.tsx` | Documentos do aluno | ✅ Migrado |
| 11 | `DialogEditarClientePJ.tsx` | Editar empresa | 🔄 Refatorar (619 linhas) |
| 12 | `DialogEmpresa.tsx` | Cadastrar empresa | ✅ Migrado |
| 13 | `DialogExcluirLancamento.tsx` | Excluir lançamento | ✅ Migrado |
| 14 | `DialogListaPresenca.tsx` | Lista de presença | ⬜ Pendente |
| 15 | `DialogPagamento.tsx` | Registrar pagamento | 🔄 Refatorar (779 linhas) |
| 16 | `DialogPermissoesUsuario.tsx` | Permissões | ✅ Migrado |
| 17 | `DialogPrecificacoesEmpresa.tsx` | Precificação empresa | ⬜ Pendente |
| 18 | `DialogProvasInstrutor.tsx` | Provas do instrutor | ⬜ Pendente |
| 19 | `DialogRelatorioInstrutor.tsx` | Relatório instrutor | ⬜ Pendente |
| 20 | `DialogRelatorioTurma.tsx` | Relatório turma | ⬜ Pendente |
| 21 | `DialogResultadoProva.tsx` | Resultado da prova | ✅ Migrado |
| 22 | `DialogSelecionarSubstituto.tsx` | Selecionar substituto | ⬜ Pendente |
| 23 | `DialogTransferirTurma.tsx` | Transferir turma | ✅ Migrado |
| 24 | `DialogUploadPlanilha.tsx` | Upload de planilha | ⬜ Pendente |

---

### 🔷 CARDS (4 arquivos)
Destino: `/frontend/src/components/cards/`

| # | Componente | Descrição | Status |
|---|------------|-----------|--------|
| 1 | `CardAluno.tsx` | Card do aluno | ⬜ Pendente |
| 2 | `CardInstrutorTurma.tsx` | Card instrutor na turma | ⬜ Pendente |
| 3 | `CardLancamentoAgrupado.tsx` | Lançamentos agrupados | ⬜ Pendente |
| 4 | `CardLoteModulo08.tsx` | Lote financeiro | ⬜ Pendente |

---

### 🔷 FORMS E PAGES (5 arquivos)
Destino: `/frontend/src/components/forms/`

| # | Componente | Descrição | Status |
|---|------------|-----------|--------|
| 1 | `FormularioMatricula.tsx` | Formulário de matrícula | ⬜ Pendente |
| 2 | `PaginaMatriculaAluno.tsx` | Página pública do aluno | ⬜ Pendente |
| 3 | `DocumentoAdministrativo.tsx` | Documento admin | ⬜ Pendente |
| 4 | `EditorFoto.tsx` | Editor de foto | ⬜ Pendente |
| 5 | `AbaLancamentosCusto.tsx` | Aba de lançamentos | ⬜ Pendente |

---

### 🔷 UTILITÁRIOS (8 arquivos)
Destino: `/frontend/src/components/` ou `/lib/`

| # | Componente | Descrição | Status |
|---|------------|-----------|--------|
| 1 | `Layout.tsx` | Layout do Figma (adaptar) | ⬜ Pendente |
| 2 | `ErrorBoundary.tsx` | Tratamento de erros | ⬜ Pendente |
| 3 | `ContextGuard.tsx` | Guard de contexto | ⬜ Pendente |
| 4 | `AvisoArmazenamentoLocal.tsx` | Aviso de storage | ⬜ Pendente |
| 5 | `BackupDados.tsx` | Backup de dados | ⬜ Pendente |
| 6 | `DiagnosticoPersistencia.tsx` | Diagnóstico | ⬜ Pendente |
| 7 | `DownloadProjetoCompleto.tsx` | Download projeto | ⬜ Pendente |
| 8 | `LimparDados.tsx` | Limpar dados | ⬜ Pendente |
| 9 | `MigracaoDadosIRATA.tsx` | Migração IRATA | ⬜ Pendente |

---

---

### 🔷 CONTEXTS (2 arquivos)
O Context gigante será dividido em múltiplas Zustand stores

| # | Arquivo | Linhas | Destino | Status |
|---|---------|--------|---------|--------|
| 1 | `SMCorpContext.tsx` | **4270** | Dividir em ~8 stores Zustand | ⬜ Pendente |
| 2 | `ThemeContext.tsx` | ~50 | Usar `next-themes` | ⬜ Pendente |

**Mapeamento SMCorpContext → Zustand Stores:**

| Entidade no Context | Store Zustand | Linhas aprox. |
|---------------------|---------------|---------------|
| `DadosInstitucionais`, `Salas`, `Fornecedores` | `settings.store.ts` | ~300 |
| `Curso`, `ProdutoExtra` | `courses.store.ts` | ~200 |
| `Turma` | `classes.store.ts` | ~200 |
| `Aluno`, `Matricula` | `students.store.ts` | ~400 |
| `Instrutor` | `instructors.store.ts` | ~200 |
| `ClientePJ`, `PrecificacaoEmpresa` | `companies.store.ts` | ~200 |
| `LancamentoCusto`, `CustoAuditavel`, `CriterioCusto` | `costs.store.ts` | ~500 |
| `Usuario`, `Permissoes` | `auth.store.ts` ✅ (já existe) | ~150 |
| Dashboard stats, filtros | `dashboard.store.ts` | ~100 |

---

### 🔷 HOOKS (1 arquivo)
Destino: `/frontend/src/hooks/`

| # | Arquivo | Descrição | Destino | Status |
|---|---------|-----------|---------|--------|
| 1 | `usePersistedState.ts` | Persistência localStorage | Zustand `persist` middleware | ⬜ Substituir |

> **Nota:** O hook `usePersistedState` será **substituído** pelo middleware `persist` do Zustand, que já faz a mesma coisa de forma mais integrada.

---

### 🔷 UTILS (2 arquivos)
Destino: `/frontend/src/lib/`

| # | Arquivo | Linhas | Descrição | Status |
|---|---------|--------|-----------|--------|
| 1 | `gerarCustosInteligentes.ts` | 309 | Geração automática de custos | ⬜ Pendente |
| 2 | `permissoes.ts` | 105 | Permissões por nível de usuário | ⬜ Pendente |

---

## 📊 RESUMO COMPLETO

| Categoria | Total | Migrados | Pendentes |
|-----------|-------|----------|-----------|
| Módulos (pages) | 11 | 0 | 11 |
| Dialogs | 24 | 0 | 24 |
| Cards | 4 | 0 | 4 |
| Forms/Pages | 5 | 0 | 5 |
| Utilitários | 9 | 0 | 9 |
| **Contexts** | **2** | **0** | **2** |
| **Hooks** | **1** | **0** | **1** |
| **Utils** | **2** | **0** | **2** |
| **TOTAL** | **58** | **0** | **58** |

### 📈 Linhas de Código a Migrar

| Categoria | Linhas Estimadas |
|-----------|------------------|
| SMCorpContext.tsx | 4.270 |
| Módulos (00-09) | ~15.000 |
| Dialogs (24) | ~6.000 |
| Cards (4) | ~800 |
| Utils (2) | ~414 |
| Outros | ~1.500 |
| **TOTAL** | **~28.000 linhas** |

---

## 🔄 MAPEAMENTO DE IMPORTS

Ao migrar cada componente, trocar:

| Import Antigo (Figma) | Import Novo (Frontend) |
|-----------------------|------------------------|
| `@/app/components/ui/` | `@/components/ui/` |
| `@/app/contexts/SMCorpContext` | `@/stores/` (Zustand) |
| `@/app/contexts/ThemeContext` | `next-themes` |
| `@/app/utils/` | `@/lib/` |
| `useSMCorp()` | `useXxxStore()` (Zustand) |
| `useState` para dados | `useQuery` (React Query) |

---

## ✅ CRITÉRIOS DE SUCESSO

A migração está completa quando:

1. [ ] Todos os 53 componentes estão em `/frontend/src/components/`
2. [ ] Todas as 10 rotas de módulos funcionam
3. [ ] Nenhum import de `@/app/contexts/SMCorpContext`
4. [ ] Nenhuma dependência de MUI
5. [ ] Dados vêm da API (não LocalStorage)
6. [ ] Build passa sem erros: `npm run build`
7. [ ] Todos os dialogs abrem e fecham corretamente
8. [ ] Menu lateral navega para todos os módulos

---

## 🚀 PRÓXIMOS PASSOS

1. **Fase 0**: Instalar componentes shadcn/ui faltantes
2. **Fase 1**: Criar pastas de destino
3. **Fase 2**: Migrar dialogs (são usados em múltiplos módulos)
4. **Fase 3**: Migrar cards
5. **Fase 4**: Migrar cada módulo, um por vez
6. **Fase 5**: Validar tudo funciona

---

*Atualizado em: 04/02/2026*
