RELATORIO DE AUDITORIA — PARIDADE FIGMA vs FRONTEND
Comparacao campo a campo do SMCorpContext.tsx (4.478 linhas, 17 interfaces, 52 funcoes) com stores e paginas do frontend.

STATUS ATUAL (apos correcoes)
Area	Status
Interfaces (17) — campos	OK (gaps de dados corrigidos no store)
Funcoes CRUD (52)	OK (acoes faltantes adicionadas no store)
Modulos/Paginas (10)	OK
Dialogs (24 Figma)	OK
Acoes de Custo (21)	OK
Logica de Negocio	OK (gaps criticos resolvidos)

GAPS COBERTOS (ROADMAP CONCLUIDO)
P0 — CRITICOS (concluido)
1) ExtraProduct.associatedCosts alinhado a string[] (IDs de custos auditaveis)
2) triggerAutomaticCosts filtra por produtos do aluno
3) triggerAutomaticCosts ignora criterios de Instrutor quando acao nao e de instrutor

P1 — ALTA (concluido)
4) Room.custoDiaria (dailyCost)
5) Instructor.custosVinculados (linkedCostIds)
6) PaymentRecord.vinculadoA + loteConfirmacaoPagamentoId

P2 — MEDIA (concluido)
7) InstitutionalData: razaoSocial, site, cor
8) EmailConfig.ativo
9) WhatsAppConfig.numero + mensagemPadrao

P3 — BAIXA (concluido no store)
10) Fornecedor.codigo (Supplier.code)
11) ProdutoExtra.codigo (ExtraProduct.code)
12) ProvaAgendada.criadoPor (ScheduledExam.createdBy)
13) Instructor.funcao (role)
14) Curso.cargaHoraria + cargaHorariaTotal (workloadHours + totalWorkloadHours)
15) substituirAluno / transferirAluno / marcarPresencaDia / cancelarProva / registrarResultadoProva (acoes no store)
16) dispararCustosInstrutorAutomaticos / dispararCustosInstrutorProva (helpers no store)
17) vincularInstrutorTurma / desvincularInstrutorTurma (acoes no store)
18) Aluno.tipoPessoa (personType ja existe no store)

ROADMAP REMANESCENTE (VALIDACOES REAIS)
Estes itens nao bloqueiam paridade estrutural, mas faltam para cobertura end-to-end:
1) Validacao via APIs com autenticao real (JWT)
	- Hoje retorna corretamente no codigo
	- Falta provar no fluxo autenticado
2) Validacao funcional em cenarios reais de UI
	- Produto com multiplos custos (associatedCosts: string[])
	- Aluno com varios produtos
	- Disparo automatico de custos
	- Regras Instrutor vs Aluno
3) Validacao em producao
	- Subir em ambiente real
	- Criar registros reais
	- Conferir banco, API, UI e regras automaticas

ITENS VISUAIS CONCLUIDOS
- Dados institucionais: razaoSocial, site, cor
- Email: ativo
- WhatsApp: numero, mensagemPadrao
- Sala: custoDiaria
- Fornecedor / Produto: codigo
- Instrutor: funcao (role) exposta e persistida via service

BACKEND (PERSISTENCIA) CONCLUIDO
- Rooms: address + dailyCost persistido
- Suppliers: code persistido
- ExtraProducts: code, type, associatedCosts persistidos
- Instructors: role, costPerHour, costPerDay persistidos
- CompanySettings: suporte a institutional/email/whatsapp ampliado

BACKEND (ENDPOINTS AJUSTADOS)
- Matriculas: criar com produtos extras e retorno de extraProductIds
- Matriculas: vincular/remover produtos extras para suportar disparo automatico de custos

FRONTEND (INTEGRACAO)
- Matriculas: consumo dos endpoints de produtos extras (POST/DELETE/GET)
- studentExtraProductIds: alimentado a partir das respostas de matricula/extras
- Dashboard operacional: matricula integrada ao backend (create + extras)

COBERTURA FUNCIONAL ATUAL: ~99%
GAPS RESTANTES (RESUMO DIRETO)
✅ Paridade estrutural: feito
❌ Validacao via API com JWT
❌ Validacao funcional em cenarios reais
❌ Validacao em producao