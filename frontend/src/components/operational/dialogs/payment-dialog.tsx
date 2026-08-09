'use client';

import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Calendar, Clock, Edit2, X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Legacy PT types — component uses Portuguese property names
// TODO: migrate to Student from @/types when component is refactored
interface ProdutoExtraLocal { id: string; nome: string; valor: number; }
interface PagamentoHistoricoLocal {
  id: string;
  valor: number;
  formaPagamento: string;
  data: string;
  hora?: string;
  observacoes?: string;
  confirmedoPor?: string;
  registradoPor?: string;
  vinculadoA?: string;
  codigoBarrasBoleto?: string;
  dataVencimentoBoleto?: string;
  dataConfirmacao?: string;
  horaConfirmacao?: string;
}
interface ReciboLocal {
  id: string;
  conteudo: string;
  dataGeracao: string;
  numeroRecibo?: string;
  produtoNome?: string;
}
interface Aluno {
  id: string;
  nome: string;
  codigoSistema: string;
  taxId: string;
  valorTotal: number;
  desconto: number;
  tipoPessoa?: 'PF' | 'PJ';
  clientePJId?: string;
  nomeProduto?: string;
  dataInicio?: string;
  produtosExtras?: ProdutoExtraLocal[];
  pagamentos?: {
    valorPago: number;
    status: string;
    historico: PagamentoHistoricoLocal[];
  };
  recibos?: ReciboLocal[];
}

type PagamentoHistoricoItem = NonNullable<Aluno['pagamentos']>['historico'][number];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: Aluno;
  onRegistrarPagamento: (dados: {
    valor: number;
    formaPagamento: string;
    observacoes: string;
    codigoBarrasBoleto?: string;
    dataVencimentoBoleto?: string;
  }) => void;
  onConfirmarPagamento: (pagamentoId: string) => void;
  onEditarPagamento: (pagamentoId: string, dados: {
    valor: number;
    formaPagamento: string;
    observacoes: string;
    codigoBarrasBoleto?: string;
    dataVencimentoBoleto?: string;
  }) => void;
  usuarioAtual: { id: string; nome: string; nivel: 'Master' | 'Admin' | 'Vendedor' };
  clientesPJ?: Array<{ id: string; name: string; companyTaxId: string; formasPagamentoPermitidas?: string[] }>;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  aluno,
  onRegistrarPagamento,
  onConfirmarPagamento,
  onEditarPagamento,
  usuarioAtual,
  clientesPJ
}) => {
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [codigoBarrasBoleto, setCodigoBarrasBoleto] = useState('');
  const [dataVencimentoBoleto, setDataVencimentoBoleto] = useState('');
  
  // Estado para controlar qual pagamento está sendo editado
  const [editandoPagamentoId, setEditandoPagamentoId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editFormaPagamento, setEditFormaPagamento] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editCodigoBarrasBoleto, setEditCodigoBarrasBoleto] = useState('');
  const [editDataVencimentoBoleto, setEditDataVencimentoBoleto] = useState('');
  
  // Estado para controlar confirmação de boleto (Master)
  const [confirmandoBoletoId, setConfirmandoBoletoId] = useState<string | null>(null);
  const [confirmarCodigoBarras, setConfirmarCodigoBarras] = useState('');
  const [confirmarDataVencimento, setConfirmarDataVencimento] = useState('');

  const valorPago = aluno.pagamentos?.valorPago || 0;
  const valorRestante = aluno.valorTotal - valorPago;
  const statusPagamento = valorPago === 0 ? 'nao-pago' : valorPago < aluno.valorTotal ? 'parcial' : 'pago';
  
  // Verificar se tem pagamento pendente de confirmação
  const pagamentoPendente = aluno.pagamentos?.historico.find(p => !p.confirmedoPor);

  const handleRegistrar = () => {
    if (!valor || !formaPagamento || parseFloat(valor) <= 0) {
      alert('Por favor, preencha o valor e forma de pagamento');
      return;
    }

    onRegistrarPagamento({
      valor: parseFloat(valor),
      formaPagamento,
      observacoes,
      codigoBarrasBoleto: formaPagamento === 'Boleto' ? codigoBarrasBoleto : undefined,
      dataVencimentoBoleto: formaPagamento === 'Boleto' ? dataVencimentoBoleto : undefined
    });

    // Limpar formulário
    setValor('');
    setFormaPagamento('');
    setObservacoes('');
    setCodigoBarrasBoleto('');
    setDataVencimentoBoleto('');
  };

  const handleConfirmar = (pagamentoId: string) => {
    if (usuarioAtual.nivel !== 'Master') {
      alert('Apenas usuários Master podem confirmar pagamentos');
      return;
    }
    
    // Buscar o pagamento
    const pagamento = aluno.pagamentos?.historico.find(p => p.id === pagamentoId);
    
    // Se for Boleto E não tiver código de barras/data de vencimento, abrir formulário
    if (pagamento?.formaPagamento === 'Boleto' && (!pagamento.codigoBarrasBoleto || !pagamento.dataVencimentoBoleto)) {
      setConfirmandoBoletoId(pagamentoId);
      setConfirmarCodigoBarras(pagamento.codigoBarrasBoleto || '');
      setConfirmarDataVencimento(pagamento.dataVencimentoBoleto || '');
      return;
    }
    
    // Se não for boleto OU já tiver os dados, confirmar direto
    onConfirmarPagamento(pagamentoId);
  };
  
  const handleConfirmarComDadosBoleto = (pagamentoId: string) => {
    if (!confirmarCodigoBarras || !confirmarDataVencimento) {
      alert('Para confirmar o recebimento do Boleto, é obrigatório informar o código de barras e a data de vencimento');
      return;
    }
    
    // Primeiro atualizar os dados do boleto
    const pagamento = aluno.pagamentos?.historico.find(p => p.id === pagamentoId);
    if (!pagamento) return;
    onEditarPagamento(pagamentoId, {
      valor: pagamento.valor,
      formaPagamento: 'Boleto',
      observacoes: pagamento.observacoes || '',
      codigoBarrasBoleto: confirmarCodigoBarras,
      dataVencimentoBoleto: confirmarDataVencimento
    });
    
    // Depois confirmar o pagamento
    onConfirmarPagamento(pagamentoId);
    
    // Limpar formulário
    setConfirmandoBoletoId(null);
    setConfirmarCodigoBarras('');
    setConfirmarDataVencimento('');
  };

  const handleEditar = (pagamentoId: string) => {
    if (usuarioAtual.nivel !== 'Master') {
      alert('Apenas usuários Master podem editar pagamentos');
      return;
    }
    
    if (!editValor || !editFormaPagamento || parseFloat(editValor) <= 0) {
      alert('Por favor, preencha o valor e forma de pagamento');
      return;
    }

    // Validação específica para Boleto
    if (editFormaPagamento === 'Boleto' && (!editCodigoBarrasBoleto || !editDataVencimentoBoleto)) {
      alert('Para pagamento em Boleto, é obrigatório informar o código de barras e a data de vencimento');
      return;
    }

    onEditarPagamento(pagamentoId, {
      valor: parseFloat(editValor),
      formaPagamento: editFormaPagamento,
      observacoes: editObservacoes,
      codigoBarrasBoleto: editFormaPagamento === 'Boleto' ? editCodigoBarrasBoleto : undefined,
      dataVencimentoBoleto: editFormaPagamento === 'Boleto' ? editDataVencimentoBoleto : undefined
    });

    // Limpar formulário de edição
    setEditandoPagamentoId(null);
    setEditValor('');
    setEditFormaPagamento('');
    setEditObservacoes('');
    setEditCodigoBarrasBoleto('');
    setEditDataVencimentoBoleto('');
  };

  const formatarMoeda = (valor: number) => {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Buscar nome da empresa se o aluno for PJ
  const getNomeEmpresa = () => {
    if (aluno.tipoPessoa === 'PJ' && aluno.clientePJId && clientesPJ) {
      const empresa = clientesPJ.find(c => c.id === aluno.clientePJId);
      return empresa ? empresa.name : 'Empresa';
    }
    return null;
  };
  
  // 💳 Obter formas de pagamento permitidas para a empresa
  const getFormasPagamentoPermitidas = (): string[] => {
    // Lista padrão de todas as formas
    const todasAsFormas = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque', 'Boleto'];
    
    // Se o aluno for PJ e tiver empresa vinculada
    if (aluno.tipoPessoa === 'PJ' && aluno.clientePJId && clientesPJ) {
      const empresa = clientesPJ.find(c => c.id === aluno.clientePJId);
      
      // Se a empresa tem formas específicas configuradas e não está vazia, usar apenas essas
      if (empresa && empresa.formasPagamentoPermitidas && empresa.formasPagamentoPermitidas.length > 0) {
        return empresa.formasPagamentoPermitidas;
      }
    }
    
    // Se não for PJ, ou não tiver formas específicas, retornar todas
    return todasAsFormas;
  };
  
  // Função para gerar o recibo de pagamento
  const gerarReciboPagamento = (pagamento: PagamentoHistoricoItem) => {
    const nomeEmpresa = getNomeEmpresa();
    const vinculadoA = nomeEmpresa || `CPF ${aluno.taxId}`;
    
    // Construir lista de produtos
    const produtoPrincipal = aluno.nomeProduto || 'Curso';
    const produtosExtras = aluno.produtosExtras && aluno.produtosExtras.length > 0 
      ? aluno.produtosExtras.map((p) => p.nome).join(', ')
      : '';
    
    const listaProdutos = produtosExtras 
      ? `${produtoPrincipal} e ${produtosExtras}`
      : produtoPrincipal;
    
    // Data de início do treinamento
    const dataInicio = aluno.dataInicio || 'A definir';
    
    // Gerar conteúdo do recibo
    const conteudoRecibo = `
═══════════════════════════════════════════════════════════════════
                         RECIBO DE PAGAMENTO
═══════════════════════════════════════════════════════════════════

A Caiso declara que o(a) aluno(a):

  ${aluno.nome.toUpperCase()}
  CPF: ${aluno.taxId}
  ${nomeEmpresa ? `Empresa: ${nomeEmpresa}` : ''}

Pagou a quantia de ${formatarMoeda(pagamento.valor)} (${formatarValorPorExtenso(pagamento.valor)})

Referente ao(s) curso(s): ${listaProdutos}

Matriculado para início em: ${dataInicio}

-------------------------------------------------------------------
DETALHES DO PAGAMENTO:

  Forma de Pagamento: ${pagamento.formaPagamento}
  Data do Pagamento: ${pagamento.data} às ${pagamento.hora}
  Registrado por: ${pagamento.registradoPor}
  Confirmado por: ${pagamento.confirmedoPor || 'Pendente'}
  ${pagamento.dataConfirmacao ? `Data da Confirmação: ${pagamento.dataConfirmacao} às ${pagamento.horaConfirmacao}` : ''}
  ${pagamento.observacoes ? `Observações: ${pagamento.observacoes}` : ''}

${pagamento.formaPagamento === 'Boleto' && pagamento.codigoBarrasBoleto ? `
-------------------------------------------------------------------
DADOS DO BOLETO:
  Código de Barras: ${pagamento.codigoBarrasBoleto}
  Data de Vencimento: ${pagamento.dataVencimentoBoleto ? new Date(pagamento.dataVencimentoBoleto + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
  Vinculado a: ${vinculadoA}
` : ''}

═══════════════════════════════════════════════════════════════════
                 Caiso - Centro de Treinamento Profissionalizante
                   Recibo gerado em ${new Date().toLocaleDateString('pt-BR')}
═══════════════════════════════════════════════════════════════════
    `.trim();
    
    // Criar arquivo para download
    const blob = new Blob([conteudoRecibo], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recibo_${aluno.nome.replace(/\s+/g, '_')}_${pagamento.data.replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  
  // Função auxiliar para converter valor para extenso (simplificado)
  const formatarValorPorExtenso = (valor: number): string => {
    const valorInteiro = Math.floor(valor);
    const centavos = Math.round((valor - valorInteiro) * 100);
    
    // Simplificado - retorna apenas formato numérico
    return `${valorInteiro} reais ${centavos > 0 ? `e ${centavos} centavos` : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Gestão de Pagamento
          </DialogTitle>
          <DialogDescription>
            {aluno.nome} - {aluno.codigoSistema}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Valor Total do Curso:</span>
              <span className="text-lg font-bold">{formatarMoeda(aluno.valorTotal)}</span>
            </div>
            {aluno.desconto > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-semibold">Desconto:</span>
                <span className="text-sm font-bold">- {formatarMoeda(aluno.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Valor Pago:</span>
              <span className={`text-lg font-bold ${
                statusPagamento === 'pago' ? 'text-blue-600' : 
                statusPagamento === 'parcial' ? 'text-orange-600' : 
                'text-red-600'
              }`}>
                {formatarMoeda(valorPago)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-semibold">Valor Restante:</span>
              <span className={`text-xl font-bold ${
                valorRestante === 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatarMoeda(valorRestante)}
              </span>
            </div>
            <div className="flex justify-center pt-2">
              <Badge variant={
                statusPagamento === 'pago' ? 'default' : 
                statusPagamento === 'parcial' ? 'secondary' : 
                'destructive'
              } className={
                statusPagamento === 'pago' ? 'bg-blue-600' : 
                statusPagamento === 'parcial' ? 'bg-orange-500' : 
                'bg-red-600'
              }>
                {statusPagamento === 'pago' ? 'PAGO INTEGRALMENTE' : 
                 statusPagamento === 'parcial' ? 'PAGAMENTO PARCIAL' : 
                 'NÃO PAGO'}
              </Badge>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          {aluno.pagamentos && aluno.pagamentos.historico.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Histórico de Pagamentos
              </h3>
              <div className="space-y-3">
                {aluno.pagamentos.historico.map((pagamento) => (
                  <div 
                    key={pagamento.id} 
                    className={`p-3 rounded border ${
                      pagamento.confirmedoPor 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-300'
                    }`}
                  >
                    {/* Se estiver editando este pagamento */}
                    {editandoPagamentoId === pagamento.id ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-sm">Editar Pagamento</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditandoPagamentoId(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Valor *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editValor}
                              onChange={(e) => setEditValor(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs">Forma de Pagamento *</Label>
                            <Select value={editFormaPagamento} onValueChange={setEditFormaPagamento}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getFormasPagamentoPermitidas().map(forma => (
                                  <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Campos específicos para Boleto na edição */}
                        {editFormaPagamento === 'Boleto' && (
                          <div className="grid grid-cols-2 gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <div className="col-span-2">
                              <Label className="text-xs font-semibold text-yellow-800">
                                📄 Código de Barras *
                              </Label>
                              <Input
                                type="text"
                                value={editCodigoBarrasBoleto}
                                onChange={(e) => setEditCodigoBarrasBoleto(e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="Código de barras do boleto"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <Label className="text-xs font-semibold text-yellow-800">
                                📅 Data de Vencimento *
                              </Label>
                              <Input
                                type="date"
                                value={editDataVencimentoBoleto}
                                onChange={(e) => setEditDataVencimentoBoleto(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs">Observações</Label>
                          <Textarea
                            value={editObservacoes}
                            onChange={(e) => setEditObservacoes(e.target.value)}
                            className="h-16 text-sm"
                            placeholder="Informações adicionais..."
                          />
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleEditar(pagamento.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={!editValor || !editFormaPagamento || parseFloat(editValor) <= 0}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{formatarMoeda(pagamento.valor)}</div>
                            <div className="text-xs text-gray-600">
                              {pagamento.formaPagamento} • {pagamento.data} às {pagamento.hora}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Botão Editar - Apenas para Master */}
                            {usuarioAtual.nivel === 'Master' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditandoPagamentoId(pagamento.id);
                                  setEditValor(pagamento.valor.toString());
                                  setEditFormaPagamento(pagamento.formaPagamento);
                                  setEditObservacoes(pagamento.observacoes || '');
                                  setEditCodigoBarrasBoleto(pagamento.codigoBarrasBoleto || '');
                                  setEditDataVencimentoBoleto(pagamento.dataVencimentoBoleto || '');
                                }}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                title="Editar pagamento (Master)"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </Button>
                            )}
                            
                            {pagamento.confirmedoPor ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Aguardando Confirmação
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Informações do Boleto */}
                        {pagamento.formaPagamento === 'Boleto' && pagamento.codigoBarrasBoleto && (
                          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-2 text-xs">
                            <div className="font-semibold text-yellow-800 mb-1">📄 Dados do Boleto:</div>
                            <div className="font-mono text-gray-700 mb-1">
                              <strong>Código:</strong> {pagamento.codigoBarrasBoleto}
                            </div>
                            <div className="text-gray-700 mb-1">
                              <strong>Vencimento:</strong> {pagamento.dataVencimentoBoleto ? new Date(pagamento.dataVencimentoBoleto + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                            </div>
                            <div className="text-gray-700">
                              <strong>Vinculado a:</strong> {pagamento.vinculadoA || (aluno.tipoPessoa === 'PJ' && aluno.clientePJId ? getNomeEmpresa() || 'CNPJ da empresa' : `CPF ${aluno.taxId}`)}
                            </div>
                          </div>
                        )}
                        
                        {pagamento.observacoes && (
                          <div className="text-sm text-gray-600 mb-2">
                            Obs: {pagamento.observacoes}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Registrado por: {pagamento.registradoPor}
                        </div>
                        {pagamento.confirmedoPor && (
                          <div className="text-xs text-green-700 mb-2">
                            Confirmado por: {pagamento.confirmedoPor} em {pagamento.dataConfirmacao} às {pagamento.horaConfirmacao}
                          </div>
                        )}
                        
                        {/* Formulário de confirmação de Boleto para Master */}
                        {!pagamento.confirmedoPor && usuarioAtual.nivel === 'Master' && confirmandoBoletoId === pagamento.id && (
                          <div className="mt-3 bg-orange-50 border-2 border-orange-300 p-3 rounded-lg space-y-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-sm text-orange-800">⚠️ Dados Obrigatórios do Boleto</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmandoBoletoId(null)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="text-xs text-orange-700 mb-2">
                              Para confirmar o recebimento do Boleto, você deve informar o código de barras e data de vencimento:
                            </div>
                            
                            <div>
                              <Label className="text-xs font-semibold text-orange-800">📄 Código de Barras *</Label>
                              <Input
                                type="text"
                                value={confirmarCodigoBarras}
                                onChange={(e) => setConfirmarCodigoBarras(e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="Digite o código de barras do boleto"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs font-semibold text-orange-800">📅 Data de Vencimento *</Label>
                              <Input
                                type="date"
                                value={confirmarDataVencimento}
                                onChange={(e) => setConfirmarDataVencimento(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            
                            <div className="text-xs text-gray-600 bg-yellow-100 p-2 rounded">
                              <strong>Vinculado a:</strong> {aluno.tipoPessoa === 'PJ' && aluno.clientePJId ? 'CNPJ da empresa' : `CPF ${aluno.taxId}`}
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleConfirmarComDadosBoleto(pagamento.id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={!confirmarCodigoBarras || !confirmarDataVencimento}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirmar Recebimento com Dados do Boleto
                            </Button>
                          </div>
                        )}
                        
                        {/* Botão de Confirmar - Apenas para Master e pagamentos pendentes */}
                        {!pagamento.confirmedoPor && usuarioAtual.nivel === 'Master' && confirmandoBoletoId !== pagamento.id && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmar(pagamento.id)}
                            className="mt-2 w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Recebimento (Master)
                          </Button>
                        )}
                        
                        {!pagamento.confirmedoPor && usuarioAtual.nivel !== 'Master' && (
                          <div className="mt-2 text-xs text-center text-yellow-700 bg-yellow-100 p-2 rounded">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Aguardando confirmação do usuário Master
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🧾 Seção de Recibos - Disponível apenas quando 100% pago */}
          {valorPago >= aluno.valorTotal && aluno.recibos && aluno.recibos.length > 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                📥 Comprovantes de Pagamento Disponíveis
              </h3>
              <div className="space-y-2">
                {aluno.recibos.map((recibo) => (
                  <Button
                    key={recibo.numeroRecibo}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Buscar o último pagamento confirmado para gerar o recibo
                      const ultimoPagamento = aluno.pagamentos?.historico
                        .filter(p => p.confirmedoPor)
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                      
                      if (ultimoPagamento) {
                        gerarReciboPagamento(ultimoPagamento);
                      }
                    }}
                    className="w-full border-green-600 text-green-700 hover:bg-green-100 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    📥 Baixar Recibo {recibo.numeroRecibo} - {recibo.produtoNome}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-green-700 mt-3 bg-green-100 p-2 rounded">
                ℹ️ Recibos gerados em {aluno.recibos[0]?.dataGeracao || 'data não disponível'}
              </div>
            </div>
          )}

          {/* Formulário de Novo Pagamento */}
          {valorRestante > 0 && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Registrar Novo Pagamento
              </h3>
              
              {/* 💳 Aviso de formas permitidas */}
              {aluno.tipoPessoa === 'PJ' && aluno.clientePJId && clientesPJ && (() => {
                const empresa = clientesPJ.find(c => c.id === aluno.clientePJId);
                return empresa && empresa.formasPagamentoPermitidas && empresa.formasPagamentoPermitidas.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">
                      <strong>🏢 {getNomeEmpresa()}:</strong> Esta empresa possui restrições de pagamento. 
                      Formas permitidas: <strong>{empresa.formasPagamentoPermitidas.join(', ')}</strong>
                    </p>
                  </div>
                );
              })()}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor">Valor Recebido *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    max={valorRestante}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Máximo: {formatarMoeda(valorRestante)}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger id="formaPagamento">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFormasPagamentoPermitidas().map(forma => (
                        <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos específicos para Boleto */}
              {formaPagamento === 'Boleto' && (
                <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="col-span-2">
                    <Label htmlFor="codigoBarrasBoleto" className="text-sm font-semibold text-yellow-800">
                      📄 Código de Barras do Boleto (opcional)
                    </Label>
                    <Input
                      id="codigoBarrasBoleto"
                      type="text"
                      value={codigoBarrasBoleto}
                      onChange={(e) => setCodigoBarrasBoleto(e.target.value)}
                      placeholder="Digite ou cole o código de barras do boleto"
                      className="font-mono"
                    />
                    <div className="text-xs text-yellow-700 mt-1">
                      Pode ser preenchido depois pelo Master ao confirmar o recebimento
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dataVencimentoBoleto" className="text-sm font-semibold text-yellow-800">
                      📅 Data de Vencimento (opcional)
                    </Label>
                    <Input
                      id="dataVencimentoBoleto"
                      type="date"
                      value={dataVencimentoBoleto}
                      onChange={(e) => setDataVencimentoBoleto(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
                      <strong>Vinculado a:</strong> {aluno.tipoPessoa === 'PJ' && aluno.clientePJId 
                        ? getNomeEmpresa() || 'CNPJ da empresa' 
                        : `CPF ${aluno.taxId}`}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre o pagamento..."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleRegistrar}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!valor || !formaPagamento || parseFloat(valor) <= 0}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Pagamento
              </Button>

              <div className="bg-blue-50 p-3 rounded text-sm">
                <div className="font-semibold text-blue-800 mb-1">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Informação Importante
                </div>
                <p className="text-blue-700">
                  Após registrar o pagamento, ele ficará com status <strong>&quot;Aguardando Confirmação&quot;</strong> até que um usuário <strong>Master</strong> confirme o recebimento do dinheiro.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
