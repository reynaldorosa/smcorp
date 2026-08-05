'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  LogOut,
  Upload,
  Users,
  BookOpen,
  Calendar,
  Download,
  UserPlus,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCompaniesStore, type Company, type CompanyPricing } from '@/stores/companies.store';
import { useClassesStore, type Class } from '@/stores/classes.store';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { studentsService } from '@/services/students.service';
import { enrollmentOperations } from '@/services/operations.service';
import type { ExtraProduct } from '@/types';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { ApproveImportedStudentsDialog } from '@/components/operational/dialogs';
import type { StudentToApprove } from '@/components/operational/dialogs/approve-imported-students-dialog';
import { useAuthStore } from '@/stores/auth.store';
import * as XLSX from 'xlsx';

// ============================================
// Types
// ============================================

interface PortalSession {
  id: string;
  code?: string;
  name: string;
  companyTaxId?: string;
}

interface ParsedStudent {
  name: string;
  taxId: string;
  rg?: string;
  birthDate?: string;
  phone?: string;
  email: string;
  address?: string;
  approved: boolean;
}

interface ApprovalStudent extends ParsedStudent {
  classId: string;
  selectedProductIds: string[];
}

// ============================================
// Helpers
// ============================================

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================
// Main Component
// ============================================

export default function PortalClienteDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { companies } = useCompaniesStore();
  const { classes } = useClassesStore();
  const { students, addStudent, updateStudent } = useStudentsStore();
  const { courses } = useCoursesStore();
  const { extraProducts } = useSettingsStore();

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('portalClienteLogado');
    logout();
    toast.info('Você saiu do portal.');
    router.push('/portal-cliente');
  }, [logout, router]);

  // Session state
  const [portalSession, setPortalSession] = useState<PortalSession | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = usePersistedState('portal-cliente-active-tab', 'import');

  const createCompanyFallback = useCallback((session: PortalSession): Company => {
    const now = new Date().toISOString();
    return {
      id: session.id,
      code: session.code || `EMP-${session.id.slice(0, 8).toUpperCase()}`,
      name: session.name,
      companyTaxId: session.companyTaxId || '',
      portalAccess: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  // Dialog states
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importClassDialogOpen, setImportClassDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [actionClassId, setActionClassId] = useState<string>('');

  // Approval workflow states
  const [studentsToApprove, setStudentsToApprove] = useState<ApprovalStudent[]>([]);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalClassName, setApprovalClassName] = useState('');
  const [approvalClassId, setApprovalClassId] = useState('');

  // New student form
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    taxId: '',
    rg: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
  });

  // Load session from sessionStorage
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT_PJ') {
      router.push('/portal-cliente');
      return;
    }

    const stored = sessionStorage.getItem('portalClienteLogado');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PortalSession;
        if (!parsed?.id) {
          handleLogout();
          return;
        }
        setPortalSession(parsed);

        const fullCompany = companies.find((c) => c.id === parsed.id);
        if (fullCompany) {
          setCompany(fullCompany);
        } else {
          setCompany(createCompanyFallback(parsed));
        }
      } catch {
        handleLogout();
      }
    } else {
      router.push('/portal-cliente');
    }
  }, [companies, router, handleLogout, createCompanyFallback, isAuthenticated, user?.role]);

  // Compute pricing-filtered data
  const companyData = useMemo(() => {
    if (!portalSession || !company)
      return { classes: [] as Class[], students: [] as Student[], totalStudents: 0, activePricings: [] as CompanyPricing[], pricedCourseIds: [] as string[] };

    // Get active pricings for this company
    const activePricings = company.pricing?.filter((p) => p.finalPrice > 0) || [];
    const pricedCourseIds = activePricings.map((p) => p.courseId);

    // Filter classes by courses that have pricing for this company
    const filteredClasses =
      pricedCourseIds.length > 0
        ? classes.filter(
            (c) =>
              pricedCourseIds.includes(c.courseId) &&
              (c.status === 'Planned' || c.status === 'Confirmed' || c.status === 'InProgress')
          )
        : classes.filter(
            (c) => c.status === 'Planned' || c.status === 'Confirmed' || c.status === 'InProgress'
          );

    // Filter students belonging to this company
    const companyStudents = students.filter(
      (s) => s.companyId === portalSession.id && !s.isReplaced
    );

    return {
      classes: filteredClasses,
      students: companyStudents,
      totalStudents: companyStudents.length,
      activePricings,
      pricedCourseIds,
    };
  }, [portalSession, company, students, classes]);

  const getCompanyPricing = useCallback(
    (courseId: string): CompanyPricing | undefined => {
      return company?.pricing?.find((p) => p.courseId === courseId && p.active !== false);
    },
    [company]
  );

  const getRequiredProductIds = useCallback(
    (courseId: string): string[] => {
      const pricing = getCompanyPricing(courseId);
      if (pricing?.includedProductIds && pricing.includedProductIds.length > 0) {
        return pricing.includedProductIds;
      }
      const course = courses.find((c) => c.id === courseId);
      return course?.linkedProducts || [];
    },
    [courses, getCompanyPricing]
  );

  const getProductsForCourse = useCallback(
    (courseId: string): ExtraProduct[] => {
      const pricing = getCompanyPricing(courseId);
      const course = courses.find((c) => c.id === courseId);
      const linkedIds = pricing?.includedProductIds && pricing.includedProductIds.length > 0
        ? pricing.includedProductIds
        : [...(course?.linkedProducts || []), ...(course?.linkedExtras || [])];

      return linkedIds
        .map((productId) => {
          const product = extraProducts.find((p) => p.id === productId);
          return product || null;
        })
        .filter((item): item is ExtraProduct => !!item);
    },
    [courses, extraProducts, getCompanyPricing]
  );

  const calculateProductsTotal = useCallback(
    (productIds: string[], courseId: string): number => {
      const products = getProductsForCourse(courseId);
      const total = productIds.reduce((sum, productId) => {
        const product = products.find((p) => p.id === productId);
        return sum + (product?.price || 0);
      }, 0);

      if (total > 0) return total;

      const pricing = getCompanyPricing(courseId);
      const course = courses.find((c) => c.id === courseId);
      return pricing?.finalPrice || course?.price || 0;
    },
    [courses, getCompanyPricing, getProductsForCourse]
  );

  const startApprovalFlow = useCallback(
    (queue: ApprovalStudent[], classId: string, className: string) => {
      setStudentsToApprove(queue);
      setApprovalClassId(classId);
      setApprovalClassName(className);
      setApprovalDialogOpen(true);
    },
    []
  );

  const buildApprovalStudent = useCallback(
    (data: ParsedStudent, classId: string): ApprovalStudent => {
      const classInfo = classes.find((c) => c.id === classId);
      const courseId = classInfo?.courseId || '';
      const requiredProductIds = courseId ? getRequiredProductIds(courseId) : [];
      const selectedProductIds = requiredProductIds.length > 0 ? requiredProductIds : [];

      return {
        ...data,
        classId,
        selectedProductIds,
      };
    },
    [classes, getRequiredProductIds]
  );

  const approvalCourseId = useMemo(() => {
    const classInfo = classes.find((c) => c.id === approvalClassId);
    return classInfo?.courseId || '';
  }, [approvalClassId, classes]);

  const approvalProducts = useMemo(() => {
    if (!approvalCourseId) return [] as ExtraProduct[];
    return getProductsForCourse(approvalCourseId);
  }, [approvalCourseId, getProductsForCourse]);

  // Get course pricing for this company
  const getCoursePricing = useCallback(
    (courseId: string): CompanyPricing | undefined => {
      return company?.pricing?.find((p) => p.courseId === courseId);
    },
    [company]
  );

  // Add student
  const handleAddStudent = () => {
    const classId = actionClassId || selectedClassId;
    if (!classId || !portalSession) {
      toast.error('Selecione uma turma primeiro.');
      return;
    }

    if (!newStudentForm.name || !newStudentForm.taxId || !newStudentForm.email) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    // Check for duplicate CPF in same class
    const duplicate = students.find(
      (s) =>
        s.taxId === newStudentForm.taxId.replace(/\D/g, '') &&
        s.classId === classId &&
        !s.isReplaced
    );
    if (duplicate) {
      toast.error('Já existe um aluno com este CPF matriculado nesta turma.');
      return;
    }

    const targetClass = classes.find((c) => c.id === classId);
    const course = targetClass ? courses.find((c) => c.id === targetClass.courseId) : null;

    const approvalStudent = buildApprovalStudent(
      {
        name: newStudentForm.name,
        taxId: newStudentForm.taxId,
        rg: newStudentForm.rg || undefined,
        birthDate: newStudentForm.birthDate || undefined,
        phone: newStudentForm.phone || undefined,
        email: newStudentForm.email,
        address: newStudentForm.address || undefined,
        approved: true,
      },
      classId
    );

    const className = `${targetClass?.code || ''} - ${course?.name || ''}`.trim();
    startApprovalFlow([approvalStudent], classId, className);
    toast.info(`📋 Aluno ${newStudentForm.name} aguardando aprovação.`);
    setNewStudentForm({ name: '', taxId: '', rg: '', birthDate: '', phone: '', email: '', address: '' });
    setAddStudentDialogOpen(false);
    setActionClassId('');
  };

  // Download template for a specific class
  const handleDownloadTemplate = (classId?: string) => {
    const targetId = classId || selectedClassId;
    if (!targetId) {
      toast.error('Selecione uma turma primeiro.');
      return;
    }

    const targetClass = classes.find((c) => c.id === targetId);
    const course = targetClass ? courses.find((c) => c.id === targetClass.courseId) : null;

    const infoRow = [
      `TEMPLATE DE IMPORTAÇÃO - ${targetClass?.code || ''} - ${course?.name || ''}`,
      `Empresa: ${company?.name || 'N/A'}`,
      `Período: ${formatDate(targetClass?.startDate || '')} a ${formatDate(targetClass?.endDate || '')}`,
      `Horário: ${targetClass?.schedule || 'A definir'}`,
      'EXCLUA ESTA LINHA',
      'ANTES DE IMPORTAR',
      '',
    ];
    const header = ['nome', 'cpf', 'rg', 'dataNascimento', 'telefone', 'email', 'endereco'];
    const formatRow = [
      '>>> FORMATO DOS DADOS <<<',
      '000.000.000-00',
      '00.000.000-0',
      'DD/MM/AAAA',
      '(00) 00000-0000',
      'nome@empresa.com',
      'Rua Nome 000 - Cidade UF',
    ];
    const example1 = ['João Silva', '000.000.000-00', '00.000.000-0', '01/01/1990', '(11) 99999-9999', 'joao@empresa.com', 'Rua Principal 123'];
    const example2 = ['Maria Santos', '111.111.111-11', '11.111.111-1', '15/03/1985', '(11) 88888-8888', 'maria@empresa.com', 'Av. Central 456'];

    const csv = [infoRow, header, formatRow, example1, example2].map((row) => row.join(';')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_students_${targetClass?.code || 'class'}_${course?.name?.replace(/[^a-zA-Z0-9]/g, '_') || ''}.csv`;
    link.click();

    toast.success('Template baixado! Preencha e importe.');
  };

  // Process CSV file import → sends to approval queue (like Figma flow)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const classId = actionClassId || selectedClassId;
    if (!classId || !portalSession) {
      toast.error('Selecione uma turma primeiro.');
      return;
    }

    const normalize = (value: unknown) => String(value || '').trim();
    const normalizeHeader = (value: unknown) => normalize(value).toLowerCase();

    const parseStudentRows = (rows: Array<Array<string | number>>): ApprovalStudent[] => {
      const headerIdx = rows.findIndex(
        (row) => row.some((cell) => normalizeHeader(cell) === 'nome') && row.some((cell) => normalizeHeader(cell) === 'cpf')
      );
      if (headerIdx === -1) {
        toast.error('Formato inválido. Linha de cabeçalho com "nome" e "cpf" não encontrada.');
        return [];
      }

      const headers = rows[headerIdx].map((cell) => normalizeHeader(cell));
      const dataRows = rows.slice(headerIdx + 1);

      const parsed: ApprovalStudent[] = [];
      let parseErrors = 0;

      dataRows.forEach((row) => {
        if (!row || row.length === 0) return;

        const rowText = row.map((cell) => normalize(cell)).join(' ').toUpperCase();
        if (rowText.includes('EXCLUA ESTA LINHA') || rowText.includes('FORMATO DOS DADOS') || rowText.includes('EXEMPLO')) {
          return;
        }

        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (!header) return;
          record[header] = normalize(row[index]);
        });

        if (!record['nome'] || !record['cpf'] || !record['email']) {
          parseErrors++;
          return;
        }

        const taxIdClean = record['cpf'].replace(/\D/g, '');
        const exists = students.find((s) => s.taxId === taxIdClean && s.classId === classId && !s.isReplaced);
        if (exists) {
          parseErrors++;
          return;
        }

        const duplicateInBatch = parsed.find((p) => p.taxId.replace(/\D/g, '') === taxIdClean);
        if (duplicateInBatch) {
          parseErrors++;
          return;
        }

        parsed.push(
          buildApprovalStudent(
            {
              name: record['nome'],
              taxId: record['cpf'],
              rg: record['rg'] || undefined,
              birthDate: record['datanascimento'] || undefined,
              phone: record['telefone'] || undefined,
              email: record['email'],
              address: record['endereco'] || undefined,
              approved: true,
            },
            classId
          )
        );
      });

      if (parseErrors > 0) {
        toast.error(`${parseErrors} linha(s) ignorada(s) (dados faltando ou duplicados).`);
      }

      return parsed;
    };

    const extension = file.name.split('.').pop()?.toLowerCase();
    let rows: Array<Array<string | number>> = [];

    if (extension === 'csv') {
      const text = await file.text();
      rows = text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.split(';').map((cell) => cell.trim()));
    } else if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = (XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as Array<Array<string | number>>)
        .filter((row) => row && row.length > 0);
    } else {
      toast.error('Formato inválido. Use arquivos .csv, .xlsx ou .xls.');
      if (e.target) e.target.value = '';
      return;
    }

    const parsed = parseStudentRows(rows);
    if (parsed.length === 0) {
      toast.error('Nenhum aluno válido encontrado na planilha.');
      if (e.target) e.target.value = '';
      return;
    }

    const targetClass = classes.find((c) => c.id === classId);
    const course = targetClass ? courses.find((c) => c.id === targetClass.courseId) : null;
    const className = `${targetClass?.code || ''} - ${course?.name || ''}`;

    startApprovalFlow(parsed, classId, className);
    setImportDialogOpen(false);
    setImportClassDialogOpen(false);

    toast.info(`📋 ${parsed.length} aluno(s) aguardando aprovação. Revise cada um individualmente.`);
    if (e.target) e.target.value = '';
  };

  const resetApprovalState = useCallback(() => {
    setStudentsToApprove([]);
    setApprovalClassName('');
    setApprovalClassId('');
    setApprovalDialogOpen(false);
    setActionClassId('');
  }, []);

  const approvalDialogStudents = useMemo((): StudentToApprove[] => {
    return studentsToApprove.map((student) => ({
      name: student.name,
      taxId: student.taxId,
      rg: student.rg || '',
      birthDate: student.birthDate || '',
      phone: student.phone || '',
      email: student.email,
      address: student.address || '',
      totalValue: 0,
      extraProductIds: student.selectedProductIds,
      classId: student.classId,
    }));
  }, [studentsToApprove]);

  const handleApproveImportedStudent = useCallback(
    async (approvedStudent: StudentToApprove) => {
      if (!portalSession) return;

      const targetClass = classes.find((c) => c.id === approvalClassId);
      const courseId = targetClass?.courseId || '';
      const courseProducts = courseId ? getProductsForCourse(courseId) : [];
      const selectedIds = Array.from(new Set(approvedStudent.extraProductIds || []));
      const selectedExtras = selectedIds.filter((productId) => {
        const product = courseProducts.find((item) => item.id === productId);
        return product?.type === 'extra';
      });

      const dialogTotal = Number(approvedStudent.totalValue || 0);
      const totalValue =
        dialogTotal > 0
          ? dialogTotal
          : courseId
            ? calculateProductsTotal(selectedIds, courseId)
            : 0;

      const now = new Date().toISOString();
      const codeSuffix = Math.random().toString(36).slice(2, 4).toUpperCase();

      const normalizedTaxId = approvedStudent.taxId.replace(/\D/g, '');
      let studentId: string | null = null;
      let studentCode = '';

      const existingLocal = students.find((student) => student.taxId === normalizedTaxId);

      if (existingLocal) {
        studentId = existingLocal.id;
        studentCode = existingLocal.code;
      } else {
        const createdStudent = await studentsService.create({
          name: approvedStudent.name,
          taxId: normalizedTaxId,
          rg: approvedStudent.rg || undefined,
          birthDate: approvedStudent.birthDate || undefined,
          phone: approvedStudent.phone || undefined,
          email: approvedStudent.email,
          address: approvedStudent.address || undefined,
          companyId: portalSession.id,
        });

        studentId = createdStudent.id;
        studentCode = createdStudent.code;

        addStudent({
          id: createdStudent.id,
          code: createdStudent.code || `ALU${Date.now().toString().slice(-6)}${codeSuffix}`,
          name: approvedStudent.name,
          taxId: normalizedTaxId,
          rg: approvedStudent.rg || undefined,
          birthDate: approvedStudent.birthDate || undefined,
          phone: approvedStudent.phone || undefined,
          email: approvedStudent.email,
          address: approvedStudent.address || undefined,
          classId: approvalClassId,
          companyId: portalSession.id,
          personType: 'company',
          totalValue,
          discount: 0,
          paymentComplete: false,
          documentsComplete: false,
          status: 'Active',
          linkStatus: 'Scheduled',
          studentStartDate: targetClass?.startDate,
          studentEndDate: targetClass?.endDate,
          extraProductIds: selectedExtras.length > 0 ? selectedExtras : undefined,
          notes: `Importado via planilha por ${company?.name || 'N/A'}`,
          createdAt: createdStudent.createdAt || now,
          updatedAt: createdStudent.updatedAt || now,
        });
      }

      if (!studentId) {
        throw new Error('Falha ao identificar aluno para matrícula');
      }

      await enrollmentOperations.create({
        studentId,
        classId: approvalClassId,
        observations: `Importado via planilha por ${company?.name || 'N/A'}`,
        extraProducts: selectedIds.map((extraProductId) => ({ extraProductId })),
      });

      updateStudent(studentId, {
        code: studentCode || `ALU${Date.now().toString().slice(-6)}${codeSuffix}`,
        classId: approvalClassId,
        companyId: portalSession.id,
        personType: 'company',
        totalValue,
        discount: 0,
        paymentComplete: false,
        documentsComplete: false,
        status: 'Active',
        linkStatus: 'Scheduled',
        studentStartDate: targetClass?.startDate,
        studentEndDate: targetClass?.endDate,
        extraProductIds: selectedExtras.length > 0 ? selectedExtras : undefined,
        notes: `Importado via planilha por ${company?.name || 'N/A'}`,
        updatedAt: new Date().toISOString(),
      });
    },
    [
      addStudent,
      approvalClassId,
      calculateProductsTotal,
      classes,
      company?.name,
      getProductsForCourse,
      portalSession,
      students,
      updateStudent,
    ]
  );

  const handleFinishImportedStudentsApproval = useCallback(
    (approvedCount: number, rejectedCount: number) => {
      if (approvedCount > 0) {
        toast.success(`✅ ${approvedCount} aluno(s) aprovado(s) e matriculado(s) com sucesso!`);
      } else {
        toast.info('Nenhum aluno aprovado para matrícula.');
      }

      if (rejectedCount > 0) {
        toast.info(`ℹ️ ${rejectedCount} aluno(s) rejeitado(s).`);
      }

      resetApprovalState();
    },
    [resetApprovalState]
  );

  if (!portalSession || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-600">
                  {company.tradeName || 'Área do Cliente'} - CNPJ:{' '}
                  {company.companyTaxId.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>

          {/* Pricing filter info banner */}
          {companyData.activePricings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Visualização Filtrada por Precificação</p>
                  <p className="text-xs text-blue-800">
                    Você visualiza apenas turmas dos cursos com precificação ativa cadastrada para sua empresa.
                    Atualmente: <strong>{companyData.activePricings.length} curso(s) contratado(s)</strong>
                    {' = '}<strong>{companyData.classes.length} turma(s) disponível(is)</strong>.
                    {companyData.classes.length === 0 && ' Não há turmas abertas para seus cursos no momento.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {companyData.activePricings.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <p className="font-semibold mb-1">Nenhum Curso Contratado</p>
                  <p className="text-xs text-yellow-800">
                    Sua empresa ainda não possui cursos com precificação ativa. Entre em contato com nossa equipe comercial para contratar cursos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600" />
                Cursos Contratados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{companyData.activePricings.length}</div>
              <p className="text-xs text-gray-500 mt-1">Com precificação ativa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                Turmas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{companyData.classes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Dos seus cursos contratados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                Alunos Matriculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{companyData.totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">Total de colaboradores</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="import">Importar Alunos</TabsTrigger>
            <TabsTrigger value="courses">Cursos Contratados</TabsTrigger>
            <TabsTrigger value="classes">Turmas Disponíveis</TabsTrigger>
            <TabsTrigger value="students">Meus Alunos</TabsTrigger>
          </TabsList>

          {/* Tab: Import Students */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Importar Alunos via Planilha</CardTitle>
                <CardDescription>
                  Faça upload de uma planilha CSV com os dados dos colaboradores para matricular em uma turma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Como importar seus colaboradores</h3>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li><strong>Selecione a turma</strong> primeiro (logo abaixo)</li>
                    <li><strong>Baixe o template</strong> com apenas os dados básicos</li>
                    <li><strong>Preencha os dados</strong> dos colaboradores seguindo o exemplo</li>
                    <li><strong>Faça upload</strong> da planilha preenchida</li>
                    <li><strong>Revise e aprove</strong> cada aluno individualmente antes da matrícula</li>
                  </ol>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-purple-800">
                      <strong>✨ PROCESSO SIMPLIFICADO:</strong> A planilha contém apenas dados básicos.
                      Os alunos poderão ser revisados visualmente durante a aprovação, oferecendo mais controle!
                    </p>
                  </div>
                </div>

                {/* Class Selection */}
                <div>
                  <Label>Selecione a Turma * (Primeiro Passo)</Label>
                  <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma turma disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyData.classes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhuma turma disponível
                        </SelectItem>
                      ) : (
                        companyData.classes.map((cls) => {
                          const course = courses.find((c) => c.id === cls.courseId);
                          const pricing = getCoursePricing(cls.courseId);
                          return (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.code} - {course?.name || 'N/A'} - {formatDate(cls.startDate)}
                              {pricing && ` - ${formatCurrency(pricing.finalPrice)}`}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione a turma para liberar o download do template personalizado
                  </p>
                </div>

                {/* Download Template Button */}
                <div>
                  <Button
                    onClick={() => handleDownloadTemplate()}
                    variant="outline"
                    className="w-full border-2 border-dashed"
                    disabled={!selectedClassId}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {selectedClassId ? 'Baixar Template Personalizado' : 'Selecione uma Turma Primeiro'}
                  </Button>
                </div>

                {/* Upload Button */}
                <div>
                  <Button
                    onClick={() => setImportDialogOpen(true)}
                    disabled={!selectedClassId}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload da Planilha Preenchida
                  </Button>
                </div>

                {/* Active Pricings Status */}
                {companyData.activePricings.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-sm mb-3">Suas Precificações Ativas</h3>
                    <div className="space-y-2">
                      {companyData.activePricings.map((pricing) => {
                        const course = courses.find((c) => c.id === pricing.courseId);
                        return (
                          <div key={pricing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">{course?.name || 'Curso N/A'}</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(pricing.finalPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contracted Courses */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Cursos Contratados</CardTitle>
                <CardDescription>
                  Cursos com precificação negociada para sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companyData.activePricings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum curso contratado ainda</p>
                    <p className="text-xs mt-1">Entre em contato com nossa equipe comercial para contratar cursos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {companyData.activePricings.map((pricing) => {
                      const course = courses.find((c) => c.id === pricing.courseId);
                      if (!course) return null;

                      return (
                        <Card key={pricing.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700">
                                    {course.code}
                                  </Badge>
                                  <span className="font-semibold text-gray-900">{course.name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                  {course.category && (
                                    <div>
                                      <span className="text-gray-500">Categoria: </span>
                                      <span className="text-gray-700">{course.category}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-500">Carga Horária: </span>
                                    <span className="text-gray-700">{course.duration}h</span>
                                  </div>
                                  {(course.startTime && course.endTime) && (
                                    <div>
                                      <span className="text-gray-500">Horário: </span>
                                      <span className="text-gray-700">{course.startTime} - {course.endTime}</span>
                                    </div>
                                  )}
                                  {pricing.notes && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">Observações: </span>
                                      <span className="text-gray-700">{pricing.notes}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Produtos Vinculados ao Curso */}
                                {(() => {
                                  const products = getProductsForCourse(course.id);
                                  if (products.length === 0) return null;
                                  return (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <p className="text-xs font-semibold text-gray-600 mb-2">📦 Produtos Vinculados:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {products.map((product) => (
                                          <Badge
                                            key={product.id}
                                            variant="outline"
                                            className={`text-xs ${
                                              product.type === 'extra'
                                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                            }`}
                                          >
                                            {product.name} — {formatCurrency(product.price)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-xs text-gray-500 mb-1">Valor Negociado</div>
                                <div className="text-xl font-bold text-green-600">
                                  {formatCurrency(pricing.finalPrice)}
                                </div>
                                {pricing.discountPercent && pricing.discountPercent > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {pricing.discountPercent}% de desconto
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Available Classes */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Turmas Disponíveis
                  <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                    {companyData.classes.length} turma(s)
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {companyData.activePricings.length > 0
                    ? 'Exibindo apenas turmas dos cursos com precificação ativa para sua empresa'
                    : 'Todas as turmas abertas disponíveis para matrícula'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyData.classes.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhuma turma disponível no momento.</p>
                      <p className="text-gray-400 text-xs mt-2">Apenas turmas de cursos com precificação ativa são exibidas aqui.</p>
                    </div>
                  ) : (
                    companyData.classes.map((cls) => {
                      const course = courses.find((c) => c.id === cls.courseId);
                      const pricing = getCoursePricing(cls.courseId);
                      const studentsInClass = companyData.students.filter((s) => s.classId === cls.id).length;

                      return (
                        <Card key={cls.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-xs font-semibold text-gray-500">{cls.code}</span>
                                  <span className="font-semibold text-gray-900">
                                    {cls.displayName || course?.name || 'N/A'}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      cls.status === 'Confirmed'
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : cls.status === 'InProgress'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : cls.status === 'Planned'
                                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                                        : 'bg-gray-50 border-gray-300 text-gray-700'
                                    }
                                  >
                                    {cls.status === 'Planned'
                                      ? 'Planejada'
                                      : cls.status === 'Confirmed'
                                      ? 'Confirmada'
                                      : cls.status === 'InProgress'
                                      ? 'Em Andamento'
                                      : cls.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                  <div>
                                    <span className="text-gray-500">Período: </span>
                                    <span className="text-gray-700">{formatDate(cls.startDate)} a {formatDate(cls.endDate)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Horário: </span>
                                    <span className="text-gray-700">{cls.schedule || 'A definir'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Vagas Disponíveis: </span>
                                    <span className="text-gray-700">{cls.availableSpots}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Matriculados: </span>
                                    <span className="text-gray-700">{studentsInClass} aluno(s)</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-xs text-gray-500 mb-1">Valor por Aluno</div>
                                <div className="text-xl font-bold text-green-600">
                                  {formatCurrency(pricing?.finalPrice || cls.price || 0)}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons per Class */}
                            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActionClassId(cls.id);
                                  setAddStudentDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Adicionar Aluno
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadTemplate(cls.id)}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Baixar Template
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActionClassId(cls.id);
                                  setImportClassDialogOpen(true);
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Importar Planilha
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: My Students */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores Matriculados</CardTitle>
                <CardDescription>
                  Todos os colaboradores da sua empresa matriculados em cursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyData.students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhum colaborador matriculado ainda.</p>
                      <p className="text-gray-400 text-xs mt-1">Use a aba &quot;Importar Alunos&quot; para matricular seus colaboradores.</p>
                      <Button className="mt-4" onClick={() => setActiveTab('import')}>
                        Ir para Importar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {companyData.students.map((student) => {
                        const studentClass = classes.find((c) => c.id === student.classId);
                        const course = studentClass ? courses.find((c) => c.id === studentClass.courseId) : null;
                        const isPaid = student.paymentComplete || (student.payments?.totalPaid || 0) >= student.totalValue;

                        return (
                          <Card key={student.id} className="border-gray-200">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {student.photoUrl ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                      <AspectRatio ratio={1}>
                                        <ImageWithFallback
                                          src={student.photoUrl}
                                          alt={student.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </AspectRatio>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-gray-500">
                                        {student.name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{student.name}</span>
                                      <span className="text-xs text-gray-500">({student.code})</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {course?.name || 'N/A'} - Turma {studentClass?.code || 'N/A'}
                                    </div>
                                    {student.isReplaced && student.replacedStudentId && (() => {
                                      const substitute = companyData.students.find((s) => s.id === student.replacedStudentId);
                                      return substitute ? (
                                        <div className="text-xs text-amber-600 mt-0.5">
                                          Substituído por: {substitute.name} ({substitute.code})
                                        </div>
                                      ) : null;
                                    })()}
                                    {!student.isReplaced && student.replacedStudentId && (() => {
                                      const original = companyData.students.find((s) => s.id === student.replacedStudentId);
                                      return original ? (
                                        <div className="text-xs text-blue-600 mt-0.5">
                                          Substituto de: {original.name} ({original.code})
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={isPaid ? 'bg-green-50 border-green-300 text-green-700' : 'bg-orange-50 border-orange-300 text-orange-700'}
                                  >
                                    {isPaid ? 'Pago' : 'Pendente'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={student.documentsComplete ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}
                                  >
                                    {student.documentsComplete ? 'Docs OK' : 'Docs Pendente'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={
                                      student.status === 'Active'
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : student.status === 'Pending'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-300 text-gray-700'
                                    }
                                  >
                                    {student.status === 'Active' ? 'Ativo' : student.status === 'Pending' ? 'Pendente' : student.status === 'Inactive' ? 'Inativo' : student.status === 'WaitingList' ? 'Lista de Espera' : student.status === 'Replaced' ? 'Substituído' : student.status}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog: Add Student */}
      <Dialog open={addStudentDialogOpen} onOpenChange={(open) => { setAddStudentDialogOpen(open); if (!open) setActionClassId(''); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Matricular Colaborador
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do colaborador para matrícula
              {actionClassId && (() => {
                const cls = classes.find((c) => c.id === actionClassId);
                const crs = cls ? courses.find((c) => c.id === cls.courseId) : null;
                return cls ? ` — ${cls.code} - ${crs?.name || ''}` : '';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  placeholder="Nome do colaborador"
                />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={newStudentForm.taxId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, taxId: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>RG</Label>
                <Input
                  value={newStudentForm.rg}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, rg: e.target.value })}
                  placeholder="00.000.000-0"
                />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={newStudentForm.birthDate}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newStudentForm.phone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  placeholder="colaborador@empresa.com"
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={newStudentForm.address}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                  placeholder="Rua, número, cidade - UF"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setAddStudentDialogOpen(false); setActionClassId(''); }}>
                Cancelar
              </Button>
              <Button onClick={handleAddStudent}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Matricular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Import Spreadsheet (from Import tab) */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Planilha
            </DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV com os dados dos colaboradores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Arraste um arquivo ou clique para selecionar</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="import-tab-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="import-tab-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Formato aceito: .csv, .xlsx, .xls (máx 1000 linhas)
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Import Spreadsheet (from class action button) */}
      <Dialog open={importClassDialogOpen} onOpenChange={(open) => { setImportClassDialogOpen(open); if (!open) setActionClassId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Planilha
            </DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV para importar alunos
              {actionClassId && (() => {
                const cls = classes.find((c) => c.id === actionClassId);
                const crs = cls ? courses.find((c) => c.id === cls.courseId) : null;
                return cls ? ` na turma ${cls.code} - ${crs?.name || ''}` : '';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Arraste um arquivo ou clique para selecionar</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="class-import-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="class-import-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Formato aceito: .csv, .xlsx, .xls (máx 1000 linhas)
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Approval of Imported Students (Figma: DialogAprovarAlunosImportados) */}
      <ApproveImportedStudentsDialog
        open={approvalDialogOpen}
        onOpenChange={(open) => {
          setApprovalDialogOpen(open);
          if (!open) resetApprovalState();
        }}
        students={approvalDialogStudents}
        className={approvalClassName}
        availableExtraProducts={approvalProducts}
        onApproveStudent={handleApproveImportedStudent}
        onFinishApproval={handleFinishImportedStudentsApproval}
      />
    </div>
  );
}
