'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Upload,
  FileText,
  CheckCircle,
  Lock,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

interface AuthorizePaymentDialogProps {
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
    notaFiscalArquivo?: File;
  }) => void;
}

export function AuthorizePaymentDialog({
  open,
  onOpenChange,
  lancamento,
  onAutorizar,
}: AuthorizePaymentDialogProps) {
  const [step, setStep] = useState<'data' | 'pin'>('data');
  const [paymentType, setPaymentType] = useState<'total' | 'parcial'>('total');
  const [paidValue, setPaidValue] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [pin, setPin] = useState('');

  const handleSubmitData = () => {
    if (paymentType === 'parcial') {
      const value = parseFloat(paidValue);
      if (!paidValue || isNaN(value) || value <= 0) {
        toast.error('Informe um valor válido para o pagamento parcial');
        return;
      }
      if (value > lancamento.valor) {
        toast.error('Valor pago não pode ser maior que o valor do lançamento');
        return;
      }
    }

    setStep('pin');
  };

  const handleSubmitPin = async () => {

    if (pin.length !== 6) {
      toast.error('O PIN deve ter 6 digitos.');
      return;
    }

    try {
      await authService.authorizeMasterPin(pin);
    } catch {
      toast.error('PIN incorreto! Autorização negada.');
      setPin('');
      return;
    }

    // PIN correto - autorizar pagamento
    onAutorizar({
      lancamentoId: lancamento.id,
      tipoPagamento: paymentType,
      valorPago:
        paymentType === 'parcial' ? parseFloat(paidValue) : lancamento.valor,
      notaFiscal: invoiceNumber || undefined,
      notaFiscalArquivo: invoiceFile || undefined,
    });

    toast.success('✅ Pagamento autorizado com sucesso!', {
      description: 'Aguardando confirmação do financeiro',
    });

    // Reset
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setStep('data');
    setPaymentType('total');
    setPaidValue('');
    setInvoiceNumber('');
    setInvoiceFile(null);
    setPin('');
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'data' ? (
              <>
                <DollarSign className="h-5 w-5 text-green-600" />
                Autorizar Pagamento
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-yellow-600" />
                Autorização do Usuário Master
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'data'
              ? `Lançamento ${lancamento.codigo} - ${lancamento.descricao}`
              : 'Digite o PIN do usuário master para autorizar o pagamento'}
          </DialogDescription>
        </DialogHeader>

        {step === 'data' ? (
          <div className="space-y-6">
            {/* Informações do Lançamento */}
            <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Código</p>
                  <p className="font-semibold">{lancamento.codigo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(lancamento.valor)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tipo de Pagamento */}
            <div className="space-y-3">
              <Label>Tipo de Pagamento</Label>
              <RadioGroup
                value={paymentType}
                onValueChange={(value: 'total' | 'parcial') =>
                  setPaymentType(value)
                }
              >
                <div className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <RadioGroupItem value="total" id="total" />
                  <Label htmlFor="total" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Total</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(lancamento.valor)}
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <RadioGroupItem value="parcial" id="parcial" />
                  <Label htmlFor="parcial" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Parcial</p>
                      <p className="text-xs text-gray-500">
                        Informe o valor pago
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Valor Parcial */}
            {paymentType === 'parcial' && (
              <div className="space-y-2">
                <Label htmlFor="paidValue">Valor Pago *</Label>
                <Input
                  id="paidValue"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paidValue}
                  onChange={(e) => setPaidValue(e.target.value)}
                  className="font-semibold"
                />
                {paidValue && (
                  <p className="text-xs text-gray-600">
                    Restante:{' '}
                    {formatCurrency(
                      lancamento.valor - parseFloat(paidValue || '0')
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Upload Nota Fiscal */}
            <div className="space-y-3">
              <Label>Nota Fiscal (Opcional)</Label>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-sm">
                  Número da Nota Fiscal
                </Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Ex: 12345"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="rounded-lg border-2 border-dashed p-6 transition-colors hover:border-red-300">
                <input
                  type="file"
                  id="invoiceUpload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setInvoiceFile(e.target.files[0]);
                      toast.success('Arquivo anexado com sucesso');
                    }
                  }}
                />
                <label
                  htmlFor="invoiceUpload"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  {invoiceFile ? (
                    <>
                      <FileText className="mb-2 h-12 w-12 text-green-600" />
                      <p className="text-sm font-semibold text-green-600">
                        {invoiceFile.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(invoiceFile.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-12 w-12 text-gray-400" />
                      <p className="text-sm font-semibold">
                        Clique para fazer upload
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, JPG ou PNG até 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Aviso */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Após a autorização, o status será alterado para{' '}
                  <strong>&quot;Aguardando Autorização&quot;</strong> e será
                  necessário o PIN do usuário master para confirmar.
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
                onClick={handleSubmitData}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Continuar para Autorização
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo da Autorização */}
            <div className="space-y-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lançamento:</span>
                <span className="font-semibold">{lancamento.codigo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-semibold">
                  {paymentType === 'total'
                    ? 'Pagamento Total'
                    : 'Pagamento Parcial'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(
                    paymentType === 'total'
                      ? lancamento.valor
                      : parseFloat(paidValue)
                  )}
                </span>
              </div>
              {invoiceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nota Fiscal:</span>
                  <span className="font-semibold">{invoiceNumber}</span>
                </div>
              )}
            </div>

            {/* Input de PIN */}
            <div className="space-y-3">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                PIN do Usuário Master
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••••"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-bold tracking-widest"
                autoFocus
              />
              <p className="text-center text-xs text-gray-500">
                Digite o PIN de 6 dígitos para autorizar
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('data')}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                onClick={handleSubmitPin}
                disabled={pin.length !== 6}
              >
                <Lock className="mr-2 h-4 w-4" />
                Autorizar com PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
