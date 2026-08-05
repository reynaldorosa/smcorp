# Auditoria de Código — PortalFigma x Frontend Real

**Data:** 14/02/2026  
**Escopo:** comparação direta de código entre:
- `portalsmcorpfigma/src/app/components/**`
- `frontend/src/**`

## 1) Método aplicado

1. Inventário de arquivos TS/TSX em ambos os lados.
2. Comparação automática por nome base (apenas apoio, com alto falso-negativo por renome).
3. Auditoria manual dos módulos 00→09 no código fonte.
4. Validação de integração real via rotas/páginas/imports no frontend ativo.

---

## 2) Resultado executivo

- **Paridade funcional de código (core): ALTA** no frontend real.
- **Paridade nominal de arquivos:** baixa (esperado), pois houve refactor estrutural:
  - Figma: app único (Vite), componentes em PT-BR e módulos monolíticos.
  - Frontend real: Next App Router, componentes fatiados em domínio, naming em inglês.
- **Conclusão:** a maioria dos itens “sem match por nome” possui equivalente funcional ativo no frontend.

---

## 3) Evidência de mapeamento de módulos

### 3.1 Referência Figma (módulos em App monolítico)
- `portalsmcorpfigma/src/app/App.tsx` faz dispatch de `Modulo00` a `Modulo09`.

### 3.2 Frontend real (rotas + gate por módulo)
- Regras canônicas em `frontend/src/lib/route-module-map.ts`:
  - `/settings` → `modulo00`
  - `/courses` → `modulo01`
  - `/classes` → `modulo02`
  - `/operacional` → `modulo03`
  - `/documents` → `modulo04`
  - `/vendas` e `/crm` → `modulo05`
  - `/cliente-pj` → `modulo06`
  - `/pagamentos`, `/costs`, `/financial` → `modulo07 OR modulo08`

---

## 4) Matriz de equivalência (código real)

| PortalFigma | Frontend real (equivalente) | Status |
|---|---|---|
| `DiagnosticoPersistencia.tsx` | `frontend/src/components/settings/persistence-diagnostic.tsx` | ✅ |
| `DialogAdicionarAlunoIndividual.tsx` | `frontend/src/components/operational/dialogs/enrollment-form.tsx` | ✅ |
| `DialogAdicionarFilaEspera.tsx` | `frontend/src/components/operational/dialogs/add-waiting-list-dialog.tsx` | ✅ |
| `DialogAdicionarInstrutor.tsx` | `frontend/src/components/operational/dialogs/add-instructor-dialog.tsx` | ✅ |
| `DialogAgendarProva.tsx` | `frontend/src/components/operational/dialogs/schedule-exam-dialog.tsx` | ✅ |
| `DialogAprovarAlunosImportados.tsx` | `frontend/src/components/operational/dialogs/approve-imported-students-dialog.tsx` | ✅ |
| `DialogAutorizarPagamento.tsx` | `frontend/src/components/dialogs/authorize-payment-dialog.tsx` | ✅ |
| `DialogAutorizarLotePagamento.tsx` | `frontend/src/components/dialogs/batch-payment-dialog.tsx` | ✅ |
| `DialogConfirmarPagamento.tsx` | `frontend/src/components/financial/dialogs/confirm-payment-dialog.tsx` | ✅ |
| `DialogCustosInstrutor.tsx` | `frontend/src/components/operational/dialogs/instructor-costs-dialog.tsx` e `frontend/src/components/settings/dialogs/instructor-costs-dialog.tsx` | ✅ |
| `DialogDocumentosAluno.tsx` | `frontend/src/components/operational/dialogs/student-documents-dialog.tsx` e `frontend/src/components/dialogs/student-documents-dialog.tsx` | ✅ |
| `DialogEditarClientePJ.tsx` | `frontend/src/components/settings/dialogs/edit-company-client-dialog.tsx` | ✅ |
| `DialogEmpresa.tsx` | `frontend/src/components/settings/dialogs/company-dialog.tsx` | ✅ |
| `DialogExcluirLancamento.tsx` | `frontend/src/components/financial/dialogs/delete-cost-entry-dialog.tsx` | ✅ |
| `DialogListaPresenca.tsx` | `frontend/src/components/operational/dialogs/attendance-list-dialog.tsx` | ✅ |
| `DialogPagamento.tsx` | `frontend/src/components/operational/dialogs/payment-dialog.tsx` e `frontend/src/components/dialogs/payment-dialog.tsx` | ✅ |
| `DialogPermissoesUsuario.tsx` | `frontend/src/components/settings/dialogs/user-permissions-dialog.tsx` | ✅ |
| `DialogPrecificacoesEmpresa.tsx` | `frontend/src/components/settings/dialogs/company-pricing-dialog.tsx` | ✅ |
| `DialogProvasInstrutor.tsx` | `frontend/src/components/operational/dialogs/instructor-exams-dialog.tsx` | ✅ |
| `DialogRelatorioInstrutor.tsx` | `frontend/src/components/settings/dialogs/instructor-report-dialog.tsx` | ✅ |
| `DialogRelatorioTurma.tsx` | `frontend/src/components/operational/dialogs/class-report-dialog.tsx` | ✅ |
| `DialogResultadoProva.tsx` | `frontend/src/components/operational/dialogs/exam-result-dialog.tsx` | ✅ |
| `DialogSelecionarSubstituto.tsx` | `frontend/src/components/operational/dialogs/select-substitute-dialog.tsx` | ✅ |
| `DialogTransferirTurma.tsx` | `frontend/src/components/operational/dialogs/transfer-class-dialog.tsx` | ✅ |
| `DialogUploadPlanilha.tsx` | `frontend/src/components/dialogs/upload-spreadsheet-dialog.tsx` | ✅ |
| `DocumentoAdministrativo.tsx` | `frontend/src/components/documents/administrative-document.tsx` | ✅ |
| `DownloadProjetoCompleto.tsx` | `frontend/src/components/settings/download-complete-project.tsx` | ✅ |
| `EditorFoto.tsx` | `frontend/src/components/shared/editor-foto.tsx` e `frontend/src/components/documents/photo-editor.tsx` | ✅ |
| `PaginaMatriculaAluno.tsx` | `frontend/src/components/enrollment/student-enrollment-page.tsx` + `frontend/src/app/enrollment/[code]/page.tsx` | ✅ |
| `CardLoteModulo08.tsx` | `frontend/src/components/financial/financial-batch-card.tsx` | ✅ |
| `CardLancamentoAgrupado.tsx` | `frontend/src/components/financial/grouped-entry-card.tsx` | ✅ |
| `AbaLancamentosCusto.tsx` | `frontend/src/components/financial/cost-entries-tab.tsx` | ✅ |
| `gerarReciboHelper.ts` | `frontend/src/lib/generate-receipt.ts` | ✅ |
| `figma/ImageWithFallback.tsx` | `frontend/src/components/ui/image-with-fallback.tsx` | ✅ |

---

## 5) Gaps reais encontrados (código)

### GAP-01 — Arquivo legado de permissões com mapeamento antigo
- **Status:** ✅ **Corrigido em 14/02/2026**.
- O arquivo legado `frontend/src/components/dialogs/user-permissions-dialog.tsx` foi convertido em proxy para a versão canônica em `frontend/src/components/settings/dialogs/user-permissions-dialog.tsx`.
- Também foi mantida compatibilidade de tipagem no barrel legado `frontend/src/components/dialogs/index.ts`.

### GAP-02 — Inconsistência textual de numeração de módulo
- **Status:** ✅ **Corrigido em 14/02/2026**.
- `frontend/src/components/settings/communications-tab.tsx` foi ajustado para “Módulo 05 - Central de Vendas”.
- Durante a continuação da auditoria, foram identificados e corrigidos também pontos em:
  - `frontend/src/components/settings/companies-tab.tsx`
  - `frontend/src/components/settings/dialogs/edit-company-client-dialog.tsx`
- Ajuste aplicado: “Área do Cliente” alinhada para **Módulo 06** (consistente com `route-module-map.ts`).

### GAP-03 — Dupla rota financeira ativa (`/costs` e `/financial`)
- **Status:** ✅ **Mitigado em 14/02/2026**.
- A rota `frontend/src/app/(dashboard)/financial/page.tsx` foi convertida para redirect server-side para `/costs`.
- Resultado: superfície funcional financeira unificada, preservando compatibilidade de URL antiga.

### GAP-04 — Inconsistências remanescentes após rodada de correção
- **Status:** ✅ **Não encontrado gap crítico novo** na continuação da auditoria de código.
- Varredura textual e checagem de erros não apontaram divergências adicionais relevantes no escopo auditado (mapeamento de módulos e paridade funcional core).

---

## 6) Veredito da auditoria de código

- **Não há evidência de ausência funcional massiva** entre PortalFigma e frontend real.
- O que há é principalmente **refatoração de arquitetura e renomeação de componentes**.
- Pendências identificadas são de **higiene/consistência técnica** (legado textual e duplicidade de superfície financeira), não de quebra do core.

---

## 7) Ação recomendada imediata (curta)

1. Manter verificação de regressão textual de módulos no checklist de release (evitar drift entre label e gate).
2. Preservar `/financial` apenas como alias de compatibilidade (redirect), sem evoluir lógica própria nessa rota.
3. Opcional: consolidar documentação com esta rodada de correção no relatório principal de auditoria funcional.

---

## 8) Atualização de execução (14/02/2026)

- Correções aplicadas no código e validadas sem erros locais nos arquivos alterados.
- Auditoria continuada concluída para o escopo solicitado (`portalsmcorpfigma` x `frontend`) com foco em paridade funcional e consistência canônica de módulos.
