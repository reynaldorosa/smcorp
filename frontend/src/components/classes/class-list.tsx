'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Filter,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClassesStore, Class } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useStudentsStore } from '@/stores/students.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { classesService } from '@/services/classes.service';
import { studentsService } from '@/services/students.service';
import { enrollmentOperations } from '@/services/operations.service';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { ClassCard } from './class-card';
import { ClassFormDialog } from './class-form-dialog';
import { ClassDeleteDialog } from './class-delete-dialog';
import { AddWaitingListDialog } from './add-waiting-list-dialog';
import { UploadSpreadsheetDialog } from '@/components/dialogs';
import type { ExcelStudent } from '@/components/dialogs';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Room {
  id: string;
  name: string;
  location?: string;
  capacity: number;
}

interface StudentStats {
  total: number;
  waitingList: number;
  replaced: number;
  totalRevenue: number;
  receivedRevenue: number;
  paidStudents: number;
}

type FilterStatus = 'active' | 'inactive' | 'all';

// ============================================
// COMPONENT
// ============================================

export function ClassList() {
  const { classes, loading, setClasses, setLoading } = useClassesStore();
  const { courses } = useCoursesStore();
  const { students, addStudent, updateStudent: updateStudentStore } = useStudentsStore();
  const { rooms } = useSettingsStore();
  const { companies } = useCompaniesStore();

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filaDialogOpen, setFilaDialogOpen] = useState(false);
  
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = usePersistedState<FilterStatus>(
    'module02-filter-status',
    'active'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateStudentCode = useCallback((counter: number) => {
    return `A${counter.toString().padStart(4, '0')}`;
  }, []);

  const cleanTaxId = useCallback((value: string) => value.replace(/\D/g, ''), []);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classesService.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast.error('Erro ao carregar turmas do servidor');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [setClasses, setLoading]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Handlers
  const handleAdd = useCallback(() => {
    setClassToEdit(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((classItem: Class) => {
    setClassToEdit(classItem);
    setFormDialogOpen(true);
  }, []);

  const handleDelete = useCallback((classItem: Class) => {
    setClassToDelete(classItem);
    setDeleteDialogOpen(true);
  }, []);

  const handleUploadPlanilha = useCallback((classItem: Class) => {
    setSelectedClass(classItem);
    setUploadDialogOpen(true);
  }, []);

  const handleFilaEspera = useCallback((classItem: Class) => {
    setSelectedClass(classItem);
    setFilaDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadClasses();
  }, [loadClasses]);

  const handleSpreadsheetRegister = useCallback(
    async (rows: ExcelStudent[]) => {
      if (!selectedClass) {
        toast.error('Nenhuma turma selecionada para cadastro');
        return;
      }

      const now = new Date().toISOString();
      const classCourse = courses.find((course) => course.id === selectedClass.courseId);
      const classPrice = classCourse?.price ?? selectedClass.price ?? 0;
      const existingTaxIds = new Set(
        students
          .filter((student) => student.classId === selectedClass.id)
          .map((student) => cleanTaxId(student.taxId || '')),
      );

      let created = 0;
      let skipped = 0;
      let codeCounter = students.length;

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const name = String(row.name || '').trim();
        const taxId = cleanTaxId(String(row.taxId || ''));

        if (!name || !taxId || taxId.length !== 11 || existingTaxIds.has(taxId)) {
          skipped += 1;
          continue;
        }

        try {
          let studentId: string | null = null;
          let studentCode = '';

          const existingLocal = students.find(
            (student) => cleanTaxId(student.taxId || '') === taxId,
          );

          if (existingLocal) {
            studentId = existingLocal.id;
            studentCode = existingLocal.code;
          } else {
            const createdStudent = await studentsService.create({
              name,
              taxId,
              rg: row.rg || undefined,
              birthDate: row.dataNascimento || undefined,
              phone: row.telefone || undefined,
              email: row.email || undefined,
              address: row.endereco || undefined,
              companyId: selectedClass.companyId,
            });

            studentId = createdStudent.id;
            studentCode = createdStudent.code;

            addStudent({
              id: createdStudent.id,
              code: createdStudent.code,
              name,
              taxId,
              rg: row.rg || undefined,
              birthDate: row.dataNascimento || undefined,
              phone: row.telefone || undefined,
              email: row.email || undefined,
              address: row.endereco || undefined,
              notes: row.observacoes || undefined,
              status: 'Active',
              linkStatus: 'Scheduled',
              classId: selectedClass.id,
              companyId: selectedClass.companyId,
              totalValue: classPrice,
              studentStartDate: selectedClass.startDate,
              studentEndDate: selectedClass.endDate,
              createdAt: createdStudent.createdAt || now,
              updatedAt: createdStudent.updatedAt || now,
            });
          }

          if (!studentId) {
            skipped += 1;
            continue;
          }

          await enrollmentOperations.create({
            studentId,
            classId: selectedClass.id,
            observations: row.observacoes || undefined,
          });

          existingTaxIds.add(taxId);
          codeCounter += 1;

          updateStudentStore(studentId, {
            code: studentCode || generateStudentCode(codeCounter),
            classId: selectedClass.id,
            companyId: selectedClass.companyId,
            status: 'Active',
            linkStatus: 'Scheduled',
            totalValue: classPrice,
            studentStartDate: selectedClass.startDate,
            studentEndDate: selectedClass.endDate,
            updatedAt: new Date().toISOString(),
          });

          created += 1;
        } catch {
          skipped += 1;
        }
      }

      if (created > 0) {
        toast.success(`${created} aluno(s) cadastrado(s) na turma`);
      }
      if (skipped > 0) {
        toast.info(`${skipped} registro(s) ignorado(s) por dados inválidos/duplicados`);
      }
    },
    [
      selectedClass,
      courses,
      students,
      cleanTaxId,
      addStudent,
      updateStudentStore,
      generateStudentCode,
    ],
  );

  const handleWaitingListAdd = useCallback(
    async (data: {
      name: string;
      taxId: string;
      rg: string;
      birthDate: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!selectedClass) {
        toast.error('Nenhuma turma selecionada para fila de espera');
        return;
      }

      const taxId = cleanTaxId(data.taxId);
      const duplicate = students.find(
        (student) =>
          student.classId === selectedClass.id &&
          cleanTaxId(student.taxId || '') === taxId &&
          !student.isReplaced,
      );

      if (duplicate) {
        toast.error('Já existe aluno com este CPF nesta turma');
        return;
      }

      const now = new Date().toISOString();

      try {
        let studentId: string | null = null;
        let studentCode = '';

        const existingLocal = students.find(
          (student) => cleanTaxId(student.taxId || '') === taxId,
        );

        if (existingLocal) {
          studentId = existingLocal.id;
          studentCode = existingLocal.code;
        } else {
          const createdStudent = await studentsService.create({
            name: data.name,
            taxId,
            rg: data.rg || undefined,
            birthDate: data.birthDate || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            address: data.address || undefined,
            companyId: selectedClass.companyId,
          });

          studentId = createdStudent.id;
          studentCode = createdStudent.code;

          addStudent({
            id: createdStudent.id,
            code: createdStudent.code,
            name: data.name,
            taxId,
            rg: data.rg || undefined,
            birthDate: data.birthDate || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            address: data.address || undefined,
            status: 'WaitingList',
            linkStatus: 'Scheduled',
            classId: selectedClass.id,
            companyId: selectedClass.companyId,
            isWaitingList: true,
            totalValue: 0,
            studentStartDate: selectedClass.startDate,
            studentEndDate: selectedClass.endDate,
            createdAt: createdStudent.createdAt || now,
            updatedAt: createdStudent.updatedAt || now,
          });
        }

        if (!studentId) {
          toast.error('Não foi possível adicionar aluno na fila de espera');
          return;
        }

        await enrollmentOperations.create({
          studentId,
          classId: selectedClass.id,
          status: 'WAITING_LIST',
        });

        updateStudentStore(studentId, {
          code: studentCode || generateStudentCode(students.length + 1),
          classId: selectedClass.id,
          companyId: selectedClass.companyId,
          status: 'WaitingList',
          linkStatus: 'Scheduled',
          isWaitingList: true,
          totalValue: 0,
          studentStartDate: selectedClass.startDate,
          studentEndDate: selectedClass.endDate,
          updatedAt: new Date().toISOString(),
        });

      } catch {
        toast.error('Falha ao adicionar aluno à fila de espera');
      }
    },
    [
      selectedClass,
      students,
      cleanTaxId,
      addStudent,
      updateStudentStore,
      generateStudentCode,
    ],
  );

  // Calculate stats for a class
  const getStudentStats = useCallback((classId: string): StudentStats => {
    const classStudents = students.filter((s) => s.classId === classId);
    const activeStudents = classStudents.filter((s) => s.status !== 'WaitingList' && s.status !== 'Replaced');
    const waitingList = classStudents.filter((s) => s.status === 'WaitingList').length;
    const replaced = classStudents.filter((s) => s.status === 'Replaced').length;
    
    // Usar totalValue em vez de price (tipo correto do Student)
    const totalRevenue = activeStudents.reduce((sum, s) => sum + (s.totalValue || 0), 0);
    // Verificar status de pagamento via payments.pending
    const paidStudents = activeStudents.filter((s) => s.payments && !s.payments.pending).length;
    const receivedRevenue = activeStudents
      .filter((s) => s.payments && !s.payments.pending)
      .reduce((sum, s) => sum + (s.totalValue || 0), 0);

    return {
      total: activeStudents.length,
      waitingList,
      replaced,
      totalRevenue,
      receivedRevenue,
      paidStudents,
    };
  }, [students]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Status filter (usar status !== 'Cancelled' como critério)
    if (filterStatus === 'active') {
      result = result.filter((c) => c.status !== 'Cancelled');
    } else if (filterStatus === 'inactive') {
      result = result.filter((c) => c.status === 'Cancelled');
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => {
        const course = courses.find((cr) => cr.id === c.courseId);
        const company = companies.find((co) => co.id === c.companyId);
        return (
          c.code?.toLowerCase().includes(term) ||
          c.displayName?.toLowerCase().includes(term) ||
          c.name?.toLowerCase().includes(term) ||
          course?.name?.toLowerCase().includes(term) ||
          company?.name?.toLowerCase().includes(term)
        );
      });
    }

    // Sort by start date (newest first)
    result.sort((a, b) => {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [classes, courses, companies, filterStatus, searchTerm]);

  // Loading state
  if (loading || isRefreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Carregando turmas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            Gestão de Turmas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredClasses.length} turma(s) encontrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código, nome ou curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">✅ Turmas Ativas</SelectItem>
                <SelectItem value="inactive">❌ Turmas Excluídas</SelectItem>
                <SelectItem value="all">📋 Todas as Turmas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nenhuma turma encontrada
              </h3>
              <p className="text-gray-600 mt-1">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Clique em "Nova Turma" para começar'}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={handleAdd} className="mt-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Turma
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((classItem) => {
            const course = courses.find((c) => c.id === classItem.courseId);
            const room = (rooms as Room[]).find((r) => r.id === classItem.roomId);
            const company = companies.find((c) => c.id === classItem.companyId);
            const stats = getStudentStats(classItem.id);

            return (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                course={course}
                room={room}
                company={company}
                stats={stats}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUploadPlanilha={handleUploadPlanilha}
                onFilaEspera={handleFilaEspera}
              />
            );
          })}
        </div>
      )}

      {/* Warning for deleted courses */}
      {filteredClasses.some((c) => !courses.find((cr) => cr.id === c.courseId)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Atenção: Turmas com Cursos Excluídos</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Algumas turmas estão vinculadas a cursos que foram excluídos.
              Elas são mantidas para fins históricos.
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ClassFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        classToEdit={classToEdit}
      />

      <ClassDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        classToDelete={classToDelete}
      />

      {selectedClass && (
        <>
          <UploadSpreadsheetDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            turmaId={selectedClass.id}
            turmaNome={selectedClass.displayName || selectedClass.name}
            valorTurma={selectedClass.price}
            onCadastrar={handleSpreadsheetRegister}
          />
          <AddWaitingListDialog
            open={filaDialogOpen}
            onOpenChange={setFilaDialogOpen}
            className={selectedClass.displayName || selectedClass.name}
            onAdd={handleWaitingListAdd}
          />
        </>
      )}
    </div>
  );
}
