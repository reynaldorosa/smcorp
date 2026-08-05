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
  Lock,
  AlertCircle,
  CheckCircle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

interface BatchEntry {
  id: string;
  codigo: string;
  descricao: string;
  valor: number;
}

interface BatchPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamentos: BatchEntry[];
  fornecedorNome: string;
  onAutorizar: (dados: {
    lancamentosIds: string[];
    tipoPagamento: 'total' | 'parcial';
    valorPagoPorLancamento?: { [key: string]: number };
    notaFiscal?: string;
    notaFiscalArquivo?: File;
  }) => void;
}

export function BatchPaymentDialog({
  open,
  onOpenChange,
  lancamentos,
  fornecedorNome,
  onAutorizar,
}: BatchPaymentDialogProps) {
  const [step, setStep] = useState<'data' | 'pin'>('data');
  const [paymentType, setPaymentType] = useState<'total' | 'parcial'>('total');
  const [partialValues, setPartialValues] = useState<{ [key: string]: string }>({});
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [pin, setPin] = useState('');

  const totalValue = lancamentos.reduce((acc, l) => acc + l.valor, 0);

  const calculatePartialTotal = () => {
    return lancamentos.reduce((acc, l) => {
      const partialValue = parseFloat(partialValues[l.id] || '0');
      return acc + (isNaN(partialValue) ? 0 : partialValue);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSubmitData = () => {
    // Validações
    if (paymentType === 'parcial') {
      let hasError = false;

      for (const entry of lancamentos) {
        const value = parseFloat(partialValues[entry.id] || '0');
        if (!partialValues[entry.id] || isNaN(value) || value <= 0) {
          toast.error(`Informe um valor válido para ${entry.codigo}`);
          hasError = true;
          break;
        }
        if (value > entry.valor) {
          toast.error(
            `Valor de ${entry.codigo} não pode ser maior que ${formatCurrency(entry.valor)}`
          );
          hasError = true;
          break;
        }
      }

      if (hasError) return;
    }

    // Ir para etapa de PIN
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

    // PIN correto - autorizar pagamento em lote
    const valorPagoPorLancamento: { [key: string]: number } = {};

    if (paymentType === 'parcial') {
      lancamentos.forEach((entry) => {
        valorPagoPorLancamento[entry.id] = parseFloat(partialValues[entry.id]);
      });
    }

    onAutorizar({
      lancamentosIds: lancamentos.map((l) => l.id),
      tipoPagamento: paymentType,
      valorPagoPorLancamento:
        paymentType === 'parcial' ? valorPagoPorLancamento : undefined,
      notaFiscal: invoiceNumber || undefined,
      notaFiscalArquivo: invoiceFile || undefined,
    });

    toast.success(
      `✅ Lote de ${lancamentos.length} pagamentos autorizado com sucesso!`,
      {
        description: 'Aguardando confirmação do financeiro',
      }
    );

    // Reset
    resetForm();
  };

  const resetForm = () => {
    setStep('data');
    setPaymentType('total');
    setPartialValues({});
    setInvoiceNumber('');
    setInvoiceFile(null);
    setPin('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'data' ? (
              <>
                <Package className="h-5 w-5 text-orange-600" />
                Autorizar Lote de Pagamentos
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
              ? `${lancamentos.length} lançamentos do fornecedor: ${fornecedorNome}`
              : 'Digite o PIN do usuário master para autorizar o lote'}
          </DialogDescription>
        </DialogHeader>

        {step === 'data' ? (
          <div className="space-y-6">
            {/* Informações do Lote */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fornecedor</p>
                  <p className="font-semibold">{fornecedorNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lançamentos</p>
                  <p className="font-semibold text-orange-600">
                    {lancamentos.length} itens
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Lançamentos */}
            <div className="space-y-2">
              <Label>Lançamentos Selecionados</Label>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-2 dark:bg-gray-800">
                {lancamentos.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded border bg-white p-2 text-sm dark:bg-gray-900"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{entry.codigo}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {entry.descricao}
                      </p>
                    </div>
                    <p className="font-bold text-red-600">
                      {formatCurrency(entry.valor)}
                    </p>
                  </div>
                ))}
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
                  <RadioGroupItem value="total" id="total-batch" />
                  <Label htmlFor="total-batch" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Total</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(totalValue)} - Todos os lançamentos
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <RadioGroupItem value="parcial" id="parcial-batch" />
                  <Label htmlFor="parcial-batch" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Pagamento Parcial</p>
                      <p className="text-xs text-gray-500">
                        Informe o valor pago para cada lançamento
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Valores Parciais */}
            {paymentType === 'parcial' && (
              <div className="space-y-2">
                <Label>Valores Parciais por Lançamento</Label>
                <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3 dark:bg-gray-800">
                  {lancamentos.map((entry) => (
                    <div key={entry.id} className="space-y-1">
                      <Label
                        htmlFor={`valor-${entry.id}`}
                        className="text-xs font-semibold"
                      >
                        {entry.codigo} - Máx: {formatCurrency(entry.valor)}
                      </Label>
                      <Input
                        id={`valor-${entry.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={partialValues[entry.id] || ''}
                        onChange={(e) =>
                          setPartialValues({
                            ...partialValues,
                            [entry.id]: e.target.value,
                          })
                        }
                        className="font-semibold"
                      />
                    </div>
                  ))}
                </div>
                {Object.keys(partialValues).length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Total a Pagar (Parcial):
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(calculatePartialTotal())}
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
                <Label htmlFor="invoiceNumberBatch" className="text-sm">
                  Número da Nota Fiscal
                </Label>
                <Input
                  id="invoiceNumberBatch"
                  placeholder="Ex: 12345"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="rounded-lg border-2 border-dashed p-6 transition-colors hover:border-orange-300">
                <input
                  type="file"
                  id="invoiceUploadBatch"
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
                  htmlFor="invoiceUploadBatch"
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
                  Após a autorização,{' '}
                  <strong>todos os {lancamentos.length} lançamentos</strong>{' '}
                  terão o status alterado para{' '}
                  <strong>&quot;Aguardando Autorização&quot;</strong> e será
                  necessário o PIN do usuário master.
                </span>
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
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
                <span className="text-gray-500">Fornecedor:</span>
                <span className="font-semibold">{fornecedorNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lançamentos:</span>
                <span className="font-semibold">{lancamentos.length} itens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-semibold">
                  {paymentType === 'total'
                    ? 'Pagamento Total'
                    : 'Pagamento Parcial'}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="text-gray-500">Valor Total:</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(
                    paymentType === 'total' ? totalValue : calculatePartialTotal()
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
              <Label htmlFor="pin-batch" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                PIN do Usuário Master
              </Label>
              <Input
                id="pin-batch"
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
                Digite o PIN de 6 dígitos para autorizar o lote
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
                Autorizar Lote com PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
