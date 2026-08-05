import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CheckCircle, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface DialogConfirmarPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: {
    id: string;
    codigo: string;
    descricao: string;
    valor: number;
    valorPago?: number;
  };
  onConfirmar: (dados: {
    lancamentoId: string;
    dataPagamento: string;
    formaPagamento: string;
  }) => void;
}

export function DialogConfirmarPagamento({
  open,
  onOpenChange,
  lancamento,
  onConfirmar
}: DialogConfirmarPagamentoProps) {
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formaPagamento, setFormaPagamento] = useState('');

  const formasPagamento = [
    'PIX',
    'Dinheiro',
    'Cartão de Débito',
    'Cartão de Crédito',
    'Boleto Bancário',
    'Transferência Bancária',
    'Cheque'
  ];

  const handleConfirmar = () => {
    if (!dataPagamento) {
      toast.error('Informe a data do pagamento');
      return;
    }

    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    onConfirmar({
      lancamentoId: lancamento.id,
      dataPagamento,
      formaPagamento
    });

    toast.success('✅ Pagamento confirmado!', {
      description: `${formaPagamento} - ${new Date(dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR')}`
    });

    // Reset
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setFormaPagamento('');
    onOpenChange(false);
  };

  const valorTotal = lancamento.valorPago || lancamento.valor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Lançamento {lancamento.codigo} - Finalize o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Lançamento */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Código:</span>
                <span className="font-semibold">{lancamento.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Descrição:</span>
                <span className="font-semibold text-right flex-1 ml-4">{lancamento.descricao}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-500">Valor a Pagar:</span>
                <span className="font-bold text-green-600 text-lg">
                  {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          {/* Data do Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="dataPagamento" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data do Pagamento *
            </Label>
            <Input
              id="dataPagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="formaPagamento" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Forma de Pagamento *
            </Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger id="formaPagamento">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aviso */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Após a confirmação, o status do lançamento será alterado para <strong>"Pago"</strong>.
              </span>
            </p>
          </div>

          {/* Botões */}
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
              onClick={handleConfirmar}
              disabled={!dataPagamento || !formaPagamento}
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
