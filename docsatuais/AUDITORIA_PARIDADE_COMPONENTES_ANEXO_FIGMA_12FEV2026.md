# Auditoria de Paridade dos Componentes (Anexo Figma) vs Frontend Ativo

**Data:** 12/02/2026  
**Escopo analisado:** `portalsmcorpfigma/src/app/components` (anexo) vs `frontend/src/components` + `frontend/src/app`  
**Objetivo:** avaliar paridade estrutural e funcional dos arquivos anexados no frontend de produção.

---

## 1) Metodologia

1. Inventário completo dos arquivos anexados (TS/TSX).
2. Comparação automática de nomes (paridade nominal direta).
3. Mapeamento funcional por domínio (módulos, dialogs, cards, utilitários).
4. Classificação em:
   - **Paridade Direta** (mesmo arquivo/nome)
   - **Paridade Funcional** (equivalente ativo com outro nome/local)
   - **Paridade Parcial** (equivalente incompleto/deslocado)
   - **Sem Equivalente Ativo**

---

## 2) Resultado quantitativo

- Arquivos no anexo Figma (`components`): **103**
- Arquivos core (raiz de `components`, sem `ui/`): **54**
- Match nominal direto (core): **1/54** (`ErrorBoundary.tsx`)
- Match nominal direto baixo é esperado por diferença de nomenclatura (PT-BR/camelCase no Figma vs nomes em inglês/kebab-case no frontend).

### UI primitives (`components/ui`)

- Figma UI: **48**
- Frontend UI: **50**
- Interseção exata por caminho relativo: **45**

**Somente no Figma UI:**
- `ui/pagination.tsx`
- `ui/sidebar.tsx`
- `ui/utils.ts`

**Equivalentes no frontend (fora de `ui/` ou renomeados):**
- `ui/pagination.tsx` → `components/ui/pagination-controls.tsx` (funcional)
- `ui/sidebar.tsx` → `components/layout/sidebar.tsx` (funcional)
- `ui/utils.ts` → `lib/utils.ts` (funcional)

**Somente no frontend UI (extensões locais):**
- `components/ui/confirmation-dialog.tsx`
- `components/ui/image-with-fallback.tsx`
- `components/ui/pagination-controls.tsx`
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`

---

## 3) Matriz de paridade funcional (core)

## 3.1 Módulos (`Modulo00..09`)

| Figma | Frontend ativo | Status |
|---|---|---|
| `Modulo00.tsx` | `app/(dashboard)/settings/page.tsx` | ✅ Funcional |
| `Modulo01.tsx` | `app/(dashboard)/courses/page.tsx` | ✅ Funcional |
| `Modulo02.tsx` | `app/(dashboard)/classes/page.tsx` | ✅ Funcional |
| `Modulo03.tsx` | `app/(dashboard)/operacional/page.tsx` | ✅ Funcional |
| `Modulo04.tsx` | `app/(dashboard)/documents/page.tsx` | ✅ Funcional |
| `Modulo05.tsx` | `app/(dashboard)/vendas/page.tsx` + `app/(dashboard)/crm/page.tsx` | ✅ Funcional |
| `Modulo06.tsx` | `app/(dashboard)/cliente-pj/page.tsx` | ✅ Funcional |
| `Modulo06Detalhado.tsx` | `app/portal-cliente/dashboard/page.tsx` + `components/documents/*` | ✅ Funcional |
| `Modulo07.tsx` | `app/(dashboard)/pagamentos/page.tsx` | ✅ Funcional |
| `Modulo08.tsx` | `app/(dashboard)/financial/page.tsx` + `app/(dashboard)/costs/page.tsx` | ✅ Funcional |
| `Modulo09.tsx` | `app/(dashboard)/dashboard/page.tsx` + `components/dashboard/dashboard-tabs.tsx` | ✅ Funcional |

## 3.2 Dialogs principais

| Figma | Frontend ativo equivalente | Status |
|---|---|---|
| `DialogAdicionarAlunoIndividual.tsx` | `components/dialogs/add-student-dialog.tsx` | ✅ Funcional |
| `DialogAdicionarFilaEspera.tsx` | `components/operational/dialogs/add-waiting-list-dialog.tsx` | ✅ Funcional |
| `DialogAdicionarInstrutor.tsx` | `components/operational/dialogs/add-instructor-dialog.tsx` | ✅ Funcional |
| `DialogAgendarProva.tsx` | `components/dialogs/schedule-exam-dialog.tsx` + `operational/dialogs/schedule-exam-dialog.tsx` | ✅ Funcional |
| `DialogAprovarAlunosImportados.tsx` | `components/operational/dialogs/approve-imported-students-dialog.tsx` | ✅ Funcional |
| `DialogAutorizarLotePagamento.tsx` | `components/dialogs/batch-payment-dialog.tsx` | ✅ Funcional |
| `DialogAutorizarPagamento.tsx` | `components/dialogs/authorize-payment-dialog.tsx` | ✅ Funcional |
| `DialogConfirmarPagamento.tsx` | `components/financial/dialogs/confirm-payment-dialog.tsx` | ✅ Funcional |
| `DialogCustosInstrutor.tsx` | `components/dialogs/instructor-costs-dialog.tsx` + `operational/dialogs/instructor-costs-dialog.tsx` | ✅ Funcional |
| `DialogDocumentosAluno.tsx` | `components/dialogs/student-documents-dialog.tsx` + `operational/dialogs/student-documents-dialog.tsx` | ✅ Funcional |
| `DialogEditarClientePJ.tsx` | `components/settings/dialogs/edit-company-client-dialog.tsx` | ✅ Funcional |
| `DialogEmpresa.tsx` | `components/settings/dialogs/company-dialog.tsx` | ✅ Funcional |
| `DialogExcluirLancamento.tsx` | `components/financial/dialogs/delete-cost-entry-dialog.tsx` | ✅ Funcional |
| `DialogListaPresenca.tsx` | `components/dialogs/attendance-list-dialog.tsx` + `operational/dialogs/attendance-list-dialog.tsx` | ✅ Funcional |
| `DialogPagamento.tsx` | `components/dialogs/payment-dialog.tsx` + `operational/dialogs/payment-dialog.tsx` | ✅ Funcional |
| `DialogPermissoesUsuario.tsx` | `components/dialogs/user-permissions-dialog.tsx` + `settings/dialogs/user-permissions-dialog.tsx` | ✅ Funcional |
| `DialogPrecificacoesEmpresa.tsx` | `components/settings/dialogs/company-pricing-dialog.tsx` | ✅ Funcional |
| `DialogProvasInstrutor.tsx` | `components/operational/dialogs/instructor-exams-dialog.tsx` | ✅ Funcional |
| `DialogRelatorioInstrutor.tsx` | `components/settings/dialogs/instructor-report-dialog.tsx` | ✅ Funcional |
| `DialogRelatorioTurma.tsx` | `components/operational/dialogs/class-report-dialog.tsx` | ✅ Funcional |
| `DialogResultadoProva.tsx` | `components/operational/dialogs/exam-result-dialog.tsx` | ✅ Funcional |
| `DialogSelecionarSubstituto.tsx` | `components/operational/dialogs/select-substitute-dialog.tsx` | ✅ Funcional |
| `DialogTransferirTurma.tsx` | `components/operational/dialogs/transfer-class-dialog.tsx` | ✅ Funcional |
| `DialogUploadPlanilha.tsx` | `components/dialogs/upload-spreadsheet-dialog.tsx` | ✅ Funcional |

## 3.3 Cards / abas / utilitários específicos

| Figma | Frontend ativo equivalente | Status |
|---|---|---|
| `AbaLancamentosCusto.tsx` | `components/financial/cost-entries-tab.tsx` | ✅ Funcional |
| `CardAluno.tsx` | `components/students/student-card/student-card.tsx` | ✅ Funcional |
| `CardInstrutorTurma.tsx` | `components/operational/class-details-panel.tsx` (painel de instrutor/turma) | ✅ Funcional |
| `CardLancamentoAgrupado.tsx` | `components/financial/grouped-entry-card.tsx` | ✅ Funcional |
| `CardLoteModulo08.tsx` | `components/financial/financial-batch-card.tsx` | ✅ Funcional |
| `DocumentoAdministrativo.tsx` | `components/documents/administrative-document.tsx` | ✅ Funcional |
| `AvisoArmazenamentoLocal.tsx` | `components/common/local-storage-warning.tsx` | ✅ Funcional |
| `BackupDados.tsx` | `components/settings/backup-tab.tsx` | ✅ Funcional |
| `DiagnosticoPersistencia.tsx` | `components/settings/persistence-diagnostic.tsx` | ✅ Funcional |
| `DownloadProjetoCompleto.tsx` | `components/settings/download-complete-project.tsx` | ✅ Funcional |
| `EditorFoto.tsx` | `components/shared/editor-foto.tsx` + `components/documents/photo-editor.tsx` | ✅ Funcional |
| `FormularioMatricula.tsx` | `components/operational/dialogs/enrollment-form.tsx` | ✅ Funcional |
| `PaginaMatriculaAluno.tsx` | `components/enrollment/student-enrollment-page.tsx` + `app/enrollment/[code]/page.tsx` | ✅ Funcional |
| `gerarReciboHelper.ts` | `lib/generate-receipt.ts` | ✅ Funcional |
| `Layout.tsx` | `app/(dashboard)/layout.tsx` + `components/layout/*` | ✅ Funcional |
| `LimparDados.tsx` | `components/settings/clear-data.tsx` | ✅ Funcional |
| `MigracaoDadosIRATA.tsx` | `components/settings/irata-data-migration.tsx` | ✅ Funcional |
| `ContextGuard.tsx` | Guarda equivalente distribuída em `app/(dashboard)/layout.tsx` + auth/permission guards | ✅ Funcional |

---

## 4) Pendências reais identificadas nesta auditoria

### 4.1 Pendência funcional (integração externa)

- **WhatsApp real (envio/recebimento persistente)** no CRM/vendas/documentos ainda é pendência de integração externa (já mapeada na auditoria principal).

### 4.2 Sem bloqueios críticos de paridade estrutural

- Não foram encontrados gaps críticos novos de paridade para o ciclo M00→M09 no frontend ativo com base no anexo.

---

## 5) Conclusão

- A paridade **nominal** entre anexo Figma e frontend é naturalmente baixa (diferença de naming e estrutura), mas a paridade **funcional** dos componentes core está **alta** no frontend ativo.
- O frontend atual mantém equivalentes operacionais para módulos, dialogs, cards e utilitários principais do anexo.
- O foco de evolução restante continua sendo integração externa (mensageria real), não reimplementação estrutural de componentes.
