'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { paymentOperations } from '@/services/operations.service';
import { CreatePaymentSchema } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentName: string;
}

type CreatePaymentFormData = z.infer<typeof CreatePaymentSchema>;

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as ErrorWithResponse).response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export function PaymentModal({ open, onClose, enrollmentId, studentName }: PaymentModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [recordingDate, setRecordingDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(CreatePaymentSchema),
    defaultValues: {
      enrollmentId,
      amount: 0,
      installments: 1,
      dueDate: new Date(),
      method: 'CREDIT_CARD',
    },
  });

  const handleCreatePayment = async (data: CreatePaymentFormData) => {
    try {
      setIsCreating(true);
      await paymentOperations.create(data);
      
      toast({
        title: 'Pagamento criado!',
        description: `Parcelamento de ${data.installments}x criado com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      form.reset();
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao criar pagamento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedPaymentId || !recordingDate) return;

    try {
      setIsRecording(true);
      await paymentOperations.record({
        paymentId: selectedPaymentId,
        method: 'CREDIT_CARD', // TODO: permitir usuário selecionar
        paidAt: recordingDate,
      });

      toast({
        title: 'Pagamento registrado!',
        description: 'O pagamento foi marcado como pago.',
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedPaymentId(null);
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gerenciar Pagamento - {studentName}
          </DialogTitle>
          <DialogDescription>
            Crie parcelamentos ou registre recebimentos de pagamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar Novo Pagamento */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Criar Novo Parcelamento
            </h3>

            <form onSubmit={form.handleSubmit(handleCreatePayment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor Total (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register('amount', { valueAsNumber: true })}
                    placeholder="1500.00"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    max="12"
                    {...form.register('installments', { valueAsNumber: true })}
                  />
                  {form.formState.errors.installments && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.installments.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">Método de Pagamento</Label>
                  <Select
                    value={form.watch('method')}
                    onValueChange={(value) => form.setValue('method', value as CreatePaymentFormData['method'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem>
                      <SelectItem value="TRANSFER">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Vencimento 1ª Parcela</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('dueDate') ? format(form.watch('dueDate'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('dueDate')}
                        onSelect={(date) => date && form.setValue('dueDate', date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Observações (opcional)</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Ex: Desconto de 10% aplicado..."
                  rows={2}
                />
              </div>

              {/* Resumo */}
              {form.watch('amount') > 0 && form.watch('installments') > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <p className="text-sm font-medium">
                    Resumo: {form.watch('installments')}x de R${' '}
                    {(Number(form.watch('amount')) / (Number(form.watch('installments')) || 1)).toFixed(2)}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Parcelamento'}
              </Button>
            </form>
          </div>

          {/* Registrar Pagamento Recebido */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Registrar Pagamento Recebido
            </h3>

            <div className="space-y-4">
              <div>
                <Label>ID da Parcela</Label>
                <Input
                  placeholder="Cole o ID da parcela aqui..."
                  value={selectedPaymentId || ''}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                />
              </div>

              <div>
                <Label>Data do Recebimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recordingDate ? format(recordingDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={recordingDate}
                      onSelect={setRecordingDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleRecordPayment}
                className="w-full"
                variant="secondary"
                disabled={!selectedPaymentId || !recordingDate || isRecording}
              >
                {isRecording ? 'Registrando...' : 'Confirmar Recebimento'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
