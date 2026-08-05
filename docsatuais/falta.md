

📊 Análise Completa: Figma vs Frontend - O que Falta
Resumo Geral
Métrica	Valor
Implementação geral	~65%
Módulos 100% completos	3 (Cursos, Turmas, Vendas)
Módulos parciais (>60%)	5
Dialogs migrados	25/25 ✅
Componentes faltando	12

✅ Módulos 100% Implementados
Módulo	Descrição
Modulo01	Catálogo de Cursos
Modulo02	Abertura de Turmas
Modulo04	Central de Vendas

⚠️ Funcionalidades Críticas que Faltam
Prioridade	Funcionalidade	Módulo
🔴 ALTA	Portal do Cliente PJ (Self-Service) - Login/dashboard próprio	M05
🔴 ALTA	Critérios de Custo e Custos Auditáveis	M00
🔴 ALTA	Geração Automática de Custos (disparo por evento)	M08
🔴 ALTA	Validação de PIN para Ações Sensíveis	M07/M08
🟡 MÉDIA	Confirmação de Pagamento em 2 Níveis	M07
🟡 MÉDIA	Dashboard Executivo Completo (gráficos Recharts)	M09
🟡 MÉDIA	Relatório de Instrutor (custos/provas)	M03
🟡 MÉDIA	Módulo 06 Detalhado (visão avançada docs)	M06
🟢 BAIXA	Backup/Migração/Limpar Dados	M00
🟢 BAIXA	Editor de Foto Avançado (crop circular)	M06
🟢 BAIXA	Gerador de Recibo HTML	M08

CardLoteModulo08.tsx          → Card de lote financeiro agrupado
CardLancamentoAgrupado.tsx    → Card de lançamento inteligente  
AbaLancamentosCusto.tsx       → Aba de custos no fluxo financeiro
EditorFoto.tsx                → Editor avançado de foto (crop circular)
Modulo06Detalhado.tsx         → Visão detalhada de documentos
MigracaoDadosIRATA.tsx        → Ferramenta de migração
LimparDados.tsx               → Ferramenta de limpeza
DiagnosticoPersistencia.tsx   → Diagnóstico de localStorage
BackupDados.tsx               → Backup de dados
gerarReciboHelper.ts          → Gerador de recibos HTML (já migrado!)
SISTEMA_DISPARO_CUSTOS        → Geração automática de custos

🎯 Plano de Ação para 100%
Fase	Tarefa	Impacto
1	Implementar Critérios de Custo em /settings	Habilita custos auditáveis
2	Criar sistema de disparo automático de custos	Core do fluxo financeiro
3	Completar Dashboard Executivo com gráficos	UX executivo
4	Implementar Portal Cliente PJ (self-service)	Novo módulo completo
5	Adicionar confirmação 2 níveis + PIN	Segurança financeira
6	Migrar componentes visuais (CardLote, etc)	Visual fidelidade
Quer que eu comece a implementar alguma dessas funcionalidades faltantes? As mais críticas são:

🔴 Custos Auditáveis + Disparo Automático - Core do sistema financeiro
🔴 Dashboard Executivo com Gráficos - Visão gerencial
🔴 Portal Cliente PJ - Novo módulo self-service
