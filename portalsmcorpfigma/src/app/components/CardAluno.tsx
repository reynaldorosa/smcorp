import React, { useState, useEffect } from 'react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, Edit, Trash2, Link2, Mail, MessageSquare, CheckCircle, XCircle, FileText, Phone, MapPin, Clock, User, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ClipboardCheck, MessageCircle, ExternalLink, RefreshCw, ArrowRightLeft, Package, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Checkbox } from '@/app/components/ui/checkbox';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import type { Aluno } from '@/app/contexts/SMCorpContext';
import { DialogPagamento } from '@/app/components/DialogPagamento';
import { DialogSelecionarSubstituto } from '@/app/components/DialogSelecionarSubstituto';
import { DialogTransferirTurma } from '@/app/components/DialogTransferirTurma';
import { DialogResultadoProva } from '@/app/components/DialogResultadoProva';

// Função helper para criar data local a partir de string YYYY-MM-DD
const criarDataLocal = (dataString: string): Date => {
  const [ano, mes, dia] = dataString.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

// Função helper para formatar telefone para WhatsApp (remove caracteres especiais)
const formatarTelefoneWhatsApp = (telefone: string): string => {
  return telefone.replace(/\D/g, ''); // Remove tudo que não é dígito
};

// Função helper para copiar texto com fallback
const copiarTexto = (texto: string): Promise<void> => {
  // Tentar usar a API moderna do Clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(texto)
      .catch(() => {
        // Se falhar, usar método alternativo
        return copiarTextoFallback(texto);
      });
  } else {
    // Usar método alternativo diretamente
    return copiarTextoFallback(texto);
  }
};

// Método alternativo para copiar (funciona em iframes)
const copiarTextoFallback = (texto: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('Comando de cópia falhou'));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
};

interface CardAlunoProps {
  aluno: Aluno;
  turma?: any;
  curso?: any;
  compacto?: boolean; // Modo compacto para visualização semanal
  destacado?: boolean; // Se o aluno está selecionado
  dataAtual?: string; // Data atual (formato YYYY-MM-DD) para controle de presença na vista semanal
}

export const CardAluno: React.FC<CardAlunoProps> = ({ aluno, turma, curso, compacto = false, destacado = false, dataAtual }) => {
  const { atualizarAluno, instrutores, produtosExtras, gerarCodigoProva, cancelarProva, excluirAluno, configuracoesEmail, configuracoesWhatsApp, usuarios, alunos, substituirAluno, marcarPresencaDia, clientesPJ, dispararCustosAutomaticos, cancelarCustosPorAcao, dispararCustosInstrutorProva, verificarCustosProvaParaExcluir } = useSMCorp();
  
  // Estado de expansão do card
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Estado para dialog de confirmação de presença
  const [dialogConfirmarPresencaAberto, setDialogConfirmarPresencaAberto] = useState(false);
  
  // Estados para envio de link
  const [enviarPorEmail, setEnviarPorEmail] = useState(false);
  const [enviarPorWhatsApp, setEnviarPorWhatsApp] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<{ tipo: 'success' | 'error' | null; mensagem: string }>({ tipo: null, mensagem: '' });
  const [mostrarEmailFallback, setMostrarEmailFallback] = useState(false);
  const [emailFallbackData, setEmailFallbackData] = useState({ destinatario: '', assunto: '', corpo: '' });

  const [provaData, setProvaData] = useState({
    nomeProva: '',
    instrutor: '',
    data: '',
    hora: ''
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editProvaData, setEditProvaData] = useState({
    nomeProva: aluno.statusProva.nomeProva || '',
    instrutor: aluno.statusProva.instrutor || '',
    data: aluno.statusProva.data || '',
    hora: aluno.statusProva.hora || ''
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editAlunoDialogOpen, setEditAlunoDialogOpen] = useState(false);
  
  const [editAlunoData, setEditAlunoData] = useState({
    nome: aluno.nome,
    cpf: aluno.cpf,
    telefone: aluno.telefone,
    email: aluno.email,
    desconto: aluno.desconto,
    foto: aluno.foto || '',
    produtosExtras: aluno.produtosExtras || []
  });

  // 🆕 Estado para rastrear produtos extras pagos pela PF (quando aluno é PJ)
  const [produtosExtrasPagoPorPF, setProdutosExtrasPagoPorPF] = useState<Set<string>>(new Set());

  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [substituirDialogOpen, setSubstituirDialogOpen] = useState(false);
  const [transferirDialogOpen, setTransferirDialogOpen] = useState(false);
  const [resultadoProvaDialogOpen, setResultadoProvaDialogOpen] = useState(false);
  
  // Estado para dialog de verificação de PIN
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Usuário atual mockado - em produção viria do contexto de autenticação
  const usuarioAtual = usuarios[0]; // Admin Principal (Master)
  
  // Buscar alunos em fila de espera da mesma turma
  const alunosFilaEspera = alunos.filter(a => a.turmaId === aluno.turmaId && a.filaEspera === true);

  const handleRegistrarPagamento = (dados: { 
    valor: number; 
    formaPagamento: string; 
    observacoes: string;
    codigoBarrasBoleto?: string;
    dataVencimentoBoleto?: string;
  }) => {
    const agora = new Date();
    const dataAtual = agora.toLocaleDateString('pt-BR');
    const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Buscar empresa se for PJ para pegar CNPJ
    let vinculadoA = aluno.cpf; // Padrão: CPF do aluno
    if (aluno.tipoPessoa === 'PJ' && aluno.clientePJId) {
      const empresa = clientesPJ.find(c => c.id === aluno.clientePJId);
      vinculadoA = empresa?.cnpj || aluno.cpf;
    }

    const novoPagamento = {
      id: Date.now().toString(),
      valor: dados.valor,
      data: dataAtual,
      hora: horaAtual,
      formaPagamento: dados.formaPagamento,
      observacoes: dados.observacoes,
      registradoPor: usuarioAtual.nome,
      codigoBarrasBoleto: dados.codigoBarrasBoleto,
      dataVencimentoBoleto: dados.dataVencimentoBoleto,
      vinculadoA: vinculadoA
    };

    const pagamentosAtualizados = {
      historico: [...(aluno.pagamentos?.historico || []), novoPagamento],
      valorPago: (aluno.pagamentos?.valorPago || 0) + dados.valor,
      pendente: true
    };

    // Atualizar statusPagamento baseado no valor total
    const statusPagamento = pagamentosAtualizados.valorPago >= (aluno.valorTotal || 0);

    atualizarAluno(aluno.id, { 
      pagamentos: pagamentosAtualizados,
      statusPagamento 
    });

    toast.success(`Pagamento de ${dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrado com sucesso!`);
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Primeiro Pagamento Registrado
    const ehPrimeiroPagamento = !aluno.pagamentos?.historico || aluno.pagamentos.historico.length === 0;
    if (ehPrimeiroPagamento) {
      setTimeout(() => {
        dispararCustosAutomaticos('Primeiro Pagamento Registrado', aluno.id, { valor: dados.valor, forma: dados.formaPagamento });
      }, 100);
    }
  };

  const handleConfirmarPagamento = (pagamentoId: string) => {
    const agora = new Date();
    const dataConfirmacao = agora.toLocaleDateString('pt-BR');
    const horaConfirmacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const pagamentosAtualizados = {
      ...aluno.pagamentos!,
      historico: aluno.pagamentos!.historico.map(p => 
        p.id === pagamentoId
          ? { 
              ...p, 
              confirmedoPor: usuarioAtual.nome,
              dataConfirmacao,
              horaConfirmacao 
            }
          : p
      ),
      pendente: aluno.pagamentos!.historico.some(p => p.id !== pagamentoId && !p.confirmedoPor)
    };

    atualizarAluno(aluno.id, { pagamentos: pagamentosAtualizados });

    toast.success('Pagamento confirmado pelo Master!', {
      icon: '✅'
    });
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Pagamento Confirmado (Master)
    const pagamento = aluno.pagamentos!.historico.find(p => p.id === pagamentoId);
    setTimeout(() => {
      dispararCustosAutomaticos('Pagamento Confirmado (Master)', aluno.id, { 
        valor: pagamento?.valor, 
        forma: pagamento?.formaPagamento 
      });
    }, 100);
  };

  const handleEditarPagamento = (pagamentoId: string, dados: { 
    valor: number; 
    formaPagamento: string; 
    observacoes: string;
    codigoBarrasBoleto?: string;
    dataVencimentoBoleto?: string;
  }) => {
    const pagamentoAntigo = aluno.pagamentos?.historico.find(p => p.id === pagamentoId);
    if (!pagamentoAntigo) return;

    const diferencaValor = dados.valor - pagamentoAntigo.valor;

    const pagamentosAtualizados = {
      ...aluno.pagamentos!,
      historico: aluno.pagamentos!.historico.map(p => 
        p.id === pagamentoId
          ? {
              ...p,
              valor: dados.valor,
              formaPagamento: dados.formaPagamento,
              observacoes: dados.observacoes,
              codigoBarrasBoleto: dados.codigoBarrasBoleto,
              dataVencimentoBoleto: dados.dataVencimentoBoleto
            }
          : p
      ),
      valorPago: (aluno.pagamentos?.valorPago || 0) + diferencaValor
    };

    // Atualizar statusPagamento baseado no novo valor total
    const statusPagamento = pagamentosAtualizados.valorPago >= (aluno.valorTotal || 0);

    atualizarAluno(aluno.id, { 
      pagamentos: pagamentosAtualizados,
      statusPagamento 
    });

    toast.success('Pagamento editado com sucesso!', {
      icon: '✏️'
    });
  };

  const handleToggleDocumentos = () => {
    // Verificar se o usuário é Master
    if (usuarioAtual.nivel !== 'Master') {
      toast.error('❌ Apenas usuários MASTER podem aprovar documentos em lote!');
      return;
    }
    
    // Abrir dialog de verificação de PIN
    setPinDialogOpen(true);
  };
  
  const handleConfirmarPIN = () => {
    // Validar PIN
    if (pinInput !== usuarioAtual.pin) {
      toast.error('❌ PIN incorreto! Tente novamente.');
      setPinInput('');
      return;
    }
    
    // PIN correto - aprovar/reprovar em lote
    atualizarAluno(aluno.id, { statusDocumentos: !aluno.statusDocumentos });
    toast.success(verificarDocumentosCompletos() ? '✅ Documentos marcados como pendente!' : '✅ Documentos aprovados em lote!');
    
    // Limpar e fechar
    setPinInput('');
    setPinDialogOpen(false);
  };

  // 🔧 Helper: Verificar se todos os documentos estão aprovados
  const verificarDocumentosCompletos = (): boolean => {
    return aluno.statusDocumentos || 
      (aluno.documentos && aluno.documentos.length > 0 && aluno.documentos.every(doc => doc.status === 'Aprovado'));
  };

  const handleAprovarDocumento = (nomeDoc: string) => {
    const documentosAtualizados = aluno.documentos.map(doc => 
      doc.nome === nomeDoc ? { ...doc, status: 'Aprovado' as const } : doc
    );
    atualizarAluno(aluno.id, { documentos: documentosAtualizados });
    toast.success(`Documento "${nomeDoc}" aprovado!`, { icon: '✅' });
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Documento Individual Aprovado
    setTimeout(() => {
      dispararCustosAutomaticos('Documento Individual Aprovado', aluno.id, { nomeDocumento: nomeDoc });
      
      // Verificar se TODOS documentos foram aprovados
      const todosAprovados = documentosAtualizados.every(doc => doc.status === 'Aprovado');
      if (todosAprovados) {
        dispararCustosAutomaticos('Todos Documentos Aprovados', aluno.id);
      }
    }, 100);
  };

  const handleReprovarDocumento = (nomeDoc: string) => {
    const documentosAtualizados = aluno.documentos.map(doc => 
      doc.nome === nomeDoc ? { ...doc, status: 'Reprovado' as const } : doc
    );
    atualizarAluno(aluno.id, { documentos: documentosAtualizados });
    toast.error(`Documento "${nomeDoc}" reprovado!`, { icon: '❌' });
  };

  const handleAgendarProva = () => {
    const numeroProva = gerarCodigoProva();
    atualizarAluno(aluno.id, {
      statusProva: {
        ativo: true,
        instrutor: provaData.instrutor,
        data: provaData.data,
        hora: provaData.hora,
        numeroProva: numeroProva,
        nomeProva: provaData.nomeProva
      }
    });
    
    // 🆕 CANCELAR custos de "Prova Cancelada" se existirem (reagendamento)
    cancelarCustosPorAcao(aluno.id, 'Prova Cancelada');
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Prova Agendada
    setTimeout(() => {
      dispararCustosAutomaticos('Prova Agendada', aluno.id, {
        numeroProva,
        data: provaData.data,
        hora: provaData.hora
      });
      
      // 🆕 DISPARAR CUSTOS DE INSTRUTOR: Instrutor Vinculado à Prova
      if (provaData.instrutor) {
        dispararCustosInstrutorProva(provaData.instrutor, aluno.id, numeroProva);
      }
    }, 100);
  };

  const progressoMatricula = () => {
    let progresso = 0;
    // Status Link: Agendado = 0%, Confirmar/Confirmado/Presente = +33%
    if (aluno.statusLink !== 'Agendado') progresso += 33;
    if (aluno.statusPagamento) progresso += 33;
    
    // 🔧 CORREÇÃO: Verificar se todos os documentos estão aprovados
    if (verificarDocumentosCompletos()) progresso += 34;
    
    return progresso;
  };

  // Templates de Mensagens WhatsApp
  const gerarMensagemWhatsApp = (tipo: string): string => {
    const linkMatricula = `https://smcorp.com/matricula/${aluno.codigoSistema}-${aluno.id}`;
    const primeiroNome = aluno.nome.split(' ')[0];
    const nomeCurso = curso?.nome || 'curso';
    const nomeTurma = turma?.codigo || '';
    
    switch (tipo) {
      case 'matricula':
        return `Olá ${primeiroNome}! 👋\n\nSua matrícula na ${nomeTurma} está confirmada! 🎓\n\nAcesse seu link exclusivo para completar o cadastro e enviar os documentos:\n${linkMatricula}\n\n✅ O que você pode fazer:\n• Enviar documentos\n• Fazer pagamento\n• Acompanhar sua matrícula\n\nQualquer dúvida, estou à disposição!\n\nEquipe SMCORP`;
      
      case 'documentos':
        return `Olá ${primeiroNome}! 📄\n\nNotamos que seus documentos ainda estão pendentes.\n\nPor favor, acesse o link abaixo e envie os documentos necessários:\n${linkMatricula}\n\n⏰ Importante: O prazo para envio é essencial para garantir sua vaga!\n\nPrecisa de ajuda? Estou aqui!\n\nEquipe SMCORP`;
      
      case 'pagamento':
        return `Olá ${primeiroNome}! 💳\n\nIdentificamos que o pagamento da sua matrícula está pendente.\n\nValor: R$ ${(aluno.valorTotal || 0).toFixed(2)}\n${aluno.desconto > 0 ? `Desconto aplicado: R$ ${(aluno.desconto || 0).toFixed(2)}` : ''}\n\nAcesse seu link para realizar o pagamento:\n${linkMatricula}\n\n✅ Formas de pagamento disponíveis no link!\n\nEquipe SMCORP`;
      
      case 'prova':
        if (!aluno.statusProva.ativo) return '';
        const dataProva = aluno.statusProva.data ? criarDataLocal(aluno.statusProva.data).toLocaleDateString('pt-BR') : '';
        return `Olá ${primeiroNome}! 📝\n\nLembrando: Sua prova está agendada!\n\n🎯 Detalhes:\n• ${aluno.statusProva.nomeProva || 'Prova'}\n• Data: ${dataProva}\n• Horário: ${aluno.statusProva.hora}\n• Código: ${aluno.statusProva.numeroProva}\n\n💡 Dica: Chegue 15 minutos antes!\n\nBoa prova!\n\nEquipe SMCORP`;
      
      case 'boasvindas':
        const dataInicio = turma?.dataInicio ? criarDataLocal(turma.dataInicio).toLocaleDateString('pt-BR') : '';
        return `Olá ${primeiroNome}! 🎉\n\nSeja bem-vindo(a) à ${nomeTurma}!\n\n📚 Informações importantes:\n• Curso: ${nomeCurso}\n• Início: ${dataInicio}\n• Horário: ${turma?.horario || ''}\n\nSeu link de matrícula:\n${linkMatricula}\n\nEstamos ansiosos para ter você conosco!\n\nEquipe SMCORP`;
      
      default:
        return `Olá ${primeiroNome}! Segue o link da sua matrícula: ${linkMatricula}`;
    }
  };

  const enviarWhatsApp = (mensagem: string) => {
    const telefoneFormatado = formatarTelefoneWhatsApp(aluno.telefone);
    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://wa.me/55${telefoneFormatado}?text=${mensagemCodificada}`;
    window.open(urlWhatsApp, '_blank');
  };

  const enviarEmail = (mensagem: string) => {
    const linkMatricula = `https://smcorp.com/matricula/${aluno.codigoSistema}-${aluno.id}`;
    const primeiroNome = aluno.nome.split(' ')[0];
    const nomeCurso = curso?.nome || 'curso';
    const nomeTurma = turma?.codigo || '';
    
    const assunto = 'Sua Matrícula na SMCORP';
    const corpoEmail = `
Olá ${primeiroNome}! 👋

Sua matrícula na ${nomeTurma} está confirmada! 🎓

Acesse seu link exclusivo para completar o cadastro e enviar os documentos:
${linkMatricula}

✅ O que você pode fazer:
• Enviar documentos
• Fazer pagamento
• Acompanhar sua matrícula

Qualquer dúvida, estou à disposição!

Equipe SMCORP
    `;

    // Tentar abrir mailto:
    const urlEmail = `mailto:${aluno.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;
    
    // Detectar se o mailto: não funciona (Chrome sem cliente configurado)
    const newWindow = window.open(urlEmail, '_blank');
    
    // Se não abriu ou foi bloqueado, mostrar fallback
    setTimeout(() => {
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // mailto: falhou - mostrar dialog com opção de copiar
        setEmailFallbackData({
          destinatario: aluno.email,
          assunto: assunto,
          corpo: corpoEmail
        });
        setMostrarEmailFallback(true);
      }
    }, 500);
  };

  return (
    <div id={`aluno-card-${aluno.id}`} className={`bg-white rounded-lg border transition-all scroll-mt-4 overflow-hidden ${
      destacado ? 'border-red-600 shadow-xl ring-2 ring-red-600 ring-offset-2' : 'border-gray-200 hover:shadow-lg'
    }`}>
      {/* VISUALIZAÇÃO COMPACTA */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Foto */}
          <div className="relative shrink-0">
            {aluno.foto ? (
              <img
                src={aluno.foto}
                alt={aluno.nome}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Nome e Produtos */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">
              {aluno.nome}
            </h3>
            
            {/* Nome dos produtos do aluno */}
            {aluno.produtosExtras && aluno.produtosExtras.length > 0 && (
              <div className="text-sm text-gray-600 mt-0.5 truncate">
                {aluno.produtosExtras.map((produtoId) => {
                  const produto = produtosExtras.find(p => p.id === produtoId);
                  return produto ? produto.nome : null;
                }).filter(Boolean).join(' • ')}
              </div>
            )}
          </div>

          {/* Ícone de expansão */}
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Layout 2 colunas: Progresso (50%) + Status/Presença (50%) */}
        {/* DIFERENÇA: Vista semanal mostra controle de presença por dia, vista lista mostra dropdown de status */}
        <div className="mt-3 mb-3 flex items-center gap-3">
          {/* Coluna 1: Progresso da Matrícula (50%) */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 font-medium">Progresso</span>
              <span className="text-[10px] text-gray-600 font-semibold">{progressoMatricula()}%</span>
            </div>
            <Progress value={progressoMatricula()} className="h-1.5" />
          </div>

          {/* Coluna 2: Status Link OU Presença do Dia (50%) */}
          <div className="flex-1">
            {compacto && dataAtual ? (
              /* VISTA SEMANAL: Controle de presença independente por dia */
              <>
                <span className="text-[10px] text-gray-600 font-medium block mb-1">Presença Hoje</span>
                {aluno.presencasPorDia && aluno.presencasPorDia[dataAtual] ? (
                  <Badge className="w-full justify-center h-7 text-xs bg-green-100 text-green-700 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    🟢 Presente
                  </Badge>
                ) : (
                  <Popover open={dialogConfirmarPresencaAberto} onOpenChange={setDialogConfirmarPresencaAberto}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Marcar Presença
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 p-0"
                      onClick={(e) => e.stopPropagation()}
                      align="center"
                      side="top"
                      sideOffset={5}
                    >
                      <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">Confirmar Presença</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Confirma a presença de{' '}
                              <span className="font-bold text-gray-900">{aluno.nome}</span>{' '}
                              em{' '}
                              <span className="font-semibold text-gray-900">
                                {dataAtual ? new Date(dataAtual + 'T12:00:00').toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'short'
                                }) : ''}
                              </span>?
                            </p>
                          </div>
                        </div>

                        {/* Aviso */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-800 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>O aluno será incluído na lista de presença deste dia.</span>
                          </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialogConfirmarPresencaAberto(false);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dataAtual) {
                                marcarPresencaDia(aluno.id, dataAtual);
                                toast.success(`✅ Presença confirmada!`, {
                                  description: `${aluno.nome} - ${new Date(dataAtual + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                });
                              }
                              setDialogConfirmarPresencaAberto(false);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </>
            ) : (
              /* VISTA LISTA: Dropdown de status global */
              <>
                <span className="text-[10px] text-gray-600 font-medium block mb-1">Status</span>
                <Select 
                  value={aluno.statusLink} 
                  onValueChange={(value) => atualizarAluno(aluno.id, { statusLink: value as 'Agendado' | 'Confirmar' | 'Confirmado' | 'Presente' })}
                >
                  <SelectTrigger className={`h-7 text-xs w-full ${
                    aluno.statusLink === 'Agendado' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                    aluno.statusLink === 'Confirmar' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                    aluno.statusLink === 'Confirmado' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                    'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">🟡 Agendado</SelectItem>
                    <SelectItem value="Confirmar">🟠 Confirmar</SelectItem>
                    <SelectItem value="Confirmado">🔵 Confirmado</SelectItem>
                    <SelectItem value="Presente">🟢 Presente</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Status Buttons + WhatsApp */}
        <div className="flex items-center gap-1.5 w-full">
          {/* Pagamento */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPagamentoDialogOpen(true);
            }}
            className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${
              (() => {
                const valorPago = aluno.pagamentos?.valorPago || 0;
                const todosConfirmados = aluno.pagamentos?.historico.every(p => p.confirmedoPor) || false;
                
                if (valorPago === 0) {
                  return 'bg-red-50 border-red-500 text-red-700';
                } else if (valorPago < (aluno.valorTotal || 0)) {
                  return 'bg-orange-50 border-orange-500 text-orange-700';
                } else if (valorPago >= (aluno.valorTotal || 0) && todosConfirmados) {
                  return 'bg-green-50 border-green-500 text-green-700';
                } else {
                  return 'bg-blue-50 border-blue-500 text-blue-700';
                }
              })()
            }`}
          >
            {(() => {
              const valorPago = aluno.pagamentos?.valorPago || 0;
              if (valorPago === 0) {
                return <XCircle className="w-3.5 h-3.5" />;
              } else if (valorPago < (aluno.valorTotal || 0)) {
                return <AlertCircle className="w-3.5 h-3.5" />;
              } else {
                return <CheckCircle2 className="w-3.5 h-3.5" />;
              }
            })()}
            PAG
          </Button>

          {/* Documentos */}
          {(() => {
            // 🔧 CORREÇÃO: Verificar se todos os documentos estão aprovados
            const temDocumentosOk = verificarDocumentosCompletos();
            
            return (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${
                      temDocumentosOk
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-red-50 border-red-500 text-red-700'
                    }`}
                  >
                    {temDocumentosOk ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    DOC
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Documentos - {aluno.nome}</DialogTitle>
                <DialogDescription>
                  Aprove ou reprove cada documento individualmente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {aluno.documentos && aluno.documentos.length > 0 ? (
                  <div className="space-y-3">
                    {aluno.documentos.map((doc, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${
                          doc.status === 'Aprovado' ? 'bg-green-50 border-green-300' :
                          doc.status === 'Reprovado' ? 'bg-red-50 border-red-300' :
                          'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <h4 className="font-semibold text-sm">{doc.nome}</h4>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${
                                  doc.status === 'Aprovado' ? 'bg-green-100 text-green-700 border-green-300' :
                                  doc.status === 'Reprovado' ? 'bg-red-100 text-red-700 border-red-300' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-300'
                                }`}
                              >
                                {doc.status}
                              </Badge>
                            </div>
                            
                            {doc.tipo === 'upload' && doc.arquivo && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">Arquivo enviado:</p>
                                <a 
                                  href={doc.arquivo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Visualizar arquivo
                                </a>
                              </div>
                            )}
                            
                            {doc.tipo === 'texto' && doc.valorTexto && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500 mb-1">Informação preenchida:</p>
                                <p className="text-sm font-mono bg-white px-2 py-1 rounded border">{doc.valorTexto}</p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              Enviado em: {new Date(doc.dataEnvio).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {doc.status !== 'Aprovado' && (
                              <Button
                                size="sm"
                                onClick={() => handleAprovarDocumento(doc.nome)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                            )}
                            {doc.status !== 'Reprovado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReprovarDocumento(doc.nome)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reprovar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-lg text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Nenhum documento foi enviado pelo aluno ainda.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Os documentos aparecerão aqui quando o aluno preencher o link de matrícula.
                    </p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Status Geral dos Documentos:</span>
                    {(() => {
                      const temDocumentosOk = verificarDocumentosCompletos();
                      return (
                        <Badge className={temDocumentosOk ? 'bg-green-500' : 'bg-red-500'}>
                          {temDocumentosOk ? '✓ Aprovado' : '✗ Pendente'}
                        </Badge>
                      );
                    })()}
                  </div>
                  <Button 
                    onClick={handleToggleDocumentos} 
                    variant="outline" 
                    className="w-full"
                  >
                    {verificarDocumentosCompletos() ? 'Marcar Todos como Pendente' : 'Aprovar Todos em Lote'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            );
          })()}

          {/* Prova */}
          {(() => {
            const temDocumentosOk = verificarDocumentosCompletos();
            
            return (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    disabled={!temDocumentosOk}
                    className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${
                      aluno.resultadoProva
                        ? aluno.resultadoProva.status === 'Aprovado'
                          ? 'bg-green-50 border-green-600 text-green-700'
                          : aluno.resultadoProva.status === 'Reprovado'
                            ? 'bg-red-50 border-red-600 text-red-700'
                            : 'bg-gray-50 border-gray-600 text-gray-700'
                        : aluno.statusProva.ativo 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : temDocumentosOk
                            ? 'border-gray-300 text-gray-700' 
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                {aluno.resultadoProva ? (
                  aluno.resultadoProva.status === 'Aprovado' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : aluno.resultadoProva.status === 'Reprovado' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )
                ) : aluno.statusProva.ativo ? (
                  <ClipboardCheck className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {aluno.resultadoProva 
                  ? aluno.resultadoProva.status === 'Aprovado' 
                    ? 'APR'
                    : aluno.resultadoProva.status === 'Reprovado'
                      ? 'REP'
                      : 'N/S'
                  : 'PROVA'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {aluno.statusProva.ativo ? `Prova ${aluno.statusProva.numeroProva} - ${aluno.nome}` : `Agendar Prova - ${aluno.nome}`}
                </DialogTitle>
                <DialogDescription>
                  {aluno.statusProva.ativo ? 'Detalhes da prova agendada.' : 'Agende uma prova para o aluno.'}
                </DialogDescription>
              </DialogHeader>
              {aluno.statusProva.ativo ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <h4 className="font-semibold mb-2 flex items-center justify-between">
                      <span>Prova Agendada</span>
                      <Badge className="bg-purple-600 text-white font-mono">
                        {aluno.statusProva.numeroProva}
                      </Badge>
                    </h4>
                    <div className="space-y-2 text-sm">
                      {aluno.statusProva.nomeProva && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nome da Prova:</span>
                          <span className="font-medium">{aluno.statusProva.nomeProva}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Instrutor:</span>
                        <span className="font-medium">
                          {instrutores.find(i => i.id === aluno.statusProva.instrutor)?.nome}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium">
                          {aluno.statusProva.data ? criarDataLocal(aluno.statusProva.data).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hora:</span>
                        <span className="font-medium">{aluno.statusProva.hora}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 italic mb-2">
                    * O código da prova é único e não pode ser alterado
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditProvaData({
                          nomeProva: aluno.statusProva.nomeProva || '',
                          instrutor: aluno.statusProva.instrutor || '',
                          data: aluno.statusProva.data || '',
                          hora: aluno.statusProva.hora || ''
                        });
                        setIsEditMode(true);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Popover open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancelar Prova
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border-red-200 dark:border-red-800" align="end">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                Cancelar Prova?
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Tem certeza que deseja cancelar a prova {aluno.statusProva.numeroProva}? Esta ação não pode ser desfeita e o código da prova será perdido.
                              </p>
                              
                              {/* 🆕 Mostrar custos que serão excluídos */}
                              {(() => {
                                const { custos, excluir, motivo } = verificarCustosProvaParaExcluir(aluno.id);
                                
                                if (excluir && custos.length > 0) {
                                  return (
                                    <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded p-2">
                                      <div className="text-[10px] font-semibold text-yellow-800 mb-1">
                                        ⚠️ Custos de instrutor que serão excluídos:
                                      </div>
                                      {custos.map((custo) => (
                                        <div key={custo.id} className="text-[10px] text-yellow-700 flex justify-between">
                                          <span>{custo.codigo}</span>
                                          <span className="font-semibold">R$ {custo.valor.toFixed(2)}</span>
                                        </div>
                                      ))}
                                      <div className="mt-1 pt-1 border-t border-yellow-300 flex justify-between text-[10px] font-bold text-yellow-900">
                                        <span>Total:</span>
                                        <span>R$ {custos.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}</span>
                                      </div>
                                      <div className="text-[9px] text-yellow-700 mt-1">
                                        {motivo}
                                      </div>
                                    </div>
                                  );
                                } else if (!excluir && motivo && motivo.includes('outro')) {
                                  return (
                                    <div className="mt-2 bg-blue-50 border border-blue-300 rounded p-2">
                                      <div className="text-[10px] text-blue-700">
                                        ℹ️ {motivo}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return null;
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancelDialogOpen(false)}
                              className="flex-1"
                            >
                              Não, manter
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                cancelarProva(aluno.id);
                                setCancelDialogOpen(false);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              Sim, cancelar
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Nome da Prova */}
                  <div>
                    <Label htmlFor="nomeProva">Nome da Prova</Label>
                    <Input
                      id="nomeProva"
                      type="text"
                      placeholder="Ex: Prova Teórica, Prova Prática..."
                      value={provaData.nomeProva}
                      onChange={(e) => setProvaData({ ...provaData, nomeProva: e.target.value })}
                    />
                  </div>

                  {/* Instrutor */}
                  <div>
                    <Label htmlFor="instrutor">Instrutor</Label>
                    <Select value={provaData.instrutor} onValueChange={(value) => setProvaData({ ...provaData, instrutor: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o instrutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instrutores.map((instrutor) => (
                          <SelectItem key={instrutor.id} value={instrutor.id}>
                            {instrutor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data e Hora */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dataProva">Data</Label>
                      <Input
                        id="dataProva"
                        type="date"
                        value={provaData.data}
                        onChange={(e) => setProvaData({ ...provaData, data: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horaProva">Hora</Label>
                      <Input
                        id="horaProva"
                        type="time"
                        value={provaData.hora}
                        onChange={(e) => setProvaData({ ...provaData, hora: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAgendarProva} className="w-full">Agendar Prova</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
            );
          })()}

          {/* WhatsApp */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => e.stopPropagation()}
                className="h-9 w-9 p-0 shrink-0 border-green-300 text-green-700 hover:bg-green-50"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>📱 Enviar WhatsApp - {aluno.nome}</DialogTitle>
                <DialogDescription>
                  Escolha um template de mensagem ou personalize.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-semibold text-green-900 mb-1">📞 Contato</p>
                  <p className="text-green-800">{aluno.telefone}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Templates de Mensagens:</Label>
                  
                  <Button 
                    onClick={() => enviarWhatsApp(gerarMensagemWhatsApp('boasvindas'))} 
                    variant="outline" 
                    className="w-full justify-start h-auto py-2"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-sm">🎉 Boas-vindas</div>
                      <div className="text-xs text-gray-500">Mensagem de boas-vindas com informações da turma</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => enviarWhatsApp(gerarMensagemWhatsApp('matricula'))} 
                    variant="outline" 
                    className="w-full justify-start h-auto py-2"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-sm">📋 Link de Matrícula</div>
                      <div className="text-xs text-gray-500">Enviar link exclusivo para completar cadastro</div>
                    </div>
                  </Button>

                  {(() => {
                    const temDocumentosOk = verificarDocumentosCompletos();
                    
                    return !temDocumentosOk && (
                      <Button 
                        onClick={() => enviarWhatsApp(gerarMensagemWhatsApp('documentos'))} 
                        variant="outline" 
                        className="w-full justify-start h-auto py-2 border-yellow-300 bg-yellow-50"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm text-yellow-700">📄 Lembrete de Documentos</div>
                          <div className="text-xs text-yellow-600">Solicitar envio de documentos pendentes</div>
                        </div>
                      </Button>
                    );
                  })()}

                  {!aluno.statusPagamento && (
                    <Button 
                      onClick={() => enviarWhatsApp(gerarMensagemWhatsApp('pagamento'))} 
                      variant="outline" 
                      className="w-full justify-start h-auto py-2 border-orange-300 bg-orange-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-sm text-orange-700">💳 Lembrete de Pagamento</div>
                        <div className="text-xs text-orange-600">Solicitar pagamento pendente</div>
                      </div>
                    </Button>
                  )}

                  {aluno.statusProva.ativo && (
                    <Button 
                      onClick={() => enviarWhatsApp(gerarMensagemWhatsApp('prova'))} 
                      variant="outline" 
                      className="w-full justify-start h-auto py-2 border-blue-300 bg-blue-50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-sm text-blue-700">📝 Confirmação de Prova</div>
                        <div className="text-xs text-blue-600">Lembrar data e horário da prova agendada</div>
                      </div>
                    </Button>
                  )}
                </div>

                <div className="pt-3 border-t text-xs text-gray-500">
                  💡 Ao clicar em uma opção, o WhatsApp será aberto com a mensagem pré-preenchida.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ÁREA EXPANDIDA */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3 bg-gray-50">
          {/* Códigos e Turma */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="default" className="bg-green-600 text-white font-mono text-xs">
                {aluno.codigoSistema}
              </Badge>
              {aluno.statusProva.ativo && aluno.statusProva.numeroProva && (
                <Badge variant="default" className="bg-purple-600 text-white font-mono text-xs">
                  {aluno.statusProva.numeroProva}
                </Badge>
              )}
            </div>
            {/* Nome da Turma e Curso */}
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Turma:</span>
                <span className="font-medium">{turma?.codigo || '-'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Curso:</span>
                <span className="font-medium">{curso?.nome || '-'}</span>
              </div>
              {/* Nome da Empresa (se for PJ) */}
              {aluno.clientePJId && (() => {
                const empresa = clientesPJ.find(c => c.id === aluno.clientePJId);
                return empresa ? (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium text-blue-700">🏢 {empresa.nome}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Datas do Aluno */}
          {(aluno.dataInicioAluno || aluno.dataFimAluno || turma) && (
            <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Início:</span>
                <span className="font-medium">
                  {aluno.dataInicioAluno 
                    ? criarDataLocal(aluno.dataInicioAluno).toLocaleDateString('pt-BR')
                    : turma?.dataInicio 
                      ? criarDataLocal(turma.dataInicio).toLocaleDateString('pt-BR')
                      : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Término:</span>
                <span className="font-medium">
                  {aluno.dataFimAluno 
                    ? criarDataLocal(aluno.dataFimAluno).toLocaleDateString('pt-BR')
                    : turma?.dataFim 
                      ? criarDataLocal(turma.dataFim).toLocaleDateString('pt-BR')
                      : '-'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">CPF:</span>
              <span className="font-medium">{aluno.cpf}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-medium">{aluno.telefone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium truncate ml-2">{aluno.email}</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-semibold text-green-600">R$ {(aluno.valorTotal || 0).toFixed(2)}</span>
            </div>
            {aluno.desconto > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-medium text-orange-600">- R$ {(aluno.desconto || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status Link:</span>
              <Badge className={`text-xs ${
                aluno.statusLink === 'Agendado' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                aluno.statusLink === 'Confirmar' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                aluno.statusLink === 'Confirmado' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                'bg-green-100 text-green-700 border-green-300'
              }`}>
                {aluno.statusLink === 'Agendado' ? '🟡 Agendado' :
                 aluno.statusLink === 'Confirmar' ? '🟠 Confirmar' :
                 aluno.statusLink === 'Confirmado' ? '🔵 Confirmado' : '🟢 Presente'}
              </Badge>
            </div>
          </div>

          {/* Progresso */}
          {(() => {
            const temDocumentosOk = verificarDocumentosCompletos();
            
            return temDocumentosOk && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-600 font-medium">Progresso da Matrícula</span>
                  <span className="text-xs text-gray-600">{progressoMatricula()}%</span>
                </div>
                <Progress value={progressoMatricula()} className="h-2" />
              </div>
            );
          })()}

          {/* Ações Adicionais */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Link */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Link de Matrícula - {aluno.nome}</DialogTitle>
                  <DialogDescription>
                    Compartilhe o QR Code ou link com o aluno para acessar sua área de matrícula.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-lg flex justify-center">
                    <QRCodeSVG
                      value={`https://smcorp.com/matricula/${aluno.codigoSistema}-${aluno.id}`}
                      size={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link de Matrícula</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`https://smcorp.com/matricula/${aluno.codigoSistema}-${aluno.id}`}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await copiarTexto(`https://smcorp.com/matricula/${aluno.codigoSistema}-${aluno.id}`);
                          } catch (error) {
                            console.error('Erro ao copiar:', error);
                          }
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      💡 <strong>Para testar:</strong> Copie o código <span className="font-mono bg-gray-100 px-1 rounded">{aluno.codigoSistema}-{aluno.id}</span> e clique no botão "Testar Link do Aluno" no canto inferior direito
                    </p>
                    
                    {/* Botão de Teste Rápido */}
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={async () => {
                          const codigo = `${aluno.codigoSistema}-${aluno.id}`;
                          try {
                            await copiarTexto(codigo);
                            alert(`✅ Código copiado: ${codigo}\n\n📌 Agora clique no botão "Testar Link do Aluno" (canto inferior direito) e cole o código!`);
                          } catch (error) {
                            alert(`📋 Código do aluno:\n${codigo}\n\nCopie manualmente e cole no botão "Testar Link do Aluno"`);
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Copiar Código para Teste
                      </Button>
                    </div>
                  </div>

                  {/* Opções de Envio */}
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-sm font-semibold">Enviar Link para o Aluno:</Label>
                    
                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id="enviarEmail"
                            checked={enviarPorEmail}
                            onChange={(e) => setEnviarPorEmail(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="enviarEmail" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">Enviar por Email</div>
                              <div className="text-xs text-gray-500">{aluno.email}</div>
                            </div>
                          </Label>
                          {configuracoesEmail.ativo ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {enviarPorEmail && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            ℹ️ <strong>Atenção:</strong> Abrirá seu cliente de email (Outlook, Gmail, etc) com a mensagem pré-preenchida. Você precisará clicar em "Enviar" manualmente.
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id="enviarWhatsApp"
                            checked={enviarPorWhatsApp}
                            onChange={(e) => setEnviarPorWhatsApp(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="enviarWhatsApp" className="flex items-center gap-2 cursor-pointer flex-1">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-medium text-sm">Enviar por WhatsApp</div>
                              <div className="text-xs text-gray-500">{aluno.telefone}</div>
                            </div>
                          </Label>
                          {configuracoesWhatsApp.ativo ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {enviarPorWhatsApp && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            ℹ️ <strong>Atenção:</strong> Abrirá o WhatsApp Web com a mensagem pré-preenchida. Você precisará clicar em "Enviar" manualmente.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão de Envio */}
                    <Button
                      onClick={() => {
                        let enviado = false;
                        if (enviarPorEmail && configuracoesEmail.ativo) {
                          enviarEmail(gerarMensagemWhatsApp('matricula'));
                          enviado = true;
                        }
                        if (enviarPorWhatsApp && configuracoesWhatsApp.ativo) {
                          enviarWhatsApp(gerarMensagemWhatsApp('matricula'));
                          enviado = true;
                        }
                        if (enviado) {
                          setStatusEnvio({ 
                            tipo: 'success', 
                            mensagem: 'Link enviado com sucesso!' 
                          });
                          setTimeout(() => setStatusEnvio({ tipo: null, mensagem: '' }), 3000);
                          
                          // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Link Enviado
                          setTimeout(() => {
                            dispararCustosAutomaticos('Link Enviado (WhatsApp/Email)', aluno.id, {
                              email: enviarPorEmail,
                              whatsapp: enviarPorWhatsApp
                            });
                          }, 100);
                        } else {
                          setStatusEnvio({ 
                            tipo: 'error', 
                            mensagem: 'Selecione ao menos uma opção de envio ativa.' 
                          });
                          setTimeout(() => setStatusEnvio({ tipo: null, mensagem: '' }), 3000);
                        }
                      }}
                      disabled={!enviarPorEmail && !enviarPorWhatsApp}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Link
                    </Button>

                    {/* Status de Envio */}
                    {statusEnvio.tipo && (
                      <div className={`p-3 rounded text-sm flex items-center gap-2 ${
                        statusEnvio.tipo === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-800' 
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {statusEnvio.tipo === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {statusEnvio.mensagem}
                      </div>
                    )}

                    {/* Informações de Configuração */}
                    {(!configuracoesEmail.ativo || !configuracoesWhatsApp.ativo) && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <p className="font-semibold text-yellow-900 mb-1">⚠️ Atenção</p>
                        <p className="text-yellow-800">
                          {!configuracoesEmail.ativo && !configuracoesWhatsApp.ativo 
                            ? 'Email e WhatsApp estão inativos. Configure no Módulo 00 → Comunicações.'
                            : !configuracoesEmail.ativo 
                              ? 'Email está inativo. Configure no Módulo 00 → Comunicações.'
                              : 'WhatsApp está inativo. Configure no Módulo 00 → Comunicações.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="font-semibold text-blue-900 mb-1">ℹ️ Informações</p>
                    <ul className="text-blue-800 space-y-1 text-xs">
                      <li>• Este link é único e permanente para {aluno.nome}</li>
                      <li>• O aluno pode enviar documentos e fazer pagamento</li>
                      <li>• Status atual: <strong>{aluno.statusLink}</strong></li>
                      <li>• Configure Email/WhatsApp no Módulo 00</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Editar */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                
                // DEBUG: Log ao abrir dialog de edição
                console.log('📝 [DEBUG] Abrindo dialog de edição');
                console.log('📝 [DEBUG] Aluno atual:', aluno);
                console.log('📝 [DEBUG] Produtos do aluno:', aluno.produtosExtras);
                
                setEditAlunoData({
                  nome: aluno.nome,
                  cpf: aluno.cpf,
                  telefone: aluno.telefone,
                  email: aluno.email,
                  desconto: aluno.desconto,
                  foto: aluno.foto || '',
                  produtosExtras: aluno.produtosExtras || []
                });
                setEditAlunoDialogOpen(true);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
          </div>

          {/* Excluir */}
          <Popover open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs border-red-300 text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Excluir Aluno
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-4 bg-white" 
              align="start"
              side="bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      Excluir Aluno?
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      Tem certeza que deseja excluir <strong>{aluno.nome}</strong>? Esta ação não pode ser desfeita e todos os dados do aluno serão permanentemente removidos do sistema.
                    </p>
                    
                    {/* 🆕 Mostrar custos que serão excluídos */}
                    {(() => {
                      const { custos, excluir, motivo } = verificarCustosProvaParaExcluir(aluno.id);
                      
                      if (excluir && custos.length > 0) {
                        return (
                          <div className="mt-2 mb-2 bg-yellow-50 border border-yellow-300 rounded p-2">
                            <div className="text-[10px] font-semibold text-yellow-800 mb-1">
                              ⚠️ Custos que serão excluídos:
                            </div>
                            {custos.map((custo) => (
                              <div key={custo.id} className="text-[10px] text-yellow-700 flex justify-between">
                                <span>{custo.codigo}</span>
                                <span className="font-semibold">R$ {custo.valor.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="mt-1 pt-1 border-t border-yellow-300 flex justify-between text-[10px] font-bold text-yellow-900">
                              <span>Total:</span>
                              <span>R$ {custos.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirAluno(aluno.id);
                      setDeleteDialogOpen(false);
                      toast.success('Aluno excluído com sucesso!');
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Sim, excluir
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Dialog de Edição de Prova (Modo de Edição) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prova - {aluno.nome}</DialogTitle>
            <DialogDescription>
              Atualize as informações da prova agendada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nome da Prova */}
            <div>
              <Label htmlFor="editNomeProva">Nome da Prova</Label>
              <Input
                id="editNomeProva"
                type="text"
                value={editProvaData.nomeProva}
                onChange={(e) => setEditProvaData({ ...editProvaData, nomeProva: e.target.value })}
              />
            </div>

            {/* Instrutor */}
            <div>
              <Label htmlFor="editInstrutor">Instrutor</Label>
              <Select value={editProvaData.instrutor} onValueChange={(value) => setEditProvaData({ ...editProvaData, instrutor: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o instrutor" />
                </SelectTrigger>
                <SelectContent>
                  {instrutores.map((instrutor) => (
                    <SelectItem key={instrutor.id} value={instrutor.id}>
                      {instrutor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDataProva">Data</Label>
                <Input
                  id="editDataProva"
                  type="date"
                  value={editProvaData.data}
                  onChange={(e) => setEditProvaData({ ...editProvaData, data: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editHoraProva">Hora</Label>
                <Input
                  id="editHoraProva"
                  type="time"
                  value={editProvaData.hora}
                  onChange={(e) => setEditProvaData({ ...editProvaData, hora: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  atualizarAluno(aluno.id, {
                    statusProva: {
                      ...aluno.statusProva,
                      nomeProva: editProvaData.nomeProva,
                      instrutor: editProvaData.instrutor,
                      data: editProvaData.data,
                      hora: editProvaData.hora
                    }
                  });
                  setDialogOpen(false);
                  setIsEditMode(false);
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Salvar Alterações
              </Button>

              <Button 
                onClick={() => {
                  setDialogOpen(false);
                  setResultadoProvaDialogOpen(true);
                }} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                📝 Informar Resultado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>





      {/* Dialog de Verificação de PIN para Aprovação em Lote */}
      <AlertDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Verificação de Segurança
            </AlertDialogTitle>
            <AlertDialogDescription>
              Digite o PIN de 6 dígitos do usuário MASTER para confirmar a aprovação em lote dos documentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="pinInput" className="text-sm font-medium">PIN de Segurança</Label>
            <Input
              id="pinInput"
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^0-9]/g, '');
                setPinInput(valor);
              }}
              placeholder="Digite 6 dígitos"
              className="mt-2 text-center text-2xl tracking-widest"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinInput.length === 6) {
                  handleConfirmarPIN();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Apenas usuários MASTER podem executar esta ação
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPinInput('');
              setPinDialogOpen(false);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarPIN}
              disabled={pinInput.length !== 6}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição de Aluno */}
      <Dialog open={editAlunoDialogOpen} onOpenChange={setEditAlunoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>Editar Aluno - {aluno.codigoSistema}</DialogTitle>
            <DialogDescription>
              Atualize as informações do aluno, incluindo produtos vinculados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
            <div>
              <Label htmlFor="editNome">Nome Completo</Label>
              <Input
                id="editNome"
                value={editAlunoData.nome}
                onChange={(e) => setEditAlunoData({ ...editAlunoData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editCpf">CPF</Label>
              <Input
                id="editCpf"
                value={editAlunoData.cpf}
                onChange={(e) => setEditAlunoData({ ...editAlunoData, cpf: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editTelefone">Telefone</Label>
              <Input
                id="editTelefone"
                value={editAlunoData.telefone}
                onChange={(e) => setEditAlunoData({ ...editAlunoData, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editAlunoData.email}
                onChange={(e) => setEditAlunoData({ ...editAlunoData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editDesconto">Desconto (R$)</Label>
              <Input
                id="editDesconto"
                type="number"
                value={editAlunoData.desconto}
                onChange={(e) => setEditAlunoData({ ...editAlunoData, desconto: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Seção de Produtos Obrigatórios e Extras */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                Produtos Vinculados ao Aluno
              </h3>

              {/* Produtos Obrigatórios (tipo 'produto') */}
              {produtosExtras.filter(p => p.tipo === 'produto').length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-red-600 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Produtos Obrigatórios
                  </Label>
                  <div className="space-y-2 border border-red-200 rounded-lg p-3 bg-red-50/50 max-h-40 overflow-y-auto">
                    {(() => {
                      // 🔧 FILTRAR PRODUTOS BASEADO NA PRECIFICAÇÃO DA EMPRESA
                      const empresaSelecionada = aluno.clientePJId ? clientesPJ.find(c => c.id === aluno.clientePJId) : null;
                      const precificacaoEmpresa = empresaSelecionada?.precificacoes?.find((prec: any) => prec.cursoId === curso?.id && prec.ativo);
                      const produtosDisponiveis = precificacaoEmpresa?.produtosInclusos ? produtosExtras.filter(p => p.tipo === 'produto' && precificacaoEmpresa.produtosInclusos.includes(p.id)) : produtosExtras.filter(p => p.tipo === 'produto');
                      return produtosDisponiveis.map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between p-2 bg-white rounded border hover:border-red-300 transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            id={`edit-produto-${produto.id}`}
                            checked={editAlunoData.produtosExtras.includes(produto.id)}
                            onCheckedChange={() => {
                              const produtos = editAlunoData.produtosExtras.includes(produto.id)
                                ? editAlunoData.produtosExtras.filter(id => id !== produto.id)
                                : [...editAlunoData.produtosExtras, produto.id];
                              setEditAlunoData({ ...editAlunoData, produtosExtras: produtos });
                            }}
                          />
                          <label htmlFor={`edit-produto-${produto.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">
                                {produto.codigo}
                              </Badge>
                              <span className="text-sm">{produto.nome}</span>
                            </div>
                          </label>
                        </div>
                        <span className="text-sm font-semibold text-red-600 ml-2">
                          + R$ {(produto.valor || 0).toFixed(2)}
                        </span>
                      </div>
                    ));
                    })()}
                  </div>
                </div>
              )}

              {/* Produtos Extras (tipo 'extra') */}
              {produtosExtras.filter(p => p.tipo === 'extra').length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-blue-600 flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    Produtos Extras (Opcionais)
                  </Label>
                  <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50 max-h-40 overflow-y-auto">
                    {(() => {
                      // 🔧 FILTRAR EXTRAS BASEADO NA PRECIFICAÇÃO DA EMPRESA  
                      const empresaSelecionada = aluno.clientePJId ? clientesPJ.find(c => c.id === aluno.clientePJId) : null;
                      const precificacaoEmpresa = empresaSelecionada?.precificacoes?.find((prec: any) => prec.cursoId === curso?.id && prec.ativo);
                      const extrasDisponiveis = precificacaoEmpresa?.produtosInclusos ? produtosExtras.filter(p => p.tipo === 'extra' && precificacaoEmpresa.produtosInclusos.includes(p.id)) : produtosExtras.filter(p => p.tipo === 'extra');
                      return extrasDisponiveis.map((produto) => (
                      <div key={produto.id} className="p-2 bg-white rounded border hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              id={`edit-extra-${produto.id}`}
                              checked={editAlunoData.produtosExtras.includes(produto.id)}
                              onCheckedChange={() => {
                                const produtos = editAlunoData.produtosExtras.includes(produto.id)
                                  ? editAlunoData.produtosExtras.filter(id => id !== produto.id)
                                  : [...editAlunoData.produtosExtras, produto.id];
                                setEditAlunoData({ ...editAlunoData, produtosExtras: produtos });
                                
                                // Se desmarcar produto, remover também do pagoPorPF
                                if (editAlunoData.produtosExtras.includes(produto.id)) {
                                  const newSet = new Set(produtosExtrasPagoPorPF);
                                  newSet.delete(produto.id);
                                  setProdutosExtrasPagoPorPF(newSet);
                                }
                              }}
                            />
                            <label htmlFor={`edit-extra-${produto.id}`} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                                  {produto.codigo}
                                </Badge>
                                <span className="text-sm">{produto.nome}</span>
                              </div>
                            </label>
                          </div>
                          <span className="text-sm font-semibold text-blue-600 ml-2">
                            + R$ {(produto.valor || 0).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* 🆕 Checkbox para PJ: Este produto será pago pela Pessoa Física? */}
                        {aluno.tipoPessoa === 'PJ' && editAlunoData.produtosExtras.includes(produto.id) && (
                          <div className="mt-2 ml-6 flex items-center gap-2 text-xs bg-orange-50 border border-orange-200 p-2 rounded">
                            <Checkbox
                              id={`pf-paga-${produto.id}`}
                              checked={produtosExtrasPagoPorPF.has(produto.id)}
                              onCheckedChange={() => {
                                const newSet = new Set(produtosExtrasPagoPorPF);
                                if (newSet.has(produto.id)) {
                                  newSet.delete(produto.id);
                                } else {
                                  newSet.add(produto.id);
                                }
                                setProdutosExtrasPagoPorPF(newSet);
                              }}
                            />
                            <label htmlFor={`pf-paga-${produto.id}`} className="cursor-pointer text-orange-800 font-medium">
                              💳 Este produto será pago pela <strong>Pessoa Física</strong>? (Gerará recibo separado)
                            </label>
                          </div>
                        )}
                      </div>
                    ));
                    })()}
                  </div>
                </div>
              )}

              {/* Resumo de Valores */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Base da Turma:</span>
                    <span className="font-medium">R$ {(turma?.preco || 0).toFixed(2)}</span>
                  </div>
                  {editAlunoData.produtosExtras.length > 0 && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>+ Produtos Selecionados ({editAlunoData.produtosExtras.length}):</span>
                        <span className="font-medium">
                          R$ {editAlunoData.produtosExtras.reduce((total, produtoId) => {
                            const produto = produtosExtras.find(p => p.id === produtoId);
                            return total + (produto?.valor || 0);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {editAlunoData.desconto > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>- Desconto:</span>
                      <span className="font-medium">R$ {(editAlunoData.desconto || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-green-300">
                    <span>Valor Total:</span>
                    <span>
                      R$ {(() => {
                        // 🔧 REGRA: Valor total = APENAS produtos - desconto (SEM valor da turma)
                        const valorProdutos = editAlunoData.produtosExtras.reduce((total, produtoId) => {
                          const produto = produtosExtras.find(p => p.id === produtoId);
                          return total + (produto?.valor || 0);
                        }, 0);
                        return (valorProdutos - (editAlunoData.desconto || 0)).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
            
          <div className="flex gap-2 px-6 py-3 border-t flex-shrink-0 bg-white">
            <Button
              onClick={() => {
                // 🔧 Separar produtos: PJ vs PF
                const produtosPJ: string[] = [];
                const produtosPF: { id: string; nome: string; valor: number }[] = [];
                
                editAlunoData.produtosExtras.forEach(produtoId => {
                  const produto = produtosExtras.find(p => p.id === produtoId);
                  if (!produto) return;
                  
                  // Se aluno é PJ E produto está marcado como "pago pela PF"
                  if (aluno.tipoPessoa === 'PJ' && produtosExtrasPagoPorPF.has(produtoId)) {
                    produtosPF.push({ id: produto.id, nome: produto.nome, valor: produto.valor });
                  } else {
                    produtosPJ.push(produtoId);
                  }
                });
                
                // 🔧 Calcular valor total (apenas produtos que NÃO são pagos pela PF)
                const valorProdutosPJ = produtosPJ.reduce((total, produtoId) => {
                  const produto = produtosExtras.find(p => p.id === produtoId);
                  return total + (produto?.valor || 0);
                }, 0);
                const novoValorTotal = valorProdutosPJ - (editAlunoData.desconto || 0);
                
                // 🆕 Criar lançamentos separados para produtos pagos pela PF
                const lancamentosPF = produtosPF.map(produto => ({
                  id: `lanc-pf-${Date.now()}-${produto.id}`,
                  produtoId: produto.id,
                  produtoNome: produto.nome,
                  valorTotal: produto.valor,
                  pagamentos: {
                    historico: [],
                    valorPago: 0,
                    pendente: false
                  }
                }));
                
                // Mesclar com lançamentos PF existentes (se houver)
                const lancamentosAntigos = aluno.lancamentosProdutosPF || [];
                const lancamentosNovos = [...lancamentosAntigos, ...lancamentosPF];
                
                console.log('🔍 [DEBUG] Salvando aluno...');
                console.log('🔍 [DEBUG] Produtos PJ:', produtosPJ);
                console.log('🔍 [DEBUG] Produtos PF:', produtosPF);
                console.log('🔍 [DEBUG] Lançamentos PF criados:', lancamentosPF);
                console.log('🔍 [DEBUG] Valor total (apenas PJ):', novoValorTotal);
                
                // Atualizar aluno
                atualizarAluno(aluno.id, {
                  ...editAlunoData,
                  produtosExtras: produtosPJ, // Apenas produtos PJ
                  valorTotal: novoValorTotal,
                  lancamentosProdutosPF: lancamentosNovos
                });
                
                setEditAlunoDialogOpen(false);
                setProdutosExtrasPagoPorPF(new Set()); // Limpar seleção
                
                if (produtosPF.length > 0) {
                  toast.success(`✅ Aluno atualizado! ${produtosPF.length} produto(s) criado(s) como lançamento PF separado.`);
                } else {
                  toast.success('✅ Dados do aluno atualizados!');
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
            
            <Button
              onClick={() => {
                setEditAlunoDialogOpen(false);
                setSubstituirDialogOpen(true);
              }}
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Substituir Aluno
            </Button>
            
            <Button
              onClick={() => {
                setEditAlunoDialogOpen(false);
                setTransferirDialogOpen(true);
              }}
              variant="outline"
              className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transferir de Turma
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Seleção de Substituto */}
      <DialogSelecionarSubstituto
        open={substituirDialogOpen}
        onOpenChange={setSubstituirDialogOpen}
        alunoAntigo={aluno}
        alunosFilaEspera={alunosFilaEspera}
        onConfirmar={(alunoNovoId, motivo) => {
          substituirAluno(aluno.id, alunoNovoId, motivo);
          toast.success('🔄 Substituição realizada com sucesso!');
        }}
      />
      
      {/* Dialog de Transferir Turma */}
      <DialogTransferirTurma
        open={transferirDialogOpen}
        onOpenChange={setTransferirDialogOpen}
        aluno={{
          id: aluno.id,
          nome: aluno.nome,
          turmaId: aluno.turmaId
        }}
      />

      {/* Dialog de Resultado da Prova */}
      <DialogResultadoProva
        open={resultadoProvaDialogOpen}
        onOpenChange={setResultadoProvaDialogOpen}
        aluno={{
          id: aluno.id,
          nome: aluno.nome,
          codigoSistema: aluno.codigoSistema
        }}
        prova={{
          numeroProva: aluno.statusProva.numeroProva,
          nomeProva: aluno.statusProva.nomeProva,
          data: aluno.statusProva.data
        }}
      />

      {/* Dialog de Fallback de Email */}
      <Dialog open={mostrarEmailFallback} onOpenChange={setMostrarEmailFallback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email - {aluno.nome}</DialogTitle>
            <DialogDescription>
              O cliente de email não foi aberto automaticamente. Você pode copiar o email abaixo e enviar manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
              <p className="font-semibold text-gray-900 mb-1">📞 Contato</p>
              <p className="text-gray-800">{aluno.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Assunto:</Label>
              <Input
                id="fallbackAssunto"
                value={emailFallbackData.assunto}
                readOnly
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Corpo do Email:</Label>
              <textarea
                id="fallbackCorpo"
                value={emailFallbackData.corpo}
                readOnly
                className="font-mono text-xs h-40 w-full"
              />
            </div>

            <Button
              onClick={async () => {
                try {
                  await copiarTexto(emailFallbackData.corpo);
                } catch (error) {
                  console.error('Erro ao copiar:', error);
                }
              }}
              className="w-full"
            >
              Copiar Corpo do Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento */}
      <DialogPagamento
        open={pagamentoDialogOpen}
        onOpenChange={setPagamentoDialogOpen}
        aluno={aluno}
        onRegistrarPagamento={handleRegistrarPagamento}
        onConfirmarPagamento={handleConfirmarPagamento}
        onEditarPagamento={handleEditarPagamento}
        usuarioAtual={usuarioAtual}
        clientesPJ={clientesPJ}
      />
    </div>
  );
};