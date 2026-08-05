import { useState, useMemo, useEffect } from 'react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { usePersistedState } from '@/app/hooks/usePersistedState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { CardLoteModulo08 } from '@/app/components/CardLoteModulo08';
import { CardLancamentoAgrupado } from '@/app/components/CardLancamentoAgrupado';
import { DialogAutorizarPagamento } from '@/app/components/DialogAutorizarPagamento';
import { DialogConfirmarPagamento } from '@/app/components/DialogConfirmarPagamento';
import { DialogAutorizarLotePagamento } from '@/app/components/DialogAutorizarLotePagamento';
import { DialogExcluirLancamento } from '@/app/components/DialogExcluirLancamento';
import { AbaLancamentosCusto } from '@/app/components/AbaLancamentosCusto';
import { gerarHTMLRecibo } from '@/app/components/gerarReciboHelper';
import { gerarCustosInteligentes } from '@/app/utils/gerarCustosInteligentes';

// Logo SVG inline (substitui figma:asset que não funciona em produção)
const logoSMCORP = 'data:image/svg+xml;base64,' + btoa(`
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#991B1B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="url(#grad)" rx="8"/>
  <text x="100" y="30" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">SMCORP</text>
  <text x="100" y="48" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.9">Treinamentos Profissionalizantes</text>
</svg>
`);
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Users,
  Receipt,
  Eye,
  Check,
  X,
  Edit,
  Download,
  CalendarDays,
  CheckSquare,
  Square,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

// Interface para Lançamento Financeiro
interface LancamentoFinanceiro {
  id: string;
  codigo: string; // D0001, D0002, etc. para custos
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao';
  
  // Para contas a pagar (custos)
  custoAuditavelId?: string;
  fornecedorId?: string;
  turmaId?: string;
  criterioId?: string;
  
  // Para contas a receber (pagamentos de alunos)
  alunoId?: string;
  clientePJId?: string;
  
  // Para custos de instrutor
  instrutorId?: string;
  
  // Nota Fiscal
  notaFiscal?: string;
  
  // Dados de pagamento
  formaPagamento?: string;
  valorPago?: number;
  
  observacoes?: string;
  
  // 🆕 Agrupamento de lançamentos recorrentes
  agrupado?: boolean; // Indica se é um lançamento consolidado
  detalhamento?: Array<{
    codigo: string;
    data: string; // Data da geração individual
    valor: number;
    descricao: string;
    observacoes?: string;
  }>;
}

export function Modulo08() {
  const { 
    custosAuditaveis, 
    fornecedores, 
    turmas, 
    criteriosCusto,
    lancamentosCusto,
    alunos,
    instrutores,
    clientesPJ,
    usuarioAtual,
    cursos,
    produtosExtras,
    limparLancamentosOrfaos,
    renumerarLancamentosCusto
  } = useSMCorp();

  // 🎨 Função auxiliar para converter logo em base64
  const converterLogoParaBase64 = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = logoSMCORP;
    });
  };

  // 💾 Filtros persistidos - mantém filtros ao trocar de módulo
  const [filtroTipo, setFiltroTipo] = usePersistedState<'todos' | 'pagar' | 'receber' | 'lancamentos-custo'>('modulo08-filtroTipo', 'todos');
  const [filtroStatus, setFiltroStatus] = usePersistedState<'todos' | 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao'>('modulo08-filtroStatus', 'todos');
  const [filtroPeriodoInicio, setFiltroPeriodoInicio] = usePersistedState<string>('modulo08-filtroPeriodoInicio', '');
  const [filtroPeriodoFim, setFiltroPeriodoFim] = usePersistedState<string>('modulo08-filtroPeriodoFim', '');
  const [filtroBusca, setFiltroBusca] = useState(''); // Não persistir busca por texto
  const [filtroTurma, setFiltroTurma] = usePersistedState<string>('modulo08-filtroTurma', 'todas');
  const [filtroFornecedor, setFiltroFornecedor] = usePersistedState<string>('modulo08-filtroFornecedor', 'todos');
  const [filtroEmpresa, setFiltroEmpresa] = usePersistedState<string>('modulo08-filtroEmpresa', 'todas');
  const [filtroInstrutor, setFiltroInstrutor] = usePersistedState<string>('modulo08-filtroInstrutor', 'todos'); // 🆕 Filtro por instrutor

  // Dialog de detalhes
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<LancamentoFinanceiro | null>(null);
  const [dialogDetalhesAberto, setDialogDetalhesAberto] = useState(false);

  // Dialog de editar status
  const [dialogEditarStatusAberto, setDialogEditarStatusAberto] = useState(false);
  const [novoStatus, setNovoStatus] = useState<'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao'>('pendente');
  const [novaDataPagamento, setNovaDataPagamento] = useState('');

  // 🆕 Dialogs de autorização e confirmação de pagamento
  const [dialogAutorizarAberto, setDialogAutorizarAberto] = useState(false);
  const [dialogConfirmarAberto, setDialogConfirmarAberto] = useState(false);
  const [dialogAutorizarLoteAberto, setDialogAutorizarLoteAberto] = useState(false);

  // 🆕 Estados para seleção múltipla (autorização em lote)
  const [modoSelecao, setModoSelecao] = useState(false);
  const [lancamentosSelecionados, setLancamentosSelecionados] = useState<Set<string>>(new Set());

  // 🚀 DADOS MOCKADOS - Lançamentos financeiros gerados automaticamente
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>(() => {
    const lancamentosGerados: LancamentoFinanceiro[] = [];
    let contadorCodigo = 1;

    // 💰 INTEGRAÇÃO COM MÓDULO 07 - Gerar contas a receber baseadas em pagamentos reais de alunos
    
    // 🎯 AGRUPAR ALUNOS POR LOTE DE APROVAÇÃO (Módulo 05)
    const lotesAprovacao = new Map<string, typeof alunos>();
    const alunosSemLote: typeof alunos = [];
    const codigoPorLote = new Map<string, string>(); // Mapear loteId -> código R0000
    
    // 🆕 AGRUPAR PAGAMENTOS POR LOTE DE CONFIRMAÇÃO (Módulo 07)
    const lotesConfirmacaoPagamento = new Map<string, string>(); // Mapear loteConfirmacaoPagamentoId -> código R0000
    
    alunos.forEach((aluno) => {
      if (aluno.loteAprovacaoId) {
        const lotesExistentes = lotesAprovacao.get(aluno.loteAprovacaoId) || [];
        lotesAprovacao.set(aluno.loteAprovacaoId, [...lotesExistentes, aluno]);
      } else {
        alunosSemLote.push(aluno);
      }
    });

    // 🎯 PROCESSAR LOTES DE APROVAÇÃO: Todos os alunos do mesmo lote recebem o MESMO código R0000
    lotesAprovacao.forEach((alunosDoLote, loteId) => {
      const codigoDoLote = `R${String(contadorCodigo).padStart(4, '0')}`;
      codigoPorLote.set(loteId, codigoDoLote);
      console.log(`📦 Lote Aprovação ${loteId} = ${codigoDoLote} (${alunosDoLote.length} alunos)`);
      contadorCodigo++; // Incrementar apenas UMA VEZ por lote
    });

    // 🆕 PROCESSAR LOTES DE CONFIRMAÇÃO DE PAGAMENTO: Pagamentos confirmados em lote no Módulo 07
    console.log('🔍 MÓDULO 08 - Iniciando processamento de lotes de confirmação de pagamento...');
    console.log('📊 Total de alunos:', alunos.length);
    console.log('📋 Alunos:', alunos.map(a => a.codigoSistema).join(', '));
    
    alunos.forEach((aluno) => {
      aluno.pagamentos?.historico?.forEach((pagamento: any) => {
        if (pagamento.loteConfirmacaoPagamentoId) {
          console.log(`   📋 Aluno ${aluno.codigoSistema} tem loteConfirmacaoPagamentoId: ${pagamento.loteConfirmacaoPagamentoId}, numeroNotaFiscal: ${pagamento.numeroNotaFiscal || 'N/A'}`);
          
          if (!lotesConfirmacaoPagamento.has(pagamento.loteConfirmacaoPagamentoId)) {
            const codigoDoLote = `R${String(contadorCodigo).padStart(4, '0')}`;
            lotesConfirmacaoPagamento.set(pagamento.loteConfirmacaoPagamentoId, codigoDoLote);
            console.log(`   ✅ Criado código ${codigoDoLote} para lote ${pagamento.loteConfirmacaoPagamentoId}`);
            contadorCodigo++;
          } else {
            console.log(`   ℹ️ Lote ${pagamento.loteConfirmacaoPagamentoId} já existe com código: ${lotesConfirmacaoPagamento.get(pagamento.loteConfirmacaoPagamentoId)}`);
          }
        }
      });
    });
    console.log('📊 Total de lotes de confirmação de pagamento:', lotesConfirmacaoPagamento.size);
    lotesConfirmacaoPagamento.forEach((codigo, loteId) => {
      console.log(`   🎯 ${loteId} → ${codigo}`);
    });

    // 🎯 PROCESSAR TODOS OS ALUNOS
    alunos.forEach((aluno) => {
      const valorPago = aluno.pagamentos?.valorPago || 0;
      const valorTotal = aluno.valorTotal || 0;
      const valorPendente = valorTotal - valorPago;

      // 🆕 Obter código base do aluno: se tem lote de aprovação, usa código do lote; senão, gera novo
      const codigoBase = aluno.loteAprovacaoId 
        ? codigoPorLote.get(aluno.loteAprovacaoId)!
        : `R${String(contadorCodigo).padStart(4, '0')}`;
      
      // Incrementar contador apenas se NÃO for lote de aprovação E se há lançamentos para este aluno
      const temLancamentos = valorPendente > 0 || (aluno.pagamentos?.historico && aluno.pagamentos.historico.length > 0);
      if (!aluno.loteAprovacaoId && temLancamentos) {
        contadorCodigo++;
      }

      // Se há valor pendente, criar lançamento a receber
      if (valorPendente > 0) {
        // Determinar se está vencido (exemplo: vencimento 10 dias após início do curso)
        const dataVencimento = aluno.dataInicioAluno 
          ? new Date(aluno.dataInicioAluno)
          : new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 10);
        const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(dataVencimentoStr);
        vencimento.setHours(0, 0, 0, 0);
        const estaVencido = vencimento < hoje;

        const observacaoLote = aluno.loteAprovacaoId ? ` | 📦 Lote: ${codigoBase} (Aprovação em Lote)` : '';
        
        lancamentosGerados.push({
          id: `R-ALU-${aluno.id}`,
          codigo: codigoBase,
          tipo: 'receber',
          descricao: `💳 Saldo Pendente - ${aluno.nome} (${aluno.codigoSistema})`,
          valor: valorPendente,
          dataVencimento: dataVencimentoStr,
          status: estaVencido ? 'vencido' : 'pendente',
          alunoId: aluno.id,
          clientePJId: aluno.clientePJId,
          observacoes: `📊 Origem: Módulo 07${observacaoLote} | Valor total: ${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Pago: ${valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Código do Aluno: ${aluno.codigoSistema}`
        });
      }

      // Criar lançamentos para cada pagamento/boleto do histórico
      if (aluno.pagamentos?.historico) {
        aluno.pagamentos.historico.forEach((pagamento, index) => {
          const ehBoleto = !!pagamento.codigoBarrasBoleto;
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          // 🎯 BOLETO: Tem código de barras e data de vencimento
          if (ehBoleto) {
            // Converter data de vencimento do boleto (formato DD/MM/YYYY para YYYY-MM-DD)
            const dataVencimentoBoleto = pagamento.dataVencimentoBoleto 
              ? pagamento.dataVencimentoBoleto.split('/').reverse().join('-')
              : pagamento.data?.split('/').reverse().join('-') || new Date().toISOString().split('T')[0];

            const vencimentoBoleto = new Date(dataVencimentoBoleto);
            vencimentoBoleto.setHours(0, 0, 0, 0);
            const boletoVencido = vencimentoBoleto < hoje;

            // 🆕 Verificar se este boleto foi confirmado em lote no Módulo 07
            const codigoBoleto = pagamento.loteConfirmacaoPagamentoId 
              ? lotesConfirmacaoPagamento.get(pagamento.loteConfirmacaoPagamentoId)!
              : codigoBase;
            
            // 🧾 Capturar Nota Fiscal do boleto
            const notaFiscalBoleto = pagamento.numeroNotaFiscal || 
              (pagamento.loteConfirmacaoPagamentoId ? `NF-${codigoBoleto}-2026` : undefined);
            
            console.log(`🔍 DEBUG NOTA FISCAL BOLETO - Aluno ${aluno.codigoSistema}:`, {
              alunoId: aluno.id,
              codigoAluno: aluno.codigoSistema,
              pagamentoId: pagamento.id,
              numeroNotaFiscalOriginal: pagamento.numeroNotaFiscal,
              notaFiscalFinal: notaFiscalBoleto,
              loteConfirmacaoPagamentoId: pagamento.loteConfirmacaoPagamentoId,
              codigoBoleto
            });
            
            // Boleto emitido = status "faturado" (só muda para "pago" quando der baixa no Módulo 08)
            const observacaoLote = aluno.loteAprovacaoId ? ` | 📦 Lote: ${codigoBase} (Aprovação em Lote)` : '';
            const observacaoLoteBoleto = pagamento.loteConfirmacaoPagamentoId 
              ? ` | �� Lote Pagamento: ${codigoBoleto} (Confirmação em Lote no Módulo 07)` 
              : '';
            
            lancamentosGerados.push({
              id: `R-BOL-${aluno.id}-${pagamento.id}`,
              codigo: codigoBoleto, // 🆕 Usar código do lote de pagamento se existir
              tipo: 'receber',
              descricao: `📄 Boleto Faturado - ${aluno.nome} (${aluno.codigoSistema})`,
              valor: pagamento.valor,
              dataVencimento: dataVencimentoBoleto,
              status: boletoVencido ? 'vencido' : 'faturado',
              alunoId: aluno.id,
              clientePJId: aluno.clientePJId,
              notaFiscal: notaFiscalBoleto, // 🧾 Nota Fiscal do boleto
              observacoes: `📊 Origem: Módulo 07${observacaoLote}${observacaoLoteBoleto} - Boleto Emitido (Aguardando Baixa no Módulo 08) | Código de Barras: ${pagamento.codigoBarrasBoleto} | Vencimento: ${pagamento.dataVencimentoBoleto} | Emitido em: ${pagamento.data}${pagamento.confirmedoPor ? ` | Confirmado por ${pagamento.confirmedoPor} em ${pagamento.dataConfirmacao}` : ''} ${pagamento.observacoes ?'| ' + pagamento.observacoes : ''} | Código do Aluno: ${aluno.codigoSistema}`
            });
          } else {
            // 💰 PAGAMENTO COMUM: PIX, Dinheiro, Cartão, etc (já confirmado)
            if (pagamento.confirmedoPor) {
              // 🆕 Verificar se este pagamento foi confirmado em lote no Módulo 07
              const codigoPagamento = pagamento.loteConfirmacaoPagamentoId 
                ? lotesConfirmacaoPagamento.get(pagamento.loteConfirmacaoPagamentoId)!
                : codigoBase;
              
              if (pagamento.loteConfirmacaoPagamentoId) {
                console.log(`✅ Pagamento do aluno ${aluno.codigoSistema} confirmado em lote: ${pagamento.loteConfirmacaoPagamentoId} = ${codigoPagamento}`);
              }
              
              const observacaoLote = aluno.loteAprovacaoId ? ` | 📦 Lote: ${codigoBase} (Aprovação em Lote)` : '';
              const observacaoLotePagamento = pagamento.loteConfirmacaoPagamentoId 
                ? ` | 💰 Lote Pagamento: ${codigoPagamento} (Confirmação em Lote no Módulo 07)` 
                : '';
              
              // 🧾 Usar número de Nota Fiscal do pagamento (se existir) ou gerar automaticamente
              const notaFiscal = pagamento.numeroNotaFiscal || 
                (pagamento.loteConfirmacaoPagamentoId ? `NF-${codigoPagamento}-2026` : undefined);
              
              console.log(`🔍 DEBUG NOTA FISCAL - Aluno ${aluno.codigoSistema}:`, {
                alunoId: aluno.id,
                codigoAluno: aluno.codigoSistema,
                pagamentoId: pagamento.id,
                numeroNotaFiscalOriginal: pagamento.numeroNotaFiscal,
                notaFiscalFinal: notaFiscal,
                loteConfirmacaoPagamentoId: pagamento.loteConfirmacaoPagamentoId,
                codigoPagamento
              });
              
              if (pagamento.numeroNotaFiscal) {
                console.log(`🧾 NOTA FISCAL DO PAGAMENTO: ${notaFiscal} para aluno ${aluno.codigoSistema}, código: ${codigoPagamento}`);
              } else if (pagamento.loteConfirmacaoPagamentoId) {
                console.log(`🧾 NOTA FISCAL GERADA: ${notaFiscal} para aluno ${aluno.codigoSistema} do lote ${pagamento.loteConfirmacaoPagamentoId}`);
              }
              
              const lancamentoCriado = {
                id: `R-PAG-${aluno.id}-${pagamento.id}`,
                codigo: codigoPagamento, // 🆕 Usar código do lote de pagamento se existir
                tipo: 'receber' as const,
                descricao: `✅ Pagamento Recebido - ${aluno.nome} (${aluno.codigoSistema})`,
                valor: pagamento.valor,
                dataVencimento: pagamento.data?.split('/').reverse().join('-') || new Date().toISOString().split('T')[0],
                dataPagamento: pagamento.dataConfirmacao?.split('/').reverse().join('-') || pagamento.data?.split('/').reverse().join('-'),
                status: 'pago' as const,
                alunoId: aluno.id,
                clientePJId: aluno.clientePJId,
                notaFiscal, // 🧾 Nota Fiscal gerada para lotes
                observacoes: `📊 Origem: Módulo 07${observacaoLote}${observacaoLotePagamento} - Pagamento Confirmado | ${pagamento.formaPagamento} | Confirmado por ${pagamento.confirmedoPor} em ${pagamento.dataConfirmacao || pagamento.data} ${pagamento.observacoes ?'| ' + pagamento.observacoes : ''} | Código do Aluno: ${aluno.codigoSistema}`
              };
              
              console.log(`✅ LANÇAMENTO CRIADO - ${aluno.codigoSistema}:`, {
                id: lancamentoCriado.id,
                codigo: lancamentoCriado.codigo,
                notaFiscal: lancamentoCriado.notaFiscal,
                valor: lancamentoCriado.valor,
                loteConfirmacaoPagamentoId: pagamento.loteConfirmacaoPagamentoId
              });
              
              lancamentosGerados.push(lancamentoCriado);
            }
          }
        });
      }
      
      // 🆕 PROCESSAR LANÇAMENTOS PF (Produtos extras pagos pela Pessoa Física quando aluno é PJ)
      if (aluno.lancamentosProdutosPF && aluno.lancamentosProdutosPF.length > 0) {
        aluno.lancamentosProdutosPF.forEach((lancamentoPF) => {
          const valorPagoPF = lancamentoPF.pagamentos?.valorPago || 0;
          const valorTotalPF = lancamentoPF.valorTotal || 0;
          const valorPendentePF = valorTotalPF - valorPagoPF;

          // Gerar código único para o lançamento PF
          const codigoLancamentoPF = `R${String(contadorCodigo).padStart(4, '0')}`;
          contadorCodigo++;

          // Se há valor pendente, criar lançamento a receber
          if (valorPendentePF > 0) {
            const dataVencimento = aluno.dataInicioAluno 
              ? new Date(aluno.dataInicioAluno)
              : new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 10);
            const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const vencimento = new Date(dataVencimentoStr);
            vencimento.setHours(0, 0, 0, 0);
            const estaVencido = vencimento < hoje;

            lancamentosGerados.push({
              id: `R-ALU-PF-${aluno.id}-${lancamentoPF.id}`,
              codigo: codigoLancamentoPF,
              tipo: 'receber',
              descricao: `💳 [PF] ${lancamentoPF.produtoNome} - ${aluno.nome} (${aluno.codigoSistema}-PF)`,
              valor: valorPendentePF,
              dataVencimento: dataVencimentoStr,
              status: estaVencido ? 'vencido' : 'pendente',
              alunoId: aluno.id,
              observacoes: `📊 Origem: Lançamento PF | Produto extra pago pela Pessoa Física | Valor total: ${valorTotalPF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Pago: ${valorPagoPF.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | CPF: ${aluno.cpf}`
            });
          }

          // Criar lançamentos para cada pagamento do histórico do lançamento PF
          if (lancamentoPF.pagamentos?.historico) {
            lancamentoPF.pagamentos.historico.forEach((pagamento) => {
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);

              // Converter data (DD/MM/YYYY para YYYY-MM-DD)
              const dataPagamentoConvertida = pagamento.data
                ? pagamento.data.split('/').reverse().join('-')
                : new Date().toISOString().split('T')[0];

              // Lançamento pago (confirmado pelo Master)
              if (pagamento.confirmedoPor) {
                lancamentosGerados.push({
                  id: `R-ALU-PF-PAG-${aluno.id}-${lancamentoPF.id}-${pagamento.id}`,
                  codigo: codigoLancamentoPF,
                  tipo: 'receber',
                  descricao: `💳 [PF] ${lancamentoPF.produtoNome} - ${aluno.nome} (${aluno.codigoSistema}-PF) - ${pagamento.formaPagamento}`,
                  valor: pagamento.valor,
                  dataVencimento: dataPagamentoConvertida,
                  dataPagamento: dataPagamentoConvertida,
                  status: 'pago',
                  alunoId: aluno.id,
                  notaFiscal: pagamento.numeroNotaFiscal,
                  observacoes: `📊 Origem: Lançamento PF | Produto: ${lancamentoPF.produtoNome} | Confirmado por: ${pagamento.confirmedoPor} em ${pagamento.dataConfirmacao} | CPF: ${aluno.cpf}`
                });
              }
            });
          }
        });
      }
    });

    // 💰 GERAR CONTAS A PAGAR BASEADAS EM LANÇAMENTOS REAIS (DISPARADOS AUTOMATICAMENTE)
    console.log('🎯 [MÓDULO 08] Carregando lançamentos de custos automáticos...');
    console.log('🎯 [MÓDULO 08] Total de lançamentos:', lancamentosCusto.length);
    
    lancamentosCusto.forEach(lancamento => {
      const custoAuditavel = custosAuditaveis.find(c => c.id === lancamento.custoAuditavelId);
      const aluno = alunos.find(a => a.id === lancamento.alunoId);
      const instrutor = instrutores.find(i => i.id === lancamento.instrutorId);
      const turma = turmas.find(t => t.id === lancamento.turmaId);
      const criterio = criteriosCusto.find(c => c.id === lancamento.criterioCustoId);
      
      // 🔍 VALIDAÇÃO: Verificar se o lançamento tem vínculo válido (aluno OU instrutor)
      if (lancamento.alunoId && !aluno) {
        console.error(`❌ [LANÇAMENTO ÓRFÃO - ALUNO] Lançamento ${lancamento.codigo} tem alunoId "${lancamento.alunoId}" mas aluno NÃO foi encontrado!`);
        console.error(`   → Este lançamento será IGNORADO (não exibido no Módulo 08)`);
        console.error(`   → O aluno provavelmente foi excluído ou os dados foram resetados`);
        console.error(`   → Para limpar completamente, use o botão "🧹 Limpar Órfãos"`);
        return; // 🚫 IGNORAR lançamento órfão - não adicionar aos lançamentos gerados
      }
      
      if (lancamento.instrutorId && !instrutor) {
        console.error(`❌ [LANÇAMENTO ÓRFÃO - INSTRUTOR] Lançamento ${lancamento.codigo} tem instrutorId "${lancamento.instrutorId}" mas instrutor NÃO foi encontrado!`);
        console.error(`   → Este lançamento será IGNORADO (não exibido no Módulo 08)`);
        console.error(`   → O instrutor provavelmente foi excluído ou os dados foram resetados`);
        console.error(`   → Para limpar completamente, use o botão "🧹 Limpar Órfãos"`);
        return; // 🚫 IGNORAR lançamento órfão
      }
      
      // Se não tem aluno nem instrutor, pode ser um custo "Não Vinculado" - permitir
      if (!lancamento.alunoId && !lancamento.instrutorId) {
        console.info(`ℹ️ [CUSTO NÃO VINCULADO] Lançamento ${lancamento.codigo} não tem vínculo com aluno ou instrutor`);
      }
      
      // 🆕 VERIFICAÇÃO ESPECIAL: Lançamentos de instrutor (pagamento direto) não têm custoAuditavelId
      // Eles são criados diretamente pela marcação de presença com instrutorId
      const isPagamentoInstrutor = lancamento.instrutorId && !lancamento.custoAuditavelId;
      
      if (!custoAuditavel && !isPagamentoInstrutor) {
        console.warn(`⚠️ Custo auditável não encontrado para lançamento ${lancamento.codigo}`);
        return;
      }
      
      // 🆕 LÓGICA DE VÍNCULO: Instrutor vs Fornecedor
      // 1. Se é pagamento direto ao instrutor (sem custoAuditavel) → Pagamento ao instrutor
      // 2. Se custoAuditavel tem instrutorId mas NÃO tem fornecedorId → Pagamento ao instrutor
      // 3. Se custoAuditavel tem instrutorId E fornecedorId → Pagamento ao fornecedor (mas mostra instrutor)
      const custoVinculadoInstrutor = isPagamentoInstrutor || (custoAuditavel?.instrutorId && !custoAuditavel?.fornecedorId);
      const custoVinculadoFornecedorComInstrutor = custoAuditavel?.instrutorId && custoAuditavel?.fornecedorId;
      
      // Converter status do lançamento para o formato do Módulo 08
      let statusModulo08: 'pendente' | 'vencido' | 'pago' | 'cancelado' = 'pendente';
      if (lancamento.status === 'Pago') statusModulo08 = 'pago';
      else if (lancamento.status === 'Cancelado') statusModulo08 = 'cancelado';
      else if (lancamento.status === 'Vencido') statusModulo08 = 'vencido';
      
      // Descrição detalhada
      let descricao = isPagamentoInstrutor ? 'Pagamento de Aula' : (custoAuditavel?.nome || 'Custo não especificado');
      
      // Adicionar informação do vínculo (aluno ou instrutor)
      if (aluno) {
        descricao += ` - 👤 ${aluno.codigoSistema} ${aluno.nome}`;
      } else if (instrutor) {
        // Se o custo é para instrutor SEM fornecedor, destacar como pagamento ao instrutor
        if (custoVinculadoInstrutor) {
          descricao += ` - 👨‍🏫 INSTRUTOR: ${instrutor.codigo} ${instrutor.nome}`;
        } 
        // Se o custo é vinculado a instrutor MAS pago a fornecedor, mostrar ambos
        else if (custoVinculadoFornecedorComInstrutor) {
          const fornecedorPagamento = fornecedores.find(f => f.id === custoAuditavel?.fornecedorId);
          if (fornecedorPagamento) {
            descricao += ` - 🏢 FORNECEDOR: ${fornecedorPagamento.codigo} ${fornecedorPagamento.nome} (Instrutor: ${instrutor.codigo})`;
          } else {
            descricao += ` - 👨‍🏫 ${instrutor.codigo} ${instrutor.nome}`;
          }
        } 
        else {
          descricao += ` - 👨‍🏫 ${instrutor.codigo} ${instrutor.nome}`;
        }
      } else {
        descricao += ` - 🔓 [Custo não vinculado]`;
      }
      
      if (turma) descricao += ` (${turma.codigo})`;
      if (lancamento.geradoAutomaticamente) descricao += ` [Automático: ${lancamento.acaoDisparo}]`;
      
      // 🆕 Adicionar indicador de tipo de pagamento
      if (custoVinculadoInstrutor && instrutor) {
        descricao += ` [Pagamento: Instrutor]`;
      } else if (custoVinculadoFornecedorComInstrutor && instrutor) {
        const fornecedorPagamento = fornecedores.find(f => f.id === custoAuditavel?.fornecedorId);
        descricao += ` [Pagamento: Fornecedor ${fornecedorPagamento?.codigo || ''}]`;
      }
      
      lancamentosGerados.push({
        id: lancamento.id,
        codigo: lancamento.codigo,
        tipo: 'pagar',
        descricao: descricao,
        valor: lancamento.valor,
        dataVencimento: lancamento.dataVencimento,
        dataPagamento: lancamento.dataPagamento,
        status: statusModulo08,
        custoAuditavelId: custoAuditavel?.id,
        fornecedorId: custoAuditavel?.fornecedorId, // undefined se for pagamento direto ao instrutor
        turmaId: lancamento.turmaId,
        criterioId: lancamento.criterioCustoId,
        alunoId: lancamento.alunoId,
        instrutorId: lancamento.instrutorId, // ID do instrutor vinculado
        observacoes: lancamento.observacoes
      });
      
      // 🆕 Log especial para custos de instrutor
      if (custoVinculadoInstrutor && instrutor) {
        console.log(`💰 [CUSTO INSTRUTOR] ${lancamento.codigo} - Pagamento ao instrutor ${instrutor.codigo} ${instrutor.nome} - R$ ${lancamento.valor.toFixed(2)}`);
      } else if (custoVinculadoFornecedorComInstrutor && instrutor) {
        const fornecedor = fornecedores.find(f => f.id === custoAuditavel?.fornecedorId);
        console.log(`💼 [CUSTO FORNECEDOR+INSTRUTOR] ${lancamento.codigo} - Fornecedor: ${fornecedor?.nome} | Instrutor: ${instrutor.codigo} - R$ ${lancamento.valor.toFixed(2)}`);
      } else {
        console.log(`✅ [MÓDULO 08] Lançamento carregado: ${lancamento.codigo} - ${descricao}`);
      }
    });

    // 🔄 AGRUPAMENTO INTELIGENTE DE LANÇAMENTOS RECORRENTES
    console.log('🔄 [MÓDULO 08] Iniciando agrupamento inteligente de lançamentos recorrentes...');
    
    // 🎯 REGRAS DE AGRUPAMENTO:
    // 1. Custos de Instrutor (pagamento direto): mesma turma + mesmo instrutor
    // 2. Custos vinculados a instrutor pagos a fornecedor: mesmo instrutor + mesmo fornecedor + mesma turma
    // 3. Custos de Aluno: mesmo aluno + mesmo instrutor
    
    const grupos = new Map<string, LancamentoFinanceiro[]>();
    
    lancamentosGerados.forEach(lancamento => {
      // 🆕 Agrupa APENAS lançamentos de custos (contas a pagar)
      if (lancamento.tipo !== 'pagar') {
        return;
      }
      
      let chave = '';
      
      // 📌 REGRA 1: Custos de Instrutor (pagamento direto ao instrutor - sem fornecedor)
      // 🔒 Agora inclui custoAuditavelId para separar Diária de outros custos
      if (lancamento.instrutorId && !lancamento.fornecedorId) {
        // Agrupar por: custo + turma + instrutor + vencimento
        chave = `INSTRUTOR_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.turmaId || 'sem-turma'}_${lancamento.instrutorId}_${lancamento.dataVencimento}`;
        console.log(`📌 [AGRUPAMENTO] Lançamento ${lancamento.codigo} - INSTRUTOR DIRETO (${chave})`);
      }
      // 📌 REGRA 2: Custos vinculados a instrutor mas pagos a fornecedor
      // 🔒 Inclui custoAuditavelId para separar Alimentação, Transporte, etc.
      else if (lancamento.instrutorId && lancamento.fornecedorId) {
        // Agrupar por: custo + instrutor + fornecedor + turma + vencimento
        chave = `FORNECEDOR+INSTRUTOR_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.instrutorId}_${lancamento.fornecedorId}_${lancamento.turmaId || 'sem-turma'}_${lancamento.dataVencimento}`;
        console.log(`📌 [AGRUPAMENTO] Lançamento ${lancamento.codigo} - FORNECEDOR+INSTRUTOR (${chave})`);
      }
      // 📌 REGRA 3: Custos de Aluno (vinculados a aluno e instrutor)
      else if (lancamento.alunoId && lancamento.instrutorId) {
        // Agrupar por: aluno + instrutor + custo + vencimento
        chave = `ALUNO+INSTRUTOR_${lancamento.alunoId}_${lancamento.instrutorId}_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.dataVencimento}`;
        console.log(`📌 [AGRUPAMENTO] Lançamento ${lancamento.codigo} - ALUNO+INSTRUTOR (${chave})`);
      }
      // 🔹 OUTROS: Agrupar por aluno + custo + fornecedor + vencimento (lógica antiga para retrocompatibilidade)
      else {
        chave = `OUTROS_${lancamento.alunoId || 'sem-aluno'}_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.fornecedorId || 'sem-fornecedor'}_${lancamento.dataVencimento}`;
        console.log(`📌 [AGRUPAMENTO] Lançamento ${lancamento.codigo} - OUTROS (${chave})`);
      }
      
      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }
      grupos.get(chave)!.push(lancamento);
    });
    
    // Processar grupos: se tiver mais de 1 lançamento, consolidar
    const lancamentosConsolidados: LancamentoFinanceiro[] = [];
    const idsParaRemover = new Set<string>();
    
    grupos.forEach((lancamentosGrupo, chave) => {
      if (lancamentosGrupo.length > 1) {
        console.log(`📦 [AGRUPAMENTO] Encontrado grupo com ${lancamentosGrupo.length} lançamentos (chave: ${chave})`);
        
        // Ordenar por código (L0001, L0002, etc.)
        lancamentosGrupo.sort((a, b) => a.codigo.localeCompare(b.codigo));
        
        const primeiro = lancamentosGrupo[0];
        const valorTotal = lancamentosGrupo.reduce((sum, l) => sum + l.valor, 0);
        
        // Extrair data de cada lançamento (usar dataGeracao ou extrair das observações)
        const detalhamento = lancamentosGrupo.map(l => {
          // 🎯 PRIORIDADE: Extrair a DATA DA PRESENÇA (dia que o aluno compareceu)
          // NÃO usar dataVencimento - queremos a data real da aula/prova
          let data = '';
          
          // 1️⃣ Primeira prioridade: "Data da presença:" (aulas regulares)
          if (l.observacoes?.includes('Data da presença:')) {
            const matchPresenca = l.observacoes.match(/Data da presença: (\d{2}\/\d{2}\/\d{4})/);
            if (matchPresenca) {
              data = matchPresenca[1];
            }
          }
          
          // 2️⃣ Segunda prioridade: "na data" (provas agendadas)
          if (!data && l.observacoes?.includes('na data')) {
            const matchProva = l.observacoes.match(/na data (\d{2}\/\d{2}\/\d{4})/);
            if (matchProva) {
              data = matchProva[1];
            }
          }
          
          // 3️⃣ Terceira prioridade: Qualquer data nas observações
          if (!data && l.observacoes) {
            const matchData = l.observacoes.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (matchData) {
              data = matchData[1];
            }
          }
          
          // 4️⃣ Última opção: dataGeracao (não usar dataVencimento!)
          if (!data) {
            data = l.dataVencimento; // fallback temporário
          }
          
          return {
            codigo: l.codigo,
            data: data,
            valor: l.valor,
            descricao: l.observacoes || '',
            observacoes: l.observacoes
          };
        });
        
        // 🎯 Determinar tipo de agrupamento para descrição
        let tipoAgrupamento = '';
        if (chave.startsWith('INSTRUTOR_')) {
          tipoAgrupamento = '👨‍🏫 Instrutor';
        } else if (chave.startsWith('FORNECEDOR+INSTRUTOR_')) {
          tipoAgrupamento = '💼 Fornecedor+Instrutor';
        } else if (chave.startsWith('ALUNO+INSTRUTOR_')) {
          tipoAgrupamento = '👤 Aluno+Instrutor';
        } else {
          tipoAgrupamento = 'Múltiplos';
        }
        
        // Criar lançamento consolidado
        const consolidado: LancamentoFinanceiro = {
          ...primeiro,
          codigo: `${primeiro.codigo}-${lancamentosGrupo[lancamentosGrupo.length - 1].codigo}`, // Ex: L0003-L0007
          valor: valorTotal,
          agrupado: true,
          detalhamento: detalhamento,
          descricao: primeiro.descricao.replace(/\[Automático:.*\]/, `[${lancamentosGrupo.length} lançamentos ${tipoAgrupamento}]`)
        };
        
        lancamentosConsolidados.push(consolidado);
        
        // Marcar originais para remoção
        lancamentosGrupo.forEach(l => idsParaRemover.add(l.id));
        
        console.log(`✅ [AGRUPAMENTO] Criado lançamento consolidado: ${consolidado.codigo} - R$ ${valorTotal.toFixed(2)}`);
        console.log(`   - Detalhamento:`, detalhamento.map(d => `${d.data}: R$ ${d.valor.toFixed(2)}`).join(', '));
      }
    });
    
    // Remover lançamentos individuais que foram agrupados e adicionar consolidados
    const lancamentosFinais = [
      ...lancamentosGerados.filter(l => !idsParaRemover.has(l.id)),
      ...lancamentosConsolidados
    ];
    
    console.log(`🎯 [AGRUPAMENTO INTELIGENTE] Total original: ${lancamentosGerados.length} | Consolidados: ${lancamentosConsolidados.length} | Final: ${lancamentosFinais.length}`);

    // 🧾 LOG FINAL: Mostrar todos os lançamentos com nota fiscal
    console.log('📊 RESUMO DE LANÇAMENTOS COM NOTA FISCAL:');
    lancamentosFinais
      .filter(l => l.notaFiscal)
      .forEach(l => {
        console.log(`   💳 ${l.codigo} - Nota Fiscal: ${l.notaFiscal} - ${l.descricao}`);
      });

    return lancamentosFinais;
  });

  // 🔄 ATUALIZAR LANÇAMENTOS QUANDO lancamentosCusto MUDAR (solução para problema de não aparecer novos lançamentos)
  useEffect(() => {
    console.log('🔄 [MÓDULO 08] lancamentosCusto mudou, recalculando contas a pagar...');
    console.log('📊 Total de lançamentos de custo:', lancamentosCusto.length);
    
    // Remover todos os lançamentos de "pagar" antigos (gerados de custosAuditaveis)
    const lancamentosReceber = lancamentos.filter(l => l.tipo === 'receber');
    
    // Reprocessar lançamentos de custos
    const novosLancamentosPagar: LancamentoFinanceiro[] = [];
    
    lancamentosCusto.forEach(lancamento => {
      const custoAuditavel = custosAuditaveis.find(c => c.id === lancamento.custoAuditavelId);
      const aluno = alunos.find(a => a.id === lancamento.alunoId);
      const instrutor = instrutores.find(i => i.id === lancamento.instrutorId);
      const turma = turmas.find(t => t.id === lancamento.turmaId);
      const criterio = criteriosCusto.find(c => c.id === lancamento.criterioCustoId);
      
      // 🔍 VALIDAÇÃO: Verificar se o lançamento tem vínculo válido (aluno OU instrutor)
      if (lancamento.alunoId && !aluno) {
        console.error(`❌ [LANÇAMENTO ÓRFÃO - ALUNO] Lançamento ${lancamento.codigo} ignorado`);
        return;
      }
      
      if (lancamento.instrutorId && !instrutor) {
        console.error(`❌ [LANÇAMENTO ÓRFÃO - INSTRUTOR] Lançamento ${lancamento.codigo} ignorado`);
        return;
      }
      
      // 🆕 VERIFICAÇÃO ESPECIAL: Lançamentos de instrutor (pagamento direto)
      const isPagamentoInstrutor = lancamento.instrutorId && !lancamento.custoAuditavelId;
      
      if (!custoAuditavel && !isPagamentoInstrutor) {
        console.warn(`⚠️ Custo auditável não encontrado para lançamento ${lancamento.codigo}`);
        return;
      }
      
      // Lógica de vínculo
      const custoVinculadoInstrutor = isPagamentoInstrutor || (custoAuditavel?.instrutorId && !custoAuditavel?.fornecedorId);
      const custoVinculadoFornecedorComInstrutor = custoAuditavel?.instrutorId && custoAuditavel?.fornecedorId;
      
      // Converter status
      let statusModulo08: 'pendente' | 'vencido' | 'pago' | 'cancelado' = 'pendente';
      if (lancamento.status === 'Pago') statusModulo08 = 'pago';
      else if (lancamento.status === 'Cancelado') statusModulo08 = 'cancelado';
      else if (lancamento.status === 'Vencido') statusModulo08 = 'vencido';
      
      // Descrição detalhada
      let descricao = isPagamentoInstrutor ? 'Pagamento de Aula' : (custoAuditavel?.nome || 'Custo não especificado');
      
      if (aluno) {
        descricao += ` - 👤 ${aluno.codigoSistema} ${aluno.nome}`;
      } else if (instrutor) {
        if (custoVinculadoInstrutor) {
          descricao += ` - 👨‍🏫 INSTRUTOR: ${instrutor.codigo} ${instrutor.nome}`;
        } 
        // Se o custo é vinculado a instrutor MAS pago a fornecedor, mostrar ambos
        else if (custoVinculadoFornecedorComInstrutor) {
          const fornecedorPagamento = fornecedores.find(f => f.id === custoAuditavel?.fornecedorId);
          if (fornecedorPagamento) {
            descricao += ` - 🏢 FORNECEDOR: ${fornecedorPagamento.codigo} ${fornecedorPagamento.nome} (Instrutor: ${instrutor.codigo})`;
          } else {
            descricao += ` - 👨‍🏫 ${instrutor.codigo} ${instrutor.nome}`;
          }
        } 
        else {
          descricao += ` - 👨‍🏫 ${instrutor.codigo} ${instrutor.nome}`;
        }
      } else {
        descricao += ` - 🔓 [Custo não vinculado]`;
      }
      
      if (turma) descricao += ` (${turma.codigo})`;
      if (lancamento.geradoAutomaticamente) descricao += ` [Automático: ${lancamento.acaoDisparo}]`;
      
      if (custoVinculadoInstrutor && instrutor) {
        descricao += ` [Pagamento: Instrutor]`;
      } else if (custoVinculadoFornecedorComInstrutor && instrutor) {
        const fornecedorPagamento = fornecedores.find(f => f.id === custoAuditavel?.fornecedorId);
        descricao += ` [Pagamento: Fornecedor ${fornecedorPagamento?.codigo || ''}]`;
      }
      
      novosLancamentosPagar.push({
        id: lancamento.id,
        codigo: lancamento.codigo,
        tipo: 'pagar',
        descricao: descricao,
        valor: lancamento.valor,
        dataVencimento: lancamento.dataVencimento,
        dataPagamento: lancamento.dataPagamento,
        status: statusModulo08,
        custoAuditavelId: custoAuditavel?.id,
        fornecedorId: lancamento.fornecedorId, // 🔧 Usar fornecedorId do lançamento, não do custo
        turmaId: lancamento.turmaId,
        criterioId: lancamento.criterioCustoId,
        alunoId: lancamento.alunoId,
        instrutorId: lancamento.instrutorId,
        observacoes: lancamento.observacoes
      });
    });
    
    // 🔄 APLICAR AGRUPAMENTO INTELIGENTE NOS NOVOS LANÇAMENTOS
    const gruposNovos = new Map<string, typeof novosLancamentosPagar>();
    
    novosLancamentosPagar.forEach(lancamento => {
      let chave = '';
      
      // 📌 REGRA 1: Custos de Instrutor (pagamento direto ao instrutor - sem fornecedor)
      // 🔒 Agora inclui custoAuditavelId para separar diferentes tipos de custo
      if (lancamento.instrutorId && !lancamento.fornecedorId) {
        chave = `INSTRUTOR_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.turmaId || 'sem-turma'}_${lancamento.instrutorId}_${lancamento.dataVencimento}`;
      }
      // 📌 REGRA 2: Custos vinculados a instrutor mas pagos a fornecedor
      // 🔒 Inclui custoAuditavelId para separar Alimentação, Transporte, etc.
      else if (lancamento.instrutorId && lancamento.fornecedorId) {
        chave = `FORNECEDOR+INSTRUTOR_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.instrutorId}_${lancamento.fornecedorId}_${lancamento.turmaId || 'sem-turma'}_${lancamento.dataVencimento}`;
      }
      // 📌 REGRA 3: Custos de Aluno (vinculados a aluno e instrutor)
      else if (lancamento.alunoId && lancamento.instrutorId) {
        chave = `ALUNO+INSTRUTOR_${lancamento.alunoId}_${lancamento.instrutorId}_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.dataVencimento}`;
      }
      // 🔹 OUTROS: Agrupar por aluno + custo + fornecedor + vencimento
      else {
        chave = `OUTROS_${lancamento.alunoId || 'sem-aluno'}_${lancamento.custoAuditavelId || 'sem-custo'}_${lancamento.fornecedorId || 'sem-fornecedor'}_${lancamento.dataVencimento}`;
      }
      
      if (!gruposNovos.has(chave)) {
        gruposNovos.set(chave, []);
      }
      gruposNovos.get(chave)!.push(lancamento);
    });
    
    // Processar grupos e criar lançamentos consolidados
    const lancamentosConsolidadosNovos: LancamentoFinanceiro[] = [];
    const idsParaRemoverNovos = new Set<string>();
    
    gruposNovos.forEach((lancamentosGrupo, chave) => {
      if (lancamentosGrupo.length > 1) {
        console.log(`📦 [AGRUPAMENTO USEEFFECT] Grupo com ${lancamentosGrupo.length} lançamentos (${chave})`);
        
        lancamentosGrupo.sort((a, b) => a.codigo.localeCompare(b.codigo));
        const primeiro = lancamentosGrupo[0];
        const valorTotal = lancamentosGrupo.reduce((sum, l) => sum + l.valor, 0);
        
        const detalhamento = lancamentosGrupo.map(l => ({
          codigo: l.codigo,
          data: l.dataVencimento,
          valor: l.valor,
          descricao: l.observacoes || '',
          observacoes: l.observacoes
        }));
        
        // 🎯 Determinar tipo de agrupamento
        let tipoAgrupamento = '';
        if (chave.startsWith('INSTRUTOR_')) {
          tipoAgrupamento = '👨‍🏫 Instrutor';
        } else if (chave.startsWith('FORNECEDOR+INSTRUTOR_')) {
          tipoAgrupamento = '💼 Fornecedor+Instrutor';
        } else if (chave.startsWith('ALUNO+INSTRUTOR_')) {
          tipoAgrupamento = '👤 Aluno+Instrutor';
        } else {
          tipoAgrupamento = 'Múltiplos';
        }
        
        const consolidado: LancamentoFinanceiro = {
          ...primeiro,
          codigo: `${primeiro.codigo}-${lancamentosGrupo[lancamentosGrupo.length - 1].codigo}`,
          valor: valorTotal,
          agrupado: true,
          detalhamento: detalhamento,
          descricao: primeiro.descricao.replace(/\\[Automático:.*\\]/, `[${lancamentosGrupo.length} lançamentos ${tipoAgrupamento}]`)
        };
        
        lancamentosConsolidadosNovos.push(consolidado);
        lancamentosGrupo.forEach(l => idsParaRemoverNovos.add(l.id));
        
        console.log(`✅ [AGRUPAMENTO USEEFFECT] Consolidado: ${consolidado.codigo} - R$ ${valorTotal.toFixed(2)}`);
      }
    });
    
    // Remover lançamentos individuais agrupados e adicionar consolidados
    const lancamentosPagarFinais = [
      ...novosLancamentosPagar.filter(l => !idsParaRemoverNovos.has(l.id)),
      ...lancamentosConsolidadosNovos
    ];
    
    // Combinar lançamentos a receber (mantidos) com novos lançamentos a pagar
    const todosLancamentos = [...lancamentosReceber, ...lancamentosPagarFinais];
    console.log(`✅ [MÓDULO 08] Lançamentos atualizados: ${lancamentosReceber.length} receber + ${lancamentosPagarFinais.length} pagar = ${todosLancamentos.length}`);
    
    setLancamentos(todosLancamentos);
  }, [lancamentosCusto, custosAuditaveis, alunos, instrutores, turmas, criteriosCusto, fornecedores]);

  // Filtrar lançamentos
  const lancamentosFiltrados = useMemo(() => {
    console.log('🔍 [FILTROS] Iniciando filtragem...', {
      total: lancamentos.length,
      filtros: {
        tipo: filtroTipo,
        status: filtroStatus,
        turma: filtroTurma,
        fornecedor: filtroFornecedor,
        empresa: filtroEmpresa,
        busca: filtroBusca,
        periodoInicio: filtroPeriodoInicio,
        periodoFim: filtroPeriodoFim
      }
    });
    
    const resultado = lancamentos.filter(lancamento => {
      // Filtro por tipo (ignora quando está na aba de lançamentos de custo)
      if (filtroTipo !== 'todos' && filtroTipo !== 'lancamentos-custo' && lancamento.tipo !== filtroTipo) return false;

      // Filtro por status
      if (filtroStatus !== 'todos' && lancamento.status !== filtroStatus) return false;

      // Filtro por período
      if (filtroPeriodoInicio && lancamento.dataVencimento < filtroPeriodoInicio) return false;
      if (filtroPeriodoFim && lancamento.dataVencimento > filtroPeriodoFim) return false;

      // Filtro por busca (🔧 CORRIGIDO: não retorna imediatamente, permite outros filtros)
      if (filtroBusca) {
        const busca = filtroBusca.toLowerCase();
        const contemBusca = 
          lancamento.codigo.toLowerCase().includes(busca) ||
          lancamento.descricao.toLowerCase().includes(busca);
        if (!contemBusca) return false;
      }

      // Filtro por turma (melhorado: busca turma do aluno ou turma direta)
      if (filtroTurma !== 'todas') {
        // Se é conta a receber, buscar turma do aluno
        if (lancamento.tipo === 'receber' && lancamento.alunoId) {
          const aluno = alunos.find(a => a.id === lancamento.alunoId);
          if (!aluno || aluno.turmaId !== filtroTurma) return false;
        }
        // Se é conta a pagar, verificar turmaId direta
        else if (lancamento.tipo === 'pagar' && lancamento.turmaId) {
          if (lancamento.turmaId !== filtroTurma) return false;
        }
        // Se não tem turmaId nem alunoId, não filtra
        else if (!lancamento.turmaId && !lancamento.alunoId) {
          return false;
        }
      }

      // Filtro por fornecedor
      if (filtroFornecedor !== 'todos') {
        // Se tem fornecedorId, verificar se corresponde ao filtro
        if (lancamento.fornecedorId && lancamento.fornecedorId !== filtroFornecedor) return false;
        // Se NÃO tem fornecedorId (ex: custo de instrutor), ocultar quando filtro específico estiver ativo
        if (!lancamento.fornecedorId) return false;
      }

      // Filtro por empresa/cliente PJ (🔧 CORRIGIDO: só filtrar se o lançamento tiver clientePJId)
      if (filtroEmpresa !== 'todas') {
        // Se tem clientePJId, verificar se corresponde ao filtro
        if (lancamento.clientePJId && lancamento.clientePJId !== filtroEmpresa) return false;
        // Se NÃO tem clientePJId (ex: conta a pagar, custo geral), ocultar quando filtro específico estiver ativo
        if (!lancamento.clientePJId) return false;
      }

      // 🆕 Filtro por instrutor
      if (filtroInstrutor !== 'todos') {
        // Se tem instrutorId, verificar se corresponde ao filtro
        if (lancamento.instrutorId && lancamento.instrutorId !== filtroInstrutor) return false;
        // Se NÃO tem instrutorId, ocultar quando filtro específico estiver ativo
        if (!lancamento.instrutorId) return false;
      }

      return true;
    });
    
    console.log(`✅ [FILTROS] Filtragem concluída: ${resultado.length} de ${lancamentos.length} lançamentos`);
    return resultado;
  }, [lancamentos, filtroTipo, filtroStatus, filtroPeriodoInicio, filtroPeriodoFim, filtroBusca, filtroTurma, filtroFornecedor, filtroEmpresa, filtroInstrutor, alunos]);

  // 🆕 Calcular estatísticas baseadas nos lançamentos FILTRADOS
  const estatisticas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const totalPagar = lancamentosFiltrados
      .filter(l => l.tipo === 'pagar' && l.status !== 'cancelado')
      .reduce((sum, l) => sum + l.valor, 0);

    const totalReceber = lancamentosFiltrados
      .filter(l => l.tipo === 'receber' && l.status !== 'cancelado')
      .reduce((sum, l) => sum + l.valor, 0);

    const vencidosPagar = lancamentosFiltrados
      .filter(l => l.tipo === 'pagar' && l.status === 'vencido')
      .reduce((sum, l) => sum + l.valor, 0);

    const vencidosReceber = lancamentosFiltrados
      .filter(l => l.tipo === 'receber' && l.status === 'vencido')
      .reduce((sum, l) => sum + l.valor, 0);

    const pagosMes = lancamentosFiltrados
      .filter(l => l.status === 'pago' && l.dataPagamento && l.dataPagamento.startsWith('2026-01'))
      .reduce((sum, l) => sum + l.valor, 0);

    const recebidosMes = lancamentosFiltrados
      .filter(l => l.tipo === 'receber' && l.status === 'pago' && l.dataPagamento && l.dataPagamento.startsWith('2026-01'))
      .reduce((sum, l) => sum + l.valor, 0);

    return {
      totalPagar,
      totalReceber,
      vencidosPagar,
      vencidosReceber,
      pagosMes,
      recebidosMes,
      saldo: totalReceber - totalPagar
    };
  }, [lancamentosFiltrados]);

  // 🎯 Agrupar lançamentos por código (para exibir lotes juntos)
  const lancamentosAgrupados = useMemo(() => {
    const grupos = new Map<string, LancamentoFinanceiro[]>();
    
    // 🆕 Primeiro, identificar e agrupar lançamentos diários (que têm GRUPO_ID)
    const lancamentosComGrupo: LancamentoFinanceiro[] = [];
    const lancamentosSemGrupo: LancamentoFinanceiro[] = [];
    
    lancamentosFiltrados.forEach(lancamento => {
      // 🆕 Se o lançamento já está agrupado (tem campo agrupado: true), tratá-lo como um grupo único
      if (lancamento.agrupado) {
        // Já está consolidado, não precisa reagrupar
        lancamentosSemGrupo.push(lancamento);
      } else if (lancamento.observacoes && lancamento.observacoes.includes('GRUPO_ID:')) {
        lancamentosComGrupo.push(lancamento);
      } else {
        lancamentosSemGrupo.push(lancamento);
      }
    });
    
    // Agrupar lançamentos diários por GRUPO_ID
    const gruposDiarios = new Map<string, LancamentoFinanceiro[]>();
    console.log(`\n🔍 TOTAL DE LANÇAMENTOS COM GRUPO_ID: ${lancamentosComGrupo.length}`);
    lancamentosComGrupo.forEach(lancamento => {
      const match = lancamento.observacoes?.match(/GRUPO_ID:\s*([^\s|]+)/);
      if (match) {
        const grupoId = match[1];
        const grupo = gruposDiarios.get(grupoId) || [];
        gruposDiarios.set(grupoId, [...grupo, lancamento]);
        
        // 🔍 Log detalhado do lançamento e GRUPO_ID
        const alunoInfo = alunos.find(a => a.id === lancamento.alunoId);
        console.log(`   📋 ${lancamento.codigo} | Aluno: ${alunoInfo?.codigoSistema || lancamento.alunoId} | GRUPO_ID: ${grupoId}`);
        if (lancamento.observacoes) {
          console.log(`      Obs: ${lancamento.observacoes.substring(0, 200)}`);
        }
      }
    });
    
    console.log(`\n📊 RESUMO DOS GRUPOS DIÁRIOS (${gruposDiarios.size} grupos):`);
    gruposDiarios.forEach((lancamentosDoGrupo, grupoId) => {
      console.log(`   🎯 ${grupoId}: ${lancamentosDoGrupo.length} lançamentos`);
    });
    
    // Adicionar grupos diários ao mapa principal (usando o grupoId único por aluno)
    gruposDiarios.forEach((lancamentosDoGrupo, grupoId) => {
      // Usar o grupoId completo que já inclui custoId, alunoId e turmaId
      // Isso garante que cada aluno tenha seu próprio card agrupado
      const alunosUnicos = [...new Set(lancamentosDoGrupo.map(l => l.alunoId))];
      console.log(`🔍 Agrupando GRUPO_ID: ${grupoId} com ${lancamentosDoGrupo.length} lançamentos`);
      console.log(`   Alunos incluídos (${alunosUnicos.length}): ${alunosUnicos.join(', ')}`);
      console.log(`   Códigos: ${lancamentosDoGrupo.map(l => l.codigo).join(', ')}`);
      
      // ⚠️ VALIDAÇÃO: Se um grupo tem múltiplos alunos, há um erro nos dados
      if (alunosUnicos.length > 1) {
        console.error(`❌ ERRO: GRUPO_ID ${grupoId} contém ${alunosUnicos.length} alunos diferentes! Isso não deveria acontecer.`);
        console.error(`   Alunos: ${alunosUnicos.join(', ')}`);
        console.error(`   Separando em grupos individuais por aluno...`);
        
        // Separar por aluno
        alunosUnicos.forEach(alunoId => {
          const lancamentosDoAluno = lancamentosDoGrupo.filter(l => l.alunoId === alunoId);
          const grupoIdPorAluno = `${grupoId}-ALUNO-${alunoId}`;
          grupos.set(grupoIdPorAluno, lancamentosDoAluno);
          console.log(`   ✅ Criado grupo separado: ${grupoIdPorAluno} (${lancamentosDoAluno.length} lançamentos)`);
        });
      } else {
        grupos.set(grupoId, lancamentosDoGrupo);
      }
    });
    
    // Agrupar lançamentos normais por código
    lancamentosSemGrupo.forEach(lancamento => {
      const codigo = lancamento.codigo;
      const grupoExistente = grupos.get(codigo) || [];
      grupos.set(codigo, [...grupoExistente, lancamento]);
    });
    
    // 🔧 DEDUPLICAÇÃO: Converter para array e remover grupos duplicados
    const gruposArray = Array.from(grupos.entries()).map(([codigo, lancamentosDoGrupo]) => {
      // 🧾 Pegar a primeira nota fiscal disponível nos lançamentos do grupo
      const notaFiscal = lancamentosDoGrupo.find(l => l.notaFiscal)?.notaFiscal;
      
      // Verificar se é um grupo diário (grupoId tem formato GRUPO-{custoId}-{alunoId}-{turmaId})
      const isGrupoDiario = codigo.startsWith('GRUPO-');
      
      // 🔧 Para grupos diários, extrair o código base do primeiro lançamento E incluir código do aluno
      let codigoExibicao = codigo;
      if (isGrupoDiario) {
        const codigoBase = lancamentosDoGrupo[0].codigo.split('-D')[0]; // Extrai "D0005" de "D0005-D01"
        // Buscar código do aluno diretamente do lançamento
        const alunoId = lancamentosDoGrupo[0].alunoId;
        const aluno = alunoId ? alunos.find(a => a.id === alunoId) : null;
        const codigoAluno = aluno?.codigoSistema || '';
        codigoExibicao = codigoAluno ? `${codigoBase} - ${codigoAluno}` : codigoBase;
      }
      
      console.log(`📋 Grupo ${codigo}:`, {
        totalLancamentos: lancamentosDoGrupo.length,
        notaFiscalEncontrada: notaFiscal,
        isGrupoDiario,
        codigoExibicao, // 🆕 Log do código de exibição
        lancamentosComNF: lancamentosDoGrupo.filter(l => l.notaFiscal).length,
        primeiroLancamento: {
          id: lancamentosDoGrupo[0].id,
          notaFiscal: lancamentosDoGrupo[0].notaFiscal
        },
        todosLancamentos: lancamentosDoGrupo.map(l => ({
          id: l.id,
          descricao: l.descricao,
          notaFiscal: l.notaFiscal
        }))
      });
      
      return {
        codigo: codigoExibicao, // 🔧 Usar código de exibição correto
        grupoId: codigo, // 🆕 Manter grupoId original para referência
        lancamentos: lancamentosDoGrupo,
        isLote: lancamentosDoGrupo.length > 1 && lancamentosDoGrupo[0].tipo === 'receber',
        isGrupoDiario, // 🆕 Flag para identificar grupos diários
        valorTotal: lancamentosDoGrupo.reduce((sum, l) => sum + l.valor, 0),
        tipo: lancamentosDoGrupo[0].tipo,
        // Status consolidado: se todos pagos = pago, se algum vencido = vencido, senão pendente
        status: lancamentosDoGrupo.every(l => l.status === 'pago') 
          ? 'pago' as const
          : lancamentosDoGrupo.some(l => l.status === 'vencido')
          ? 'vencido' as const
          : lancamentosDoGrupo.some(l => l.status === 'faturado')
          ? 'faturado' as const
          : 'pendente' as const,
        dataVencimento: lancamentosDoGrupo[0].dataVencimento,
        dataPagamento: lancamentosDoGrupo.every(l => l.dataPagamento) 
          ? lancamentosDoGrupo[0].dataPagamento 
          : undefined,
        // 🧾 Nota Fiscal: pegar a primeira disponível nos lançamentos do grupo
        notaFiscal
      };
    });
    
    // 🔧 DEDUPLICAÇÃO: Remover grupos duplicados com base em grupoId único
    const gruposUnicos = new Map<string, typeof gruposArray[0]>();
    gruposArray.forEach(grupo => {
      // Se já existe um grupo com este grupoId, manter apenas o primeiro
      if (!gruposUnicos.has(grupo.grupoId)) {
        gruposUnicos.set(grupo.grupoId, grupo);
      } else {
        console.warn(`⚠️ DUPLICAÇÃO DETECTADA E REMOVIDA: ${grupo.grupoId}`);
      }
    });
    
    console.log(`\n✅ GRUPOS FINAIS: ${gruposUnicos.size} (removidas ${gruposArray.length - gruposUnicos.size} duplicações)`);
    
    return Array.from(gruposUnicos.values());
  }, [lancamentosFiltrados]);

  // Função para dar baixa no lançamento
  const darBaixa = (id: string) => {
    // 🎯 Encontrar o lançamento selecionado
    const lancamentoSelecionado = lancamentos.find(l => l.id === id);
    if (!lancamentoSelecionado) return;

    const codigoDoLancamento = lancamentoSelecionado.codigo;
    
    // 🎯 Verificar quantos lançamentos têm o MESMO código (lote)
    const lancamentosDoMesmoCodigo = lancamentos.filter(l => 
      l.codigo === codigoDoLancamento && 
      l.status !== 'pago' && 
      l.status !== 'cancelado'
    );

    const qtdLancamentos = lancamentosDoMesmoCodigo.length;
    const dataPagamento = new Date().toISOString().split('T')[0];

    // 🎯 Se há múltiplos lançamentos com o mesmo código, dar baixa em TODOS
    if (qtdLancamentos > 1) {
      const confirmar = window.confirm(
        `⚠️ ATENÇÃO: Este código ${codigoDoLancamento} possui ${qtdLancamentos} lançamentos.\n\n` +
        `Ao dar baixa, TODOS os ${qtdLancamentos} lançamentos deste código serão marcados como PAGOS.\n\n` +
        `Deseja continuar?`
      );

      if (!confirmar) return;

      // Dar baixa em TODOS os lançamentos do mesmo código
      setLancamentos(lancamentos.map(l => 
        l.codigo === codigoDoLancamento && l.status !== 'pago' && l.status !== 'cancelado'
          ? { ...l, status: 'pago' as const, dataPagamento }
          : l
      ));
      
      toast.success(`✅ Baixa realizada com sucesso! ${qtdLancamentos} lançamentos do código ${codigoDoLancamento} foram pagos.`);
    } else {
      // Apenas 1 lançamento com este código
      setLancamentos(lancamentos.map(l => 
        l.id === id 
          ? { ...l, status: 'pago' as const, dataPagamento }
          : l
      ));
      toast.success('✅ Baixa realizada com sucesso!');
    }
    
    setDialogDetalhesAberto(false);
  };

  // Função para cancelar lançamento
  const cancelarLancamento = (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este lançamento?')) {
      setLancamentos(lancamentos.map(l => 
        l.id === id 
          ? { ...l, status: 'cancelado' as const }
          : l
      ));
      toast.success('✅ Lançamento cancelado com sucesso!');
      setDialogDetalhesAberto(false);
    }
  };

  // 🆕 Função para abrir dialog de editar status
  const abrirEditarStatus = (lanc: LancamentoFinanceiro) => {
    setLancamentoSelecionado(lanc);
    setNovoStatus(lanc.status);
    setNovaDataPagamento(lanc.dataPagamento || '');
    setDialogEditarStatusAberto(true);
  };

  // 🆕 Função para salvar novo status
  const salvarNovoStatus = () => {
    if (!lancamentoSelecionado) return;

    setLancamentos(lancamentos.map(l =>
      l.id === lancamentoSelecionado.id
        ? {
            ...l,
            status: novoStatus,
            dataPagamento: novaDataPagamento || undefined
          }
        : l
    ));

    toast.success('✅ Status atualizado com sucesso!');
    setDialogEditarStatusAberto(false);
    setDialogDetalhesAberto(false);
  };

  // 🆕 Função para autorizar pagamento
  const handleAutorizarPagamento = (dados: {
    lancamentoId: string;
    tipoPagamento: 'total' | 'parcial';
    valorPago?: number;
    notaFiscal?: string;
  }) => {
    setLancamentos(lancamentos.map(l =>
      l.id === dados.lancamentoId
        ? {
            ...l,
            status: 'aguardando-autorizacao' as const,
            valorPago: dados.valorPago,
            notaFiscal: dados.notaFiscal || l.notaFiscal
          }
        : l
    ));
  };

  // 🆕 Função para confirmar pagamento
  const handleConfirmarPagamento = (dados: {
    lancamentoId: string;
    dataPagamento: string;
    formaPagamento: string;
  }) => {
    setLancamentos(lancamentos.map(l =>
      l.id === dados.lancamentoId
        ? {
            ...l,
            status: 'pago' as const,
            dataPagamento: dados.dataPagamento,
            formaPagamento: dados.formaPagamento
          }
        : l
    ));
  };

  // 🆕 Função para autorizar lote de pagamentos
  const handleAutorizarLote = (dados: {
    lancamentosIds: string[];
    tipoPagamento: 'total' | 'parcial';
    valorPagoPorLancamento?: { [key: string]: number };
    notaFiscal?: string;
  }) => {
    setLancamentos(lancamentos.map(l => {
      if (dados.lancamentosIds.includes(l.id)) {
        return {
          ...l,
          status: 'aguardando-autorizacao' as const,
          valorPago: dados.valorPagoPorLancamento?.[l.id],
          notaFiscal: dados.notaFiscal || l.notaFiscal
        };
      }
      return l;
    }));

    // Limpar seleção
    setLancamentosSelecionados(new Set());
    setModoSelecao(false);
  };

  // 🆕 Função para alternar seleção de um lançamento
  const toggleSelecaoLancamento = (lancamentoId: string) => {
    const novaSelecao = new Set(lancamentosSelecionados);
    if (novaSelecao.has(lancamentoId)) {
      novaSelecao.delete(lancamentoId);
    } else {
      novaSelecao.add(lancamentoId);
    }
    setLancamentosSelecionados(novaSelecao);
  };

  // 🆕 Função para selecionar todos os lançamentos visíveis do mesmo fornecedor
  const selecionarTodosFornecedor = (fornecedorId: string) => {
    const lancamentosDoFornecedor = lancamentosFiltrados
      .filter(l => 
        l.tipo === 'pagar' && 
        l.fornecedorId === fornecedorId && 
        l.status !== 'pago' && 
        l.status !== 'cancelado'
      );
    
    const novaSelecao = new Set<string>();
    lancamentosDoFornecedor.forEach(l => novaSelecao.add(l.id));
    setLancamentosSelecionados(novaSelecao);
  };

  // 🆕 Função para iniciar autorização em lote
  const iniciarAutorizacaoLote = () => {
    if (lancamentosSelecionados.size === 0) {
      toast.error('Selecione pelo menos um lançamento');
      return;
    }

    // 🔒 Validar se todos os lançamentos são do mesmo fornecedor
    const lancamentosSelecionadosArray = lancamentosCusto.filter(l => 
      lancamentosSelecionados.has(l.id)
    );
    
    const fornecedoresUnicos = new Set(
      lancamentosSelecionadosArray
        .map(l => l.fornecedorId)
        .filter(Boolean)
    );

    if (fornecedoresUnicos.size > 1) {
      const fornecedoresNomes = Array.from(fornecedoresUnicos)
        .map(fId => {
          const f = fornecedores.find(fn => fn.id === fId);
          return f ? `${f.codigo} - ${f.nome}` : 'Desconhecido';
        })
        .join(', ');

      toast.error('⚠️ Erro: Múltiplos fornecedores selecionados!', {
        description: `Os lançamentos selecionados pertencem a fornecedores diferentes: ${fornecedoresNomes}. Por favor, selecione apenas lançamentos do mesmo fornecedor.`,
        duration: 8000
      });
      return;
    }

    setDialogAutorizarLoteAberto(true);
  };

  // 🆕 Função para gerar recibo PF (Pessoa Física pagando produto extra quando aluno é PJ)
  const gerarReciboPF = async (lancamento: LancamentoFinanceiro) => {
    const aluno = lancamento.alunoId ? alunos.find(a => a.id === lancamento.alunoId) : null;
    if (!aluno) {
      toast.error('❌ Aluno não encontrado!');
      return;
    }

    // Verificar se é lançamento PF pela descrição
    const ehLancamentoPF = lancamento.descricao.includes('[PF]');
    if (!ehLancamentoPF) {
      toast.error('❌ Este lançamento não é um lançamento PF!');
      return;
    }

    // Extrair nome do produto da descrição: "💳 [PF] NomeProduto - NomeAluno (Código-PF)"
    const produtoMatch = lancamento.descricao.match(/\[PF\]\s+(.+?)\s+-/);
    const nomeProduto = produtoMatch ? produtoMatch[1] : 'Produto Extra';

    // Gerar número de recibo sequencial
    const numeroRecibo = `CP${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    // Formatar valor por extenso (completo)
    const formatarValorPorExtenso = (valor: number): string => {
      const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
      const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
      const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
      
      const valorInteiro = Math.floor(valor);
      const centavos = Math.round((valor - valorInteiro) * 100);
      
      const converterNumero = (num: number): string => {
        if (num === 0) return 'zero';
        if (num === 100) return 'cem';
        
        let resultado = '';
        
        // Centenas
        const c = Math.floor(num / 100);
        const resto = num % 100;
        
        if (c > 0) {
          resultado += centenas[c];
          if (resto > 0) resultado += ' e ';
        }
        
        // Dezenas e unidades
        if (resto >= 10 && resto < 20) {
          resultado += especiais[resto - 10];
        } else {
          const d = Math.floor(resto / 10);
          const u = resto % 10;
          
          if (d > 0) {
            resultado += dezenas[d];
            if (u > 0) resultado += ' e ';
          }
          
          if (u > 0) {
            resultado += unidades[u];
          }
        }
        
        return resultado;
      };
      
      // Converter milhares
      let extenso = '';
      const milhares = Math.floor(valorInteiro / 1000);
      const restoValor = valorInteiro % 1000;
      
      if (milhares > 0) {
        if (milhares === 1) {
          extenso = 'mil';
        } else {
          extenso = converterNumero(milhares) + ' mil';
        }
        
        if (restoValor > 0) {
          if (restoValor < 100) {
            extenso += ' e ';
          } else {
            extenso += ' ';
          }
        }
      }
      
      if (restoValor > 0) {
        extenso += converterNumero(restoValor);
      }
      
      // Adicionar "reais"
      if (valorInteiro === 1) {
        extenso += ' real';
      } else {
        extenso += ' reais';
      }
      
      // Adicionar centavos se houver
      if (centavos > 0) {
        extenso += ' e ' + converterNumero(centavos);
        extenso += centavos === 1 ? ' centavo' : ' centavos';
      }
      
      // Primeira letra maiúscula
      return extenso.charAt(0).toUpperCase() + extenso.slice(1);
    };

    // Formatar data por extenso
    const formatarDataPorExtenso = (): string => {
      const hoje = new Date();
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
    };

    // Formatar valor em moeda
    const valorFormatado = lancamento.valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });

    // 🎨 Converter logo para base64
    const logoBase64 = await converterLogoParaBase64();

    // Gerar HTML do recibo (modelo EXATO da imagem)
    const htmlRecibo = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo ${numeroRecibo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      padding: 0;
      background: white;
    }
    
    .recibo-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      border: 4px double #000;
      border-radius: 15px;
      position: relative;
      background: white;
    }
    
    .recibo-container::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      bottom: 8px;
      border: 2px solid #000;
      border-radius: 10px;
      pointer-events: none;
    }
    
    .cabecalho {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      border: 3px solid #000;
      border-radius: 8px;
      margin-bottom: 30px;
      background: white;
    }
    
    .cabecalho-titulo {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .logo-smcorp {
      height: 50px;
      width: auto;
      object-fit: contain;
    }
    
    .cabecalho-info {
      text-align: right;
    }
    
    .numero-recibo {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .valor-recibo {
      font-size: 18px;
      font-weight: bold;
    }
    
    .corpo-recibo {
      padding: 0 20px;
      line-height: 2.5;
      font-size: 16px;
    }
    
    .campo {
      margin: 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }
    
    .label {
      display: inline-block;
      min-width: 150px;
      font-weight: normal;
    }
    
    .valor-campo {
      font-weight: bold;
      margin-left: 10px;
    }
    
    .campo-texto {
      margin: 25px 0;
    }
    
    .assinatura-section {
      margin-top: 50px;
      padding: 0 20px;
    }
    
    .assinatura {
      margin-top: 80px;
      padding-top: 2px;
      border-top: 2px solid #000;
      width: 100%;
      font-size: 14px;
    }
    
    .rodape {
      margin-top: 40px;
      text-align: right;
      padding: 0 20px;
      font-weight: bold;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .btn-imprimir {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .btn-imprimir:hover {
      background: #b91c1c;
    }
  </style>
</head>
<body>
  <button class="btn-imprimir no-print" onclick="window.print()">🖨️ Imprimir</button>
  
  <div class="recibo-container">
    <div class="cabecalho">
      <div class="cabecalho-titulo">RECIBO</div>
      <div class="logo-container">
        <img src="${logoBase64}" alt="SMCORP Treinamentos" class="logo-smcorp" />
      </div>
      <div class="cabecalho-info">
        <div class="numero-recibo">Nº: ${numeroRecibo}</div>
        <div class="valor-recibo">VALOR: ${valorFormatado} -</div>
      </div>
    </div>
    
    <div class="corpo-recibo">
      <div class="campo">
        <span class="label">Recebe(emos) de</span>
        <span class="valor-campo">${aluno.nome} (CPF ${aluno.cpf})</span>
      </div>
      
      <div class="campo">
        <span class="label">a importância de</span>
        <span class="valor-campo">${formatarValorPorExtenso(lancamento.valor)}</span>
      </div>
      
      <div class="campo">
        <span class="label">referente a</span>
        <span class="valor-campo">${nomeProduto}</span>
      </div>
      
      <div class="campo-texto">
        e para clareza firmo(amos) o presente
      </div>
      
      <div style="text-align: right; margin-top: 40px; padding-right: 20px;">
        <strong>Macaé</strong>, ${formatarDataPorExtenso()}
      </div>
      
      <div class="assinatura-section">
        <div class="assinatura">Assinatura:</div>
      </div>
    </div>
    
    <div class="rodape">
      <div>SMCORP Treinamento LTDA</div>
      <div>13.036.648/0001-60</div>
    </div>
  </div>
  
  <script>
    // Auto-imprimir ao carregar (opcional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
    `;

    // Abrir em nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      janelaImpressao.document.write(htmlRecibo);
      janelaImpressao.document.close();
      toast.success(`✅ Recibo ${numeroRecibo} gerado com sucesso!`);
    } else {
      toast.error('❌ Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    }
  };

  // 🆕 Função para gerar recibo NORMAL (Pessoa Física - todos os produtos quando pagamento = 100%)
  const gerarRecibo = async (lancamento: LancamentoFinanceiro) => {
    const aluno = lancamento.alunoId ? alunos.find(a => a.id === lancamento.alunoId) : null;
    if (!aluno) {
      toast.error('❌ Aluno não encontrado!');
      return;
    }

    // Verificar se é Pessoa Física
    if (aluno.tipoPessoa === 'PJ') {
      toast.error('❌ Este recibo é apenas para Pessoa Física! Use o botão "Recibo PF" para produtos extras.');
      return;
    }

    // Verificar se não é lançamento [PF]
    if (lancamento.descricao.includes('[PF]')) {
      toast.error('❌ Use a função específica para lançamentos PF!');
      return;
    }

    // 🎯 Buscar nome REAL do curso do aluno
    let nomeProduto = 'Curso/Produto';
    
    if (aluno.turmaId) {
      const turma = turmas.find(t => t.id === aluno.turmaId);
      if (turma) {
        // Usar nome personalizado da turma se existir, senão buscar o curso
        if (turma.nomePersonalizado) {
          nomeProduto = turma.nomePersonalizado;
        } else if (turma.cursoId) {
          const curso = cursos.find(c => c.id === turma.cursoId);
          if (curso) {
            nomeProduto = curso.nome;
          }
        }
      }
    }

    // 📦 Adicionar produtos extras se houver
    if (aluno.produtosExtras && aluno.produtosExtras.length > 0) {
      const nomesExtras = aluno.produtosExtras
        .map(produtoId => {
          const produto = produtosExtras.find(p => p.id === produtoId);
          return produto ? produto.nome : null;
        })
        .filter(Boolean)
        .join(', ');
      
      if (nomesExtras) {
        nomeProduto += ` + ${nomesExtras}`;
      }
    }

    // Gerar número de recibo sequencial
    const numeroRecibo = `CP${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

    // 🎨 Converter logo para base64
    const logoBase64 = await converterLogoParaBase64();

    // Gerar HTML usando helper
    const htmlRecibo = gerarHTMLRecibo({
      numeroRecibo,
      alunoNome: aluno.nome,
      alunoCPF: aluno.cpf,
      valor: lancamento.valor,
      nomeProduto,
      logoBase64
    });

    // Abrir em nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      janelaImpressao.document.write(htmlRecibo);
      janelaImpressao.document.close();
      toast.success(`✅ Recibo ${numeroRecibo} gerado com sucesso!`);
    } else {
      toast.error('❌ Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
    }
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      case 'faturado':
        return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Faturado</Badge>;
      case 'aguardando-autorizacao':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" /> Aguardando Autorização</Badge>;
      default:
        return null;
    }
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    if (!data) return '';
    
    // Se já está em formato dd/mm/yyyy, retornar direto
    if (data.includes('/')) {
      return data;
    }
    
    // Se está em formato yyyy-mm-dd, converter para dd/mm/yyyy
    const partes = data.split('-');
    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    }
    
    return data;
  };

  // Função para formatar valor
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-600">💰 Módulo 08 - Fluxo Financeiro</h1>
            <p className="text-gray-600 mt-2">Controle de vencimentos, contas a pagar e receber</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                limparLancamentosOrfaos();
              }}
              variant="outline"
              size="sm"
              className="bg-orange-50 border-orange-300 hover:bg-orange-100"
            >
              🧹 Limpar Órfãos
            </Button>
            <Button
              onClick={() => {
                renumerarLancamentosCusto();
              }}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-300 hover:bg-blue-100"
              title="Renumera todos os lançamentos para corrigir códigos duplicados"
            >
              🔢 Renumerar Códigos
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('smcorp-alunos');
                window.location.reload();
              }}
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
            >
              🔄 Resetar Cache
            </Button>
          </div>
        </div>

        {/* 🆕 Indicador de Agrupamento Inteligente */}
        {(() => {
          const lancamentosAgrupados = lancamentos.filter(l => l.agrupado && l.detalhamento && l.detalhamento.length > 1);
          const totalLancamentosOriginais = lancamentosAgrupados.reduce((sum, l) => sum + (l.detalhamento?.length || 0), 0);
          return lancamentosAgrupados.length > 0 ? (
            <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-700" />
                <p className="text-sm text-purple-900 font-semibold">
                  🔄 Agrupamento Inteligente Ativo: {lancamentosAgrupados.length} grupo(s) consolidado(s) • {totalLancamentosOriginais} lançamentos individuais agrupados
                </p>
              </div>
            </div>
          ) : null;
        })()}

        {/* Indicador de Filtros Ativos */}
        {(filtroTurma !== 'todas' || filtroFornecedor !== 'todos' || filtroEmpresa !== 'todas' || 
          filtroStatus !== 'todos' || filtroBusca || filtroPeriodoInicio || filtroPeriodoFim) && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 font-semibold">
              📊 Exibindo resumo dos dados filtrados ({lancamentosFiltrados.length} lançamento(s))
            </p>
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">A Pagar (Total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-600">
                  {formatarValor(estatisticas.totalPagar)}
                </div>
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vencidos: {formatarValor(estatisticas.vencidosPagar)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">A Receber (Total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  {formatarValor(estatisticas.totalReceber)}
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vencidos: {formatarValor(estatisticas.vencidosReceber)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pagos no Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">
                  {formatarValor(estatisticas.pagosMes)}
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Janeiro/2026</p>
            </CardContent>
          </Card>

          <Card className={estatisticas.saldo >= 0 ? 'border-green-200' : 'border-red-200'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Projetado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarValor(estatisticas.saldo)}
                </div>
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Receber - Pagar</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                    <SelectItem value="receber">A Receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="aguardando-autorizacao">Aguardando Autorização</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="faturado">Faturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Período Início</Label>
                <Input 
                  type="date" 
                  value={filtroPeriodoInicio}
                  onChange={(e) => setFiltroPeriodoInicio(e.target.value)}
                />
              </div>

              <div>
                <Label>Período Fim</Label>
                <Input 
                  type="date" 
                  value={filtroPeriodoFim}
                  onChange={(e) => setFiltroPeriodoFim(e.target.value)}
                />
              </div>

              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Código ou descrição..."
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Turma</Label>
                <Select value={filtroTurma} onValueChange={(v: any) => setFiltroTurma(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {turmas.map(turma => (
                      <SelectItem key={turma.id} value={turma.id}>{turma.codigo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fornecedor</Label>
                <Select value={filtroFornecedor} onValueChange={(v: any) => setFiltroFornecedor(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {fornecedores.filter(f => f.id).map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Empresa/Cliente PJ</Label>
                <Select value={filtroEmpresa} onValueChange={(v: any) => setFiltroEmpresa(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {clientesPJ.map(empresa => (
                      <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 🆕 Filtro por Instrutor */}
              <div>
                <Label>Instrutor</Label>
                <Select value={filtroInstrutor} onValueChange={(v: any) => setFiltroInstrutor(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {instrutores.map(instrutor => (
                      <SelectItem key={instrutor.id} value={instrutor.id}>{instrutor.codigo} - {instrutor.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filtroTipo !== 'todos' || filtroStatus !== 'todos' || filtroPeriodoInicio || filtroPeriodoFim || filtroBusca || filtroTurma !== 'todas' || filtroFornecedor !== 'todos' || filtroEmpresa !== 'todas' || filtroInstrutor !== 'todos') && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroTipo('todos');
                    setFiltroStatus('todos');
                    setFiltroPeriodoInicio('');
                    setFiltroPeriodoFim('');
                    setFiltroBusca('');
                    setFiltroTurma('todas');
                    setFiltroFornecedor('todos');
                    setFiltroEmpresa('todas');
                    setFiltroInstrutor('todos'); // 🆕 Limpar filtro de instrutor
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs - Separação entre Contas a Pagar e Receber */}
        <Tabs value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as 'todos' | 'pagar' | 'receber' | 'lancamentos-custo')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos">
              Todos ({lancamentosFiltrados.length})
            </TabsTrigger>
            <TabsTrigger value="pagar">
              A Pagar ({lancamentosFiltrados.filter(l => l.tipo === 'pagar').length})
            </TabsTrigger>
            <TabsTrigger value="receber">
              A Receber ({lancamentosFiltrados.filter(l => l.tipo === 'receber').length})
            </TabsTrigger>
            <TabsTrigger value="lancamentos-custo">
              🗑️ Lançamentos de Custo ({lancamentosCusto.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-4 mt-4">
            {lancamentosAgrupados.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhum lançamento encontrado
                </CardContent>
              </Card>
            ) : (
              lancamentosAgrupados.map(grupo => (
                <CardLoteModulo08
                  key={grupo.grupoId || grupo.codigo}
                  grupo={grupo}
                  alunos={alunos}
                  instrutores={instrutores}
                  turmas={turmas}
                  onVerDetalhes={(lanc) => {
                    setLancamentoSelecionado(lanc);
                    setDialogDetalhesAberto(true);
                  }}
                  onDarBaixa={darBaixa}
                  onGerarRecibo={gerarRecibo}
                  onGerarReciboPF={gerarReciboPF}
                  formatarValor={formatarValor}
                  formatarData={formatarData}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pagar" className="space-y-4 mt-4">
            {/* Controles de Seleção em Lote */}
            {lancamentosAgrupados.filter(g => g.tipo === 'pagar' && g.status !== 'pago' && g.status !== 'cancelado').length > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-800">Autorização em Lote</p>
                    <p className="text-sm text-orange-600">
                      {modoSelecao 
                        ? `${lancamentosSelecionados.size} lançamento(s) selecionado(s)`
                        : 'Selecione múltiplos lançamentos do mesmo fornecedor'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!modoSelecao ? (
                    <Button
                      onClick={() => setModoSelecao(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Ativar Seleção
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setModoSelecao(false);
                          setLancamentosSelecionados(new Set());
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={iniciarAutorizacaoLote}
                        disabled={lancamentosSelecionados.size === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Autorizar {lancamentosSelecionados.size} Lançamento(s)
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {lancamentosAgrupados.filter(g => g.tipo === 'pagar').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhuma conta a pagar encontrada
                </CardContent>
              </Card>
            ) : (
              lancamentosAgrupados.filter(g => g.tipo === 'pagar').map(grupo => {
                const lancamento = grupo.lancamentos[0];
                
                // 🆕 Se é um lançamento com agrupamento inteligente, usar CardLancamentoAgrupado
                if (lancamento.agrupado && lancamento.detalhamento && lancamento.detalhamento.length > 1) {
                  const fornecedor = lancamento.fornecedorId ? fornecedores.find(f => f.id === lancamento.fornecedorId) : null;
                  const turma = lancamento.turmaId ? turmas.find(t => t.id === lancamento.turmaId) : null;
                  const aluno = lancamento.alunoId ? alunos.find(a => a.id === lancamento.alunoId) : null;
                  const custoAuditavel = lancamento.custoAuditavelId ? custosAuditaveis.find(c => c.id === lancamento.custoAuditavelId) : null;
                  const instrutor = lancamento.instrutorId ? instrutores.find(i => i.id === lancamento.instrutorId) : null; // 🆕 Buscar instrutor

                  return (
                    <CardLancamentoAgrupado
                      key={lancamento.id}
                      lancamento={{
                        id: lancamento.id,
                        codigo: lancamento.codigo,
                        descricao: lancamento.descricao,
                        valor: lancamento.valor,
                        dataVencimento: lancamento.dataVencimento,
                        status: lancamento.status,
                        agrupado: true,
                        detalhamento: lancamento.detalhamento,
                        fornecedorNome: fornecedor ? `${fornecedor.codigo} - ${fornecedor.nome}` : undefined,
                        alunoNome: aluno?.nome,
                        alunocodigo: aluno?.codigoSistema,
                        turmacodigo: turma?.codigo,
                        custoNome: custoAuditavel?.nome,
                        instrutorNome: instrutor?.nome, // 🆕 Nome do instrutor
                        instrutorCodigo: instrutor?.codigo // 🆕 Código do instrutor
                      }}
                      onVerDetalhes={() => {
                        setLancamentoSelecionado(lancamento);
                        setDialogDetalhesAberto(true);
                      }}
                      onDarBaixa={() => {
                        if (grupo.status === 'aguardando-autorizacao') {
                          setLancamentoSelecionado(lancamento);
                          setDialogConfirmarAberto(true);
                        } else {
                          setLancamentoSelecionado(lancamento);
                          setDialogAutorizarAberto(true);
                        }
                      }}
                      formatarValor={formatarValor}
                      formatarData={formatarData}
                    />
                  );
                }
                
                // Se é um grupo diário, mostrar de forma agrupada
                if (grupo.isGrupoDiario && grupo.lancamentos.length > 1) {
                  const fornecedor = lancamento.fornecedorId 
                    ? fornecedores.find(f => f.id === lancamento.fornecedorId)
                    : null;
                  const turma = lancamento.turmaId 
                    ? turmas.find(t => t.id === lancamento.turmaId)
                    : null;
                  const criterio = lancamento.criterioId
                    ? criteriosCusto.find(c => c.id === lancamento.criterioId)
                    : null;
                  const alunoCusto = lancamento.alunoId
                    ? alunos.find(a => a.id === lancamento.alunoId)
                    : null;
                  const instrutorCusto = lancamento.instrutorId // 🆕 Buscar instrutor
                    ? instrutores.find(i => i.id === lancamento.instrutorId)
                    : null;

                  // Extrair nome do custo e aluno da descrição
                  const [nomeCusto, nomeAluno] = lancamento.descricao.split(' - ');
                  const codigoBase = lancamento.codigo.split('-')[0];

                  return (
                    <Card 
                      key={grupo.grupoId || grupo.codigo} 
                      className="border-l-4 border-l-red-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-red-50">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">{codigoBase}</span>
                                  {getStatusBadge(grupo.status)}
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                    {grupo.lancamentos.length} dias
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{nomeCusto} - {nomeAluno}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-gray-500">Valor Total</p>
                                <p className="font-bold text-red-600">
                                  {formatarValor(grupo.valorTotal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Valor Unitário</p>
                                <p className="font-semibold text-gray-600">
                                  {formatarValor(lancamento.valor)} / dia
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Vencimento</p>
                                <p className="font-semibold">{formatarData(lancamento.dataVencimento)}</p>
                              </div>
                              {fornecedor && (
                                <div>
                                  <p className="text-gray-500">Fornecedor</p>
                                  <p className="font-semibold flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {fornecedor.nome}
                                  </p>
                                </div>
                              )}
                              {turma && (
                                <div>
                                  <p className="text-gray-500">Turma</p>
                                  <p className="font-semibold flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {turma.codigo}
                                  </p>
                                </div>
                              )}
                              {criterio && (
                                <div>
                                  <p className="text-gray-500">Critério</p>
                                  <p className="font-semibold text-blue-600 text-xs">
                                    {criterio.nome}
                                  </p>
                                </div>
                              )}
                              {alunoCusto && (
                                <div>
                                  <p className="text-gray-500">Aluno</p>
                                  <p className="font-semibold text-purple-600 text-xs">
                                    {alunoCusto.codigoSistema}
                                  </p>
                                </div>
                              )}
                              {instrutorCusto && (
                                <div>
                                  <p className="text-gray-500">👨‍🏫 Instrutor</p>
                                  <p className="font-semibold text-green-600 text-xs">
                                    {instrutorCusto.codigo} - {instrutorCusto.nome}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* 📦 Mostrar informações do produto do aluno */}
                            {lancamento.observacoes && lancamento.observacoes.includes('Produto:') && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-800 font-semibold">
                                  {lancamento.observacoes.split('|').find(s => s.includes('Produto:'))?.trim()}
                                </p>
                              </div>
                            )}

                            {/* ℹ️ Aviso sobre critério diário */}
                            {criterio && criterio.frequenciaLancamento === 'Diariamente' && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs text-green-800 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span>
                                    <strong>Critério Diário:</strong> Apenas os dias com presença confirmada geram lançamentos. 
                                    Dias de ausência não são cobrados.
                                  </span>
                                </p>
                              </div>
                            )}

                            {/* 📅 Detalhamento dos dias */}
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-red-600 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Ver detalhamento por dia ({grupo.lancamentos.length} {grupo.lancamentos.length === 1 ? 'lançamento' : 'lançamentos'} - apenas dias com presença)
                              </summary>
                              <div className="mt-2 space-y-1 pl-6">
                                {grupo.lancamentos.map((lanc, idx) => {
                                  const diaMatch = lanc.observacoes?.match(/Dia \d+\/\d+ - (\d{2}\/\d{2}\/\d{4})/);
                                  const diaTexto = diaMatch ? diaMatch[1] : `Dia ${idx + 1}`;
                                  const estaPresente = lanc.observacoes?.includes('✅ PRESENTE');
                                  return (
                                    <div key={lanc.id} className="text-xs text-gray-600 flex items-center gap-2">
                                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{lanc.codigo}</span>
                                      <span>{diaTexto}</span>
                                      <span className="text-red-600 font-semibold">{formatarValor(lanc.valor)}</span>
                                      {estaPresente && (
                                        <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0">
                                          ✅ Presente
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setDialogDetalhesAberto(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {grupo.status === 'aguardando-autorizacao' ? (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setLancamentoSelecionado(lancamento);
                                  setDialogConfirmarAberto(true);
                                }}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Confirmar Pagamento
                              </Button>
                            ) : grupo.status !== 'pago' && grupo.status !== 'cancelado' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => {
                                  setLancamentoSelecionado(lancamento);
                                  setDialogAutorizarAberto(true);
                                }}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Autorizar Pagamento
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Para lançamentos únicos (não agrupados), manter o formato original
                const fornecedor = lancamento.fornecedorId 
                  ? fornecedores.find(f => f.id === lancamento.fornecedorId)
                  : null;
                const turma = lancamento.turmaId 
                  ? turmas.find(t => t.id === lancamento.turmaId)
                  : null;
                const criterio = lancamento.criterioId
                  ? criteriosCusto.find(c => c.id === lancamento.criterioId)
                  : null;
                const alunoCusto = lancamento.alunoId
                  ? alunos.find(a => a.id === lancamento.alunoId)
                  : null;
                const instrutorCusto = lancamento.instrutorId // 🆕 Buscar instrutor
                  ? instrutores.find(i => i.id === lancamento.instrutorId)
                  : null;

                return (
                  <Card 
                    key={lancamento.id} 
                    className={`border-l-4 border-l-red-500 ${lancamento.status === 'cancelado' ? 'opacity-50' : ''} ${
                      modoSelecao && lancamentosSelecionados.has(lancamento.id) ? 'bg-orange-50 border-orange-300' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        {/* Checkbox de Seleção */}
                        {modoSelecao && lancamento.status !== 'pago' && lancamento.status !== 'cancelado' && (
                          <div 
                            className="mr-3 cursor-pointer pt-2"
                            onClick={() => toggleSelecaoLancamento(lancamento.id)}
                          >
                            {lancamentosSelecionados.has(lancamento.id) ? (
                              <CheckSquare className="w-6 h-6 text-orange-600" />
                            ) : (
                              <Square className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-red-50">
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{lancamento.codigo}</span>
                                {getStatusBadge(lancamento.status)}
                              </div>
                              <p className="text-sm text-gray-600">{lancamento.descricao}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-500">Valor</p>
                              <p className="font-bold text-red-600">
                                {formatarValor(lancamento.valor)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Vencimento</p>
                              <p className="font-semibold">{formatarData(lancamento.dataVencimento)}</p>
                            </div>
                            {lancamento.dataPagamento && (
                              <div>
                                <p className="text-gray-500">Pagamento</p>
                                <p className="font-semibold text-green-600">
                                  {formatarData(lancamento.dataPagamento)}
                                </p>
                              </div>
                            )}
                            {fornecedor && (
                              <div>
                                <p className="text-gray-500">Fornecedor</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {fornecedor.nome}
                                </p>
                              </div>
                            )}
                            {turma && (
                              <div>
                                <p className="text-gray-500">Turma</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {turma.codigo}
                                </p>
                              </div>
                            )}
                            {criterio && (
                              <div>
                                <p className="text-gray-500">Critério</p>
                                <p className="font-semibold text-blue-600 text-xs">
                                  {criterio.nome}
                                </p>
                              </div>
                            )}
                            {alunoCusto && (
                              <div>
                                <p className="text-gray-500">Aluno</p>
                                <p className="font-semibold text-purple-600 text-xs">
                                  {alunoCusto.codigoSistema}
                                </p>
                              </div>
                            )}
                            {instrutorCusto && (
                              <div>
                                <p className="text-gray-500">👨‍🏫 Instrutor</p>
                                <p className="font-semibold text-green-600 text-xs">
                                  {instrutorCusto.codigo} - {instrutorCusto.nome}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* 📦 Mostrar informações do produto do aluno */}
                          {lancamento.observacoes && lancamento.observacoes.includes('Produto:') && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-800 font-semibold">
                                {lancamento.observacoes.split('|').find(s => s.includes('Produto:'))?.trim()}
                              </p>
                            </div>
                          )}
                        </div>

                        {!modoSelecao && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setDialogDetalhesAberto(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {lancamento.status === 'aguardando-autorizacao' ? (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setDialogConfirmarAberto(true);
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Confirmar Pagamento
                            </Button>
                          ) : lancamento.status !== 'pago' && lancamento.status !== 'cancelado' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setDialogAutorizarAberto(true);
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Autorizar Pagamento
                            </Button>
                          )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="receber" className="space-y-4 mt-4">
            {lancamentosFiltrados.filter(l => l.tipo === 'receber').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhuma conta a receber encontrada
                </CardContent>
              </Card>
            ) : (
              lancamentosFiltrados.filter(l => l.tipo === 'receber').map(lancamento => {
                const aluno = lancamento.alunoId
                  ? alunos.find(a => a.id === lancamento.alunoId)
                  : null;
                const clientePJ = lancamento.clientePJId
                  ? clientesPJ.find(c => c.id === lancamento.clientePJId)
                  : null;

                return (
                  <Card 
                    key={lancamento.id} 
                    className={`border-l-4 border-l-green-500 ${lancamento.status === 'cancelado' ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-50">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{lancamento.codigo}</span>
                                {getStatusBadge(lancamento.status)}
                              </div>
                              <p className="text-sm text-gray-600">{lancamento.descricao}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-500">Valor</p>
                              <p className="font-bold text-green-600">
                                {formatarValor(lancamento.valor)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Vencimento</p>
                              <p className="font-semibold">{formatarData(lancamento.dataVencimento)}</p>
                            </div>
                            {lancamento.dataPagamento && (
                              <div>
                                <p className="text-gray-500">Recebimento</p>
                                <p className="font-semibold text-green-600">
                                  {formatarData(lancamento.dataPagamento)}
                                </p>
                              </div>
                            )}
                            {aluno && (
                              <div>
                                <p className="text-gray-500">Aluno</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {aluno.nome}
                                </p>
                              </div>
                            )}
                            {clientePJ && (
                              <div>
                                <p className="text-gray-500">Empresa</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {clientePJ.nomeEmpresa}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLancamentoSelecionado(lancamento);
                              setDialogDetalhesAberto(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {lancamento.status !== 'pago' && lancamento.status !== 'cancelado' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => darBaixa(lancamento.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                          )}
                          {/* 🆕 Botão de Download para lançamentos PF pagos */}
                          {lancamento.status === 'pago' && lancamento.descricao.includes('[PF]') && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => gerarReciboPF(lancamento)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Recibo PF
                            </Button>
                          )}
                          {/* 🆕 Botão de Recibo NORMAL para Pessoa Física (não-[PF]) com pagamento = 100% */}
                          {lancamento.status === 'pago' && !lancamento.descricao.includes('[PF]') && aluno && !aluno.tipoPessoa && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => gerarRecibo(lancamento)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Recibo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* 🗑️ Nova Aba: Lançamentos de Custo (com exclusão) */}
          <TabsContent value="lancamentos-custo">
            <AbaLancamentosCusto
              lancamentosCusto={lancamentosCusto}
              custosAuditaveis={custosAuditaveis}
              alunos={alunos}
              instrutores={instrutores}
              turmas={turmas}
              criteriosCusto={criteriosCusto}
              formatarValor={formatarValor}
              formatarData={formatarData}
            />
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes */}
        <Dialog open={dialogDetalhesAberto} onOpenChange={setDialogDetalhesAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Lançamento</DialogTitle>
              <DialogDescription>
                Informações completas do lançamento financeiro
              </DialogDescription>
            </DialogHeader>

            {lancamentoSelecionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Código</Label>
                    <p className="font-bold text-lg">{lancamentoSelecionado.codigo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(lancamentoSelecionado.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Descrição</Label>
                  <p className="font-semibold">{lancamentoSelecionado.descricao}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Tipo</Label>
                    <p className={`font-bold ${
                      lancamentoSelecionado.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {lancamentoSelecionado.tipo === 'pagar' ? 'Conta a Pagar' : 'Conta a Receber'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Valor</Label>
                    <p className={`font-bold text-lg ${
                      lancamentoSelecionado.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatarValor(lancamentoSelecionado.valor)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Data de Vencimento</Label>
                    <p className="font-semibold">{formatarData(lancamentoSelecionado.dataVencimento)}</p>
                  </div>
                  {lancamentoSelecionado.dataPagamento && (
                    <div>
                      <Label className="text-gray-500">Data de Pagamento</Label>
                      <p className="font-semibold text-green-600">
                        {formatarData(lancamentoSelecionado.dataPagamento)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 🧾 Exibir Nota Fiscal se existir */}
                {lancamentoSelecionado.notaFiscal && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <Label className="text-gray-500">🧾 Nota Fiscal</Label>
                    <p className="font-bold text-lg text-blue-700">{lancamentoSelecionado.notaFiscal}</p>
                  </div>
                )}

                {lancamentoSelecionado.fornecedorId && (
                  <div>
                    <Label className="text-gray-500">Fornecedor</Label>
                    <p className="font-semibold">
                      {fornecedores.find(f => f.id === lancamentoSelecionado.fornecedorId)?.nome || 'N/A'}
                    </p>
                  </div>
                )}

                {lancamentoSelecionado.turmaId && (
                  <div>
                    <Label className="text-gray-500">Turma</Label>
                    <p className="font-semibold">
                      {turmas.find(t => t.id === lancamentoSelecionado.turmaId)?.codigo || 'N/A'}
                    </p>
                  </div>
                )}

                {lancamentoSelecionado.criterioId && (
                  <div>
                    <Label className="text-gray-500">Critério de Custo</Label>
                    <p className="font-semibold text-blue-600">
                      {criteriosCusto.find(c => c.id === lancamentoSelecionado.criterioId)?.nome || 'N/A'}
                    </p>
                  </div>
                )}

                {lancamentoSelecionado.observacoes && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <Label className="text-gray-500">📋 Observações Detalhadas</Label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{lancamentoSelecionado.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => abrirEditarStatus(lancamentoSelecionado)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Status
                  </Button>
                  {lancamentoSelecionado.status !== 'pago' && lancamentoSelecionado.status !== 'cancelado' && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => darBaixa(lancamentoSelecionado.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Dar Baixa
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => cancelarLancamento(lancamentoSelecionado.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setDialogDetalhesAberto(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar Status */}
        <Dialog open={dialogEditarStatusAberto} onOpenChange={setDialogEditarStatusAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Status do Lançamento</DialogTitle>
              <DialogDescription>
                Altere o status e a data de pagamento do lançamento financeiro
              </DialogDescription>
            </DialogHeader>

            {lancamentoSelecionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Código</Label>
                    <p className="font-bold text-lg">{lancamentoSelecionado.codigo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status Atual</Label>
                    <div className="mt-1">{getStatusBadge(lancamentoSelecionado.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Descrição</Label>
                  <p className="font-semibold">{lancamentoSelecionado.descricao}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Novo Status</Label>
                    <Select value={novoStatus} onValueChange={(v: any) => setNovoStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="aguardando-autorizacao">Aguardando Autorização</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="faturado">Faturado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {novoStatus === 'pago' && (
                    <div>
                      <Label className="text-gray-500">Data de Pagamento</Label>
                      <Input 
                        type="date" 
                        value={novaDataPagamento}
                        onChange={(e) => setNovaDataPagamento(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={salvarNovoStatus}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDialogEditarStatusAberto(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Autorizar Pagamento */}
        {lancamentoSelecionado && (
          <DialogAutorizarPagamento
            open={dialogAutorizarAberto}
            onOpenChange={setDialogAutorizarAberto}
            lancamento={{
              id: lancamentoSelecionado.id,
              codigo: lancamentoSelecionado.codigo,
              descricao: lancamentoSelecionado.descricao,
              valor: lancamentoSelecionado.valor,
              status: lancamentoSelecionado.status
            }}
            onAutorizar={handleAutorizarPagamento}
          />
        )}

        {/* Dialog de Confirmar Pagamento */}
        {lancamentoSelecionado && (
          <DialogConfirmarPagamento
            open={dialogConfirmarAberto}
            onOpenChange={setDialogConfirmarAberto}
            lancamento={{
              id: lancamentoSelecionado.id,
              codigo: lancamentoSelecionado.codigo,
              descricao: lancamentoSelecionado.descricao,
              valor: lancamentoSelecionado.valor,
              valorPago: lancamentoSelecionado.valorPago
            }}
            onConfirmar={handleConfirmarPagamento}
          />
        )}

        {/* Dialog de Autorizar Lote de Pagamentos */}
        {lancamentosSelecionados.size > 0 && (() => {
          const lancamentosArray = Array.from(lancamentosSelecionados)
            .map(id => lancamentos.find(l => l.id === id))
            .filter(l => l !== undefined);
          
          // 🔧 Verificar se há múltiplos fornecedores
          const fornecedoresUnicos = new Set(lancamentosArray.map(l => l.fornecedorId).filter(Boolean));
          let fornecedorNome = 'Não especificado';
          
          if (fornecedoresUnicos.size === 0) {
            fornecedorNome = 'Sem fornecedor vinculado';
          } else if (fornecedoresUnicos.size === 1) {
            const fornecedor = fornecedores.find(f => f.id === Array.from(fornecedoresUnicos)[0]);
            fornecedorNome = fornecedor ? `${fornecedor.codigo} - ${fornecedor.nome}` : 'Fornecedor não encontrado';
          } else {
            // ⚠️ ERRO: Lançamentos com múltiplos fornecedores no mesmo lote
            const fornecedoresNomes = Array.from(fornecedoresUnicos)
              .map(fId => {
                const f = fornecedores.find(fn => fn.id === fId);
                return f ? `${f.codigo} - ${f.nome}` : 'Desconhecido';
              })
              .join(', ');
            
            fornecedorNome = `⚠️ ERRO: Múltiplos Fornecedores`;
            
            toast.error('⚠️ Erro: Lançamentos com múltiplos fornecedores!', {
              description: `Os lançamentos selecionados pertencem a fornecedores diferentes: ${fornecedoresNomes}. Por favor, selecione lançamentos de apenas um fornecedor por vez.`,
              duration: 8000
            });
          }

          return (
            <DialogAutorizarLotePagamento
              open={dialogAutorizarLoteAberto}
              onOpenChange={setDialogAutorizarLoteAberto}
              lancamentos={lancamentosArray.map(l => ({
                id: l.id,
                codigo: l.codigo,
                descricao: l.descricao,
                valor: l.valor
              }))}
              fornecedorNome={fornecedorNome}
              onAutorizar={handleAutorizarLote}
            />
          );
        })()}
      </div>
    </div>
  );
}