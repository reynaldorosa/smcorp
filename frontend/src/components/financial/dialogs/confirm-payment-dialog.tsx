'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

// ============================================
// Types
// ============================================

interface CostEntryInfo {
  id: string;
  code: string;
  description: string;
  value: number;
  amountPaid?: number;
}

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costEntry: CostEntryInfo;
  onConfirm: (data: {
    costEntryId: string;
    paymentDate: string;
    paymentMethod: string;
  }) => void;
}

// ============================================
// Constants
// ============================================

const PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Boleto Bancário',
  'Transferência Bancária',
  'Cheque',
];

// ============================================
// Component
// ============================================

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  costEntry,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pin, setPin] = useState('');

  const handleConfirm = async () => {
    if (!paymentDate) {
      toast.error('Informe a data do pagamento');
      return;
    }

    if (!paymentMethod) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    if (pin.length !== 6) {
      toast.error('Digite o PIN de 6 digitos para confirmar.');
      return;
    }

    try {
      await authService.authorizeMasterPin(pin);
    } catch {
      toast.error('PIN incorreto! Confirmacao negada.');
      setPin('');
      return;
    }

    onConfirm({
      costEntryId: costEntry.id,
      paymentDate,
      paymentMethod,
    });

    toast.success('✅ Pagamento confirmado!', {
      description: `${paymentMethod} - ${new Date(paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')}`,
    });

    // Reset
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setPin('');
    onOpenChange(false);
  };

  const totalValue = costEntry.amountPaid ?? costEntry.value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Lançamento {costEntry.code} - Finalize o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cost Entry Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Código:</span>
                <span className="font-semibold">{costEntry.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Descrição:</span>
                <span className="font-semibold text-right flex-1 ml-4">{costEntry.description}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-500">Valor a Pagar:</span>
                <span className="font-bold text-green-600 text-lg">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data do Pagamento *
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Forma de Pagamento *
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              PIN Master *
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {/* Notice */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Após a confirmação, o status do lançamento será alterado para <strong>&quot;Pago&quot;</strong>.
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={!paymentDate || !paymentMethod || pin.length !== 6}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
