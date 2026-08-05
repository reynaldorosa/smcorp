import React, { useState, useMemo } from 'react';
import { DollarSign, Search, Filter, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle, Clock, Download, Edit2, Calendar, Building2, User, Trash2, X, Lock, CheckSquare } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const Modulo07: React.FC = () => {
  const { alunos, turmas, cursos, clientesPJ, atualizarAluno, atualizarAlunosEmLote, usuarioAtual, produtosExtras, gerarNumeroRecibo } = useSMCorp();
  
  // Estados de filtros
  const [buscaAluno, setBuscaAluno] = useState<string>('');
  const [statusPagamentoFiltro, setStatusPagamentoFiltro] = useState<string>('todos');
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [tipoPessoaFiltro, setTipoPessoaFiltro] = useState<string>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('todos');
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('todas');
  
  // Estados para seleção múltipla e aprovação em lote
  const [modoSelecao, setModoSelecao] = useState(false);
  const [alunosSelecionados, setAlunosSelecionados] = useState<Set<string>>(new Set());
  const [dialogAprovacaoLoteAberto, setDialogAprovacaoLoteAberto] = useState(false);
  const [codigoBarrasLote, setCodigoBarrasLote] = useState('');
  const [dataVencimentoLote, setDataVencimentoLote] = useState('');
  const [numeroNotaFiscalLote, setNumeroNotaFiscalLote] = useState(''); // 🆕 Nota Fiscal em Lote (obrigatória para PJ)
  
  // Estados para dialog de pagamento
  const [dialogPagamentoAberto, setDialogPagamentoAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [codigoBarrasBoleto, setCodigoBarrasBoleto] = useState('');
  const [dataVencimentoBoleto, setDataVencimentoBoleto] = useState('');
  
  // Estados para confirmação de pagamento
  const [confirmandoPagamento, setConfirmandoPagamento] = useState<string | null>(null);
  const [confirmandoBoletoId, setConfirmandoBoletoId] = useState<string | null>(null);
  const [confirmarCodigoBarras, setConfirmarCodigoBarras] = useState('');
  const [confirmarDataVencimento, setConfirmarDataVencimento] = useState('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState(''); // 🆕 Número da Nota Fiscal
  
  // Estados para editar pagamento
  const [editandoPagamentoId, setEditandoPagamentoId] = useState<string | null>(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [observacoesEdicao, setObservacoesEdicao] = useState('');
  const [codigoBarrasEdicao, setCodigoBarrasEdicao] = useState('');
  const [dataVencimentoEdicao, setDataVencimentoEdicao] = useState('');
  
  // Estados para validação de PIN
  const [dialogPinAberto, setDialogPinAberto] = useState(false);
  const [pinDigitado, setPinDigitado] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<{ tipo: 'editar' | 'excluir', pagamento: any } | null>(null);
  
  // Estado para dialog de sucesso
  const [dialogSucessoAberto, setDialogSucessoAberto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  
  // Estado para dialog de confirmação concluída
  const [dialogConfirmacaoConcluidaAberto, setDialogConfirmacaoConcluidaAberto] = useState(false);
  const [valorConfirmado, setValorConfirmado] = useState('');

  // Filtrar alunos
  const alunosFiltrados = useMemo(() => {
    let filtrados = alunos;

    // Filtrar por turma
    if (turmaFiltro !== 'todas') {
      filtrados = filtrados.filter(a => a.turmaId === turmaFiltro);
    }

    // Filtrar por tipo de pessoa
    if (tipoPessoaFiltro === 'PF') {
      filtrados = filtrados.filter(a => a.tipoPessoa !== 'PJ');
    } else if (tipoPessoaFiltro === 'PJ') {
      filtrados = filtrados.filter(a => a.tipoPessoa === 'PJ');
    }

    // Filtrar por empresa (Cliente PJ)
    if (empresaFiltro !== 'todas') {
      filtrados = filtrados.filter(a => a.clientePJId === empresaFiltro);
    }

    // Filtrar por status de pagamento
    if (statusPagamentoFiltro === 'pago') {
      filtrados = filtrados.filter(a => (a.pagamentos?.valorPago || 0) >= a.valorTotal);
    } else if (statusPagamentoFiltro === 'parcial') {
      filtrados = filtrados.filter(a => {
        const pago = a.pagamentos?.valorPago || 0;
        return pago > 0 && pago < a.valorTotal;
      });
    } else if (statusPagamentoFiltro === 'pendente') {
      filtrados = filtrados.filter(a => (a.pagamentos?.valorPago || 0) === 0);
    } else if (statusPagamentoFiltro === 'aguardando-confirmacao') {
      filtrados = filtrados.filter(a => 
        a.pagamentos?.historico?.some(p => !p.confirmedoPor)
      );
    }

    // Filtrar por período
    if (periodoFiltro !== 'todos') {
      const hoje = new Date();
      const dataInicio = new Date(hoje);
      
      if (periodoFiltro === 'hoje') {
        dataInicio.setHours(0, 0, 0, 0);
      } else if (periodoFiltro === 'semana') {
        dataInicio.setDate(hoje.getDate() - 7);
      } else if (periodoFiltro === 'mes') {
        dataInicio.setMonth(hoje.getMonth() - 1);
      }
      
      filtrados = filtrados.filter(a => {
        if (!a.pagamentos?.historico || a.pagamentos.historico.length === 0) return false;
        
        return a.pagamentos.historico.some(p => {
          const [dia, mes, ano] = p.data.split('/');
          const dataPagamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          return dataPagamento >= dataInicio;
        });
      });
    }

    // Filtrar por busca
    if (buscaAluno.trim()) {
      const termo = buscaAluno.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.nome.toLowerCase().includes(termo) ||
        a.codigoSistema.toLowerCase().includes(termo) ||
        a.cpf.includes(termo)
      );
    }

    return filtrados;
  }, [alunos, turmaFiltro, tipoPessoaFiltro, statusPagamentoFiltro, periodoFiltro, buscaAluno, empresaFiltro]);

  // Estatísticas financeiras
  const estatisticas = useMemo(() => {
    const totalEsperado = alunosFiltrados.reduce((sum, a) => sum + a.valorTotal, 0);
    const totalPago = alunosFiltrados.reduce((sum, a) => sum + (a.pagamentos?.valorPago || 0), 0);
    const totalPendente = totalEsperado - totalPago;
    
    const alunosPagos = alunosFiltrados.filter(a => (a.pagamentos?.valorPago || 0) >= a.valorTotal).length;
    const alunosParcial = alunosFiltrados.filter(a => {
      const pago = a.pagamentos?.valorPago || 0;
      return pago > 0 && pago < a.valorTotal;
    }).length;
    const alunosPendentes = alunosFiltrados.filter(a => (a.pagamentos?.valorPago || 0) === 0).length;
    const aguardandoConfirmacao = alunosFiltrados.filter(a => 
      a.pagamentos?.historico?.some(p => !p.confirmedoPor)
    ).length;
    
    return {
      totalEsperado,
      totalPago,
      totalPendente,
      alunosPagos,
      alunosParcial,
      alunosPendentes,
      aguardandoConfirmacao,
      taxaRecebimento: totalEsperado > 0 ? (totalPago / totalEsperado) * 100 : 0
    };
  }, [alunosFiltrados]);

  const formatarMoeda = (valor: number) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusPagamento = (aluno: any) => {
    const pago = aluno.pagamentos?.valorPago || 0;
    if (pago >= aluno.valorTotal) return 'pago';
    if (pago > 0) return 'parcial';
    return 'pendente';
  };

  const getClientePJNome = (clientePJId: string) => {
    const cliente = clientesPJ.find(c => c.id === clientePJId);
    return cliente ? cliente.razaoSocial : 'Empresa não encontrada';
  };

  const handleAbrirPagamento = (aluno: any) => {
    setAlunoSelecionado(aluno);
    setDialogPagamentoAberto(true);
    setValor('');
    setFormaPagamento('');
    setObservacoes('');
    setCodigoBarrasBoleto('');
    setDataVencimentoBoleto('');
  };

  const getFormasPagamentoPermitidas = () => {
    if (alunoSelecionado && alunoSelecionado.tipoPessoa === 'PJ') {
      const clientePJ = clientesPJ.find(c => c.id === alunoSelecionado.clientePJId);
      return clientePJ?.formasPagamentoPermitidas || [];
    }
    return ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque', 'Boleto'];
  };

  const handleRegistrarPagamento = () => {
    if (!valor || !formaPagamento || parseFloat(valor) <= 0) {
      toast.error('Preencha o valor e forma de pagamento');
      return;
    }

    // 💳 Validar se a forma de pagamento é permitida para o cliente PJ
    const formasPermitidas = getFormasPagamentoPermitidas();
    if (!formasPermitidas.includes(formaPagamento)) {
      toast.error('❌ Esta forma de pagamento não é permitida para este cliente!');
      return;
    }

    const valorNumerico = parseFloat(valor);
    const valorPagoAtual = alunoSelecionado.pagamentos?.valorPago || 0;
    const valorRestante = alunoSelecionado.valorTotal - valorPagoAtual;

    if (valorNumerico > valorRestante) {
      toast.error(`O valor não pode ser maior que o restante: ${formatarMoeda(valorRestante)}`);
      return;
    }

    const agora = new Date();
    const novoPagamento = {
      id: `pag-${Date.now()}`,
      valor: valorNumerico,
      formaPagamento,
      observacoes,
      data: agora.toLocaleDateString('pt-BR'),
      hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      registradoPor: usuarioAtual?.nome || 'Sistema',
      codigoBarrasBoleto: formaPagamento === 'Boleto' ? codigoBarrasBoleto : undefined,
      dataVencimentoBoleto: formaPagamento === 'Boleto' && dataVencimentoBoleto 
        ? dataVencimentoBoleto.split('-').reverse().join('/') // Converter YYYY-MM-DD para DD/MM/YYYY
        : undefined,
      vinculadoA: alunoSelecionado.tipoPessoa === 'PJ' && alunoSelecionado.clientePJId 
        ? getClientePJNome(alunoSelecionado.clientePJId)
        : `CPF ${alunoSelecionado.cpf}`
    };

    const pagamentosAtualizados = {
      valorPago: valorPagoAtual + valorNumerico,
      historico: [...(alunoSelecionado.pagamentos?.historico || []), novoPagamento]
    };

    // 🆕 Verificar se é um lançamento PF
    const isLancamentoPF = (alunoSelecionado as any)._lancamentoPFId;
    
    if (isLancamentoPF) {
      // Atualizar lançamento PF
      const alunoOriginalId = alunoSelecionado.id.split('-lanc-')[0];
      const alunoOriginal = alunos.find(a => a.id === alunoOriginalId);
      
      if (alunoOriginal) {
        const lancamentosAtualizados = (alunoOriginal.lancamentosProdutosPF || []).map(lanc => 
          lanc.id === (alunoSelecionado as any)._lancamentoPFId
            ? { ...lanc, pagamentos: pagamentosAtualizados }
            : lanc
        );
        
        atualizarAluno(alunoOriginalId, { lancamentosProdutosPF: lancamentosAtualizados });
        
        // Atualizar alunoSelecionado virtual
        setAlunoSelecionado({
          ...alunoSelecionado,
          pagamentos: pagamentosAtualizados
        });
      }
    } else {
      // Atualizar aluno normal
      const alunoAtualizado = {
        ...alunoSelecionado,
        pagamentos: pagamentosAtualizados
      };

      atualizarAluno(alunoSelecionado.id, { pagamentos: pagamentosAtualizados });

      // Atualizar o alunoSelecionado para refletir as mudanças imediatamente no dialog
      setAlunoSelecionado(alunoAtualizado);
    }
    
    // Limpar campos
    setValor('');
    setFormaPagamento('');
    setObservacoes('');
    setCodigoBarrasBoleto('');
    setDataVencimentoBoleto('');
    
    // Abrir dialog de sucesso
    setMensagemSucesso(`Pagamento de ${formatarMoeda(valorNumerico)} registrado com sucesso!`);
    setDialogSucessoAberto(true);
  };

  const handleConfirmarPagamento = (aluno: any, pagamentoId: string) => {
    if (usuarioAtual?.nivel !== 'Master') {
      toast.error('Apenas usuários Master podem confirmar pagamentos');
      return;
    }

    const pagamento = aluno.pagamentos?.historico?.find((p: any) => p.id === pagamentoId);
    
    // 🆕 Sempre abrir dialog de confirmação para preencher nota fiscal e dados de boleto (se necessário)
    setConfirmandoBoletoId(pagamentoId);
    setConfirmandoPagamento(aluno.id);
    setConfirmarCodigoBarras(pagamento?.codigoBarrasBoleto || '');
    // Converter DD/MM/YYYY para YYYY-MM-DD para o input type="date"
    const dataVencimento = pagamento?.dataVencimentoBoleto || '';
    const dataConvertida = dataVencimento && dataVencimento.includes('/') 
      ? dataVencimento.split('/').reverse().join('-') // DD/MM/YYYY -> YYYY-MM-DD
      : dataVencimento;
    setConfirmarDataVencimento(dataConvertida);
    setNumeroNotaFiscal(pagamento?.numeroNotaFiscal || '');
  };

  const handleConfirmarComDadosBoleto = (aluno: any, pagamentoId: string) => {
    const pagamento = aluno.pagamentos?.historico?.find((p: any) => p.id === pagamentoId);
    
    console.log('🔍 Validando confirmação de pagamento:');
    console.log('   Tipo Pessoa:', aluno.tipoPessoa);
    console.log('   Nota Fiscal:', numeroNotaFiscal);
    console.log('   Forma Pagamento:', pagamento?.formaPagamento);
    
    // 🆕 Validar nota fiscal (obrigatória para PJ, opcional para PF)
    if (aluno.tipoPessoa === 'PJ' && !numeroNotaFiscal.trim()) {
      toast.error('📋 Número da Nota Fiscal é obrigatório para Pessoa Jurídica');
      return;
    }

    // Validar boleto se necessário
    if (pagamento?.formaPagamento === 'Boleto' && (!confirmarCodigoBarras || !confirmarDataVencimento)) {
      toast.error('Preencha o código de barras e data de vencimento do boleto');
      return;
    }

    const agora = new Date();
    const historico = aluno.pagamentos.historico.map((p: any) => 
      p.id === pagamentoId 
        ? {
            ...p,
            ...(pagamento?.formaPagamento === 'Boleto' ? {
              codigoBarrasBoleto: confirmarCodigoBarras,
              dataVencimentoBoleto: confirmarDataVencimento.includes('-') 
                ? confirmarDataVencimento.split('-').reverse().join('/') // Converter YYYY-MM-DD para DD/MM/YYYY
                : confirmarDataVencimento // Já está em DD/MM/YYYY
            } : {}),
            numeroNotaFiscal: numeroNotaFiscal.trim() || undefined, // 🆕 Salvar nota fiscal
            confirmedoPor: usuarioAtual?.nome || 'Master',
            dataConfirmacao: agora.toLocaleDateString('pt-BR'),
            horaConfirmacao: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        : p
    );
    
    console.log('✅ Pagamento confirmado com nota fiscal:', numeroNotaFiscal || 'N/A');

    // 🧾 Verificar se o aluno completou 100% do pagamento
    const valorTotalPago = historico
      .filter((p: any) => p.confirmedoPor) // Apenas pagamentos confirmados
      .reduce((sum: number, p: any) => sum + p.valor, 0);
    
    const pagamentoConcluido = valorTotalPago >= aluno.valorTotal;
    
    // 🧾 Gerar recibos se pagamento 100% e ainda não tem recibos
    let recibosGerados = aluno.recibos || [];
    
    if (pagamentoConcluido && (!aluno.recibos || aluno.recibos.length === 0)) {
      console.log('🧾 Gerando recibos para aluno', aluno.codigoSistema);
      
      const turma = turmas.find(t => t.id === aluno.turmaId);
      const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
      
      // Para PESSOA FÍSICA: gerar recibos de TODOS os produtos
      if (aluno.tipoPessoa !== 'PJ') {
        // Produto principal (curso)
        if (curso) {
          recibosGerados.push({
            produtoId: curso.id,
            produtoNome: curso.nome,
            numeroRecibo: gerarNumeroRecibo(),
            dataGeracao: agora.toLocaleDateString('pt-BR'),
            tipoProduto: 'principal'
          });
        }
        
        // Produtos extras
        if (aluno.produtosExtras && aluno.produtosExtras.length > 0) {
          aluno.produtosExtras.forEach((extraId: string) => {
            const extra = produtosExtras.find(p => p.id === extraId);
            if (extra) {
              recibosGerados.push({
                produtoId: extra.id,
                produtoNome: extra.nome,
                numeroRecibo: gerarNumeroRecibo(),
                dataGeracao: agora.toLocaleDateString('pt-BR'),
                tipoProduto: 'extra'
              });
            }
          });
        }
      }
      // Para PESSOA JURÍDICA: gerar recibos APENAS dos produtos extras pagos pela PF
      else {
        // Aqui vamos gerar apenas quando houver produtos com flag pagoPorPF
        // Por enquanto, deixamos vazio (será implementado ao adicionar produtos extras)
        console.log('📋 Aluno PJ - recibos serão gerados apenas para produtos extras pagos pela PF');
      }
      
      console.log('✅ Recibos gerados:', recibosGerados);
    }

    // 🆕 Verificar se é um lançamento PF (aluno virtual)
    const isLancamentoPF = (aluno as any)._lancamentoPFId;
    let alunoAtualizado: any; // Declarar fora para usar depois
    
    if (isLancamentoPF) {
      // É um lançamento PF - precisamos atualizar o aluno original
      const alunoOriginalId = aluno.id.split('-lanc-')[0];
      const alunoOriginal = alunos.find(a => a.id === alunoOriginalId);
      
      if (alunoOriginal) {
        const lancamentosAtualizados = (alunoOriginal.lancamentosProdutosPF || []).map(lanc => 
          lanc.id === (aluno as any)._lancamentoPFId
            ? {
                ...lanc,
                pagamentos: {
                  ...lanc.pagamentos,
                  historico
                },
                recibos: pagamentoConcluido ? [{
                  numeroRecibo: gerarNumeroRecibo(),
                  dataGeracao: agora.toLocaleDateString('pt-BR')
                }] : lanc.recibos
              }
            : lanc
        );
        
        atualizarAluno(alunoOriginalId, { lancamentosProdutosPF: lancamentosAtualizados });
        console.log('✅ Lançamento PF atualizado');
        
        // Criar aluno atualizado virtual para usar no dialog
        alunoAtualizado = {
          ...aluno,
          pagamentos: {
            ...aluno.pagamentos,
            historico
          }
        };
      }
    } else {
      // É um aluno normal - atualizar normalmente
      alunoAtualizado = {
        ...aluno,
        pagamentos: {
          ...aluno.pagamentos,
          historico
        },
        recibos: recibosGerados
      };

      atualizarAluno(aluno.id, { pagamentos: alunoAtualizado.pagamentos, recibos: recibosGerados });
    }

    // Atualizar o alunoSelecionado se for o mesmo aluno
    if (alunoSelecionado?.id === aluno.id && alunoAtualizado) {
      setAlunoSelecionado(alunoAtualizado);
    }

    // Guardar valor confirmado e abrir dialog de sucesso
    const pag = aluno.pagamentos.historico.find((p: any) => p.id === pagamentoId);
    setValorConfirmado(pag?.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '');
    setDialogConfirmacaoConcluidaAberto(true);
    
    // Resetar estados
    setConfirmandoBoletoId(null);
    setConfirmandoPagamento(null);
    setConfirmarCodigoBarras('');
    setConfirmarDataVencimento('');
    setNumeroNotaFiscal('');
  };

  // Funções para seleção múltipla
  const toggleSelecaoAluno = (alunoId: string) => {
    const novaSelecao = new Set(alunosSelecionados);
    if (novaSelecao.has(alunoId)) {
      novaSelecao.delete(alunoId);
    } else {
      novaSelecao.add(alunoId);
    }
    setAlunosSelecionados(novaSelecao);
  };

  const toggleModoSelecao = () => {
    setModoSelecao(!modoSelecao);
    setAlunosSelecionados(new Set());
  };

  const handleAbrirAprovacaoLote = () => {
    if (alunosSelecionados.size === 0) {
      toast.error('Selecione pelo menos um aluno');
      return;
    }

    // Verificar se todos os alunos selecionados são PJ
    const alunosSelecionadosArray = Array.from(alunosSelecionados)
      .map(id => alunos.find(a => a.id === id))
      .filter(Boolean);

    const temPF = alunosSelecionadosArray.some(a => a.tipoPessoa !== 'PJ');
    if (temPF) {
      toast.error('❌ Aprovação em lote só é permitida para Pessoa Jurídica');
      return;
    }

    // Verificar se todos têm pagamentos aguardando confirmação
    const temPagamentosPendentes = alunosSelecionadosArray.every(a => 
      a.pagamentos?.historico?.some((p: any) => !p.confirmedoPor)
    );

    if (!temPagamentosPendentes) {
      toast.error('❌ Todos os alunos selecionados devem ter pagamentos aguardando confirmação');
      return;
    }

    setDialogAprovacaoLoteAberto(true);
  };

  const handleConfirmarAprovacaoLote = () => {
    if (usuarioAtual?.nivel !== 'Master') {
      toast.error('Apenas usuários Master podem confirmar pagamentos');
      return;
    }

    // Verificar se precisa de código de barras e data (se algum pagamento for boleto)
    const alunosSelecionadosArray = Array.from(alunosSelecionados)
      .map(id => alunos.find(a => a.id === id))
      .filter(Boolean);

    console.log('🔍 APROVAÇÃO EM LOTE - INÍCIO');
    console.log('Total de alunos selecionados:', alunosSelecionadosArray.length);
    console.log('IDs dos alunos:', alunosSelecionadosArray.map(a => a.codigoSistema));

    // 🆕 Validar Nota Fiscal (obrigatória para PJ em lote)
    if (!numeroNotaFiscalLote.trim()) {
      toast.error('📋 Número da Nota Fiscal é obrigatório para aprovação em lote de Pessoa Jurídica');
      return;
    }

    const temBoleto = alunosSelecionadosArray.some(a =>
      a.pagamentos?.historico?.some((p: any) => !p.confirmedoPor && p.formaPagamento === 'Boleto')
    );

    if (temBoleto && (!codigoBarrasLote || !dataVencimentoLote)) {
      toast.error('Preencha o código de barras e data de vencimento para boletos');
      return;
    }

    console.log('🎫 Código de barras para lote:', codigoBarrasLote);
    console.log('📅 Data vencimento para lote:', dataVencimentoLote);
    console.log('📋 Nota Fiscal para lote:', numeroNotaFiscalLote);

    const agora = new Date();
    let totalConfirmados = 0;
    let boletosAtualizados = 0;

    // 🆕 Gerar ID único para o lote de confirmação de pagamentos
    const loteConfirmacaoPagamentoId = `LOTE-PAG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🎯 Lote de Confirmação ID:', loteConfirmacaoPagamentoId);

    // 🔧 FIX: Processar TODOS os alunos de uma vez para evitar race conditions
    // Primeiro, criar um mapa com todas as atualizações
    const atualizacoes = new Map();
    
    alunosSelecionadosArray.forEach(aluno => {
      console.log(`\n📋 Processando aluno: ${aluno.codigoSistema} - ${aluno.nome}`);
      console.log(`   Total de pagamentos no histórico:`, aluno.pagamentos?.historico?.length || 0);
      
      const pagamentosPendentes = aluno.pagamentos?.historico?.filter((p: any) => !p.confirmedoPor) || [];
      console.log(`   Pagamentos pendentes:`, pagamentosPendentes.length);
      
      const historico = aluno.pagamentos.historico.map((p: any) => {
        if (!p.confirmedoPor) {
          totalConfirmados++;
          console.log(`   ✅ Confirmando pagamento ID: ${p.id}, Forma: ${p.formaPagamento}`);
          
          // Se for boleto, adicionar código de barras e data de vencimento
          const dadosBoleto = p.formaPagamento === 'Boleto' ? {
            codigoBarrasBoleto: codigoBarrasLote,
            dataVencimentoBoleto: dataVencimentoLote ? 
              new Date(dataVencimentoLote + 'T00:00:00').toLocaleDateString('pt-BR') : ''
          } : {};
          
          if (p.formaPagamento === 'Boleto') {
            boletosAtualizados++;
            console.log(`   🎫 Aplicando código de barras: ${codigoBarrasLote}`);
            console.log(`   📅 Aplicando data vencimento: ${dadosBoleto.dataVencimentoBoleto}`);
          }
          
          const pagamentoAtualizado = {
            ...p,
            ...dadosBoleto,
            numeroNotaFiscal: numeroNotaFiscalLote.trim(), // 🆕 Aplicar Nota Fiscal em lote
            loteConfirmacaoPagamentoId: loteConfirmacaoPagamentoId, // 🆕 ID do lote para agrupamento no Módulo 08
            confirmedoPor: usuarioAtual?.nome || 'Master',
            dataConfirmacao: agora.toLocaleDateString('pt-BR'),
            horaConfirmacao: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          };
          
          console.log('   ✅ Pagamento final:', {
            id: p.id,
            formaPagamento: p.formaPagamento,
            codigoBarrasBoleto: pagamentoAtualizado.codigoBarrasBoleto,
            dataVencimentoBoleto: pagamentoAtualizado.dataVencimentoBoleto,
            numeroNotaFiscal: pagamentoAtualizado.numeroNotaFiscal, // 🆕 Log da Nota Fiscal
            confirmedoPor: pagamentoAtualizado.confirmedoPor
          });
          
          return pagamentoAtualizado;
        }
        return p;
      });

      // Armazenar a atualização no mapa
      atualizacoes.set(aluno.id, {
        pagamentos: {
          ...aluno.pagamentos,
          historico
        }
      });
    });

    // 🔧 FIX CRÍTICO: Aplicar TODAS as atualizações de uma vez usando batch update
    console.log(`\n💾 Aplicando ${atualizacoes.size} atualizações em LOTE...`);
    atualizarAlunosEmLote(atualizacoes);
    
    // Atualizar alunoSelecionado se ele estiver aberto no dialog
    if (alunoSelecionado && atualizacoes.has(alunoSelecionado.id)) {
      const aluno = alunosSelecionadosArray.find(a => a.id === alunoSelecionado.id);
      if (aluno) {
        setAlunoSelecionado({
          ...aluno,
          ...atualizacoes.get(alunoSelecionado.id)
        });
      }
    }

    console.log('\n✅ APROVAÇÃO EM LOTE - CONCLUSÃO');
    console.log(`Total confirmados: ${totalConfirmados}`);
    console.log(`Boletos atualizados: ${boletosAtualizados}`);

    const mensagem = boletosAtualizados > 0 
      ? `✅ ${totalConfirmados} pagamento(s) confirmado(s) em lote! (${boletosAtualizados} boleto(s) com código atualizado)`
      : `✅ ${totalConfirmados} pagamento(s) confirmado(s) em lote!`;
    
    toast.success(mensagem, { duration: 5000 });
    setDialogAprovacaoLoteAberto(false);
    setCodigoBarrasLote('');
    setDataVencimentoLote('');
    setNumeroNotaFiscalLote(''); // 🆕 Resetar Nota Fiscal em lote
    setAlunosSelecionados(new Set());
    setModoSelecao(false);
  };

  const handleEditarPagamento = (pag: any) => {
    // Exigir PIN Master para editar pagamento confirmado
    if (usuarioAtual?.nivel !== 'Master') {
      toast.error('🔒 Apenas usuários Master podem editar pagamentos confirmados');
      return;
    }
    
    setAcaoPendente({ tipo: 'editar', pagamento: pag });
    setDialogPinAberto(true);
    setPinDigitado('');
  };

  const handleSolicitarExclusao = (pag: any) => {
    // Exigir PIN Master para excluir pagamento confirmado
    if (usuarioAtual?.nivel !== 'Master') {
      toast.error('🔒 Apenas usuários Master podem excluir pagamentos confirmados');
      return;
    }
    
    setAcaoPendente({ tipo: 'excluir', pagamento: pag });
    setDialogPinAberto(true);
    setPinDigitado('');
  };

  const handleValidarPin = () => {
    if (!acaoPendente) return;

    // Validar PIN do usuário Master
    if (pinDigitado !== usuarioAtual?.pin) {
      toast.error('❌ PIN incorreto! Acesso negado.');
      setPinDigitado('');
      return;
    }

    // PIN correto - fechar dialog de PIN ANTES de executar ação
    setDialogPinAberto(false);
    setPinDigitado('');

    // Executar ação com um pequeno delay para garantir que o dialog de PIN foi fechado
    setTimeout(() => {
      // IMPORTANTE: Garantir que o dialog de pagamento permaneça aberto
      setDialogPagamentoAberto(true);
      
      if (acaoPendente.tipo === 'editar') {
        const pag = acaoPendente.pagamento;
        setEditandoPagamentoId(pag.id);
        setValorEdicao(pag.valor.toString());
        setObservacoesEdicao(pag.observacoes || '');
        setCodigoBarrasEdicao(pag.codigoBarrasBoleto || '');
        // Converter DD/MM/YYYY para YYYY-MM-DD para o input type="date"
        const dataVencimento = pag.dataVencimentoBoleto || '';
        const dataConvertida = dataVencimento && dataVencimento.includes('/') 
          ? dataVencimento.split('/').reverse().join('-') // DD/MM/YYYY -> YYYY-MM-DD
          : dataVencimento;
        setDataVencimentoEdicao(dataConvertida);
        toast.success('✅ PIN validado! Você pode editar o pagamento.');
      } else if (acaoPendente.tipo === 'excluir') {
        handleExcluirPagamentoConfirmado(acaoPendente.pagamento);
      }
      setAcaoPendente(null);
    }, 100);
  };

  const handleExcluirPagamentoConfirmado = (pag: any) => {
    const historico = alunoSelecionado.pagamentos.historico.filter((p: any) => p.id !== pag.id);
    const novoValorPago = historico.reduce((sum: number, p: any) => sum + p.valor, 0);

    const alunoAtualizado = {
      ...alunoSelecionado,
      pagamentos: {
        ...alunoSelecionado.pagamentos,
        historico,
        valorPago: novoValorPago
      }
    };

    atualizarAluno(alunoSelecionado.id, { pagamentos: alunoAtualizado.pagamentos });

    // Atualizar o alunoSelecionado para refletir as mudanças imediatamente no dialog
    setAlunoSelecionado(alunoAtualizado);

    toast.success('✅ Lançamento excluído com sucesso!');
  };

  const handleSalvarEdicao = (aluno: any, pagamentoId: string) => {
    if (!valorEdicao || parseFloat(valorEdicao) <= 0) {
      toast.error('Valor inválido');
      return;
    }

    const pagamentoAntigo = aluno.pagamentos.historico.find((p: any) => p.id === pagamentoId);
    const novoValor = parseFloat(valorEdicao);
    
    const historico = aluno.pagamentos.historico.map((p: any) =>
      p.id === pagamentoId
        ? {
            ...p,
            valor: novoValor,
            observacoes: observacoesEdicao,
            codigoBarrasBoleto: codigoBarrasEdicao || undefined,
            dataVencimentoBoleto: dataVencimentoEdicao 
              ? dataVencimentoEdicao.split('-').reverse().join('/') // Converter YYYY-MM-DD para DD/MM/YYYY
              : undefined
          }
        : p
    );

    // Recalcular valor total pago
    const novoValorPago = historico.reduce((sum: number, p: any) => sum + p.valor, 0);

    const alunoAtualizado = {
      ...aluno,
      pagamentos: {
        ...aluno.pagamentos,
        historico,
        valorPago: novoValorPago
      }
    };

    atualizarAluno(aluno.id, { pagamentos: alunoAtualizado.pagamentos });

    // Atualizar o alunoSelecionado para refletir as mudanças imediatamente no dialog
    setAlunoSelecionado(alunoAtualizado);

    toast.success('Pagamento editado com sucesso!');
    setEditandoPagamentoId(null);
    setValorEdicao('');
    setObservacoesEdicao('');
    setCodigoBarrasEdicao('');
    setDataVencimentoEdicao('');
  };

  const exportarRelatorioExcel = () => {
    // Preparar dados para o Excel
    const dadosResumo = [
      ['RELATÓRIO FINANCEIRO - SMCORP'],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [],
      ['RESUMO GERAL'],
      ['Total Esperado:', formatarMoeda(estatisticas.totalEsperado)],
      ['Total Pago:', formatarMoeda(estatisticas.totalPago)],
      ['Total Pendente:', formatarMoeda(estatisticas.totalPendente)],
      ['Taxa de Recebimento:', `${estatisticas.taxaRecebimento.toFixed(2)}%`],
      [],
      ['Alunos Pagos:', estatisticas.alunosPagos],
      ['Alunos Pagamento Parcial:', estatisticas.alunosParcial],
      ['Alunos Pendentes:', estatisticas.alunosPendentes],
      ['Aguardando Confirmação:', estatisticas.aguardandoConfirmacao],
      [],
      [],
      ['DETALHAMENTO POR ALUNO'],
      ['#', 'Código', 'Nome', 'Tipo', 'Empresa/CPF', 'Nota Fiscal', 'Valor Total', 'Valor Pago', 'Valor Pendente', 'Status', 'Observação'],
    ];

    // Adicionar dados dos alunos
    const dadosAlunos = alunosFiltrados.map((a, index) => {
      const status = getStatusPagamento(a);
      const pago = a.pagamentos?.valorPago || 0;
      const pendente = a.valorTotal - pago;
      const temPendente = a.pagamentos?.historico?.some((p: any) => !p.confirmedoPor);
      
      // 🆕 Pegar o número da nota fiscal (todos os pagamentos confirmados que possuem nota)
      const pagamentosConfirmados = a.pagamentos?.historico?.filter((p: any) => p.confirmedoPor && p.numeroNotaFiscal) || [];
      const notasFiscais = pagamentosConfirmados.map((p: any) => p.numeroNotaFiscal).join(', ');

      return [
        index + 1,
        a.codigoSistema,
        a.nome,
        a.tipoPessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
        a.tipoPessoa === 'PJ' && a.clientePJId ? getClientePJNome(a.clientePJId) : a.cpf,
        notasFiscais || '-', // 🆕 Número da Nota Fiscal
        a.valorTotal,
        pago,
        pendente,
        status === 'pago' ? 'PAGO' : status === 'parcial' ? 'PARCIAL' : 'PENDENTE',
        temPendente ? 'Aguardando Confirmação' : ''
      ];
    });

    const todosOsDados = [...dadosResumo, ...dadosAlunos];

    // Criar planilha
    const worksheet = XLSX.utils.aoa_to_sheet(todosOsDados);

    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 5 },   // #
      { wch: 12 },  // Código
      { wch: 30 },  // Nome
      { wch: 18 },  // Tipo
      { wch: 35 },  // Empresa/CPF
      { wch: 18 },  // 🆕 Nota Fiscal
      { wch: 15 },  // Valor Total
      { wch: 15 },  // Valor Pago
      { wch: 15 },  // Valor Pendente
      { wch: 12 },  // Status
      { wch: 25 },  // Observação
    ];

    // Criar workbook e adicionar planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Financeiro');

    // Exportar arquivo
    XLSX.writeFile(workbook, `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('✅ Relatório Excel exportado com sucesso!');
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-red-600" />
                Módulo 07 - Gestão de Pagamentos
              </h2>
              <p className="text-gray-600 mt-1">
                Controle financeiro completo de todos os alunos com registro e confirmação de pagamentos
              </p>
            </div>
            
            {/* Badge do Usuário Atual */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-2">
              <div className="text-xs text-blue-600 font-medium">👤 Usuário Logado:</div>
              <div className="text-sm font-bold text-blue-800 flex items-center gap-2">
                {usuarioAtual?.nome}
                <Badge className={
                  usuarioAtual?.nivel === 'Master' 
                    ? 'bg-red-600 text-white' 
                    : usuarioAtual?.nivel === 'Admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
                }>
                  {usuarioAtual?.nivel}
                </Badge>
              </div>
              {usuarioAtual?.nivel !== 'Master' && (
                <div className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Apenas Master pode confirmar pagamentos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Esperado</p>
                  <p className="text-2xl font-bold text-blue-600">{formatarMoeda(estatisticas.totalEsperado)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(estatisticas.totalPago)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pendente</p>
                  <p className="text-2xl font-bold text-red-600">{formatarMoeda(estatisticas.totalPendente)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aguardando</p>
                  <p className="text-2xl font-bold text-orange-600">{estatisticas.aguardandoConfirmacao}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Nome, código ou CPF"
                    value={buscaAluno}
                    onChange={(e) => setBuscaAluno(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Status Pagamento</Label>
                <Select value={statusPagamentoFiltro} onValueChange={setStatusPagamentoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pago">✅ Pago</SelectItem>
                    <SelectItem value="parcial">🟡 Parcial</SelectItem>
                    <SelectItem value="pendente">❌ Pendente</SelectItem>
                    <SelectItem value="aguardando-confirmacao">⏳ Aguardando Confirmação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Turma</Label>
                <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="📚 Todas as Turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">📚 Todas as Turmas</SelectItem>
                    {turmas.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.codigo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={tipoPessoaFiltro} onValueChange={setTipoPessoaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="PF">👤 Pessoa Física</SelectItem>
                    <SelectItem value="PJ">🏢 Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Empresa (PJ)</Label>
                <Select value={empresaFiltro} onValueChange={setEmpresaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="🏢 Todas as Empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">🏢 Todas as Empresas</SelectItem>
                    {clientesPJ.map(empresa => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Período</Label>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os períodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os períodos</SelectItem>
                    <SelectItem value="hoje">📅 Hoje</SelectItem>
                    <SelectItem value="semana">📅 Última semana</SelectItem>
                    <SelectItem value="mes">📅 Último mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={toggleModoSelecao}
            variant={modoSelecao ? "default" : "outline"}
            className={modoSelecao ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {modoSelecao ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar Seleção
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Modo Seleção (PJ)
              </>
            )}
          </Button>

          {modoSelecao && alunosSelecionados.size > 0 && (
            <Button
              onClick={handleAbrirAprovacaoLote}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar em Lote ({alunosSelecionados.size})
            </Button>
          )}

          <Button
            onClick={exportarRelatorioExcel}
            variant="outline"
            className="ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Pagos</p>
                  <p className="text-3xl font-bold text-green-700">{estatisticas.alunosPagos}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Parcial</p>
                  <p className="text-3xl font-bold text-orange-700">{estatisticas.alunosParcial}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-red-700">{estatisticas.alunosPendentes}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Aguardando</p>
                  <p className="text-3xl font-bold text-yellow-700">{estatisticas.aguardandoConfirmacao}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista de Alunos ({alunosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Aviso de Modo Seleção */}
            {modoSelecao && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Modo Seleção Ativado - Apenas Pessoa Jurídica
                    </p>
                    <p className="text-sm text-red-700">
                      Selecione os alunos PJ com pagamentos pendentes para aprovar em lote.
                      {alunosSelecionados.size > 0 && (
                        <span className="font-semibold"> {alunosSelecionados.size} aluno(s) selecionado(s).</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {modoSelecao && (
                      <th className="text-center p-3 font-semibold text-sm w-12">
                        <CheckSquare className="w-4 h-4 mx-auto text-red-600" />
                      </th>
                    )}
                    <th className="text-left p-3 font-semibold text-sm">#</th>
                    <th className="text-left p-3 font-semibold text-sm">Código</th>
                    <th className="text-left p-3 font-semibold text-sm">Nome</th>
                    <th className="text-left p-3 font-semibold text-sm">Tipo</th>
                    <th className="text-left p-3 font-semibold text-sm">Empresa/CPF</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor Total</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor Pago</th>
                    <th className="text-right p-3 font-semibold text-sm">Pendente</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={modoSelecao ? 11 : 10} className="text-center p-8 text-gray-500">
                        Nenhum aluno encontrado com os filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    alunosFiltrados.flatMap((aluno, index) => {
                      const status = getStatusPagamento(aluno);
                      const pago = aluno.pagamentos?.valorPago || 0;
                      const pendente = aluno.valorTotal - pago;
                      const temPendente = aluno.pagamentos?.historico?.some((p: any) => !p.confirmedoPor);

                      const podeSelecionar = modoSelecao && aluno.tipoPessoa === 'PJ' && temPendente;

                      // Linha principal do aluno
                      const linhaPrincipal = (
                        <tr key={aluno.id} className="border-b hover:bg-gray-50">
                          {modoSelecao && (
                            <td className="p-3 text-center">
                              {podeSelecionar ? (
                                <input
                                  type="checkbox"
                                  checked={alunosSelecionados.has(aluno.id)}
                                  onChange={() => toggleSelecaoAluno(aluno.id)}
                                  className="w-4 h-4 cursor-pointer accent-red-600"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                          )}
                          <td className="p-3 text-sm">{index + 1}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono font-semibold text-blue-600">
                              {aluno.codigoSistema}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-sm">{aluno.nome}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={
                              aluno.tipoPessoa === 'PJ' 
                                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                : 'bg-green-50 text-green-700 border-green-300'
                            }>
                              {aluno.tipoPessoa === 'PJ' ? '🏢 PJ' : '👤 PF'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {aluno.tipoPessoa === 'PJ' && aluno.clientePJId ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium truncate max-w-[180px]" title={getClientePJNome(aluno.clientePJId)}>
                                  {getClientePJNome(aluno.clientePJId)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-green-600" />
                                <span className="font-mono text-xs">{aluno.cpf}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right font-semibold text-sm">{formatarMoeda(aluno.valorTotal)}</td>
                          <td className="p-3 text-right font-semibold text-green-600 text-sm">{formatarMoeda(pago)}</td>
                          <td className="p-3 text-right font-semibold text-red-600 text-sm">{formatarMoeda(pendente)}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Badge 
                                variant="outline"
                                className={
                                  status === 'pago' 
                                    ? 'bg-green-50 text-green-700 border-green-300' 
                                    : status === 'parcial'
                                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                                    : 'bg-red-50 text-red-700 border-red-300'
                                }
                              >
                                {status === 'pago' ? '✅ Pago' : status === 'parcial' ? '🟡 Parcial' : '❌ Pendente'}
                              </Badge>
                              {temPendente && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 ml-1">
                                  ⏳
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleAbrirPagamento(aluno)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Gerenciar
                            </Button>
                          </td>
                        </tr>
                      );

                      // 🆕 Linhas de lançamentos PF (produtos extras pagos pela Pessoa Física)
                      const linhasLancamentosPF = (aluno.lancamentosProdutosPF || []).map((lancamento) => {
                        const pagoLanc = lancamento.pagamentos.valorPago || 0;
                        const pendenteLanc = lancamento.valorTotal - pagoLanc;
                        const statusLanc = pagoLanc >= lancamento.valorTotal ? 'pago' : pagoLanc > 0 ? 'parcial' : 'pendente';
                        const temPendenteLanc = lancamento.pagamentos.historico.some((p: any) => !p.confirmedoPor);

                        return (
                          <tr key={`${aluno.id}-lanc-${lancamento.id}`} className="border-b bg-orange-50/30 hover:bg-orange-50">
                            {modoSelecao && (
                              <td className="p-3 text-center">
                                <span className="text-xs text-gray-400">-</span>
                              </td>
                            )}
                            <td className="p-3 text-sm text-gray-400">↳</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono font-semibold text-orange-600 bg-orange-100">
                                {aluno.codigoSistema}-PF
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">{aluno.nome}</span>
                                <Badge className="bg-orange-500 text-white text-xs">
                                  {lancamento.produtoNome}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                💳 PF
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-1 text-orange-700">
                                <User className="w-4 h-4" />
                                <span className="font-mono text-xs">{aluno.cpf}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold text-sm">{formatarMoeda(lancamento.valorTotal)}</td>
                            <td className="p-3 text-right font-semibold text-green-600 text-sm">{formatarMoeda(pagoLanc)}</td>
                            <td className="p-3 text-right font-semibold text-red-600 text-sm">{formatarMoeda(pendenteLanc)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Badge 
                                  variant="outline"
                                  className={
                                    statusLanc === 'pago' 
                                      ? 'bg-green-50 text-green-700 border-green-300' 
                                      : statusLanc === 'parcial'
                                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                                      : 'bg-red-50 text-red-700 border-red-300'
                                  }
                                >
                                  {statusLanc === 'pago' ? '✅ Pago' : statusLanc === 'parcial' ? '🟡 Parcial' : '❌ Pendente'}
                                </Badge>
                                {temPendenteLanc && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 ml-1">
                                    ⏳
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Criar um "aluno virtual" para abrir o dialog de pagamento
                                  const alunoVirtual = {
                                    ...aluno,
                                    id: `${aluno.id}-lanc-${lancamento.id}`,
                                    codigoSistema: `${aluno.codigoSistema}-PF`,
                                    valorTotal: lancamento.valorTotal,
                                    pagamentos: lancamento.pagamentos,
                                    tipoPessoa: 'PF' as 'PF' | 'PJ',
                                    clientePJId: undefined,
                                    _lancamentoPFId: lancamento.id // Identificador especial
                                  };
                                  handleAbrirPagamento(alunoVirtual);
                                }}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Gerenciar
                              </Button>
                            </td>
                          </tr>
                        );
                      });

                      // Retornar linha principal + linhas de lançamentos PF
                      return [linhaPrincipal, ...linhasLancamentosPF];
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Gestão de Pagamento */}
      <Dialog open={dialogPagamentoAberto} onOpenChange={setDialogPagamentoAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Gestão de Pagamento - {alunoSelecionado?.nome}
              {(alunoSelecionado as any)?._lancamentoPFId && (
                <Badge className="bg-orange-500 text-white ml-2">
                  💳 Lançamento PF Separado
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {alunoSelecionado && (
            <ScrollArea className="flex-1 px-6 min-h-0">
              <div className="space-y-6 py-4">
                {/* Aviso de Lançamento PF Separado */}
                {(alunoSelecionado as any)?._lancamentoPFId && (
                  <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💳</div>
                      <div>
                        <h4 className="font-bold text-orange-900 mb-1">Lançamento PF Separado</h4>
                        <p className="text-sm text-orange-800">
                          Este é um pagamento de <strong>produto extra</strong> que será pago pela <strong>Pessoa Física</strong> (CPF {alunoSelecionado.cpf}), 
                          independente do vínculo com a empresa. Todas as formas de pagamento estão disponíveis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Informações do Aluno */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Código:</span> {alunoSelecionado.codigoSistema}
                    </div>
                    <div>
                      <span className="font-semibold">CPF:</span> {alunoSelecionado.cpf}
                    </div>
                    <div>
                      <span className="font-semibold">Tipo:</span>{' '}
                      {alunoSelecionado.tipoPessoa === 'PJ' ? '🏢 Pessoa Jurídica' : '👤 Pessoa Física'}
                    </div>
                    {alunoSelecionado.tipoPessoa === 'PJ' && alunoSelecionado.clientePJId && (
                      <div>
                        <span className="font-semibold">Empresa:</span> {getClientePJNome(alunoSelecionado.clientePJId)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor Total:</span>
                    <span className="text-xl font-bold">{formatarMoeda(alunoSelecionado.valorTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor Pago:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatarMoeda(alunoSelecionado.pagamentos?.valorPago || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Valor Restante:</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatarMoeda(alunoSelecionado.valorTotal - (alunoSelecionado.pagamentos?.valorPago || 0))}
                    </span>
                  </div>
                </div>

                {/* Histórico de Pagamentos */}
                {alunoSelecionado.pagamentos?.historico && alunoSelecionado.pagamentos.historico.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Histórico de Pagamentos ({alunoSelecionado.pagamentos.historico.length})
                    </h3>
                    <div className="space-y-3">
                      {alunoSelecionado.pagamentos.historico.map((pag: any) => (
                        <div 
                          key={pag.id} 
                          className={`p-3 rounded border ${
                            pag.confirmedoPor 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-yellow-50 border-yellow-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-lg">{formatarMoeda(pag.valor)}</div>
                              <div className="text-xs text-gray-600">
                                {pag.formaPagamento} • {pag.data} às {pag.hora}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {pag.confirmedoPor ? (
                                <Badge className="bg-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirmado
                                </Badge>
                              ) : (
                                <>
                                  <Badge className="bg-yellow-500 text-white">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Pendente
                                  </Badge>
                                  {usuarioAtual?.nivel === 'Master' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleConfirmarPagamento(alunoSelecionado, pag.id)}
                                      className="bg-green-600 hover:bg-green-700 h-7"
                                    >
                                      Confirmar
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Dados do Boleto */}
                          {pag.formaPagamento === 'Boleto' && pag.codigoBarrasBoleto && (
                            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs mb-2">
                              <div className="font-semibold text-yellow-800 mb-1">📄 Dados do Boleto:</div>
                              <div className="font-mono text-gray-700"><strong>Código:</strong> {pag.codigoBarrasBoleto}</div>
                              <div className="text-gray-700">
                                <strong>Vencimento:</strong>{' '}
                                {pag.dataVencimentoBoleto 
                                  ? new Date(pag.dataVencimentoBoleto + 'T00:00:00').toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </div>
                            </div>
                          )}

                          {pag.observacoes && (
                            <div className="text-sm text-gray-600 mb-2">Obs: {pag.observacoes}</div>
                          )}
                          
                          {/* 🆕 Exibir Nota Fiscal se disponível */}
                          {pag.numeroNotaFiscal && (
                            <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs mb-2">
                              <div className="font-semibold text-blue-800">
                                📋 Nota Fiscal: {pag.numeroNotaFiscal}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Registrado por: {pag.registradoPor}
                          </div>
                          {pag.confirmedoPor && (
                            <div className="text-xs text-green-700">
                              Confirmado por: {pag.confirmedoPor} em {pag.dataConfirmacao} às {pag.horaConfirmacao}
                            </div>
                          )}

                          {/* Formulário de confirmação de pagamento */}
                          {!pag.confirmedoPor && confirmandoBoletoId === pag.id && confirmandoPagamento === alunoSelecionado.id && (
                            <div className="mt-3 bg-orange-50 border-2 border-orange-300 p-3 rounded-lg space-y-3">
                              <h4 className="font-semibold text-sm text-orange-800">
                                ✅ Confirmação de Pagamento Master
                              </h4>
                              
                              {/* 🆕 Campo Nota Fiscal */}
                              <div>
                                <Label className="text-xs font-semibold">
                                  📋 Número da Nota Fiscal {alunoSelecionado.tipoPessoa === 'PJ' && <span className="text-red-600">*</span>}
                                  {alunoSelecionado.tipoPessoa === 'PF' && <span className="text-gray-500">(opcional)</span>}
                                </Label>
                                <Input
                                  type="text"
                                  value={numeroNotaFiscal}
                                  onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                                  className="h-8 text-xs"
                                  placeholder={alunoSelecionado.tipoPessoa === 'PJ' ? 'Obrigatório para PJ' : 'Ex: NF-12345'}
                                />
                                {alunoSelecionado.tipoPessoa === 'PJ' && (
                                  <p className="text-xs text-red-600 mt-1">
                                    * Campo obrigatório para Pessoa Jurídica
                                  </p>
                                )}
                              </div>

                              {/* Campos do Boleto (somente se for Boleto) */}
                              {pag.formaPagamento === 'Boleto' && (
                                <>
                                  <div className="border-t pt-2">
                                    <p className="text-xs font-semibold text-orange-800 mb-2">📄 Dados do Boleto</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold">Código de Barras *</Label>
                                    <Input
                                      type="text"
                                      value={confirmarCodigoBarras}
                                      onChange={(e) => setConfirmarCodigoBarras(e.target.value)}
                                      className="h-8 text-xs font-mono"
                                      placeholder="Digite o código de barras"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold">Data de Vencimento *</Label>
                                    <Input
                                      type="date"
                                      value={confirmarDataVencimento}
                                      onChange={(e) => setConfirmarDataVencimento(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmarComDadosBoleto(alunoSelecionado, pag.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirmar Pagamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setConfirmandoBoletoId(null);
                                    setConfirmandoPagamento(null);
                                    setNumeroNotaFiscal('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Formulário de edição */}
                          {editandoPagamentoId === pag.id && (
                            <div className="mt-3 bg-blue-50 border-2 border-blue-300 p-3 rounded-lg space-y-3">
                              <h4 className="font-semibold text-sm text-blue-800">✏️ Editar Pagamento</h4>
                              <div>
                                <Label className="text-xs font-semibold">Valor *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={valorEdicao}
                                  onChange={(e) => setValorEdicao(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div>
                                <Label className="text-xs font-semibold">Observações</Label>
                                <Textarea
                                  placeholder="Informações adicionais..."
                                  value={observacoesEdicao}
                                  onChange={(e) => setObservacoesEdicao(e.target.value)}
                                  rows={3}
                                  className="text-xs"
                                />
                              </div>

                              <div>
                                <Label className="text-xs font-semibold">Código de Barras {pag.formaPagamento !== 'Boleto' && '(opcional)'}</Label>
                                <Input
                                  type="text"
                                  value={codigoBarrasEdicao}
                                  onChange={(e) => setCodigoBarrasEdicao(e.target.value)}
                                  className="h-8 text-xs font-mono"
                                  placeholder="Digite o código de barras"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs font-semibold">Data de Vencimento {pag.formaPagamento !== 'Boleto' && '(opcional)'}</Label>
                                <Input
                                  type="date"
                                  value={dataVencimentoEdicao}
                                  onChange={(e) => setDataVencimentoEdicao(e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSalvarEdicao(alunoSelecionado, pag.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  disabled={!valorEdicao || parseFloat(valorEdicao) <= 0}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditandoPagamentoId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Botões de ação - Apenas para pagamentos confirmados */}
                          {pag.confirmedoPor && editandoPagamentoId !== pag.id && (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditarPagamento(pag)}
                                className="bg-blue-600 hover:bg-blue-700 h-7"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSolicitarExclusao(pag)}
                                className="bg-red-600 hover:bg-red-700 h-7"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário de Novo Pagamento */}
                {(alunoSelecionado.pagamentos?.valorPago || 0) < alunoSelecionado.valorTotal && (
                  <div className="border-2 border-red-600 rounded-lg p-4 bg-red-50">
                    <h3 className="font-semibold mb-3 text-red-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Registrar Novo Pagamento
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="valor">Valor *</Label>
                          <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
                          <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                            <SelectTrigger id="forma-pagamento">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getFormasPagamentoPermitidas().length === 0 ? (
                                <>
                                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="PIX">PIX</SelectItem>
                                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                  <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                                  <SelectItem value="Cheque">Cheque</SelectItem>
                                  <SelectItem value="Boleto">Boleto</SelectItem>
                                </>
                              ) : (
                                getFormasPagamentoPermitidas().map(forma => (
                                  <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Aviso de formas permitidas para PJ */}
                      {alunoSelecionado.tipoPessoa === 'PJ' && alunoSelecionado.clientePJId && (() => {
                        const formasPermitidas = getFormasPagamentoPermitidas();
                        if (formasPermitidas.length > 0) {
                          return (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-sm text-blue-800">
                                <strong>🏢 {getClientePJNome(alunoSelecionado.clientePJId)}:</strong> Esta empresa possui restrições de pagamento.
                              </p>
                              <p className="text-xs text-blue-700 mt-1">
                                Formas permitidas: <strong>{formasPermitidas.join(', ')}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          placeholder="Informações adicionais..."
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleRegistrarPagamento}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!valor || !formaPagamento || parseFloat(valor) <= 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Registrar Pagamento
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Validação de PIN */}
      <Dialog open={dialogPinAberto} onOpenChange={(open) => {
        setDialogPinAberto(open);
        if (!open) {
          // Limpar estados quando fechar o dialog
          setPinDigitado('');
          setAcaoPendente(null);
        }
      }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Validação de PIN
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4 px-6">
            <p className="text-sm text-gray-600">
              Para realizar esta ação, você precisa validar seu PIN Master:
            </p>
            <Input
              type="password"
              value={pinDigitado}
              onChange={(e) => setPinDigitado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleValidarPin();
                }
              }}
              className="h-8 text-xs font-mono"
              placeholder="Digite seu PIN"
              autoFocus
            />
            <Button
              onClick={handleValidarPin}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validar PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Sucesso */}
      <Dialog open={dialogSucessoAberto} onOpenChange={(open) => {
        setDialogSucessoAberto(open);
        if (!open) {
          // Fechar também o dialog de pagamento
          setDialogPagamentoAberto(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Pagamento Registrado!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {mensagemSucesso}
              </p>
              <p className="text-sm text-gray-600">
                O pagamento foi registrado no sistema e está aguardando confirmação do Master.
              </p>
            </div>
            
            <Button
              onClick={() => {
                setDialogSucessoAberto(false);
                setDialogPagamentoAberto(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              OK, Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação Concluída */}
      <Dialog open={dialogConfirmacaoConcluidaAberto} onOpenChange={setDialogConfirmacaoConcluidaAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Pagamento Confirmado!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Valor Confirmado: {valorConfirmado}
              </p>
              <p className="text-sm text-gray-600">
                O pagamento foi confirmado com sucesso no sistema.
              </p>
            </div>
            
            <Button
              onClick={() => {
                setDialogConfirmacaoConcluidaAberto(false);
                setDialogPagamentoAberto(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              OK, Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprovação em Lote */}
      <Dialog open={dialogAprovacaoLoteAberto} onOpenChange={setDialogAprovacaoLoteAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <CheckCircle className="w-6 h-6" />
              Aprovação em Lote - Pessoa Jurídica
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Lista de alunos selecionados */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">
                Alunos Selecionados ({alunosSelecionados.size}):
              </p>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {Array.from(alunosSelecionados).map(alunoId => {
                    const aluno = alunos.find(a => a.id === alunoId);
                    if (!aluno) return null;
                    
                    const pagamentosPendentes = aluno.pagamentos?.historico?.filter((p: any) => !p.confirmedoPor) || [];
                    const totalPendente = pagamentosPendentes.reduce((sum: number, p: any) => sum + p.valor, 0);
                    
                    return (
                      <div key={alunoId} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {aluno.codigoSistema}
                          </Badge>
                          <span className="font-medium">{aluno.nome}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {pagamentosPendentes.length} pagamento(s)
                          </p>
                          <p className="font-semibold text-green-600">
                            {formatarMoeda(totalPendente)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 🆕 Campo Nota Fiscal (Obrigatório para PJ) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Label htmlFor="numeroNotaFiscalLote" className="font-semibold text-green-900 mb-2 block">
                📋 Número da Nota Fiscal <span className="text-red-600">*</span>
              </Label>
              <Input
                id="numeroNotaFiscalLote"
                placeholder="Ex: NF-12345 (obrigatório para Pessoa Jurídica)"
                value={numeroNotaFiscalLote}
                onChange={(e) => setNumeroNotaFiscalLote(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-green-700 mt-2">
                * Este número será aplicado para <strong>TODOS</strong> os pagamentos confirmados em lote
              </p>
            </div>

            {/* Aviso sobre boletos */}
            {Array.from(alunosSelecionados).some(alunoId => {
              const aluno = alunos.find(a => a.id === alunoId);
              return aluno?.pagamentos?.historico?.some((p: any) => 
                !p.confirmedoPor && p.formaPagamento === 'Boleto'
              );
            }) && (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-semibold mb-2">
                    ⚠️ Atenção: Pagamentos em Boleto Detectados
                  </p>
                  <p className="text-xs text-orange-700">
                    Os campos abaixo serão aplicados para <strong>TODOS</strong> os boletos selecionados.
                    Certifique-se de que o código de barras e data de vencimento são iguais para todos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigoBarrasLote">
                      Código de Barras (Boletos) <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="codigoBarrasLote"
                      placeholder="Digite o código de barras"
                      value={codigoBarrasLote}
                      onChange={(e) => setCodigoBarrasLote(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataVencimentoLote">
                      Data de Vencimento (Boletos) <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="dataVencimentoLote"
                      type="date"
                      value={dataVencimentoLote}
                      onChange={(e) => setDataVencimentoLote(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Aviso Master */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold mb-1">
                🔒 Ação Master Necessária
              </p>
              <p className="text-xs text-red-700">
                Apenas usuários Master podem confirmar pagamentos em lote.
                Todos os pagamentos pendentes dos alunos selecionados serão confirmados simultaneamente.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setDialogAprovacaoLoteAberto(false);
                  setCodigoBarrasLote('');
                  setDataVencimentoLote('');
                  setNumeroNotaFiscalLote(''); // 🆕 Resetar Nota Fiscal ao cancelar
                }}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarAprovacaoLote}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar em Lote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};