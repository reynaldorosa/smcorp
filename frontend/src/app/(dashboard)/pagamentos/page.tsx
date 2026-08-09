'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  DollarSign,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  User,
  Building2,
  CreditCard,
  Receipt,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStudentsStore, type Student, type Receipt as StudentReceipt } from '@/stores/students.store';
import { useClassesStore, type Class } from '@/stores/classes.store';
import { useCompaniesStore, type Company } from '@/stores/companies.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { generateReceiptHTML, generateReceiptNumber, valueInWords } from '@/lib/generate-receipt';
import { paymentsService, type Payment, type PaymentMethod, type PaymentStatus as ApiPaymentStatus } from '@/services/payments.service';
import { studentsService } from '@/services/students.service';
import { PixCheckoutDialog } from '@/components/financial/pix-checkout-dialog';
import { authService } from '@/services/auth.service';

// ============================================
// TYPES
// ============================================

type PaymentStatus = 'paid' | 'pending' | 'partial' | 'overdue';

interface PaymentFormData {
  amount: number;
  method: 'Cash' | 'Credit' | 'Debit' | 'Pix' | 'BankSlip' | 'Transfer' | 'CompanyInvoice';
  date: string;
  notes: string;
  bankSlipCode?: string;
  bankSlipDueDate?: string;
}

interface FilterState {
  search: string;
  status: 'all' | PaymentStatus;
  classId: string | null;
  companyId: string | null;
  customerType: 'all' | 'B2B' | 'B2C';
}

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusBadge(status: PaymentStatus) {
  const variants: Record<PaymentStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    paid: { variant: 'default', label: 'Pago', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    pending: { variant: 'secondary', label: 'Pendente', icon: <Clock className="w-3 h-3 mr-1" /> },
    partial: { variant: 'outline', label: 'Parcial', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    overdue: { variant: 'destructive', label: 'Vencido', icon: <XCircle className="w-3 h-3 mr-1" /> },
  };
  return variants[status];
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const classIdFromQuery = searchParams.get('classId');

  // Stores
  const { students, setStudents } = useStudentsStore();
  const { classes } = useClassesStore();
  const { companies } = useCompaniesStore();
  const { courses } = useCoursesStore();
  const { institutionalData } = useSettingsStore();

  const queryClient = useQueryClient();

  // Garantir alunos na store (a página depende deles para cruzar pagamentos;
  // sem isso, a lista fica vazia ao entrar direto em /pagamentos)
  useEffect(() => {
    if (students.length > 0) return;
    const loadStudents = async () => {
      try {
        const data = await studentsService.getAll();
        if (data.length === 0) return;
        // A API retorna enrollments[] aninhadas; a página cruza por
        // enrollmentId/classId do aluno — deriva da matrícula ativa.
        const enriched = data.map((s) => {
          const active = (s.enrollments || []).find(
            (e) => e.status !== 'CANCELLED' && e.status !== 'ABSENT',
          );
          return {
            ...s,
            enrollmentId: s.enrollmentId || active?.id,
            classId: s.classId || active?.classId,
          };
        });
        setStudents(enriched);
      } catch (error) {
        console.error('Falha ao carregar alunos em Pagamentos:', error);
        toast.error('Não foi possível carregar os alunos. Recarregue a página.');
      }
    };
    void loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students.length, setStudents]);

  const { data: allPayments = [], isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ['payments', 'all'],
    queryFn: async () => {
      // Buscar todas as páginas para permitir agregação por matrícula.
      const first = await paymentsService.getAll({ page: 1, limit: 200 });
      const pages = first.meta?.totalPages ?? 1;
      const results: Payment[] = [...(first.data || [])];

      if (pages <= 1) return results;

      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, idx) => idx + 2).map((page) =>
          paymentsService.getAll({ page, limit: 200 })
        )
      );

      rest.forEach((r) => {
        if (Array.isArray(r.data)) results.push(...r.data);
      });

      return results;
    },
    staleTime: 10_000,
  });

  const paymentsByEnrollmentId = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const payment of allPayments) {
      if (!payment?.enrollmentId) continue;
      const list = map.get(payment.enrollmentId) || [];
      list.push(payment);
      map.set(payment.enrollmentId, list);
    }
    // Ordenar por data de vencimento ascendente (igual ao backend /enrollment)
    map.forEach((list, key) => {
      list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      map.set(key, list);
    });
    return map;
  }, [allPayments]);

  const getEnrollmentPayments = (student: Student) => {
    if (!student.enrollmentId) return [];
    return paymentsByEnrollmentId.get(student.enrollmentId) || [];
  };

  const getAggregates = (student: Student) => {
    const payments = getEnrollmentPayments(student);
    const expected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const received = payments
      .filter((p) => p.status === 'PAID' || !!p.paidAt)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const hasOverdue = payments.some((p) => p.status === 'OVERDUE');
    return { expected, received, remaining: expected - received, hasOverdue, payments };
  };

  const getPaymentStatusApi = (student: Student): PaymentStatus => {
    const { expected, received, hasOverdue } = getAggregates(student);
    if (hasOverdue) return 'overdue';
    if (expected <= 0) return 'pending';
    if (received >= expected) return 'paid';
    if (received > 0 && received < expected) return 'partial';
    return 'pending';
  };

  const mapUiMethodToApi = (method: PaymentFormData['method']): PaymentMethod => {
    switch (method) {
      case 'Pix':
        return 'PIX';
      case 'Cash':
        return 'CASH';
      case 'Credit':
        return 'CREDIT_CARD';
      case 'Debit':
        return 'DEBIT_CARD';
      case 'BankSlip':
        return 'BOLETO';
      case 'Transfer':
        return 'TRANSFER';
      case 'CompanyInvoice':
        return 'INVOICE';
      default:
        return 'PIX';
    }
  };

  const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentFormData['method']; label: string; allowedLabel: string }> = [
    { value: 'Pix', label: 'Pix', allowedLabel: 'PIX' },
    { value: 'Cash', label: 'Dinheiro', allowedLabel: 'Dinheiro' },
    { value: 'Credit', label: 'Cartão de Crédito', allowedLabel: 'Cartão de Crédito' },
    { value: 'Debit', label: 'Cartão de Débito', allowedLabel: 'Cartão de Débito' },
    { value: 'BankSlip', label: 'Boleto', allowedLabel: 'Boleto' },
    { value: 'Transfer', label: 'Transferência Bancária', allowedLabel: 'Transferência Bancária' },
    { value: 'CompanyInvoice', label: 'Nota Fiscal (PJ)', allowedLabel: 'Nota Fiscal' },
  ];

  // Rótulos legíveis para métodos gravados na API
  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    PIX: 'Pix',
    CASH: 'Dinheiro',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    BOLETO: 'Boleto',
    TRANSFER: 'Transferência Bancária',
    INVOICE: 'Nota Fiscal',
  };

  const [activeTab, setActiveTab] = useState('all');
  const tabs = ['all', 'paid', 'pending'];
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    classId: classIdFromQuery,
    companyId: null,
    customerType: 'all',
  });

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pixCheckoutPayment, setPixCheckoutPayment] = useState<{
    paymentId: string;
    enrollmentId: string;
    amount: number;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: 0,
    method: 'Pix',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [pfPaymentEnabled, setPfPaymentEnabled] = useState(false);
  const [pfProductId, setPfProductId] = useState('');

  // Batch approval dialog
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // PIN Master dialog
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinAction, setPinAction] = useState<{ type: 'confirm' | 'delete' | 'batch'; studentId?: string; paymentId?: string } | null>(null);

  // Invoice number for PJ confirmation
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ student: Student; receipts: StudentReceipt[] } | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !student.name.toLowerCase().includes(search) &&
          !student.code.toLowerCase().includes(search) &&
          !(student.taxId && student.taxId.includes(search))
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        const status = getPaymentStatusApi(student);
        if (status !== filters.status) return false;
      }

      // Class filter
      if (filters.classId && student.classId !== filters.classId) {
        return false;
      }

      // Company filter
      if (filters.companyId && student.companyId !== filters.companyId) {
        return false;
      }

      // Customer type filter
      if (filters.customerType !== 'all') {
        const isB2B = !!student.companyId;
        if (filters.customerType === 'B2B' && !isB2B) return false;
        if (filters.customerType === 'B2C' && isB2B) return false;
      }

      return true;
    });
  }, [students, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    filteredStudents.forEach((student) => {
      const { expected, received } = getAggregates(student);
      totalValue += expected;
      totalPaid += received;

      const status = getPaymentStatusApi(student);
      if (status === 'paid') paidCount++;
      else if (status === 'pending') pendingCount++;
      else if (status === 'partial') partialCount++;
    });

    return {
      totalValue,
      totalPaid,
      totalPending: totalValue - totalPaid,
      paidCount,
      pendingCount,
      partialCount,
    };
  }, [filteredStudents]);

  // Handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedStudents(new Set());
  };

  const toggleStudentSelection = (id: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStudents(newSelection);
  };

  const handleOpenPaymentDialog = (student: Student) => {
    setSelectedStudent(student);
    const { remaining } = getAggregates(student);
    const company = student.companyId ? companies.find((c) => c.id === student.companyId) : null;
    const allowedMethods =
      company?.allowedPaymentMethods && company.allowedPaymentMethods.length > 0
        ? PAYMENT_METHOD_OPTIONS.filter((option) =>
            company.allowedPaymentMethods?.includes(option.allowedLabel)
          )
        : PAYMENT_METHOD_OPTIONS;
    const defaultMethod = allowedMethods[0]?.value || 'Pix';
    setPaymentForm({
      amount: remaining > 0 ? remaining : 0,
      method: defaultMethod,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    const hasPfProducts = (student.pfProductPayments || []).length > 0;
    setPfPaymentEnabled(false);
    setPfProductId(hasPfProducts ? student.pfProductPayments?.[0]?.productId || '' : '');
    setPaymentDialogOpen(true);
  };

  const handleRegisterPayment = async () => {
    if (!selectedStudent) return;

    if (paymentForm.amount <= 0) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    if (!selectedStudent.enrollmentId) {
      toast.error('Aluno sem matrícula (enrollmentId). Não é possível registrar pagamento via API.');
      return;
    }

    try {
      const method = mapUiMethodToApi(paymentForm.method);

      let descriptionBase = `Pagamento - ${selectedStudent.code} ${selectedStudent.name}`;
      if (pfPaymentEnabled) {
        const targetPf = (selectedStudent.pfProductPayments || []).find(
          (item) => item.productId === pfProductId
        );
        if (!targetPf) {
          toast.error('Selecione um produto PF válido.');
          return;
        }
        descriptionBase = `Pagamento PF - ${targetPf.productName} - ${selectedStudent.code} ${selectedStudent.name}`;
      }

      const boletoInfo =
        paymentForm.method === 'BankSlip' && (paymentForm.bankSlipCode || paymentForm.bankSlipDueDate)
          ? ` | Boleto: ${paymentForm.bankSlipCode || '-'} | Venc: ${paymentForm.bankSlipDueDate || '-'}`
          : '';

      const description = `${descriptionBase}${paymentForm.notes ? ` | ${paymentForm.notes}` : ''}${boletoInfo}`;

      // Registra como PENDING (equivalente ao comportamento legado antes da confirmação Master)
      await paymentsService.create({
        enrollmentId: selectedStudent.enrollmentId,
        amount: paymentForm.amount,
        dueDate: paymentForm.date,
        method,
        installments: 1,
        description,
      });

      toast.success('Pagamento lançado com sucesso (PENDENTE).');
      setPaymentDialogOpen(false);
      setSelectedStudent(null);
      await queryClient.invalidateQueries({ queryKey: ['payments', 'all'] });
    } catch {
      toast.error('Erro ao registrar pagamento via API');
    }
  };

  const handleConfirmPayment = (studentId: string, paymentId: string) => {
    // Require PIN Master validation
    setPinAction({ type: 'confirm', studentId, paymentId });
    setPinValue('');
    setInvoiceNumber('');
    setPinDialogOpen(true);
  };

  const handleDeletePayment = (studentId: string, paymentId: string) => {
    // Require PIN for deleting confirmed payments
    const student = students.find((s) => s.id === studentId);
    const enrollmentId = student?.enrollmentId;
    const payment = enrollmentId
      ? (paymentsByEnrollmentId.get(enrollmentId) || []).find((p) => p.id === paymentId)
      : undefined;

    if (payment?.status === 'PAID') {
      setPinAction({ type: 'delete', studentId, paymentId });
      setPinValue('');
      setPinDialogOpen(true);
    } else {
      executeDeletePayment(studentId, paymentId);
    }
  };

  const executeDeletePayment = async (studentId: string, paymentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student?.enrollmentId) return;
    const payment = (paymentsByEnrollmentId.get(student.enrollmentId) || []).find((p) => p.id === paymentId);
    if (!payment) return;

    try {
      if (payment.status === 'PAID') {
        await paymentsService.updateStatus({
          paymentId,
          status: 'CANCELLED',
          reason: 'Cancelado via portal',
        });
      } else {
        await paymentsService.delete(paymentId);
      }
      toast.success('Pagamento atualizado/removido via API!');
      await queryClient.invalidateQueries({ queryKey: ['payments', 'all'] });
    } catch {
      toast.error('Erro ao excluir/cancelar pagamento via API');
    }
  };

  const executeConfirmPayment = async (studentId: string, paymentId: string, nf?: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student?.enrollmentId) return;
    const payment = (paymentsByEnrollmentId.get(student.enrollmentId) || []).find((p) => p.id === paymentId);
    if (!payment) return;

    try {
      const method: PaymentMethod = payment.paymentMethod || 'PIX';
      await paymentsService.recordPayment({
        paymentId,
        method,
        invoiceNumber: nf?.trim() || undefined,
        notes: payment.notes || undefined,
      });

      // Gera recibo local (HTML) sem persistir no store
      generateReceipt(student, [
        {
          productId: payment.id,
          productName: payment.description,
          receiptNumber: generateReceiptNumber(),
          generatedAt: new Date().toISOString(),
          productType: 'main',
        },
      ]);

      toast.success('Pagamento confirmado via API!');
      await queryClient.invalidateQueries({ queryKey: ['payments', 'all'] });
    } catch {
      toast.error('Erro ao confirmar pagamento via API');
    }
  };

  const handlePinSubmit = async () => {
    const normalizedPin = pinValue.trim();
    if (!normalizedPin) {
      toast.error('Informe o PIN Master para continuar.');
      setPinValue('');
      return;
    }

    if (!pinAction) return;

    try {
      await authService.authorizeMasterPin(normalizedPin);
    } catch {
      toast.error('PIN Master inválido.');
      setPinValue('');
      return;
    }

    if (pinAction.type === 'confirm' && pinAction.studentId && pinAction.paymentId) {
      const student = students.find((s) => s.id === pinAction.studentId);
      if (student?.companyId && !invoiceNumber) {
        toast.error('Número da nota fiscal (NF) é obrigatório para pagamentos PJ!');
        return;
      }
      await executeConfirmPayment(pinAction.studentId, pinAction.paymentId, invoiceNumber);
    } else if (pinAction.type === 'delete' && pinAction.studentId && pinAction.paymentId) {
      await executeDeletePayment(pinAction.studentId, pinAction.paymentId);
    } else if (pinAction.type === 'batch') {
      await executeBatchApproval();
    }

    setPinDialogOpen(false);
    setPinAction(null);
    setPinValue('');
    setInvoiceNumber('');
  };

  // Receipt generation
  const generateReceipt = (student: Student, receipts: StudentReceipt[]) => {
    if (receipts.length === 0) return;
    setReceiptData({ student, receipts });
    setReceiptDialogOpen(true);
    toast.success(`Recibos gerados para ${student.name}!`);
  };

  const downloadReceipt = (receipt: StudentReceipt) => {
    if (!receiptData) return;
    const { student } = receiptData;
    const company = companies.find((c) => c.id === student.companyId);
    const classInfo = getClassInfo(student.classId);
    const useIndividualPayer = receipt.paidByIndividual === true;
    const payerName = useIndividualPayer ? student.name : company?.name || student.name;
    const payerTaxId = useIndividualPayer ? student.taxId || 'N/A' : company?.companyTaxId || student.taxId || 'N/A';
    const payerAddress = useIndividualPayer ? student.address : company?.address || student.address;
    const payerPhone = useIndividualPayer ? student.phone : company?.phone || student.phone;

    const enrollmentPayments = getEnrollmentPayments(student);
    const paymentForReceipt = enrollmentPayments.find((p) => p.id === receipt.productId);
    const productAmount = paymentForReceipt ? Number(paymentForReceipt.amount || 0) : 0;

    const receiptHtml = generateReceiptHTML({
      receiptNumber: receipt.receiptNumber,
      issueDate: new Date(receipt.generatedAt),
      company: {
        name: institutionalData?.name || 'Caiso Treinamentos',
        companyTaxId: institutionalData?.companyTaxId || 'N/A',
        address: institutionalData?.address || 'Endereco nao informado',
        phone: institutionalData?.phone || 'N/A',
        email: institutionalData?.email || 'N/A',
        logo: institutionalData?.logo,
      },
      payer: {
        name: payerName,
        taxId: payerTaxId,
        address: payerAddress,
        phone: payerPhone,
      },
      payment: {
        amount: productAmount,
        amountInWords: valueInWords(productAmount),
        paymentMethod: paymentForReceipt?.paymentMethod || 'Pagamento confirmado',
        reference: receipt.productName,
        description: `Recibo referente ao pagamento: ${receipt.productName}`,
      },
      course: classInfo?.course
        ? { name: classInfo.course.name, code: classInfo.course.code }
        : undefined,
      classInfo: classInfo?.classItem
        ? { code: classInfo.classItem.code, period: formatDate(classInfo.classItem.startDate) }
        : undefined,
    });

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receipt_${student.code}_${receipt.productId}.html`;
    link.click();
    toast.success('Recibo baixado!');
  };

  const handleBatchApproval = () => {
    // Require PIN for batch approval
    setPinAction({ type: 'batch' });
    setPinValue('');
    setInvoiceNumber('');
    setBatchDialogOpen(false);
    setPinDialogOpen(true);
  };

  const executeBatchApproval = async () => {
    const hasB2BSelected = Array.from(selectedStudents).some((studentId) => {
      const student = students.find((s) => s.id === studentId);
      return !!student?.companyId;
    });

    if (hasB2BSelected && !invoiceNumber.trim()) {
      toast.error('Número da Nota Fiscal (NF) é obrigatório para confirmar pagamentos PJ em lote.');
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedStudents).map(async (studentId) => {
          const student = students.find((s) => s.id === studentId);
          if (!student?.enrollmentId) return;
          const payments = paymentsByEnrollmentId.get(student.enrollmentId) || [];
          const pendings = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
          await Promise.all(
            pendings.map((p) =>
              paymentsService.recordPayment({
                paymentId: p.id,
                method: p.paymentMethod || 'PIX',
                invoiceNumber: student.companyId ? invoiceNumber.trim() || undefined : undefined,
              })
            )
          );
        })
      );

      toast.success(`${selectedStudents.size} pagamento(s) confirmado(s) via API!`);
      setSelectionMode(false);
      setSelectedStudents(new Set());
      await queryClient.invalidateQueries({ queryKey: ['payments', 'all'] });
    } catch {
      toast.error('Erro na confirmação em lote via API');
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = filteredStudents.map((student, index) => {
        const { expected, received } = getAggregates(student);
        return {
          '#': index + 1,
          'Código': student.code,
          'Nome': student.name,
          'Tipo': student.companyId ? 'PJ' : 'PF',
          'CPF': student.taxId || '',
          'Valor Total': expected,
          'Total Pago': received,
          'Restante': expected - received,
          'Status': getPaymentStatusApi(student),
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
      XLSX.writeFile(wb, `relatorio_pagamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  const getClassInfo = (classId?: string) => {
    if (!classId) return null;
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) return null;
    const course = courses.find((c) => c.id === classItem.courseId);
    return { classItem, course };
  };

  const getTabFilteredStudents = () => {
    if (activeTab === 'paid') return filteredStudents.filter(s => getPaymentStatusApi(s) === 'paid');
    if (activeTab === 'pending') return filteredStudents.filter(s => getPaymentStatusApi(s) === 'pending' || getPaymentStatusApi(s) === 'partial' || getPaymentStatusApi(s) === 'overdue');
    return filteredStudents;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Pagamentos</h1>
                    <p className="text-slate-600 text-sm">
                      Controle de pagamentos dos alunos e confirmação de recibos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('prev')}
                    disabled={tabs.indexOf(activeTab) === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('next')}
                    disabled={tabs.indexOf(activeTab) === tabs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Horizontal Tabs Navigation */}
              <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <TabsList className="flex w-max h-auto bg-slate-50/50 rounded-none p-1.5 gap-1.5">
                  <TabsTrigger 
                    value="all"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Todos ({filteredStudents.length})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="paid"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Pagos ({filteredStudents.filter(s => getPaymentStatusApi(s) === 'paid').length})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Pendentes ({filteredStudents.filter(s => ['pending', 'partial', 'overdue'].includes(getPaymentStatusApi(s))).length})</span>
                  </TabsTrigger>
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  <Button 
                    size="sm"
                    variant="outline"
                    className="rounded-none px-4 py-2.5 h-auto font-medium text-sm"
                    onClick={exportToExcel}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                  <Button 
                    size="sm"
                    variant={selectionMode ? 'default' : 'outline'}
                    className={selectionMode ? 'bg-red-600 hover:bg-red-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm' : 'rounded-none px-4 py-2.5 h-auto font-medium text-sm'}
                    onClick={toggleSelectionMode}
                  >
                    {selectionMode ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Seleção (PJ)
                      </>
                    )}
                  </Button>
                  {selectionMode && selectedStudents.size > 0 && (
                    <Button 
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm shadow-md border border-green-700"
                      onClick={() => setBatchDialogOpen(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar ({selectedStudents.size})
                    </Button>
                  )}
                </TabsList>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <Card className="bg-blue-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            Valor Total
                          </p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Total Recebido
                          </p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            Pendente
                          </p>
                          <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">Alunos</p>
                          <div className="flex gap-2 text-xs mt-1">
                            <span className="text-green-600 font-semibold">{stats.paidCount} pagos</span>
                            <span className="text-yellow-600 font-semibold">{stats.partialCount} parciais</span>
                            <span className="text-gray-600 font-semibold">{stats.pendingCount} pendentes</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Filters */}
                    <Card className="rounded-none mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Search className="w-5 h-5" />
                          Filtros
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label>Buscar</Label>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Buscar alunos..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Select
                              value={filters.status}
                              onValueChange={(v: FilterState['status']) => setFilters({ ...filters, status: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="partial">Parcial</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="overdue">Vencido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Turma</Label>
                            <Select
                              value={filters.classId || 'all'}
                              onValueChange={(v) => setFilters({ ...filters, classId: v === 'all' ? null : v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {classes.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <Select
                              value={filters.customerType}
                              onValueChange={(v: FilterState['customerType']) => 
                                setFilters({ ...filters, customerType: v })
                              }
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="B2B">B2B</SelectItem>
                                <SelectItem value="B2C">B2C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Students Table */}
                    <TabsContent value={activeTab} className="mt-0">
                      <Card className="rounded-none">
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  {selectionMode && <th className="p-3 w-10"></th>}
                                  <th className="text-left p-3 font-medium text-gray-600">Aluno</th>
                                  <th className="text-left p-3 font-medium text-gray-600">Turma</th>
                                  <th className="text-left p-3 font-medium text-gray-600">Tipo</th>
                                  <th className="text-right p-3 font-medium text-gray-600">Valor Total</th>
                                  <th className="text-right p-3 font-medium text-gray-600">Pago</th>
                                  <th className="text-right p-3 font-medium text-gray-600">Restante</th>
                                  <th className="text-center p-3 font-medium text-gray-600">Status</th>
                                  <th className="text-center p-3 font-medium text-gray-600">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getTabFilteredStudents().length === 0 ? (
                                  <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                      Nenhum aluno encontrado
                                    </td>
                                  </tr>
                                ) : (
                                  getTabFilteredStudents().map((student) => {
                                    const { expected, received, remaining } = getAggregates(student);
                                    const status = getPaymentStatusApi(student);
                                    const statusBadge = getStatusBadge(status);
                                    const classInfo = getClassInfo(student.classId);
                                    const company = companies.find((c) => c.id === student.companyId);

                                    return (
                                      <tr key={student.id} className="border-b hover:bg-gray-50">
                                        {selectionMode && (
                                          <td className="p-3">
                                            <Checkbox
                                              checked={selectedStudents.has(student.id)}
                                              onCheckedChange={() => toggleStudentSelection(student.id)}
                                            />
                                          </td>
                                        )}
                                        <td className="p-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                              <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                              <p className="font-medium">{student.name}</p>
                                              <p className="text-sm text-gray-500">{student.code}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          {classInfo ? (
                                            <div>
                                              <p className="text-sm">{classInfo.classItem.code}</p>
                                              <p className="text-xs text-gray-500">{classInfo.course?.name}</p>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </td>
                                        <td className="p-3">
                                          <Badge variant="outline" className="text-xs">
                                            {student.companyId ? (
                                              <span className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {company?.name || 'B2B'}
                                              </span>
                                            ) : (
                                              'B2C'
                                            )}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-right font-medium">
                                          {formatCurrency(expected)}
                                        </td>
                                        <td className="p-3 text-right text-green-600">
                                          {formatCurrency(received)}
                                        </td>
                                        <td className="p-3 text-right text-yellow-600">
                                          {formatCurrency(remaining)}
                                        </td>
                                        <td className="p-3 text-center">
                                          <Badge variant={statusBadge.variant} className="text-xs">
                                            {statusBadge.icon}
                                            {statusBadge.label}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-center">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenPaymentDialog(student)}
                                          >
                                            <CreditCard className="w-4 h-4 mr-1" />
                                            Gerenciar
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Gestão de Pagamentos - {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Code: {selectedStudent?.code} | Total (API): {formatCurrency(selectedStudent ? getAggregates(selectedStudent).expected : 0)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="new">
            <TabsList>
              <TabsTrigger value="new">Novo Pagamento</TabsTrigger>
              <TabsTrigger value="history">
                Histórico ({selectedStudent ? getEnrollmentPayments(selectedStudent).length : 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4 mt-4">
              {selectedStudent?.companyId && (selectedStudent.pfProductPayments || []).length > 0 && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pf-payment"
                      checked={pfPaymentEnabled}
                      onCheckedChange={(checked) => setPfPaymentEnabled(checked as boolean)}
                    />
                    <Label htmlFor="pf-payment" className="text-sm">
                      Registrar pagamento PF (pessoa fisica)
                    </Label>
                  </div>
                  {pfPaymentEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pf-product">Produto PF</Label>
                        <Select
                          value={pfProductId}
                          onValueChange={(value) => setPfProductId(value)}
                        >
                          <SelectTrigger id="pf-product">
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedStudent.pfProductPayments?.map((item) => {
                              return (
                                <SelectItem key={item.productId} value={item.productId}>
                                  {item.productName} ({formatCurrency(item.totalValue)} valor referência)
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs text-amber-700">
                        Pagamentos PF são lançados na API com descrição dedicada.
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Método de Pagamento</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(v: PaymentFormData['method']) =>
                      setPaymentForm({ ...paymentForm, method: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedStudent?.companyId
                        ? (() => {
                            const company = companies.find((c) => c.id === selectedStudent.companyId);
                            if (company?.allowedPaymentMethods && company.allowedPaymentMethods.length > 0) {
                              return PAYMENT_METHOD_OPTIONS.filter((option) =>
                                company.allowedPaymentMethods?.includes(option.allowedLabel)
                              );
                            }
                            return PAYMENT_METHOD_OPTIONS;
                          })()
                        : PAYMENT_METHOD_OPTIONS
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudent?.companyId && (() => {
                    const company = companies.find((c) => c.id === selectedStudent.companyId);
                    return company?.allowedPaymentMethods && company.allowedPaymentMethods.length > 0;
                  })() && (
                    <p className="mt-1 text-xs text-amber-600">
                      Metodos limitados pelas permissoes da empresa.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                />
              </div>
              {paymentForm.method === 'BankSlip' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankSlipCode">Código do Boleto</Label>
                    <Input
                      id="bankSlipCode"
                      value={paymentForm.bankSlipCode || ''}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, bankSlipCode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankSlipDueDate">Vencimento</Label>
                    <Input
                      id="bankSlipDueDate"
                      type="date"
                      value={paymentForm.bankSlipDueDate || ''}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, bankSlipDueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleRegisterPayment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Pagamento
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {!selectedStudent || getEnrollmentPayments(selectedStudent).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum pagamento registrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getEnrollmentPayments(selectedStudent).map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-500">
                              {PAYMENT_METHOD_LABELS[payment.paymentMethod || ''] || payment.paymentMethod || '—'} • Venc: {formatDate(payment.dueDate)}
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-gray-400 mt-1">{payment.notes}</p>
                            )}
                            {payment.status === 'PAID' && payment.paidAt && (
                              <p className="text-xs text-green-700 mt-1">Pago em: {formatDate(payment.paidAt)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.status === 'PAID' ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pago
                              </Badge>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                  onClick={() =>
                                    setPixCheckoutPayment({
                                      paymentId: payment.id,
                                      enrollmentId: selectedStudent.enrollmentId || '',
                                      amount: Number(payment.amount),
                                    })
                                  }
                                >
                                  <QrCode className="w-3 h-3 mr-1" />
                                  PIX
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleConfirmPayment(selectedStudent.id, payment.id)
                                  }
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirmar
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() =>
                                handleDeletePayment(selectedStudent.id, payment.id)
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Batch Approval Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovação de Pagamento em Lote</DialogTitle>
            <DialogDescription>
              Confirmar pagamentos para {selectedStudents.size} aluno(s) selecionado(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Isso confirmará todos os pagamentos pendentes dos alunos selecionados. O PIN Master será necessário.
            </p>
            <div>
              <Label>Número da Nota Fiscal (NF) — Obrigatório para PJ</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="NF-0000"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBatchApproval} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Prosseguir para Validação PIN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Master Validation Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={(open) => { setPinDialogOpen(open); if (!open) { setPinAction(null); setPinValue(''); setInvoiceNumber(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔐 Validação PIN Master
            </DialogTitle>
            <DialogDescription>
              Digite o PIN Master para {pinAction?.type === 'confirm' ? 'confirmar este pagamento' : pinAction?.type === 'delete' ? 'excluir este pagamento confirmado' : 'aprovar pagamentos em lote'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pinAction?.type === 'confirm' && (() => {
              const student = students.find((s) => s.id === pinAction.studentId);
              const isB2B = !!student?.companyId;
              return isB2B ? (
                <div>
                  <Label>Número da Nota Fiscal (NF) *</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="NF-0000 (obrigatório para PJ)"
                  />
                  <p className="text-xs text-orange-600 mt-1">Obrigatório para pagamentos de empresas PJ</p>
                </div>
              ) : null;
            })()}
            <div>
              <Label>PIN Master (6 dígitos)</Label>
              <Input
                type="password"
                maxLength={6}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="Digite o PIN de 6 dígitos"
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-400 mt-1">PIN padrão: 281242</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setPinDialogOpen(false); setPinAction(null); }}>
                Cancel
              </Button>
              <Button onClick={handlePinSubmit} disabled={pinValue.length < 4}>
                Validar e Prosseguir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recibos Gerados
            </DialogTitle>
            <DialogDescription>
              Recibos disponíveis por produto
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Aluno:</span>
                    <span className="font-medium">{receiptData.student.name} ({receiptData.student.code})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Recibos:</span>
                    <span className="font-medium">{receiptData.receipts.length}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {receiptData.receipts.map((receipt) => (
                  <Button
                    key={receipt.receiptNumber}
                    onClick={() => downloadReceipt(receipt)}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span>
                      {receipt.productName} ({receipt.productType === 'main' ? 'Curso' : 'Extra'})
                      {receipt.paidByIndividual ? ' - PF' : ''}
                    </span>
                    <Download className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout PIX (Mercado Pago) */}
      <PixCheckoutDialog
        open={!!pixCheckoutPayment}
        onOpenChange={(open) => {
          if (!open) setPixCheckoutPayment(null);
        }}
        enrollmentId={pixCheckoutPayment?.enrollmentId || ''}
        amount={pixCheckoutPayment?.amount || 0}
        onPaid={() => {
          void queryClient.invalidateQueries({ queryKey: ['payments', 'all'] });
        }}
      />
    </div>
  );
}
