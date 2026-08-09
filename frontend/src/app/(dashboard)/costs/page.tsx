'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Check,
  X,
  Edit,
  Package,
  Lock,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

import { useCostsStore } from '@/stores/costs.store';
import type { CostTriggerAction } from '@/stores/costs.store';
import { CostEntriesTab } from '@/components/financial/cost-entries-tab';
import { FinancialBatchCard, GroupedEntryCard } from '@/components/financial';
import { AuthorizePaymentDialog } from '@/components/dialogs/authorize-payment-dialog';
import { BatchPaymentDialog } from '@/components/dialogs/batch-payment-dialog';
import { ConfirmPaymentDialog } from '@/components/financial/dialogs/confirm-payment-dialog';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useClassesStore, type Class } from '@/stores/classes.store';
import { useSettingsStore, type Supplier, type Instructor } from '@/stores/settings.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { useCoursesStore } from '@/stores/courses.store';
import { generateSmartCosts } from '@/lib/generate-smart-costs';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { toast } from 'sonner';
import { costsService } from '@/services/costs.service';

type PaymentAuthorizationMetadata = {
  tipoPagamento: 'total' | 'parcial';
  valorAutorizado: number;
  notaFiscal?: string;
  notaFiscalArquivoNome?: string;
  notaFiscalArquivoTamanho?: number;
  notaFiscalArquivoTipo?: string;
  authorizedAt: string;
};

const PAYMENT_AUTH_PREFIX = '__PAYMENT_AUTH__=';

function extractPaymentAuthorization(
  notes?: string
): PaymentAuthorizationMetadata | null {
  if (!notes) return null;

  const line = notes
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.startsWith(PAYMENT_AUTH_PREFIX));

  if (!line) return null;

  const payload = line.slice(PAYMENT_AUTH_PREFIX.length);
  try {
    const parsed = JSON.parse(payload) as PaymentAuthorizationMetadata;
    if (!parsed || typeof parsed.valorAutorizado !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function upsertPaymentAuthorization(
  notes: string | undefined,
  data: PaymentAuthorizationMetadata
): string {
  const existing = (notes || '').split('\n');
  const withoutAuth = existing.filter(
    (line) => !line.trim().startsWith(PAYMENT_AUTH_PREFIX)
  );
  const base = withoutAuth.join('\n').trim();
  const authLine = `${PAYMENT_AUTH_PREFIX}${JSON.stringify(data)}`;
  return base ? `${base}\n${authLine}` : authLine;
}

function stripPaymentAuthorization(notes?: string): string | undefined {
  if (!notes) return undefined;
  const cleaned = notes
    .split('\n')
    .filter((line) => !line.trim().startsWith(PAYMENT_AUTH_PREFIX))
    .join('\n')
    .trim();
  return cleaned || undefined;
}

// ============================================
// TYPES (English)
// ============================================

type EntryType = 'payable' | 'receivable';
type EntryStatus = 'Pending' | 'Overdue' | 'Paid' | 'Cancelled' | 'Invoiced' | 'AwaitingAuthorization';
type ActiveTab = 'all' | 'payable' | 'receivable' | 'cost-entries';

const COST_TRIGGER_ACTIONS: CostTriggerAction[] = [
  'NewEnrollment',
  'StatusScheduled',
  'StatusConfirm',
  'StatusConfirmed',
  'StatusPresent',
  'FirstPayment',
  'PaymentConfirmed',
  'AllDocsApproved',
  'DocApproved',
  'ExamScheduled',
  'ExamCancelled',
  'ExamPassed',
  'ExamFailed',
  'ExamNoShow',
  'StudentEdited',
  'StudentReplaced',
  'StudentTransferred',
  'AttendanceMarked',
  'LinkSent',
  'InstructorLinkedToClass',
  'InstructorAttendance',
  'InstructorAssignedToExam',
];

function toCostTriggerAction(value?: string): CostTriggerAction | undefined {
  if (!value) return undefined;
  return COST_TRIGGER_ACTIONS.includes(value as CostTriggerAction)
    ? (value as CostTriggerAction)
    : undefined;
}

function toCostTriggerActions(values?: string[]): CostTriggerAction[] | undefined {
  if (!values?.length) return undefined;
  const mapped = values
    .map((value) => toCostTriggerAction(value))
    .filter((value): value is CostTriggerAction => Boolean(value));
  return mapped.length ? mapped : undefined;
}

interface FinancialEntry {
  id: string;
  code: string;
  type: EntryType;
  description: string;
  value: number;
  dueDate: string;
  paidAt?: string;
  status: EntryStatus;
  auditableCostId?: string;
  supplierId?: string;
  classId?: string;
  criterionId?: string;
  studentId?: string;
  instructorId?: string;
  companyId?: string;
  invoiceNumber?: string;
  notes?: string;
  isGrouped?: boolean;
  groupDetails?: {
    code: string;
    date: string;
    value: number;
    notes?: string;
  }[];
}

interface GroupedEntry {
  code: string;
  groupId: string;
  entries: FinancialEntry[];
  isLot: boolean;
  isDailyGroup?: boolean;
  totalValue: number;
  type: EntryType;
  status: EntryStatus;
  dueDate: string;
  paidAt?: string;
  invoiceNumber?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
  if (!date) return '';
  if (date.includes('/')) return date;
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function getStatusBadge(status: EntryStatus) {
  switch (status) {
    case 'Paid':
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
    case 'Pending':
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    case 'Overdue':
      return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</Badge>;
    case 'Cancelled':
      return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
    case 'Invoiced':
      return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Faturado</Badge>;
    case 'AwaitingAuthorization':
      return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" /> Aguardando Autorização</Badge>;
    default:
      return null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CostsPage() {
  // Stores
  const {
    costEntries,
    auditableCosts,
    costCriteria,
    setAuditableCosts,
    setCostCriteria,
    setCostEntries,
    updateCostEntry,
    deleteCostEntry,
    addBatchCostEntries,
    renumberCostEntries,
    payCostEntry,
  } = useCostsStore();
  const { students } = useStudentsStore();
  const { classes } = useClassesStore();
  const { suppliers, instructors, extraProducts, currentUser, users } = useSettingsStore();
  const { companies } = useCompaniesStore();
  const { courses } = useCoursesStore();

  const { data: auditableCostsData } = useQuery({
    queryKey: ['costs', 'auditable'],
    queryFn: () => costsService.getAuditable(),
  });

  const { data: criteriaData } = useQuery({
    queryKey: ['costs', 'criteria'],
    queryFn: () => costsService.getCriteria(),
  });

  const { data: costEntriesData } = useQuery({
    queryKey: ['costs', 'entries'],
    queryFn: () => costsService.getEntries(1, 500),
  });

  useEffect(() => {
    if (auditableCostsData) {
      const mapped = auditableCostsData.map((cost) => ({
        id: cost.id,
        code: `AC-${cost.id.slice(0, 8).toUpperCase()}`,
        name: cost.description,
        value: Number(cost.amount),
        supplierId: cost.supplierId,
        companyId: cost.companyId,
        active: true,
        costCriterionId: undefined,
        linkType: cost.linkType,
        instructorId: cost.instructorId,
      }));
      setAuditableCosts(mapped);
    }
  }, [auditableCostsData, setAuditableCosts]);

  useEffect(() => {
    if (criteriaData) {
      setCostCriteria(
        criteriaData.map((criterion) => ({
          ...criterion,
          triggers: toCostTriggerActions(criterion.triggers),
          createdAt: criterion.createdAt?.split('T')[0] || criterion.createdAt,
        }))
      );
    }
  }, [criteriaData, setCostCriteria]);

  useEffect(() => {
    if (costEntriesData?.data) {
      setCostEntries(
        costEntriesData.data.map((entry) => ({
          id: entry.id,
          code: entry.code,
          auditableCostId: entry.auditableCostId,
          costCriterionId: entry.costCriterionId,
          studentId: entry.studentId,
          classId: entry.classId,
          supplierId: entry.supplierId,
          instructorId: entry.instructorId,
          examNumber: entry.examNumber,
          examName: entry.examName,
          value: entry.value,
          generatedAt: entry.generatedAt.split('T')[0],
          dueDate: entry.dueDate.split('T')[0],
          status: entry.status,
          paidAt: entry.paidAt ? entry.paidAt.split('T')[0] : undefined,
          notes: entry.notes,
          autoGenerated: entry.autoGenerated,
          triggerAction: toCostTriggerAction(entry.triggerAction),
        }))
      );
    }
  }, [costEntriesData, setCostEntries]);

  const masterPin = useMemo(() => {
    if (currentUser?.role === 'Master' && currentUser.pin) {
      return currentUser.pin;
    }

    return users.find((user) => user.role === 'Master' && user.pin)?.pin;
  }, [currentUser, users]);

  const costEntriesUi = useMemo(
    () =>
      costEntries.map((entry) => ({
        id: entry.id,
        code: entry.code,
        auditableCostId: entry.auditableCostId,
        studentId: entry.studentId,
        instructorId: entry.instructorId,
        classId: entry.classId,
        costCriteriaId: entry.costCriterionId,
        amount: entry.value,
        dueDate: entry.dueDate,
        examNumber: entry.examNumber,
        examName: entry.examName,
        notes: entry.notes,
      })),
    [costEntries]
  );

  const auditableCostsUi = useMemo(
    () => auditableCosts.map((cost) => ({ id: cost.id, code: cost.code, name: cost.name })),
    [auditableCosts]
  );

  const studentsUi = useMemo(
    () => students.map((student) => ({ id: student.id, name: student.name })),
    [students]
  );

  const instructorsUi = useMemo(
    () => instructors.map((instructor) => ({ id: instructor.id, name: instructor.name })),
    [instructors]
  );

  const classesUi = useMemo(
    () => classes.map((cls) => ({ id: cls.id, code: cls.code })),
    [classes]
  );

  const costCriteriaUi = useMemo(
    () => costCriteria.map((criterion) => ({ id: criterion.id, name: criterion.name })),
    [costCriteria]
  );

  // State - Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const tabs: ActiveTab[] = ['all', 'payable', 'receivable', 'cost-entries'];

  const isActiveTab = (value: string): value is ActiveTab => {
    return (
      value === 'all' ||
      value === 'payable' ||
      value === 'receivable' ||
      value === 'cost-entries'
    );
  };
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  // State - Filters
  const [filterType, setFilterType] = usePersistedState<'all' | 'payable' | 'receivable' | 'cost-entries'>(
    'smcorp-costs-filter-type',
    'all'
  );
  const [filterStatus, setFilterStatus] = usePersistedState<EntryStatus | 'all'>(
    'smcorp-costs-filter-status',
    'all'
  );
  const [filterClass, setFilterClass] = usePersistedState<string>(
    'smcorp-costs-filter-class',
    'all'
  );
  const [filterSupplier, setFilterSupplier] = usePersistedState<string>(
    'smcorp-costs-filter-supplier',
    'all'
  );
  const [filterCompany, setFilterCompany] = usePersistedState<string>(
    'smcorp-costs-filter-company',
    'all'
  );
  const [filterInstructor, setFilterInstructor] = usePersistedState<string>(
    'smcorp-costs-filter-instructor',
    'all'
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStartDate, setFilterStartDate] = usePersistedState<string>(
    'smcorp-costs-filter-start-date',
    ''
  );
  const [filterEndDate, setFilterEndDate] = usePersistedState<string>(
    'smcorp-costs-filter-end-date',
    ''
  );

  // State - Selection Mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  // State - Dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [authorizePaymentOpen, setAuthorizePaymentOpen] = useState(false);
  const [batchPaymentOpen, setBatchPaymentOpen] = useState(false);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [smartCostResult, setSmartCostResult] = useState<{ totalGenerated: number; skippedAbsent: number; skippedNoProducts: number; processedStudents: number; processedClasses: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [authorizePaymentEntryId, setAuthorizePaymentEntryId] = useState<string | null>(null);
  const [batchPaymentGroupId, setBatchPaymentGroupId] = useState<string | null>(null);
  const [confirmPaymentTargetIds, setConfirmPaymentTargetIds] = useState<string[]>([]);
  const [confirmPaymentInfo, setConfirmPaymentInfo] = useState<{
    id: string;
    code: string;
    description: string;
    value: number;
    amountPaid?: number;
  } | null>(null);

  // State - Selected Entry
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [newStatus, setNewStatus] = useState<EntryStatus>('Pending');
  const [newPaidAt, setNewPaidAt] = useState('');
  const [statusPin, setStatusPin] = useState('');

  const requiresStatusPin =
    !!selectedEntry &&
    selectedEntry.type === 'payable' &&
    newStatus === 'Paid';
  const isStatusPinConfigured = !!masterPin;
  const isStatusPinCorrect =
    requiresStatusPin && isStatusPinConfigured && statusPin === masterPin;

  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setStatusPin('');
  };

  const handleGenerateCosts = () => {
    setIsGenerating(true);
    try {
      const result = generateSmartCosts(
        classes,
        students,
        courses,
        extraProducts,
        auditableCosts,
        costCriteria,
        costEntries
      );

      if (result.entries.length > 0) {
        addBatchCostEntries(result.entries);
        toast.success(`✅ Gerados ${result.totalGenerated} lançamentos de custo!`);
      } else {
        toast.info('ℹ️ Nenhum novo lançamento a gerar. Todos os custos já foram processados.');
      }

      setSmartCostResult({
        totalGenerated: result.totalGenerated,
        skippedAbsent: result.skippedAbsent,
        skippedNoProducts: result.skippedNoProducts,
        processedStudents: result.processedStudents,
        processedClasses: result.processedClasses,
      });
    } catch (err) {
      toast.error('Erro ao gerar custos inteligentes');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenumberEntries = async () => {
    if (costEntries.length === 0) {
      toast.info('ℹ️ Não há lançamentos para renumerar.');
      return;
    }

    const count = costEntries.length;
    const success = await renumberCostEntries();
    if (success) {
      toast.success(`✅ ${count} lançamento(s) renumerado(s).`);
    } else {
      toast.error('Falha ao renumerar no servidor — recarregue a página e tente de novo.');
    }
  };

  // Convert CostEntry to FinancialEntry (payable) and Student payments to receivable
  const financialEntries = useMemo<FinancialEntry[]>(() => {
    const payableEntries = costEntries.map(entry => {
      const cost = auditableCosts.find(c => c.id === entry.auditableCostId);
      const student = students.find(s => s.id === entry.studentId);
      const instructor = instructors.find(i => i.id === entry.instructorId);
      const classInfo = classes.find(c => c.id === entry.classId);

      const authorization = extractPaymentAuthorization(entry.notes);

      let description = cost?.name || 'Custo não especificado';
      
      if (student) {
        description += ` - 👤 ${student.code} ${student.name}`;
      } else if (instructor) {
        description += ` - 👨‍🏫 ${instructor.name}`;
      }
      
      if (classInfo) {
        description += ` (${classInfo.code})`;
      }

      // Map status
      let status: EntryStatus = 'Pending';
      if (entry.status === 'Paid') status = 'Paid';
      else if (entry.status === 'Overdue') status = 'Overdue';
      else if (entry.status === 'Cancelled') status = 'Cancelled';
      else if (authorization) status = 'AwaitingAuthorization';

      return {
        id: entry.id,
        code: entry.code,
        type: 'payable' as EntryType,
        description,
        value: entry.value,
        dueDate: entry.dueDate,
        paidAt: entry.paidAt,
        status,
        auditableCostId: entry.auditableCostId,
        supplierId: entry.supplierId,
        classId: entry.classId,
        criterionId: entry.costCriterionId,
        studentId: entry.studentId,
        instructorId: entry.instructorId,
        invoiceNumber: authorization?.notaFiscal,
        notes: stripPaymentAuthorization(entry.notes),
      };
    });

    const today = new Date().toISOString().split('T')[0];
    const classById = new Map(classes.map((item) => [item.id, item]));

    const receivableEntries: FinancialEntry[] = [];

    students.forEach((student) => {
      const classInfo = student.classId ? classById.get(student.classId) : undefined;
      const classCode = classInfo?.code;
      const history = student.payments?.history || [];
      const computedPaid = history.reduce((sum, record) => sum + (record.amount || 0), 0);
      const totalPaid = student.payments?.totalPaid ?? computedPaid;

      history.forEach((record, index) => {
        const code = record.id || `REC-${student.code}-${String(index + 1).padStart(2, '0')}`;
        const description = classCode
          ? `Pagamento aluno ${student.name} (${classCode})`
          : `Pagamento aluno ${student.name}`;

        receivableEntries.push({
          id: `receivable-paid-${student.id}-${record.id || index}`,
          code,
          type: 'receivable',
          description,
          value: record.amount,
          dueDate: record.date,
          paidAt: record.date,
          status: 'Paid',
          classId: student.classId,
          studentId: student.id,
          companyId: student.companyId,
          notes: record.notes,
        });
      });

      const totalValue = student.totalValue || 0;
      const remaining = Math.max(totalValue - totalPaid, 0);
      if (remaining > 0) {
        const dueDate = student.studentEndDate || classInfo?.endDate || today;
        const status: EntryStatus = dueDate < today ? 'Overdue' : 'Pending';
        const description = classCode
          ? `Saldo pendente - ${student.name} (${classCode})`
          : `Saldo pendente - ${student.name}`;

        receivableEntries.push({
          id: `receivable-pending-${student.id}`,
          code: `REC-${student.code}-PEND`,
          type: 'receivable',
          description,
          value: remaining,
          dueDate,
          status,
          classId: student.classId,
          studentId: student.id,
          companyId: student.companyId,
          notes: `Saldo pendente (${remaining.toFixed(2)})`,
        });
      }
    });

    return [...payableEntries, ...receivableEntries];
  }, [costEntries, auditableCosts, students, instructors, classes]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return financialEntries.filter(entry => {
      // Tab filtering
      if (activeTab !== 'all' && activeTab !== 'cost-entries' && entry.type !== activeTab) return false;
      if (filterType !== 'all' && filterType !== 'cost-entries' && entry.type !== filterType) return false;
      if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
      if (filterStartDate && entry.dueDate < filterStartDate) return false;
      if (filterEndDate && entry.dueDate > filterEndDate) return false;
      
      if (filterSearch) {
        const search = filterSearch.toLowerCase();
        const matches = entry.code.toLowerCase().includes(search) ||
                       entry.description.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (filterClass !== 'all') {
        if (entry.classId !== filterClass) return false;
      }

      if (filterSupplier !== 'all') {
        if (entry.supplierId !== filterSupplier) return false;
      }

      if (filterCompany !== 'all') {
        if (entry.companyId !== filterCompany) return false;
      }

      if (filterInstructor !== 'all') {
        if (entry.instructorId !== filterInstructor) return false;
      }

      return true;
    });
  }, [financialEntries, activeTab, filterType, filterStatus, filterStartDate, filterEndDate, filterSearch, filterClass, filterSupplier, filterCompany, filterInstructor]);

  // Statistics
  const statistics = useMemo(() => {
    const totalPayable = filteredEntries
      .filter(e => e.type === 'payable' && e.status !== 'Cancelled')
      .reduce((sum, e) => sum + e.value, 0);

    const totalReceivable = filteredEntries
      .filter(e => e.type === 'receivable' && e.status !== 'Cancelled')
      .reduce((sum, e) => sum + e.value, 0);

    const overduePayable = filteredEntries
      .filter(e => e.type === 'payable' && e.status === 'Overdue')
      .reduce((sum, e) => sum + e.value, 0);

    const overdueReceivable = filteredEntries
      .filter(e => e.type === 'receivable' && e.status === 'Overdue')
      .reduce((sum, e) => sum + e.value, 0);

    const paidThisMonth = filteredEntries
      .filter(e => e.status === 'Paid' && e.paidAt?.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((sum, e) => sum + e.value, 0);

    return {
      totalPayable,
      totalReceivable,
      overduePayable,
      overdueReceivable,
      paidThisMonth,
      balance: totalReceivable - totalPayable,
    };
  }, [filteredEntries]);

  // Group entries
  const groupedEntries = useMemo<GroupedEntry[]>(() => {
    const groups = new Map<string, FinancialEntry[]>();

    filteredEntries.forEach(entry => {
      if (entry.isGrouped) {
        groups.set(entry.code, [entry]);
      } else {
        const existing = groups.get(entry.code) || [];
        groups.set(entry.code, [...existing, entry]);
      }
    });

    return Array.from(groups.entries()).map(([code, entries]) => {
      const first = entries[0];
      const totalValue = entries.reduce((sum, e) => sum + e.value, 0);
      
      let status: EntryStatus = 'Pending';
      if (entries.every(e => e.status === 'Paid')) status = 'Paid';
      else if (entries.some(e => e.status === 'Overdue')) status = 'Overdue';
      else if (entries.some(e => e.status === 'AwaitingAuthorization')) status = 'AwaitingAuthorization';
      else if (entries.some(e => e.status === 'Invoiced')) status = 'Invoiced';

      return {
        code,
        groupId: code,
        entries,
        isLot: entries.length > 1 && first.type === 'receivable',
        isDailyGroup: entries.length > 1,
        totalValue,
        type: first.type,
        status,
        dueDate: first.dueDate,
        paidAt: entries.every(e => e.paidAt) ? first.paidAt : undefined,
        invoiceNumber: first.invoiceNumber,
      };
    });
  }, [filteredEntries]);

  // Actions
  const openSinglePaymentFlow = (entryId: string) => {
    const entry = financialEntries.find((item) => item.id === entryId);
    if (!entry) return;

    if (entry.type !== 'payable') {
      toast.error('Ação disponível apenas para lançamentos a pagar.');
      return;
    }

    if (entry.status === 'Paid' || entry.status === 'Cancelled') return;

    if (entry.status === 'AwaitingAuthorization') {
      const raw = costEntries.find((item) => item.id === entry.id);
      const authorization = extractPaymentAuthorization(raw?.notes);
      const amountPaid = authorization?.valorAutorizado ?? entry.value;

      setConfirmPaymentTargetIds([entry.id]);
      setConfirmPaymentInfo({
        id: entry.id,
        code: entry.code,
        description: entry.description,
        value: entry.value,
        amountPaid,
      });
      setConfirmPaymentOpen(true);
      return;
    }

    setAuthorizePaymentEntryId(entry.id);
    setAuthorizePaymentOpen(true);
  };

  const openGroupPaymentFlow = (group: GroupedEntry) => {
    if (group.type !== 'payable') {
      toast.error('Ação disponível apenas para lançamentos a pagar.');
      return;
    }

    if (group.entries.length === 1) {
      openSinglePaymentFlow(group.entries[0].id);
      return;
    }

    if (group.status === 'Paid' || group.status === 'Cancelled') return;

    if (group.status === 'AwaitingAuthorization') {
      const totalToPay = group.entries.reduce((acc, item) => {
        const raw = costEntries.find((entry) => entry.id === item.id);
        const authorization = extractPaymentAuthorization(raw?.notes);
        return acc + (authorization?.valorAutorizado ?? item.value);
      }, 0);

      setConfirmPaymentTargetIds(group.entries.map((item) => item.id));
      setConfirmPaymentInfo({
        id: `batch:${group.groupId}`,
        code: group.code,
        description: `Lote (${group.entries.length} itens)`,
        value: group.totalValue,
        amountPaid: totalToPay,
      });
      setConfirmPaymentOpen(true);
      return;
    }

    setBatchPaymentGroupId(group.groupId);
    setBatchPaymentOpen(true);
  };

  const openSelectionBatchAuthorization = () => {
    if (selectedEntries.size === 0) return;

    const selected = Array.from(selectedEntries)
      .map((id) => financialEntries.find((item) => item.id === id))
      .filter(Boolean) as FinancialEntry[];

    if (selected.length === 0) return;

    if (selected.some((item) => item.type !== 'payable')) {
      toast.error('Selecione apenas lançamentos a pagar.');
      return;
    }

    const supplierIds = new Set(
      selected.map((item) => item.supplierId).filter(Boolean)
    );
    if (supplierIds.size !== 1) {
      toast.error(
        'Selecione lançamentos do mesmo fornecedor para autorizar em lote.'
      );
      return;
    }

    setBatchPaymentGroupId('__selection__');
    setBatchPaymentOpen(true);
  };

  const handleCancel = (entryId: string) => {
    if (confirm('Tem certeza que deseja cancelar este lançamento?')) {
      updateCostEntry(entryId, { status: 'Cancelled' });
      toast.success('✅ Lançamento cancelado!');
      setDetailsDialogOpen(false);
    }
  };

  const handleSaveStatus = () => {
    if (!selectedEntry) return;

    if (newStatus === 'Paid' && selectedEntry.type === 'payable') {
      if (!masterPin) {
        toast.error('PIN do usuario master nao configurado.');
        return;
      }

      if (statusPin.length !== 6) {
        toast.error('Digite o PIN de 6 digitos para confirmar.');
        return;
      }

      if (statusPin !== masterPin) {
        toast.error('PIN incorreto! Confirmacao negada.');
        setStatusPin('');
        return;
      }
    }

    // Map UI status to CostEntry status
    let mappedStatus: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled' = 'Pending';
    if (newStatus === 'Paid') mappedStatus = 'Paid';
    else if (newStatus === 'Overdue') mappedStatus = 'Overdue';
    else if (newStatus === 'Cancelled') mappedStatus = 'Cancelled';
    // 'AwaitingAuthorization' and 'Invoiced' map to 'Pending' in CostEntry

    const paidAt = newStatus === 'Paid'
      ? (newPaidAt || new Date().toISOString().split('T')[0])
      : (newPaidAt || undefined);

    const raw = costEntries.find((entry) => entry.id === selectedEntry.id);
    const nextNotes =
      newStatus === 'Paid' ? stripPaymentAuthorization(raw?.notes) : raw?.notes;

    updateCostEntry(selectedEntry.id, {
      status: mappedStatus,
      paidAt: paidAt || undefined,
      notes: nextNotes,
    });
    toast.success('✅ Status atualizado!');
    setStatusDialogOpen(false);
    setDetailsDialogOpen(false);
    setStatusPin('');
  };

  const openStatusDialog = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setNewStatus(entry.status);
    setNewPaidAt(entry.paidAt || '');
    setStatusPin('');
    setStatusDialogOpen(true);
  };

  const toggleSelection = (entryId: string) => {
    const newSet = new Set(selectedEntries);
    if (newSet.has(entryId)) {
      newSet.delete(entryId);
    } else {
      newSet.add(entryId);
    }
    setSelectedEntries(newSet);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSearch('');
    setFilterClass('all');
    setFilterSupplier('all');
    setFilterCompany('all');
    setFilterInstructor('all');
  };

  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all' || 
    filterStartDate || filterEndDate || filterSearch || 
    filterClass !== 'all' || filterSupplier !== 'all' || 
    filterCompany !== 'all' || filterInstructor !== 'all';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isActiveTab(value)) {
              setActiveTab(value);
            }
          }}
          className="flex flex-col h-full"
        >

          {/* ── Header Area ── */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financeiro</h1>
                    <p className="text-slate-600 text-sm">Fluxo financeiro, contas a pagar e a receber, autorizações e lançamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateTab('prev')}
                    disabled={activeTab === tabs[0]}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateTab('next')}
                    disabled={activeTab === tabs[tabs.length - 1]}
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
                    <Receipt className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Todos ({filteredEntries.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payable"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <TrendingDown className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">A Pagar ({filteredEntries.filter(e => e.type === 'payable').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="receivable"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">A Receber ({filteredEntries.filter(e => e.type === 'receivable').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cost-entries"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Package className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Lançamentos ({costEntries.length})</span>
                  </TabsTrigger>

                  <div className="w-px h-7 bg-slate-300 mx-2" />

                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm shadow-md border border-green-700"
                    disabled={isGenerating}
                    onClick={handleGenerateCosts}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isGenerating ? 'Gerando...' : 'Gerar Custos'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-300 rounded-none px-4 py-2.5 h-auto font-medium text-sm"
                    onClick={handleRenumberEntries}
                  >
                    🔢 Renumerar
                  </Button>
                </TabsList>
              </div>
            </div>
          </div>

          {/* ── Main Content Area ── */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-6">

                    {/* Smart Cost Generation Result */}
                    {smartCostResult && (
                      <Card className="border-green-200 bg-green-50 rounded-none mb-4">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-green-800">
                                🧠 Resultado da Geração Inteligente de Custos
                              </p>
                              <div className="flex gap-4 text-xs text-green-700">
                                <span>✅ Gerados: <strong>{smartCostResult.totalGenerated}</strong></span>
                                <span>📚 Turmas: <strong>{smartCostResult.processedClasses}</strong></span>
                                <span>👤 Alunos: <strong>{smartCostResult.processedStudents}</strong></span>
                                {smartCostResult.skippedAbsent > 0 && (
                                  <span>⏭️ Ausências: <strong>{smartCostResult.skippedAbsent}</strong></span>
                                )}
                                {smartCostResult.skippedNoProducts > 0 && (
                                  <span>⚠️ Sem produtos: <strong>{smartCostResult.skippedNoProducts}</strong></span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSmartCostResult(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Active Filters Indicator */}
                    {hasActiveFilters && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                        <p className="text-sm text-orange-800 font-semibold">
                          📊 Exibindo dados filtrados ({filteredEntries.length} lançamentos)
                        </p>
                      </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <Card className="bg-red-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">A Pagar (Total)</p>
                          <p className="text-xl font-bold text-red-700">{formatCurrency(statistics.totalPayable)}</p>
                          <p className="text-xs text-gray-400">Vencido: {formatCurrency(statistics.overduePayable)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">A Receber (Total)</p>
                          <p className="text-xl font-bold text-green-700">{formatCurrency(statistics.totalReceivable)}</p>
                          <p className="text-xs text-gray-400">Vencido: {formatCurrency(statistics.overdueReceivable)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">Pago Este Mês</p>
                          <p className="text-xl font-bold text-blue-700">{formatCurrency(statistics.paidThisMonth)}</p>
                          <p className="text-xs text-gray-400">Mês atual</p>
                        </CardContent>
                      </Card>
                      <Card className={`border-0 rounded-none ${statistics.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500">Saldo Projetado</p>
                          <p className={`text-xl font-bold ${statistics.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(statistics.balance)}
                          </p>
                          <p className="text-xs text-gray-400">A Receber - A Pagar</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Filters */}
                    <Card className="rounded-none mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="w-5 h-5" />
                          Filtros
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label>Buscar</Label>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Código ou descrição..."
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label>Tipo</Label>
                              <Select value={filterType} onValueChange={(v: 'all' | 'payable' | 'receivable' | 'cost-entries') => setFilterType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="payable">A Pagar</SelectItem>
                                  <SelectItem value="receivable">A Receber</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select value={filterStatus} onValueChange={(v: EntryStatus | 'all') => setFilterStatus(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="Pending">Pendente</SelectItem>
                                  <SelectItem value="Overdue">Vencido</SelectItem>
                                  <SelectItem value="AwaitingAuthorization">Aguardando Autorização</SelectItem>
                                  <SelectItem value="Paid">Pago</SelectItem>
                                  <SelectItem value="Cancelled">Cancelado</SelectItem>
                                  <SelectItem value="Invoiced">Faturado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Data Início</Label>
                              <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                            </div>
                            <div>
                              <Label>Data Fim</Label>
                              <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                              Filtrar por vínculo
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <Label>Turma</Label>
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {classes.map(c => (
                                      <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Fornecedor</Label>
                                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {suppliers.map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Empresa</Label>
                                <Select value={filterCompany} onValueChange={setFilterCompany}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {companies.map(c => (
                                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Instrutor</Label>
                                <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {instructors.map(i => (
                                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                        {hasActiveFilters && (
                          <div className="mt-4">
                            <Button variant="outline" size="sm" onClick={clearFilters}>Limpar Filtros</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* ═══════ TAB: TODOS ═══════ */}
                    <TabsContent value="all" className="mt-0 space-y-4">
                      {groupedEntries.length === 0 ? (
                        <Card className="rounded-none">
                          <CardContent className="py-8 text-center text-gray-500">
                            Nenhum lançamento encontrado
                          </CardContent>
                        </Card>
                      ) : (
                        groupedEntries.map(group => (
                          <EntryCard
                            key={group.groupId}
                            group={group}
                            students={students}
                            instructors={instructors}
                            classes={classes}
                            suppliers={suppliers}
                            selectionMode={selectionMode}
                            isSelected={selectedEntries.has(group.entries[0].id)}
                            onToggleSelect={() => toggleSelection(group.entries[0].id)}
                            onViewDetails={(entry) => { setSelectedEntry(entry); setDetailsDialogOpen(true); }}
                            onMarkAsPaid={openSinglePaymentFlow}
                            onSettleGroup={openGroupPaymentFlow}
                          />
                        ))
                      )}
                    </TabsContent>

                    {/* ═══════ TAB: A PAGAR ═══════ */}
                    <TabsContent value="payable" className="mt-0 space-y-4">
                      {/* Batch Selection Controls */}
                      {groupedEntries.filter(g => g.type === 'payable' && g.status !== 'Paid' && g.status !== 'Cancelled').length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="font-semibold text-orange-800">Autorização em Lote</p>
                              <p className="text-sm text-orange-600">
                                {selectionMode
                                  ? `${selectedEntries.size} lançamento(s) selecionado(s)`
                                  : 'Selecione múltiplos lançamentos do mesmo fornecedor'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!selectionMode ? (
                              <Button onClick={() => setSelectionMode(true)} className="bg-orange-600 hover:bg-orange-700">
                                <CheckSquare className="w-4 h-4 mr-2" />
                                Habilitar Seleção
                              </Button>
                            ) : (
                              <>
                                <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedEntries(new Set()); }}>
                                  <X className="w-4 h-4 mr-2" />
                                  Cancelar
                                </Button>
                                <Button
                                  disabled={selectedEntries.size === 0}
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={openSelectionBatchAuthorization}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Autorizar {selectedEntries.size} Lançamento(s)
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {groupedEntries.filter(g => g.type === 'payable').length === 0 ? (
                        <Card className="rounded-none">
                          <CardContent className="py-8 text-center text-gray-500">
                            Nenhum lançamento a pagar encontrado
                          </CardContent>
                        </Card>
                      ) : (
                        groupedEntries.filter(g => g.type === 'payable').map(group => (
                          <EntryCard
                            key={group.groupId}
                            group={group}
                            students={students}
                            instructors={instructors}
                            classes={classes}
                            suppliers={suppliers}
                            selectionMode={selectionMode}
                            isSelected={selectedEntries.has(group.entries[0].id)}
                            onToggleSelect={() => toggleSelection(group.entries[0].id)}
                            onViewDetails={(entry) => { setSelectedEntry(entry); setDetailsDialogOpen(true); }}
                            onMarkAsPaid={openSinglePaymentFlow}
                            onSettleGroup={openGroupPaymentFlow}
                          />
                        ))
                      )}
                    </TabsContent>

                    {/* ═══════ TAB: A RECEBER ═══════ */}
                    <TabsContent value="receivable" className="mt-0 space-y-4">
                      {groupedEntries.filter(g => g.type === 'receivable').length === 0 ? (
                        <Card className="rounded-none">
                          <CardContent className="py-8 text-center text-gray-500">
                            Nenhum lançamento a receber encontrado
                          </CardContent>
                        </Card>
                      ) : (
                        groupedEntries.filter(g => g.type === 'receivable').map(group => (
                          <EntryCard
                            key={group.groupId}
                            group={group}
                            students={students}
                            instructors={instructors}
                            classes={classes}
                            suppliers={suppliers}
                            selectionMode={false}
                            isSelected={false}
                            onToggleSelect={() => {
                              toast.info('Seleção em lote disponível na aba A Pagar.');
                            }}
                            onViewDetails={(entry) => { setSelectedEntry(entry); setDetailsDialogOpen(true); }}
                            onMarkAsPaid={openSinglePaymentFlow}
                            onSettleGroup={openGroupPaymentFlow}
                          />
                        ))
                      )}
                    </TabsContent>

                    {/* ═══════ TAB: LANÇAMENTOS ═══════ */}
                    <TabsContent value="cost-entries" className="mt-0 space-y-4">
                      <Card className="rounded-none">
                        <CardHeader>
                          <CardTitle>Lançamentos de Custos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-500">
                            {costEntries.length} lançamentos de custos no sistema
                          </p>
                        </CardContent>
                      </Card>

                      <CostEntriesTab
                        costEntries={costEntriesUi}
                        auditableCosts={auditableCostsUi}
                        students={studentsUi}
                        instructors={instructorsUi}
                        classes={classesUi}
                        costCriteria={costCriteriaUi}
                        formatValue={formatCurrency}
                        formatDate={formatDate}
                        onDeleteEntry={deleteCostEntry}
                      />
                    </TabsContent>

                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      {authorizePaymentEntryId && (
        <AuthorizePaymentDialog
          open={authorizePaymentOpen}
          onOpenChange={(open) => {
            setAuthorizePaymentOpen(open);
            if (!open) setAuthorizePaymentEntryId(null);
          }}
          lancamento={(() => {
            const entry = financialEntries.find(
              (item) => item.id === authorizePaymentEntryId
            );
            return {
              id: authorizePaymentEntryId,
              codigo: entry?.code ?? '',
              descricao: entry?.description ?? '',
              valor: entry?.value ?? 0,
              status: entry?.status ?? 'Pending',
            };
          })()}
          onAutorizar={(dados) => {
            const entry = costEntries.find(
              (item) => item.id === dados.lancamentoId
            );
            if (!entry) {
              toast.error('Lançamento não encontrado para autorização.');
              return;
            }

            const today = new Date().toISOString().split('T')[0];
            const valorAutorizado =
              dados.tipoPagamento === 'parcial'
                ? Number(dados.valorPago ?? 0)
                : entry.value;

            updateCostEntry(entry.id, {
              notes: upsertPaymentAuthorization(entry.notes, {
                tipoPagamento: dados.tipoPagamento,
                valorAutorizado,
                notaFiscal: dados.notaFiscal,
                notaFiscalArquivoNome: dados.notaFiscalArquivo?.name,
                notaFiscalArquivoTamanho: dados.notaFiscalArquivo?.size,
                notaFiscalArquivoTipo: dados.notaFiscalArquivo?.type,
                authorizedAt: today,
              }),
            });
          }}
        />
      )}

      {batchPaymentOpen && (
        <BatchPaymentDialog
          open={batchPaymentOpen}
          onOpenChange={(open) => {
            setBatchPaymentOpen(open);
            if (!open) setBatchPaymentGroupId(null);
          }}
          fornecedorNome={(() => {
            if (batchPaymentGroupId === '__selection__') {
              const selected = Array.from(selectedEntries)
                .map((id) => financialEntries.find((item) => item.id === id))
                .filter(Boolean) as FinancialEntry[];
              const supplierId = selected[0]?.supplierId;
              return (
                suppliers.find((s) => s.id === supplierId)?.name ?? 'Fornecedor'
              );
            }

            const group = groupedEntries.find(
              (g) => g.groupId === batchPaymentGroupId
            );
            const supplierId = group?.entries[0]?.supplierId;
            return (
              suppliers.find((s) => s.id === supplierId)?.name ?? 'Fornecedor'
            );
          })()}
          lancamentos={(() => {
            if (batchPaymentGroupId === '__selection__') {
              const selected = Array.from(selectedEntries)
                .map((id) => financialEntries.find((item) => item.id === id))
                .filter(Boolean) as FinancialEntry[];
              return selected.map((entry) => ({
                id: entry.id,
                codigo: entry.code,
                descricao: entry.description,
                valor: entry.value,
              }));
            }

            const group = groupedEntries.find(
              (g) => g.groupId === batchPaymentGroupId
            );
            return (group?.entries ?? []).map((entry) => ({
              id: entry.id,
              codigo: entry.code,
              descricao: entry.description,
              valor: entry.value,
            }));
          })()}
          onAutorizar={(dados) => {
            const today = new Date().toISOString().split('T')[0];

            dados.lancamentosIds.forEach((id) => {
              const entry = costEntries.find((item) => item.id === id);
              if (!entry) return;

              const valorAutorizado =
                dados.tipoPagamento === 'parcial'
                  ? Number(dados.valorPagoPorLancamento?.[id] ?? 0)
                  : entry.value;

              updateCostEntry(entry.id, {
                notes: upsertPaymentAuthorization(entry.notes, {
                  tipoPagamento: dados.tipoPagamento,
                  valorAutorizado,
                  notaFiscal: dados.notaFiscal,
                  notaFiscalArquivoNome: dados.notaFiscalArquivo?.name,
                  notaFiscalArquivoTamanho: dados.notaFiscalArquivo?.size,
                  notaFiscalArquivoTipo: dados.notaFiscalArquivo?.type,
                  authorizedAt: today,
                }),
              });
            });

            if (batchPaymentGroupId === '__selection__') {
              setSelectedEntries(new Set());
              setSelectionMode(false);
            }
          }}
        />
      )}

      {confirmPaymentInfo && (
        <ConfirmPaymentDialog
          open={confirmPaymentOpen}
          onOpenChange={(open) => {
            setConfirmPaymentOpen(open);
            if (!open) {
              setConfirmPaymentTargetIds([]);
              setConfirmPaymentInfo(null);
            }
          }}
          costEntry={confirmPaymentInfo}
          onConfirm={({ paymentDate, paymentMethod }) => {
            confirmPaymentTargetIds.forEach((id) => {
              payCostEntry(id, paymentDate);

              const existing = costEntries.find((item) => item.id === id);
              if (!existing) return;

              const cleaned = stripPaymentAuthorization(existing.notes);
              const paymentLine = `Pagamento confirmado: ${paymentMethod} em ${paymentDate}`;
              const nextNotes = cleaned ? `${cleaned}\n${paymentLine}` : paymentLine;

              updateCostEntry(id, { notes: nextNotes });
            });

            setDetailsDialogOpen(false);
          }}
        />
      )}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
            <DialogDescription>Informações completas do lançamento financeiro</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Código</Label>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Descrição</Label>
                <p className="font-semibold">{selectedEntry.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Tipo</Label>
                  <p className={`font-bold ${selectedEntry.type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedEntry.type === 'payable' ? 'A Pagar' : 'A Receber'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Valor</Label>
                  <p className="font-bold text-lg">{formatCurrency(selectedEntry.value)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Vencimento</Label>
                  <p className="font-semibold">{formatDate(selectedEntry.dueDate)}</p>
                </div>
                {selectedEntry.paidAt && (
                  <div>
                    <Label className="text-gray-500">Data do Pagamento</Label>
                    <p className="font-semibold text-green-600">{formatDate(selectedEntry.paidAt)}</p>
                  </div>
                )}
              </div>
              {selectedEntry.invoiceNumber && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Label className="text-gray-500">🧾 Número da Nota Fiscal</Label>
                  <p className="font-bold text-lg text-blue-700">{selectedEntry.invoiceNumber}</p>
                </div>
              )}
              {selectedEntry.notes && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Label className="text-gray-500">📋 Observações</Label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedEntry.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openStatusDialog(selectedEntry)}>
                  <Edit className="w-4 h-4 mr-2" />Editar Status
                </Button>
                {selectedEntry.status !== 'Paid' && selectedEntry.status !== 'Cancelled' && (
                  <>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => openSinglePaymentFlow(selectedEntry.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      {selectedEntry.status === 'AwaitingAuthorization'
                        ? 'Confirmar Pagamento'
                        : 'Autorizar Pagamento'}
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleCancel(selectedEntry.id)}>
                      <X className="w-4 h-4 mr-2" />Cancelar Lançamento
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeStatusDialog();
            return;
          }
          setStatusDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Status do Lançamento</DialogTitle>
            <DialogDescription>Alterar o status e data de pagamento</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Código</Label>
                  <p className="font-bold">{selectedEntry.code}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Novo Status</Label>
                  <Select value={newStatus} onValueChange={(v: EntryStatus) => setNewStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pendente</SelectItem>
                      <SelectItem value="Overdue">Vencido</SelectItem>
                      <SelectItem value="AwaitingAuthorization">Aguardando Autorização</SelectItem>
                      <SelectItem value="Paid">Pago</SelectItem>
                      <SelectItem value="Cancelled">Cancelado</SelectItem>
                      <SelectItem value="Invoiced">Faturado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newStatus === 'Paid' && (
                  <div>
                    <Label>Data do Pagamento</Label>
                    <Input type="date" value={newPaidAt} onChange={(e) => setNewPaidAt(e.target.value)} />
                  </div>
                )}
              </div>

              {newStatus === 'Paid' && selectedEntry.type === 'payable' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    PIN Master *
                  </Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={statusPin}
                    onChange={(e) => setStatusPin(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-gray-500">
                    Para marcar como pago, confirme com o PIN do usuário Master
                  </p>
                  {!isStatusPinConfigured && (
                    <p className="text-xs text-red-600">
                      PIN Master não configurado
                    </p>
                  )}
                  {isStatusPinConfigured && statusPin.length > 0 && !isStatusPinCorrect && (
                    <p className="text-xs text-red-600">
                      PIN incorreto
                    </p>
                  )}
                  {isStatusPinConfigured && statusPin.length > 0 && isStatusPinCorrect && (
                    <p className="text-xs text-green-600">
                      PIN correto
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveStatus}
                  disabled={requiresStatusPin && !isStatusPinCorrect}
                >
                  <Check className="w-4 h-4 mr-2" />Salvar
                </Button>
                <Button variant="outline" onClick={closeStatusDialog}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// ENTRY CARD COMPONENT
// ============================================

interface EntryCardProps {
  group: GroupedEntry;
  students: Student[];
  instructors: Instructor[];
  classes: Class[];
  suppliers: Supplier[];
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onViewDetails: (entry: FinancialEntry) => void;
  onMarkAsPaid: (entryId: string) => void;
  onSettleGroup: (group: GroupedEntry) => void;
}

function EntryCard({
  group,
  students,
  instructors,
  classes,
  suppliers,
  selectionMode,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onMarkAsPaid,
  onSettleGroup,
}: EntryCardProps) {
  const entry = group.entries[0];
  if (!entry) return null;

  const supplier = suppliers.find((s: Supplier) => s.id === entry.supplierId);
  const classInfo = classes.find((c: Class) => c.id === entry.classId);
  const student = students.find((s: Student) => s.id === entry.studentId);
  const instructor = instructors.find((i: Instructor) => i.id === entry.instructorId);

  const mapStatusToPt = (
    status: EntryStatus,
  ): 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao' => {
    switch (status) {
      case 'Paid':
        return 'pago';
      case 'Overdue':
        return 'vencido';
      case 'Cancelled':
        return 'cancelado';
      case 'Invoiced':
        return 'faturado';
      case 'AwaitingAuthorization':
        return 'aguardando-autorizacao';
      case 'Pending':
      default:
        return 'pendente';
    }
  };

  const mapTypeToPt = (type: EntryType): 'pagar' | 'receber' =>
    type === 'payable' ? 'pagar' : 'receber';

  const shouldShowSelection =
    selectionMode && entry.status !== 'Paid' && entry.status !== 'Cancelled';

  // Se o lançamento já vem agrupado com detalhamento (isGrouped), use o card dedicado.
  // Obs: o card agrupado não suporta o status "Faturado"; nesse caso, mantém o fluxo normal.
  if (entry.isGrouped && entry.status !== 'Invoiced') {
    const costName = (entry.description || '').split(' - ')[0] || entry.description;

    const detalhamento = (entry.groupDetails || []).map((detail) => ({
      codigo: detail.code,
      data: formatDate(detail.date),
      valor: detail.value,
      descricao: entry.description,
      observacoes: detail.notes,
    }));

    const groupedLaunch = {
      id: entry.id,
      codigo: entry.code,
      descricao: entry.description,
      valor: entry.value,
      dataVencimento: entry.dueDate,
      status: mapStatusToPt(entry.status) as
        | 'pendente'
        | 'vencido'
        | 'pago'
        | 'cancelado'
        | 'aguardando-autorizacao',
      agrupado: true,
      detalhamento,
      fornecedorNome: supplier?.name,
      alunoNome: student?.name,
      alunocodigo: student?.code,
      turmacodigo: classInfo?.code,
      custoNome: costName,
      instrutorNome: instructor?.name,
      instrutorCodigo: instructor?.code,
    };

    return (
      <div
        className={`flex items-start gap-3 ${
          selectionMode && isSelected
            ? 'bg-orange-50 border border-orange-300 rounded-lg'
            : ''
        }`}
      >
        {shouldShowSelection && (
          <div className="cursor-pointer pt-2" onClick={onToggleSelect}>
            {isSelected ? (
              <CheckSquare className="w-6 h-6 text-orange-600" />
            ) : (
              <Square className="w-6 h-6 text-gray-400" />
            )}
          </div>
        )}
        <div className="flex-1">
          <GroupedEntryCard
            lancamento={groupedLaunch}
            onVerDetalhes={() => onViewDetails(entry)}
            onDarBaixa={() => onMarkAsPaid(entry.id)}
            formatarValor={formatCurrency}
            formatarData={formatDate}
            hideActions={selectionMode}
          />
        </div>
      </div>
    );
  }

  type StudentWithPersonType = Student & {
    personType?: 'individual' | 'company';
  };
  type InstructorWithCodes = Instructor & {
    code?: string;
    codigoSistema?: string;
  };
  type ClassWithCourseNames = Class & {
    courseName?: string;
    nomeCurso?: string;
  };

  const componentStudents = students.map((s) => {
    const rawPersonType = (s as StudentWithPersonType).personType;
    const personType: 'PF' | 'PJ' | undefined =
      rawPersonType === 'company'
        ? 'PJ'
        : rawPersonType === 'individual'
          ? 'PF'
          : undefined;

    return {
      id: s.id,
      name: s.name,
      code: s.code,
      personType,
    };
  });

  const componentInstructors = instructors.map((i) => ({
    id: i.id,
    name: i.name,
    code:
      (i as InstructorWithCodes).code ??
      (i as InstructorWithCodes).codigoSistema ??
      i.id,
  }));

  const componentClasses = classes.map((c) => ({
    id: c.id,
    code: c.code,
    courseName:
      (c as ClassWithCourseNames).courseName ??
      (c as ClassWithCourseNames).nomeCurso ??
      '',
  }));

  const componentEntries = group.entries.map((e) => ({
    id: e.id,
    code: e.code,
    type: mapTypeToPt(e.type),
    description: e.description,
    amount: e.value,
    dueDate: e.dueDate,
    paidDate: e.paidAt,
    status: mapStatusToPt(e.status),
    studentId: e.studentId,
    companyId: e.companyId,
    instructorId: e.instructorId,
    supplierId: e.supplierId,
    classId: e.classId,
    invoiceNumber: e.invoiceNumber,
    notes: e.notes,
  }));

  const componentGroup = {
    code: group.code,
    groupId: group.groupId,
    entries: componentEntries,
    isBatch: group.isLot && group.entries.length > 1,
    isDailyGroup: group.isDailyGroup && group.entries.length > 1,
    totalAmount: group.totalValue,
    type: mapTypeToPt(group.type),
    status: mapStatusToPt(group.status),
    dueDate: group.dueDate,
    paidDate: group.paidAt,
    invoiceNumber: group.invoiceNumber,
  };

  return (
    <div
      className={`flex items-start gap-3 ${
        selectionMode && isSelected ? 'bg-orange-50 border border-orange-300 rounded-lg' : ''
      }`}
    >
      {shouldShowSelection && (
        <div className="cursor-pointer pt-2" onClick={onToggleSelect}>
          {isSelected ? (
            <CheckSquare className="w-6 h-6 text-orange-600" />
          ) : (
            <Square className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      <div className="flex-1">
        <FinancialBatchCard
          group={componentGroup}
          students={componentStudents}
          instructors={componentInstructors}
          classes={componentClasses}
          onViewDetails={(e) => {
            const original = group.entries.find((item) => item.id === e.id);
            if (original) onViewDetails(original);
          }}
          onSettle={() => onSettleGroup(group)}
          formatValue={formatCurrency}
          formatDate={formatDate}
          hideActions={selectionMode}
        />
      </div>
    </div>
  );
}
