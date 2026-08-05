import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Upload, FileText, CheckCircle, Lock, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface DialogAutorizarPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: {
    id: string;
    codigo: string;
    descricao: string;
    valor: number;
    status: string;
  };
  onAutorizar: (dados: {
    lancamentoId: string;
    tipoPagamento: 'total' | 'parcial';
    valorPago?: number;
    notaFiscal?: string;
  }) => void;
}

export function DialogAutorizarPagamento({
  open,
  onOpenChange,
  lancamento,
  onAutorizar
}: DialogAutorizarPagamentoProps) {
  const [etapa, setEtapa] = useState<'dados' | 'pin'>('dados');
  const [tipoPagamento, setTipoPagamento] = useState<'total' | 'parcial'>('total');
  const [valorPago, setValorPago] = useState<string>('');
  const [notaFiscalNumero, setNotaFiscalNumero] = useState('');
  const [notaFiscalArquivo, setNotaFiscalArquivo] = useState<File | null>(null);
  const [pin, setPin] = useState('');

  const PIN_MASTER = '1234'; // PIN do usuário master

  const handleSubmitDados = () => {
    // Validações
    if (tipoPagamento === 'parcial') {
      const valor = parseFloat(valorPago);
      if (!valorPago || isNaN(valor) || valor <= 0) {
        toast.error('Informe um valor válido para o pagamento parcial');
        return;
      }
      if (valor > lancamento.valor) {
        toast.error('Valor pago não pode ser maior que o valor do lançamento');
        return;
      }
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

    // PIN correto - autorizar pagamento
    onAutorizar({
      lancamentoId: lancamento.id,
      tipoPagamento,
      valorPago: tipoPagamento === 'parcial' ? parseFloat(valorPago) : lancamento.valor,
      notaFiscal: notaFiscalNumero || undefined
    });

    toast.success('✅ Pagamento autorizado com sucesso!', {
      description: 'Aguardando confirmação do financeiro'
    });

    // Reset
    setEtapa('dados');
    setTipoPagamento('total');
    setValorPago('');
    setNotaFiscalNumero('');
    setNotaFiscalArquivo(null);
    setPin('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEtapa('dados');
    setTipoPagamento('total');
    setValorPago('');
    setNotaFiscalNumero('');
    setNotaFiscalArquivo(null);
    setPin('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {etapa === 'dados' ? (
              <>
                <DollarSign className="w-5 h-5 text-green-600" />
                Autorizar Pagamento
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
              ? `Lançamento ${lancamento.codigo} - ${lancamento.descricao}`
              : 'Digite o PIN do usuário master para autorizar o pagamento'
            }
          </DialogDescription>
        </DialogHeader>

        {etapa === 'dados' ? (
          <div className="space-y-6">
            {/* Informações do Lançamento */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Código</p>
                  <p className="font-semibold">{lancamento.codigo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-bold text-red-600">
                    {lancamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
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
                        {lancamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="parcial" id="parcial" />
                  <Label htmlFor="parcial" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Parcial</p>
                      <p className="text-xs text-gray-500">Informe o valor pago</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Valor Parcial */}
            {tipoPagamento === 'parcial' && (
              <div className="space-y-2">
                <Label htmlFor="valorPago">Valor Pago *</Label>
                <Input
                  id="valorPago"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  className="font-semibold"
                />
                {valorPago && (
                  <p className="text-xs text-gray-600">
                    Restante: {(lancamento.valor - parseFloat(valorPago || '0')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
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

              <div className="border-2 border-dashed rounded-lg p-6 hover:border-red-300 transition-colors">
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
                  Após a autorização, o status será alterado para <strong>"Aguardando Autorização"</strong> e 
                  será necessário o PIN do usuário master para confirmar.
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
                className="flex-1 bg-green-600 hover:bg-green-700"
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
                <span className="text-gray-500">Lançamento:</span>
                <span className="font-semibold">{lancamento.codigo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-semibold">{tipoPagamento === 'total' ? 'Pagamento Total' : 'Pagamento Parcial'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor:</span>
                <span className="font-bold text-green-600">
                  {(tipoPagamento === 'total' ? lancamento.valor : parseFloat(valorPago)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                Digite o PIN de 4 dígitos para autorizar
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
                Autorizar com PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
