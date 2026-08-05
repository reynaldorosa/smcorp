# 🔍 AUDITORIA COMPLETA: Figma (SMCorpContext.tsx) vs Frontend

**Data:** 07/02/2026  
**Arquivo Referência:** `portalsmcorpfigma/src/app/contexts/SMCorpContext.tsx` (4478 linhas)  
**Frontend:** `frontend/src/stores/`, `frontend/src/types/`, `frontend/src/services/`

---

## 1. COMPARAÇÃO DE INTERFACES

### 1.1 DadosInstitucionais → InstitutionalData 🔄 DIFERENTE (completo)

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `nome` | `name` | ✅ |
| `razaoSocial` | `legalName?` | ✅ |
| `cnpj` | `companyTaxId` | ✅ |
| `endereco` | `address` | ✅ |
| `telefone` | `phone` | ✅ |
| `email` | `email` | ✅ |
| `site` | `website?` | ✅ |
| `cor` | `brandColor?` | ✅ |
| `contaCorrente?` | `bankAccount?` | ✅ |
| `agencia?` | `bankAgency?` | ✅ |
| `banco?` | `bankName?` | ✅ |
| `chavePix?` | `pixKey?` | ✅ |
| `caixaFisico?` | `cashBox?` | ✅ (tipo number — corrigido) |
| `observacoesCaixa?` | `cashNotes?` | ✅ |
| — | `id` | 🆕 Frontend extra |
| — | `city`, `state`, `zipCode` | 🆕 Frontend mais granular |
| — | `logo?` | 🆕 Frontend extra |

**Status: 🔄 DIFERENTE** — Todos os campos Figma mapeados. Frontend adicionou `id`, `city`, `state`, `zipCode`, `logo` (melhorias).

---

### 1.2 ConfiguracoesEmail → EmailConfig ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `remetente` | `fromEmail` + `fromName` | ✅ (separado em 2) |
| `host` | `smtpHost` | ✅ |
| `porta` | `smtpPort` | ✅ |
| `usuario` | `smtpUser` | ✅ |
| `senha` | `smtpPassword` | ✅ |
| `ativo` | `active?` | ✅ |
| — | `id`, `useSsl` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Mapeamento completo com melhorias.

---

### 1.3 ConfiguracoesWhatsApp → WhatsAppConfig ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `numero` | `number?` | ✅ |
| `apiKey` | `apiKey` | ✅ |
| `webhookUrl` | `webhookUrl?` | ✅ |
| `ativo` | `enabled` | ✅ |
| `mensagemPadrao?` | `defaultMessage?` | ✅ |
| — | `id`, `instanceId` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.4 Sala → Room ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `nome` | `name` | ✅ |
| `localizacao` | `location?` | ✅ |
| `capacidadeMaxima` | `capacity` | ✅ |
| `custoDiaria` | `dailyCost?` | ✅ |
| — | `address?`, `active` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.5 Usuario → User (settings.store) ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code?` | ✅ |
| `nome` | `name` | ✅ |
| `nivel` ('Master'\|'Admin'\|'Vendedor') | `role` (AppUserRole: 'Master'\|'Admin'\|'Seller') | ✅ |
| `pin?` | `pin?` | ✅ |
| `permissoes.modulos` (modulo00-08) | `permissions.modulos` (9 módulos idênticos) | ✅ |
| `permissoes.acoes` (17 ações) | `permissions.acoes` (17 ações idênticas) | ✅ |
| — | `email`, `active`, `createdAt` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — `UserPermissions` em `lib/user-permissions.ts` tem estrutura idêntica ao Figma: `modulos` (9 booleans: modulo00-08) + `acoes` (17 booleans: cadastrarAluno, editarAluno, etc.). Dialog de permissões granulares implementado em `user-permissions-dialog.tsx`.

---

### 1.6 ClientePJ → Company ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `nome` | `name` | ✅ |
| `cnpj` | `companyTaxId` | ✅ |
| `razaoSocial?` | `tradeName?` | ✅ |
| `endereco?` | `address?` | ✅ |
| `telefone?` | `phone?` | ✅ |
| `email?` | `email?` | ✅ |
| `precificacoes[]` | `pricing?[]` | ✅ |
| `formasPagamentoPermitidas?` | `allowedPaymentMethods?` | ✅ |
| `login?` | `portalLogin?` | ✅ |
| `senha?` | `portalPassword?` | ✅ |
| `acessoAtivo?` | `portalAccess` | ✅ |
| `cursoId?` | — | ❌ Removido (correto, era legacy) |
| `precificacaoNegociada` | — | ❌ Removido (correto, substituído por pricing[]) |
| — | `contacts?[]`, `city`, `state`, `zipCode`, `notes?`, `active`, timestamps | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo e melhorado.

---

### 1.7 PrecificacaoEmpresa → CompanyPricing ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `cursoId` | `courseId` | ✅ |
| `valorNegociado` | `finalPrice` | ✅ |
| `produtosInclusos[]` | `includedProductIds?[]` | ✅ |
| `observacoes?` | `notes?` | ✅ |
| `dataVigencia?` | `validUntil?` | ✅ |
| `ativo` | `active?` | ✅ |
| — | `basePrice`, `discountPercent?` | 🆕 Frontend extra (mais granular) |

**Status: ✅ IMPLEMENTADO** — Completo, com desconto separado.

---

### 1.8 CustoAuditavel → AuditableCost ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `nome` | `name` | ✅ |
| `valor` | `value` | ✅ |
| `fornecedorId?` | `supplierId?` | ✅ |
| `clientePJId?` | `companyId?` | ✅ |
| `criterioCustoId?` | `costCriterionId?` | ✅ |
| `tipoVinculo?` | `linkType?` | ✅ |
| `instrutorId?` | `instructorId?` | ✅ |
| — | `active` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Mapeamento 1:1 completo.

---

### 1.9 LancamentoCusto → CostEntry ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `custoAuditavelId` | `auditableCostId` | ✅ |
| `criterioCustoId?` | `costCriterionId?` | ✅ |
| `alunoId?` | `studentId?` | ✅ |
| `turmaId?` | `classId?` | ✅ |
| `cursoId?` | `courseId?` | ✅ |
| `fornecedorId?` | `supplierId?` | ✅ |
| `instrutorId?` | `instructorId?` | ✅ |
| `numeroProva?` | `examNumber?` | ✅ |
| `nomeProva?` | `examName?` | ✅ |
| `valor` | `value` | ✅ |
| `dataGeracao` | `generatedAt` | ✅ |
| `dataVencimento` | `dueDate` | ✅ |
| `status` | `status` | ✅ (traduzido para EN) |
| `dataPagamento?` | `paidAt?` | ✅ |
| `observacoes?` | `notes?` | ✅ |
| `geradoAutomaticamente` | `autoGenerated` | ✅ |
| `acaoDisparo?` | `triggerAction?` | ✅ |

**Status: ✅ IMPLEMENTADO** — Mapeamento 1:1 completo.

---

### 1.10 CriterioCusto → CostCriterion ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `nome` | `name` | ✅ |
| `frequenciaLancamento` | `frequency` | ✅ (EN equivalents) |
| `vinculo` | `linkage` | ✅ (EN equivalents) |
| `criterioVencimento` | `dueCriterion` | ✅ (EN equivalents) |
| `diasParaVencimento?` | `daysUntilDue?` | ✅ |
| `diaFechamentoMensal?` | `monthlyClosingDay?` | ✅ |
| `diasPagamentoAposFechamento?` | `daysAfterClosing?` | ✅ |
| `quando?[]` | `triggers?[]` | ✅ |
| `ativo` | `active` | ✅ |
| `dataCriacao` | `createdAt` | ✅ |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.11 AcaoDisparoCusto → CostTriggerAction ✅ IMPLEMENTADO

| Figma (PT-BR) | Frontend (EN) | Status |
|---|---|---|
| 'Nova Matrícula Criada' | 'NewEnrollment' | ✅ |
| 'Status → Agendado' | 'StatusScheduled' | ✅ |
| 'Status → Confirmar' | 'StatusConfirm' | ✅ |
| 'Status → Confirmado' | 'StatusConfirmed' | ✅ |
| 'Status → Presente' | 'StatusPresent' | ✅ |
| 'Primeiro Pagamento Registrado' | 'FirstPayment' | ✅ |
| 'Pagamento Confirmado (Master)' | 'PaymentConfirmed' | ✅ |
| 'Todos Documentos Aprovados' | 'AllDocsApproved' | ✅ |
| 'Documento Individual Aprovado' | 'DocApproved' | ✅ |
| 'Prova Agendada' | 'ExamScheduled' | ✅ |
| 'Prova Cancelada' | 'ExamCancelled' | ✅ |
| 'Resultado Prova → Aprovado' | 'ExamPassed' | ✅ |
| 'Resultado Prova → Reprovado' | 'ExamFailed' | ✅ |
| 'Resultado Prova → No Show' | 'ExamNoShow' | ✅ |
| 'Aluno Editado' | 'StudentEdited' | ✅ |
| 'Aluno Substituído' | 'StudentReplaced' | ✅ |
| 'Aluno Transferido' | 'StudentTransferred' | ✅ |
| 'Presença Marcada no Dia' | 'AttendanceMarked' | ✅ |
| 'Link Enviado (WhatsApp/Email)' | 'LinkSent' | ✅ |
| 'Presença Instrutor Confirmada' | 'InstructorAttendance' | ✅ |
| 'Instrutor Vinculado à Prova' | 'InstructorAssignedToExam' | ✅ |

**Status: ✅ IMPLEMENTADO** — Todas as 21 ações mapeadas 1:1.

---

### 1.12 Fornecedor → Supplier ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code?` | ✅ |
| `nome` | `name` | ✅ |
| `cnpj` | `companyTaxId?` | ✅ |
| `telefone` | `phone?` | ✅ |
| `email?` | `email?` | ✅ |
| — | `category`, `active` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.13 Instrutor → Instructor ✅ IMPLEMENTADO (expandido)

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `nome` | `name` | ✅ |
| `funcao` | `role?` | ✅ |
| `telefone?` | `phone?` | ✅ |
| `custosVinculados?[]` | `linkedCostIds?[]` | ✅ |
| — | `email?`, `taxId?`, `specialties[]`, `certifications[]`, `availability[]`, `costPerHour?`, `costPerDay?`, `classHourlyRate?`, `examHourlyRate?`, `notes?`, `active`, timestamps | 🆕 Frontend muito mais completo |

**Status: ✅ IMPLEMENTADO** — Frontend expandiu significativamente com certificações, disponibilidade, custos por hora/dia.

---

### 1.14 ProvaAgendada → ScheduledExam ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `turmaId` | `classId` | ✅ |
| `numeroProva` | `examNumber` | ✅ |
| `nomeProva` | `examName` | ✅ |
| `data` | `date` | ✅ |
| `hora` | `time` | ✅ |
| `instrutorId` | `instructorId` | ✅ |
| `alunosIds[]` | `studentIds[]` | ✅ |
| `dataCriacao` | `createdAt` | ✅ |
| `criadoPor?` | `createdBy?` | ✅ |
| — | `status`, `updatedAt` | 🆕 Frontend extra (status field added) |

**Status: ✅ IMPLEMENTADO** — Completo com melhorias.

---

### 1.15 ProdutoExtra → ExtraProduct ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code?` | ✅ |
| `tipo` ('produto'\|'extra') | `type` ('product'\|'extra') | ✅ |
| `nome` | `name` | ✅ |
| `valor` | `price` | ✅ |
| `custosAssociados[]` | `associatedCosts?[]` | ✅ |
| — | `description?`, `active` | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.16 Curso → Course ✅ IMPLEMENTADO (expandido)

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `nome` | `name` | ✅ |
| `categoria` | `category?` | ✅ |
| `cargaHoraria` | `workloadHours?` | ✅ |
| `cargaHorariaTotal` | `totalWorkloadHours?` / `duration` | ✅ |
| `horasAulaPorDia` | `hoursPerDay?` | ✅ |
| `horarioInicio` | `startTime?` | ✅ |
| `horarioFim` | `endTime?` | ✅ |
| `usaFimDeSemana` | `useWeekends?` / `allowSaturday?` / `allowSunday?` | ✅ (mais granular) |
| `valorBase` | `price` | ✅ |
| `descricao` | `description?` | ✅ |
| `produtosVinculados?[]` | `linkedProducts?[]` | ✅ |
| `extrasVinculados?[]` | `linkedExtras?[]` | ✅ |
| `intervalo?` | `breakDuration?` | ✅ |
| `conteudoProgramatico?` | `syllabus?` | ✅ |
| `validadeCertificacao?` | `certificationValidity?` | ✅ |
| `documentosObrigatorios?[]` | `requiredDocuments?[]` | ✅ |
| `excluido?` | `deleted?` | ✅ |
| — | `displayName?`, `isOffshore?`, `learningTime?`, `certificationInfo?`, `prerequisites?`, `cashValue?`, `active`, timestamps | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Completo e expandido com DNA Técnico.

---

### 1.17 Turma → Class ✅ IMPLEMENTADO

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigo` | `code` | ✅ |
| `cursoId` | `courseId` | ✅ |
| `dataInicio` | `startDate` | ✅ |
| `dataFim` | `endDate` | ✅ |
| `horario` | `schedule?` | ✅ |
| `salaId` | `roomId?` | ✅ |
| `vagasDisponiveis` | `availableSpots` | ✅ |
| `statusTurma` | `status` | ✅ (EN equivalents) |
| `nomePersonalizado?` | `name` / `displayName?` | ✅ |
| `clientePJId?` | `companyId?` | ✅ |
| `preco` | `price` | ✅ |
| `instrutores?[]` | `instructors?[]` (ClassInstructor[]) | ✅ |
| — | `maxStudents`, `currentStudents`, `enrolledStudentIds?`, timestamps | 🆕 Frontend extra |
| — | Status 'Cancelled' | 🆕 Frontend tem status adicional |

**Status: ✅ IMPLEMENTADO** — Completo.

---

### 1.18 Aluno → Student ✅ IMPLEMENTADO (expandido)

| Campo Figma | Campo Frontend | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `codigoSistema` | `code` | ✅ |
| `turmaId` | `classId?` | ✅ |
| `nome` | `name` | ✅ |
| `cpf` | `taxId?` | ✅ |
| `rg?` | `rg?` | ✅ |
| `dataNascimento?` | `birthDate?` | ✅ |
| `telefone` | `phone?` | ✅ |
| `email` | `email?` | ✅ |
| `endereco?` | `address?` | ✅ |
| `valorTotal` | `totalValue` | ✅ |
| `desconto` | `discount?` | ✅ |
| `statusLink` | `linkStatus?` | ✅ |
| `foto?` | `photoUrl?` | ✅ |
| `statusPagamento` | `paymentComplete?` | ✅ |
| `statusDocumentos` | `documentsComplete?` | ✅ |
| `pagamentos?` | `payments?` (StudentPayment) | ✅ |
| `documentos[]` | `documents?[]` (StudentDocument[]) | ✅ |
| `dataInicioAluno` | `studentStartDate?` | ✅ |
| `dataFimAluno` | `studentEndDate?` | ✅ |
| `statusProva` | `examStatus?` (ExamStatus) | ✅ |
| `resultadoProva?` | `examResult?` (ExamResultDetails) | ✅ |
| `produtosExtras?[]` | `extraProductIds?[]` | ✅ |
| `recibos?[]` | `receipts?[]` (Receipt[]) | ✅ |
| `lancamentosProdutosPF?[]` | `pfProductPayments?[]` | ✅ |
| `observacoes?` | `notes?` | ✅ |
| `presencasPorDia?` | `attendanceByDay?` | ✅ |
| `filaEspera?` | `isWaitingList?` | ✅ |
| `substituido?` | `isReplaced?` | ✅ |
| `substitutoDe?` | `replacedStudentId?` | ✅ |
| `dataSubstituicao?` | `replacementDate?` | ✅ |
| `motivoSubstituicao?` | `replacementReason?` | ✅ |
| `loteAprovacaoId?` | `approvalBatchId?` | ✅ |
| `clientePJId?` | `companyId?` | ✅ |
| — | `status` (StudentStatus), `personType?`, `extraProductPayments?[]`, timestamps | 🆕 Frontend extra |

**Status: ✅ IMPLEMENTADO** — Mapeamento extensivo e completo.

---

## 2. COMPARAÇÃO DE FUNÇÕES

### 2.1 Funções de Infraestrutura (Módulo 00)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarSala(sala)` | `addRoom(room)` | settings.store | ✅ |
| `editarSala(id, dados)` | `updateRoom(id, room)` | settings.store | ✅ |
| `adicionarUsuario(usuario)` | `addUser(user)` | settings.store | ✅ |
| `editarUsuario(id, dados)` | `updateUser(id, user)` | settings.store | ✅ |
| `atualizarConfiguracoesEmail(config)` | `setEmailConfig(config)` | settings.store | ✅ |
| `atualizarConfiguracoesWhatsApp(config)` | `setWhatsappConfig(config)` | settings.store | ✅ |
| `atualizarDadosInstitucionais(dados)` | `setInstitutionalData(data)` | settings.store | ✅ |
| `adicionarFornecedor(fornecedor)` | `addSupplier(supplier)` | settings.store | ✅ |
| `editarFornecedor(id, dados)` | `updateSupplier(id, supplier)` | settings.store | ✅ |
| `adicionarProdutoExtra(produto)` | `addExtraProduct(product)` | settings.store | ✅ |
| `editarProdutoExtra(id, dados)` | `updateExtraProduct(id, product)` | settings.store | ✅ |
| `resetarDados()` | `reset()` (em cada store) | Todos os stores | ✅ |

### 2.2 Funções de Instrutores

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarInstrutor(instrutor)` | `addInstructor(instructor)` | settings.store | ✅ |
| `editarInstrutor(id, dados)` | `updateInstructor(id, instructor)` | settings.store | ✅ |
| `excluirInstrutor(id)` | `deleteInstructor(id)` | settings.store | ✅ |
| `vincularCustoInstrutor(instrutorId, custoId)` | `linkInstructorCost(costId, instructorId)` | costs.store | ✅ |
| `desvincularCustoInstrutor(instrutorId, custoId)` | `unlinkInstructorCost(costId)` | costs.store | ✅ |
| `dispararCustosInstrutorAutomaticos(instrutorId, turmaId, data)` | `triggerInstructorAutomaticCosts({instructorId, classId, date})` | costs.store | ✅ |
| `dispararCustosInstrutorProva(instrutorId, alunoId, numProva, nomeProva, data)` | `triggerInstructorExamCosts({instructorId, classId, examNumber, examName})` | costs.store | ✅ |

### 2.3 Funções de Empresas/Clientes PJ (Módulo 05)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarClientePJ(cliente)` | `addCompany(company)` | companies.store | ✅ |
| `editarClientePJ(id, dados)` | `updateCompany(id, company)` | companies.store | ✅ |
| `adicionarPrecificacaoEmpresa(clientePJId, prec)` | `addPricing(companyId, pricing)` | companies.store | ✅ |
| `editarPrecificacaoEmpresa(clientePJId, precId, dados)` | `updatePricing(companyId, pricingId, data)` | companies.store | ✅ |
| `excluirPrecificacaoEmpresa(clientePJId, precId)` | `deletePricing(companyId, pricingId)` | companies.store | ✅ |

### 2.4 Funções de Custos (Módulo 08)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarCustoAuditavel(custo)` | `addAuditableCost(cost)` | costs.store | ✅ |
| `editarCustoAuditavel(id, dados)` | `updateAuditableCost(id, cost)` | costs.store | ✅ |
| `removerCustoAuditavel(id)` | `deleteAuditableCost(id)` | costs.store | ✅ |
| `adicionarCriterioCusto(criterio)` | `addCostCriterion(criterion)` | costs.store | ✅ |
| `editarCriterioCusto(id, dados)` | `updateCostCriterion(id, criterion)` | costs.store | ✅ |
| `excluirCriterioCusto(id)` | `deleteCostCriterion(id)` | costs.store | ✅ |
| `dispararCustosAutomaticos(acao, alunoId, dados)` | `triggerAutomaticCosts(action, context)` | costs.store | ✅ |
| `cancelarCustosPorAcao(alunoId, acao)` | `cancelCostEntriesByAction({action, studentId, ...})` | costs.store | ✅ |
| `limparLancamentosOrfaos()` | `cleanupOrphanCostEntries()` | costs.store | ✅ |
| `renumerarLancamentosCusto()` | `renumberCostEntries()` | costs.store | ✅ |
| `excluirLancamentoCusto(id)` | `deleteCostEntry(id)` | costs.store | ✅ |
| `verificarCustosProvaParaExcluir(alunoId)` | `verifyExamCostsForDeletion({studentId, ...})` | costs.store | ✅ |
| `obterAlunosNaMesmaProva(instrutorId, numProva)` | `getStudentsInSameExam({examNumber, ...})` | exams.store | ✅ |

### 2.5 Funções de Cursos (Módulo 01)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarCurso(curso)` | `addCourse(course)` | courses.store | ✅ |
| `atualizarCurso(id, dados)` | `updateCourse(id, course)` | courses.store | ✅ |
| `excluirCurso(id)` | `deleteCourse(id)` | courses.store | ✅ (soft delete) |

### 2.6 Funções de Turmas (Módulo 02)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarTurma(turma)` | `addClass(classItem)` | classes.store | ✅ |
| `atualizarTurma(id, dados)` | `updateClass(id, classItem)` | classes.store | ✅ |
| `excluirTurma(id)` | `deleteClass(id)` | classes.store | ✅ |
| `vincularInstrutorTurma(turmaId, instrutorId)` | `linkInstructorToClass(classId, instructorId)` | classes.store | ✅ |
| `desvincularInstrutorTurma(turmaId, instrutorId)` | `unlinkInstructorFromClass(classId, instructorId)` | classes.store | ✅ |
| `confirmarPresencaInstrutor(turmaId, instrutorId, data, usuarioId)` | `confirmInstructorAttendance(classId, instructorId, date, confirmedBy)` | classes.store | ✅ |

### 2.7 Funções de Alunos (Módulo 03/04)

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `adicionarAluno(aluno)` | `addStudent(student)` | students.store | ✅ (com trigger de custos) |
| `atualizarAluno(id, dados)` | `updateStudent(id, student)` | students.store | ✅ (com trigger de custos) |
| `atualizarAlunosEmLote(map)` | `updateStudentsBatch(updates)` | students.store | ✅ |
| `excluirAluno(id)` | `deleteStudent(id)` | students.store | ✅ (com limpeza custos) |
| `substituirAluno(antigoId, novoId, motivo)` | `substituteStudent(oldId, newId, reason)` | students.store | ✅ |
| `transferirAluno(alunoId, novaTurmaId)` | `transferStudent(studentId, newClassId)` | students.store | ✅ |
| `marcarPresencaDia(alunoId, data)` | `markAttendanceDay(studentId, date)` | students.store | ✅ |
| `gerarCodigoProva()` | `getNextExamNumber()` | exams.store | ✅ |
| `cancelarProva(alunoId)` | `cancelExam(studentId)` | students.store | ✅ |
| `registrarResultadoProva(alunoId, status, obs, userId)` | `registerExamResult(studentId, data)` | students.store | ✅ |

### 2.8 Funções de Provas Agendadas

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `agendarProva(dados)` | `addExam(exam)` | exams.store | ✅ |
| `editarProvaAgendada(provaId, dados)` | `updateExam(id, exam)` | exams.store | ✅ |
| `excluirProvaAgendada(provaId)` | `deleteExam(id)` | exams.store | ✅ |

### 2.9 Funções Utilitárias

| Função Figma | Implementação Frontend | Store | Status |
|---|---|---|---|
| `gerarNumeroRecibo()` | `getNextReceiptNumber()` + `generateReceiptNumber()` | settings.store + generate-receipt.ts | ✅ Centralizado |

---

## 3. COMPARAÇÃO DE DADOS SEED

| Entidade | Figma | Frontend | Status |
|---|---|---|---|
| Salas | 3 seed (Sala 101, 102, Lab 201) | Vazio (backend) | 🔄 Arch. diferente |
| Usuários | 3 seed (Master, Admin, Vendedor) | Vazio (auth JWT) | 🔄 Arch. diferente |
| Cursos | 4 seed (C0001-C0004) | Vazio (backend) | 🔄 Arch. diferente |
| Turmas | 10 seed (#0001-#0010) | Vazio (backend) | 🔄 Arch. diferente |
| Fornecedores | 6 seed (F0001-F0006) | Vazio (backend) | 🔄 Arch. diferente |
| Produtos Extras | 8 seed (PV/EX) | 8 seed **IDÊNTICOS** | ✅ Match |
| Custos Auditáveis | 9 seed (CA0001-CA0009) | Vazio (backend) | 🔄 Arch. diferente |
| Critérios de Custo | 8 seed (CR0001-CR0007) | Vazio (backend) | 🔄 Arch. diferente |
| Empresas PJ | 4 seed (CP0001-CP0004) | Vazio (backend) | 🔄 Arch. diferente |
| Alunos | Vazio (comentado) | Vazio | ✅ Match |
| Instrutores | Vazio | Vazio | ✅ Match |
| Provas | Vazio | Vazio | ✅ Match |

> **Nota:** Todos os seeds no Figma eram dados mockados no localStorage (prototipação). No frontend de produção, dados vêm do backend via API — essa diferença é **arquiteturalmente correta**.

---

## 4. RESUMO DE GAPS — TODOS RESOLVIDOS ✅

### 🔴 ALTA PRIORIDADE — ✅ RESOLVIDOS

| # | Gap | Status | Solução Implementada |
|---|---|---|---|
| 1 | **Side-effects em cascata** | ✅ RESOLVIDO | `unlinkInstructorFromClass` (classes.store) agora faz cascade: deleta lançamentos de custo via `deleteCostEntriesByInstructorClass()` e remove provas relacionadas via `useExamsStore`. `deleteExam` (exams.store) agora cancela custos 'ExamScheduled' de cada aluno e verifica/exclui custos do instrutor via `verifyExamCostsForDeletion()`. |
| 2 | **Auto-limpeza de lançamentos órfãos** | ✅ RESOLVIDO | Hook `useOrphanCleanup` criado em `hooks/use-orphan-cleanup.ts` — observa mudanças em `students` e `instructors` e executa `cleanupOrphanCostEntries()` automaticamente. Integrado no `providers.tsx`. |

### 🟡 MÉDIA PRIORIDADE — ✅ RESOLVIDOS

| # | Gap | Status | Solução Implementada |
|---|---|---|---|
| 3 | **Permissões granulares (módulo + ações)** | ✅ RESOLVIDO | `UserPermissions` em `lib/user-permissions.ts` tem estrutura idêntica ao Figma: `modulos` (9 booleans modulo00-08) + `acoes` (17 booleans). Dialog de permissões granulares em `user-permissions-dialog.tsx`. |
| 4 | **`gerarNumeroRecibo()` centralizado** | ✅ RESOLVIDO | `getNextReceiptNumber()` adicionado ao `settings.store` com contador persistido `receiptCounter`. Gera CP0001, CP0002... sequencialmente. Também existe `generateReceiptNumber()` em `lib/generate-receipt.ts`. |
| 5 | **`cashBox` tipo correto** | ✅ RESOLVIDO | Tipo corrigido de `string` para `number` no store (`settings.store.ts`) e no componente (`institutional-tab.tsx`). Input alterado para `type="number"` com `step={0.01}`. |

### 🟢 BAIXA PRIORIDADE (Cosméticos — sem ação necessária)

| # | Gap | Impacto | Detalhe |
|---|---|---|---|
| 6 | **Prefixos de código diferentes** | Baixo | Figma: `CA`, `L`. Frontend: `AC`, `CE`. Apenas convenção de naming — não afeta funcionalidade. |
| 7 | **Seed data ausente no frontend** | Nenhum | Frontend busca do backend — design correto para produção. |

---

## 5. MATRIZ DE COBERTURA POR MÓDULO

| Módulo | Interfaces | Funções | Seeds | Status Geral |
|---|---|---|---|---|
| **M00 - Configurações** | ✅ 6/6 | ✅ 12/12 | 🔄 | ✅ Completo |
| **M01 - Cursos** | ✅ 1/1 | ✅ 3/3 | 🔄 | ✅ Completo |
| **M02 - Turmas** | ✅ 1/1 | ✅ 6/6 | 🔄 | ✅ Completo |
| **M03/04 - Alunos** | ✅ 1/1 | ✅ 10/10 | ✅ | ✅ Completo |
| **M05 - Empresas PJ** | ✅ 2/2 | ✅ 5/5 | 🔄 | ✅ Completo |
| **M07 - Instrutores** | ✅ 1/1 | ✅ 7/7 | ✅ | ✅ Completo |
| **M08 - Custos** | ✅ 4/4 | ✅ 13/13 | 🔄 | ✅ Completo |
| **Provas** | ✅ 1/1 | ✅ 3/3 | ✅ | ✅ Completo |

---

## 6. FUNCIONALIDADES EXTRAS NO FRONTEND (Além do Figma)

| Funcionalidade | Arquivo | Detalhe |
|---|---|---|
| **CRM completo** | `crm.store.ts` | Contatos, Pipeline, Deals, Atividades — módulo inteiro novo |
| **Certificados** | `certificates.store.ts` | Gestão de certificados, templates, status |
| **Auth JWT real** | `auth.store.ts` | Autenticação com tokens vs simulação do Figma |
| **Dashboard service** | `dashboard.service.ts` | Serviço dedicado de dashboard |
| **Operations service** | `operations.service.ts` | Serviço de operações |
| **15 API services** | `services/*.service.ts` | Camada completa de API REST |
| **Exams store separado** | `exams.store.ts` | Provas com seu próprio store Zustand |
| **Sidebar state** | `sidebar.store.ts` | Controle de UI da sidebar |

---

## 7. CONCLUSÃO

### Cobertura: **~99%** ✅

| Métrica | Valor |
|---|---|
| Interfaces implementadas | **18/18** (100%) |
| Funções implementadas | **55/55** (100%) |
| Campos de interface mapeados | **~99%** — todos os campos essenciais presentes |
| Ações de disparo de custo | **21/21** (100%) |
| Permissões granulares | **9 módulos + 17 ações** (100% — idêntico ao Figma) |
| Side-effects em cascata | **100%** — `unlinkInstructor`, `deleteExam` com cascade |
| Auto-cleanup órfãos | **✅** — hook automático no `providers.tsx` |
| Stores Zustand | 13 stores vs 1 contexto monolítico Figma |
| Services de API | 15 services (0 no Figma) |

### ✅ Pontos Fortes
1. Migração PT→EN consistente em todos os nomes
2. Arquitetura desacoplada (Zustand stores) vs monolítico (React Context)
3. Todas as 21 ações de disparo automático implementadas
4. `students.store` orquestra disparos de custo automaticamente no `addStudent`/`updateStudent`
5. Side-effects em cascata em `unlinkInstructorFromClass` e `deleteExam`
6. Auto-limpeza de lançamentos órfãos via hook `useOrphanCleanup`
7. Recibos centralizados com contador persistido (`getNextReceiptNumber`)
8. Permissões granulares idênticas ao Figma (9 módulos + 17 ações)
9. Funcionalidades extras: CRM, Certificados, Auth JWT, API layer

### ✅ Todos os gaps anteriores foram resolvidos

Nenhuma ação pendente de paridade Figma↔Frontend.
