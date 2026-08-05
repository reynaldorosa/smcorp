'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Edit2,
  CreditCard,
  Banknote,
  Receipt,
  Download,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type PaymentMethod =
  | 'Cash'
  | 'PIX'
  | 'CreditCard'
  | 'DebitCard'
  | 'BankTransfer'
  | 'Check'
  | 'Invoice';

export type PaymentStatus = 'Pending' | 'Confirmed' | 'Cancelled';

interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  observations?: string;
  invoiceCode?: string;
  invoiceDueDate?: string;
}

interface Student {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  payments: PaymentRecord[];
}

interface CurrentUser {
  id: string;
  name: string;
  role: 'Master' | 'Admin' | 'Seller';
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  currentUser: CurrentUser;
  allowedPaymentMethods?: PaymentMethod[];
  onRegisterPayment: (data: {
    amount: number;
    method: PaymentMethod;
    observations: string;
    invoiceCode?: string;
    invoiceDueDate?: string;
  }) => void;
  onConfirmPayment: (paymentId: string) => void;
  onEditPayment: (
    paymentId: string,
    data: {
      amount: number;
      method: PaymentMethod;
      observations: string;
      invoiceCode?: string;
      invoiceDueDate?: string;
    }
  ) => void;
}

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CreditCard', label: 'Cartão de Crédito' },
  { value: 'DebitCard', label: 'Cartão de Débito' },
  { value: 'BankTransfer', label: 'Transferência Bancária' },
  { value: 'Check', label: 'Cheque' },
  { value: 'Invoice', label: 'Boleto' },
];

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMethodIcon(method: PaymentMethod) {
  switch (method) {
    case 'Cash':
      return <Banknote className="w-4 h-4" />;
    case 'CreditCard':
    case 'DebitCard':
      return <CreditCard className="w-4 h-4" />;
    case 'Invoice':
      return <Receipt className="w-4 h-4" />;
    default:
      return <DollarSign className="w-4 h-4" />;
  }
}

// ============================================
// COMPONENT
// ============================================

export function PaymentDialog({
  open,
  onOpenChange,
  student,
  currentUser,
  allowedPaymentMethods,
  onRegisterPayment,
  onConfirmPayment,
  onEditPayment,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [observations, setObservations] = useState('');
  const [invoiceCode, setInvoiceCode] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  // Edit mode
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod | ''>('');
  const [editObservations, setEditObservations] = useState('');
  const [editInvoiceCode, setEditInvoiceCode] = useState('');
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState('');

  // Master confirmation for invoice data
  const [confirmingInvoicePaymentId, setConfirmingInvoicePaymentId] = useState<string | null>(null);
  const [confirmInvoiceCode, setConfirmInvoiceCode] = useState('');
  const [confirmInvoiceDueDate, setConfirmInvoiceDueDate] = useState('');

  useEffect(() => {
    if (!open) {
      // Reset form when closing
      setAmount('');
      setMethod('');
      setObservations('');
      setInvoiceCode('');
      setInvoiceDueDate('');
      setEditingPaymentId(null);
      setEditInvoiceCode('');
      setEditInvoiceDueDate('');
      setConfirmingInvoicePaymentId(null);
      setConfirmInvoiceCode('');
      setConfirmInvoiceDueDate('');
    }
  }, [open]);

  const remainingAmount = student.totalAmount - student.paidAmount;
  const paymentStatus =
    student.paidAmount === 0
      ? 'unpaid'
      : student.paidAmount < student.totalAmount
      ? 'partial'
      : 'paid';

  const availableMethods = allowedPaymentMethods
    ? PAYMENT_METHODS.filter((m) => allowedPaymentMethods.includes(m.value))
    : PAYMENT_METHODS;

  const handleRegister = () => {
    if (!amount || !method || parseFloat(amount) <= 0) {
      toast.error('Preencha o valor e o método de pagamento.');
      return;
    }

    onRegisterPayment({
      amount: parseFloat(amount),
      method: method as PaymentMethod,
      observations,
      invoiceCode: method === 'Invoice' ? invoiceCode : undefined,
      invoiceDueDate: method === 'Invoice' ? invoiceDueDate : undefined,
    });

    // Clear form
    setAmount('');
    setMethod('');
    setObservations('');
    setInvoiceCode('');
    setInvoiceDueDate('');

    toast.success('Pagamento registrado com sucesso!');
  };

  const handleConfirm = (paymentId: string) => {
    if (currentUser.role !== 'Master') {
      toast.error('Apenas usuários Master podem confirmar pagamentos.');
      return;
    }

    const payment = student.payments.find((item) => item.id === paymentId);
    if (!payment) {
      toast.error('Pagamento não encontrado.');
      return;
    }

    if (payment.method === 'Invoice' && (!payment.invoiceCode || !payment.invoiceDueDate)) {
      setConfirmingInvoicePaymentId(paymentId);
      setConfirmInvoiceCode(payment.invoiceCode || '');
      setConfirmInvoiceDueDate(payment.invoiceDueDate || '');
      return;
    }

    onConfirmPayment(paymentId);
    toast.success('Pagamento confirmado!');
  };

  const handleConfirmWithInvoiceData = () => {
    if (!confirmingInvoicePaymentId) return;

    if (!confirmInvoiceCode || !confirmInvoiceDueDate) {
      toast.error('Para confirmar boleto, informe código de barras e vencimento.');
      return;
    }

    const payment = student.payments.find((item) => item.id === confirmingInvoicePaymentId);
    if (!payment) {
      toast.error('Pagamento não encontrado.');
      return;
    }

    onEditPayment(confirmingInvoicePaymentId, {
      amount: payment.amount,
      method: payment.method,
      observations: payment.observations || '',
      invoiceCode: confirmInvoiceCode,
      invoiceDueDate: confirmInvoiceDueDate,
    });

    onConfirmPayment(confirmingInvoicePaymentId);

    setConfirmingInvoicePaymentId(null);
    setConfirmInvoiceCode('');
    setConfirmInvoiceDueDate('');

    toast.success('Pagamento confirmado com dados do boleto!');
  };

  const startEditing = (payment: PaymentRecord) => {
    if (currentUser.role !== 'Master') {
      toast.error('Apenas usuários Master podem editar pagamentos.');
      return;
    }
    setEditingPaymentId(payment.id);
    setEditAmount(payment.amount.toString());
    setEditMethod(payment.method);
    setEditObservations(payment.observations || '');
    setEditInvoiceCode(payment.invoiceCode || '');
    setEditInvoiceDueDate(payment.invoiceDueDate || '');
  };

  const handleEdit = () => {
    if (!editingPaymentId || !editAmount || !editMethod) return;

    if (editMethod === 'Invoice' && (!editInvoiceCode || !editInvoiceDueDate)) {
      toast.error('Para boleto, informe código de barras e data de vencimento.');
      return;
    }

    onEditPayment(editingPaymentId, {
      amount: parseFloat(editAmount),
      method: editMethod as PaymentMethod,
      observations: editObservations,
      invoiceCode: editMethod === 'Invoice' ? editInvoiceCode : undefined,
      invoiceDueDate: editMethod === 'Invoice' ? editInvoiceDueDate : undefined,
    });

    setEditingPaymentId(null);
    setEditInvoiceCode('');
    setEditInvoiceDueDate('');
    toast.success('Pagamento atualizado!');
  };

  const downloadPaymentReceipt = (payment: PaymentRecord) => {
    if (payment.status !== 'Confirmed') {
      toast.error('Somente pagamentos confirmados geram recibo.');
      return;
    }

    const receiptContent = [
      '══════════════════════════════════════════════',
      '            RECIBO DE PAGAMENTO',
      '══════════════════════════════════════════════',
      '',
      `Aluno: ${student.name}`,
      `Código: ${student.code}`,
      `Valor: ${formatCurrency(payment.amount)}`,
      `Forma de pagamento: ${PAYMENT_METHODS.find((m) => m.value === payment.method)?.label || payment.method}`,
      `Data: ${formatDate(payment.date)}`,
      payment.invoiceCode ? `Código boleto: ${payment.invoiceCode}` : '',
      payment.invoiceDueDate ? `Vencimento boleto: ${formatDate(payment.invoiceDueDate)}` : '',
      payment.confirmedBy ? `Confirmado por: ${payment.confirmedBy}` : '',
      '',
      `Emitido em: ${new Date().toLocaleString('pt-BR')}`,
      '══════════════════════════════════════════════',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-${student.code}-${payment.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Gerenciamento de Pagamentos
          </DialogTitle>
          <DialogDescription>
            Gerencie os pagamentos de {student.name} ({student.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 font-medium">Total</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(student.totalAmount)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 font-medium">Pago</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(student.paidAmount)}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`${
                remainingAmount > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <CardContent className="p-3">
                <div
                  className={`text-xs font-medium ${
                    remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  Restante
                </div>
                <div
                  className={`text-lg font-bold ${
                    remainingAmount > 0 ? 'text-orange-700' : 'text-green-700'
                  }`}
                >
                  {formatCurrency(remainingAmount)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Payment Form */}
          {remainingAmount > 0 && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium">Registrar Novo Pagamento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="method">Método *</Label>
                    <Select
                      value={method}
                      onValueChange={(v) => setMethod(v as PaymentMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMethods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Invoice fields */}
                {method === 'Invoice' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceCode">Código do Boleto</Label>
                      <Input
                        id="invoiceCode"
                        value={invoiceCode}
                        onChange={(e) => setInvoiceCode(e.target.value)}
                        placeholder="Código de barras..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="invoiceDueDate">Vencimento</Label>
                      <Input
                        id="invoiceDueDate"
                        type="date"
                        value={invoiceDueDate}
                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>

                <Button onClick={handleRegister} className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <div className="flex-1 overflow-hidden">
            <h4 className="font-medium mb-2">Histórico de Pagamentos</h4>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-2 space-y-2">
                {(!student.payments || student.payments.length === 0) ? (
                  <div className="text-center py-6 text-gray-500">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  (student.payments || []).map((payment) => (
                    <Card key={payment.id} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getMethodIcon(payment.method)}
                            <div>
                              <p className="font-medium">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {PAYMENT_METHODS.find((m) => m.value === payment.method)?.label}
                                {' • '}
                                {formatDate(payment.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(payment.status)}
                            {payment.status === 'Pending' &&
                              currentUser.role === 'Master' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(payment)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirm(payment.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Confirmar
                                  </Button>
                                </>
                              )}
                          </div>
                        </div>
                        {payment.confirmedBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            <User className="w-3 h-3 inline mr-1" />
                            Confirmado por {payment.confirmedBy}
                          </p>
                        )}

                        {payment.method === 'Invoice' && (
                          <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded p-2 space-y-1">
                            <p>
                              <strong>Código do boleto:</strong> {payment.invoiceCode || 'Não informado'}
                            </p>
                            <p>
                              <strong>Vencimento:</strong> {payment.invoiceDueDate ? formatDate(payment.invoiceDueDate) : 'Não informado'}
                            </p>
                          </div>
                        )}

                        {editingPaymentId === payment.id && (
                          <div className="mt-3 border rounded p-3 space-y-3 bg-slate-50">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Valor</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Método</Label>
                                <Select
                                  value={editMethod}
                                  onValueChange={(v) => setEditMethod(v as PaymentMethod)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableMethods.map((m) => (
                                      <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {editMethod === 'Invoice' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Código do Boleto</Label>
                                  <Input
                                    value={editInvoiceCode}
                                    onChange={(e) => setEditInvoiceCode(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Vencimento</Label>
                                  <Input
                                    type="date"
                                    value={editInvoiceDueDate}
                                    onChange={(e) => setEditInvoiceDueDate(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            <div>
                              <Label className="text-xs">Observações</Label>
                              <Textarea
                                rows={2}
                                value={editObservations}
                                onChange={(e) => setEditObservations(e.target.value)}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleEdit} className="flex-1">
                                Salvar edição
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPaymentId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {confirmingInvoicePaymentId === payment.id && (
                          <div className="mt-3 border-2 border-orange-300 rounded p-3 space-y-3 bg-orange-50">
                            <p className="text-xs font-semibold text-orange-800">
                              Para confirmar boleto, informe os dados obrigatórios.
                            </p>
                            <div>
                              <Label className="text-xs">Código de Barras</Label>
                              <Input
                                value={confirmInvoiceCode}
                                onChange={(e) => setConfirmInvoiceCode(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Data de Vencimento</Label>
                              <Input
                                type="date"
                                value={confirmInvoiceDueDate}
                                onChange={(e) => setConfirmInvoiceDueDate(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleConfirmWithInvoiceData}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Confirmar boleto
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmingInvoicePaymentId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {payment.status === 'Confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => downloadPaymentReceipt(payment)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar recibo
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
