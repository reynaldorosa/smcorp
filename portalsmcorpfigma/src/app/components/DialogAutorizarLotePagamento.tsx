import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Upload, FileText, Lock, AlertCircle, DollarSign, CheckCircle, Package } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

interface LancamentoLote {
  id: string;
  codigo: string;
  descricao: string;
  valor: number;
}

interface DialogAutorizarLotePagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamentos: LancamentoLote[];
  fornecedorNome: string;
  onAutorizar: (dados: {
    lancamentosIds: string[];
    tipoPagamento: 'total' | 'parcial';
    valorPagoPorLancamento?: { [key: string]: number };
    notaFiscal?: string;
  }) => void;
}

export function DialogAutorizarLotePagamento({
  open,
  onOpenChange,
  lancamentos,
  fornecedorNome,
  onAutorizar
}: DialogAutorizarLotePagamentoProps) {
  const [etapa, setEtapa] = useState<'dados' | 'pin'>('dados');
  const [tipoPagamento, setTipoPagamento] = useState<'total' | 'parcial'>('total');
  const [valoresParciais, setValoresParciais] = useState<{ [key: string]: string }>({});
  const [notaFiscalNumero, setNotaFiscalNumero] = useState('');
  const [notaFiscalArquivo, setNotaFiscalArquivo] = useState<File | null>(null);
  const [pin, setPin] = useState('');

  const PIN_MASTER = '1234'; // PIN do usuário master

  const valorTotal = lancamentos.reduce((acc, l) => acc + l.valor, 0);

  const calcularTotalParcial = () => {
    return lancamentos.reduce((acc, l) => {
      const valorParcial = parseFloat(valoresParciais[l.id] || '0');
      return acc + (isNaN(valorParcial) ? 0 : valorParcial);
    }, 0);
  };

  const handleSubmitDados = () => {
    // Validações
    if (tipoPagamento === 'parcial') {
      let temErro = false;
      
      for (const lanc of lancamentos) {
        const valor = parseFloat(valoresParciais[lanc.id] || '0');
        if (!valoresParciais[lanc.id] || isNaN(valor) || valor <= 0) {
          toast.error(`Informe um valor válido para ${lanc.codigo}`);
          temErro = true;
          break;
        }
        if (valor > lanc.valor) {
          toast.error(`Valor de ${lanc.codigo} não pode ser maior que ${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
          temErro = true;
          break;
        }
      }

      if (temErro) return;
    }

    // Ir para etapa de PIN
    setEtapa('pin');
  };

  const handleSubmitPin = () => {
    if (pin !== PIN_MASTER) {
      toast.error('PIN incorreto! Autorização negada.');
      setPin('');
      return;
    }

    // PIN correto - autorizar pagamento em lote
    const valorPagoPorLancamento: { [key: string]: number } = {};
    
    if (tipoPagamento === 'parcial') {
      lancamentos.forEach(lanc => {
        valorPagoPorLancamento[lanc.id] = parseFloat(valoresParciais[lanc.id]);
      });
    }

    onAutorizar({
      lancamentosIds: lancamentos.map(l => l.id),
      tipoPagamento,
      valorPagoPorLancamento: tipoPagamento === 'parcial' ? valorPagoPorLancamento : undefined,
      notaFiscal: notaFiscalNumero || undefined
    });

    toast.success(`✅ Lote de ${lancamentos.length} pagamentos autorizado com sucesso!`, {
      description: 'Aguardando confirmação do financeiro'
    });

    // Reset
    handleCancel();
  };

  const handleCancel = () => {
    setEtapa('dados');
    setTipoPagamento('total');
    setValoresParciais({});
    setNotaFiscalNumero('');
    setNotaFiscalArquivo(null);
    setPin('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {etapa === 'dados' ? (
              <>
                <Package className="w-5 h-5 text-orange-600" />
                Autorizar Lote de Pagamentos
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-yellow-600" />
                Autorização do Usuário Master
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {etapa === 'dados' 
              ? `${lancamentos.length} lançamentos do fornecedor: ${fornecedorNome}`
              : 'Digite o PIN do usuário master para autorizar o lote'
            }
          </DialogDescription>
        </DialogHeader>

        {etapa === 'dados' ? (
          <div className="space-y-6">
            {/* Informações do Lote */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fornecedor</p>
                  <p className="font-semibold">{fornecedorNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lançamentos</p>
                  <p className="font-semibold text-orange-600">{lancamentos.length} itens</p>
                </div>
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-bold text-red-600">
                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Lançamentos */}
            <div className="space-y-2">
              <Label>Lançamentos Selecionados</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50">
                {lancamentos.map((lanc) => (
                  <div key={lanc.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <div className="flex-1">
                      <p className="font-semibold">{lanc.codigo}</p>
                      <p className="text-xs text-gray-600">{lanc.descricao}</p>
                    </div>
                    <p className="font-bold text-red-600">
                      {lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo de Pagamento */}
            <div className="space-y-3">
              <Label>Tipo de Pagamento</Label>
              <RadioGroup value={tipoPagamento} onValueChange={(value: 'total' | 'parcial') => setTipoPagamento(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="total" id="total" />
                  <Label htmlFor="total" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Total</p>
                      <p className="text-xs text-gray-500">
                        {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - Todos os lançamentos
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="parcial" id="parcial" />
                  <Label htmlFor="parcial" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Parcial</p>
                      <p className="text-xs text-gray-500">Informe o valor pago para cada lançamento</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Valores Parciais */}
            {tipoPagamento === 'parcial' && (
              <div className="space-y-2">
                <Label>Valores Parciais por Lançamento</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-2 p-3 border rounded-lg bg-gray-50">
                  {lancamentos.map((lanc) => (
                    <div key={lanc.id} className="space-y-1">
                      <Label htmlFor={`valor-${lanc.id}`} className="text-xs font-semibold">
                        {lanc.codigo} - Máx: {lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Label>
                      <Input
                        id={`valor-${lanc.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={valoresParciais[lanc.id] || ''}
                        onChange={(e) => setValoresParciais({ ...valoresParciais, [lanc.id]: e.target.value })}
                        className="font-semibold"
                      />
                    </div>
                  ))}
                </div>
                {Object.keys(valoresParciais).length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-blue-800">Total a Pagar (Parcial):</span>
                      <span className="text-lg font-bold text-blue-600">
                        {calcularTotalParcial().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Nota Fiscal */}
            <div className="space-y-3">
              <Label>Nota Fiscal (Opcional)</Label>
              
              <div className="space-y-2">
                <Label htmlFor="notaFiscalNumero" className="text-sm">Número da Nota Fiscal</Label>
                <Input
                  id="notaFiscalNumero"
                  placeholder="Ex: 12345"
                  value={notaFiscalNumero}
                  onChange={(e) => setNotaFiscalNumero(e.target.value)}
                />
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 hover:border-orange-300 transition-colors">
                <input
                  type="file"
                  id="notaFiscalUpload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNotaFiscalArquivo(e.target.files[0]);
                      toast.success('Arquivo anexado com sucesso');
                    }
                  }}
                />
                <label
                  htmlFor="notaFiscalUpload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {notaFiscalArquivo ? (
                    <>
                      <FileText className="w-12 h-12 text-green-600 mb-2" />
                      <p className="text-sm font-semibold text-green-600">{notaFiscalArquivo.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(notaFiscalArquivo.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold">Clique para fazer upload</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG até 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Aviso */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Após a autorização, <strong>todos os {lancamentos.length} lançamentos</strong> terão o status 
                  alterado para <strong>"Aguardando Autorização"</strong> e será necessário o PIN do usuário master.
                </span>
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSubmitDados}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Continuar para Autorização
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo da Autorização */}
            <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fornecedor:</span>
                <span className="font-semibold">{fornecedorNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lançamentos:</span>
                <span className="font-semibold">{lancamentos.length} itens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-semibold">{tipoPagamento === 'total' ? 'Pagamento Total' : 'Pagamento Parcial'}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-500">Valor Total:</span>
                <span className="font-bold text-orange-600 text-lg">
                  {(tipoPagamento === 'total' ? valorTotal : calcularTotalParcial()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {notaFiscalNumero && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nota Fiscal:</span>
                  <span className="font-semibold">{notaFiscalNumero}</span>
                </div>
              )}
            </div>

            {/* Input de PIN */}
            <div className="space-y-3">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                PIN do Usuário Master
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-2xl tracking-widest font-bold"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Digite o PIN de 4 dígitos para autorizar o lote
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEtapa('dados')}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                onClick={handleSubmitPin}
                disabled={pin.length !== 4}
              >
                <Lock className="w-4 h-4 mr-2" />
                Autorizar Lote com PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
