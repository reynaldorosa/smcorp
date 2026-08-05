'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Types - Single source of truth
import { Class, ClassStatus, Student, Course, Room, Company, Instructor, ScheduledExam } from '@/types';

// Stores
import { useClassesStore } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useStudentsStore } from '@/stores/students.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { useCostsStore } from '@/stores/costs.store';
import { useExamsStore } from '@/stores/exams.store';
import { enrollmentOperations } from '@/services/operations.service';
import { studentsService } from '@/services/students.service';
import { classesService } from '@/services/classes.service';

// Hooks
import { usePersistedState } from '@/hooks/use-persisted-state';

// UI
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Components
import { ClassSidebar } from './class-sidebar';
import { ClassCalendar } from './class-calendar';
import { ClassDetailsPanel } from './class-details-panel';
import {
  AddWaitingListDialog,
  AttendanceListDialog,
  ClassReportDialog,
  AddInstructorDialog,
  ScheduleExamDialog,
  InstructorExamsDialog,
  InstructorCostsDialog,
  TransferClassDialog,
  EnrollmentForm,
  SelectSubstituteDialog,
} from './dialogs';

// ============================================
// TYPES
// ============================================

interface ClassFormData {
  courseId: string;
  startDate: string;
  endDate: string;
  roomId: string;
  companyId: string;
  displayName: string;
}

interface EnrollmentDraft {
  name: string;
  taxId: string;
  rg: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
  personType: 'individual' | 'company';
  companyId: string;
  discount: number;
  studentStartDate: string;
  studentEndDate: string;
  linkedProducts: string[];
  linkedExtras: string[];
}

interface FoundStudent {
  id: string;
  name: string;
  taxId: string;
  rg?: string;
  birthDate?: string;
  address?: string;
  phone: string;
  email: string;
}

interface ExamScheduleInput {
  classId: string;
  examNumber: string;
  examName: string;
  data: string;
  hora: string;
  instructorId: string;
  studentIds: string[];
}

// ============================================
// COMPONENT
// ============================================

interface OperationalDashboardProps {
  courseSearchProp?: string;
  studentSearchProp?: string;
}

export function OperationalDashboard({ courseSearchProp = '', studentSearchProp = '' }: OperationalDashboardProps) {
  const router = useRouter();

  // ---------- STORES ----------
  const { classes, loading: classesLoading, addClass, updateClass } = useClassesStore();
  const { courses } = useCoursesStore();
  const { students, addStudent, updateStudent: updateStudentStore } = useStudentsStore();
  const { rooms, instructors, extraProducts, users, currentUser } = useSettingsStore();
  const { companies } = useCompaniesStore();
  const {
    auditableCosts,
    costEntries,
    triggerAutomaticCosts,
    deleteCostEntriesByExam,
    deleteCostEntriesByInstructorClass,
    deleteCostEntriesByExamNumber,
    deleteCostEntriesByStudentExam,
  } = useCostsStore();
  const { exams, addExam, updateExam, deleteExam, getNextExamNumber, loadOperationalExams } =
    useExamsStore();

  // Use props for search values
  const courseSearch = courseSearchProp;
  const studentSearch = studentSearchProp;

  // ---------- STATE ----------
  // UI State
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);

  // Visibility & Expansion
  const [visibleClasses, setVisibleClasses] = usePersistedState<Set<string>>(
    'module03-visible-classes',
    new Set()
  );
  const [expandedClasses, setExpandedClasses] = usePersistedState<Set<string>>(
    'module03-expanded-classes',
    new Set()
  );

  // Dialog States
  const [dialogStates, setDialogStates] = useState({
    attendance: false,
    waitingList: false,
    report: false,
    addInstructor: false,
    scheduleExam: false,
    instructorExams: false,
    instructorCosts: false,
    payment: false,
    transfer: false,
    documents: false,
    enrollment: false,
    substitute: false,
  });

  // Selected items for dialogs
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [examDialogInstructorId, setExamDialogInstructorId] = useState<string | undefined>(
    undefined
  );
  const [editingExam, setEditingExam] = useState<ScheduledExam | null>(null);
  const [instructorCostLinks, setInstructorCostLinks] = usePersistedState<Record<string, string[]>>(
    'module03-instructor-cost-links',
    {}
  );

  const [enrollmentDraft, setEnrollmentDraft] = useState<EnrollmentDraft>({
    name: '',
    taxId: '',
    rg: '',
    birthDate: '',
    address: '',
    phone: '',
    email: '',
    personType: 'individual',
    companyId: '',
    discount: 0,
    studentStartDate: '',
    studentEndDate: '',
    linkedProducts: [],
    linkedExtras: [],
  });
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [foundStudent, setFoundStudent] = useState<FoundStudent | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [enrollmentToken, setEnrollmentToken] = useState('');

  const [editClassOpen, setEditClassOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassData, setEditClassData] = useState({
    displayName: '',
    startDate: '',
    endDate: '',
    roomId: '',
    status: 'Planned' as ClassStatus,
  });

  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [substituteStudent, setSubstituteStudent] = useState<Student | null>(null);

  // Initialize visible classes (show active ones by default)
  useEffect(() => {
    if (classes.length > 0 && visibleClasses.size === 0) {
      const prioritizedClasses = classes
        .filter(
          (c) => c.status === 'InProgress' || c.status === 'Confirmed' || c.status === 'Planned',
        )
        .map((c) => c.id);

      const fallbackClasses = classes
        .filter((c) => c.status !== 'Cancelled')
        .map((c) => c.id);

      const initialVisible = (prioritizedClasses.length > 0 ? prioritizedClasses : fallbackClasses).slice(0, 5);
      setVisibleClasses(new Set(initialVisible));
    }
  }, [classes, visibleClasses.size]);

  // ---------- MEMOS ----------
  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!highlightedStudentId) return;

    const element = document.getElementById(`student-card-${highlightedStudentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const timeout = setTimeout(() => {
      setHighlightedStudentId(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [highlightedStudentId]);

  useEffect(() => {
    const classIds = new Set(classes.map((classItem) => classItem.id));
    setVisibleClasses((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((id) => {
        if (!classIds.has(id)) {
          next.delete(id);
        }
      });
      return next;
    });
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((id) => {
        if (!classIds.has(id)) {
          next.delete(id);
        }
      });
      return next;
    });
  }, [classes, setExpandedClasses, setVisibleClasses]);

  useEffect(() => {
    if (!selectedClass) return;
    setEnrollmentDraft((prev) => ({
      ...prev,
      studentStartDate: selectedClass.startDate,
      studentEndDate: selectedClass.endDate,
    }));
  }, [selectedClass]);

  useEffect(() => {
    if (classes.length === 0 || students.length === 0) return;
    void loadOperationalExams();
  }, [classes.length, students.length, loadOperationalExams]);

  const selectedCourse = useMemo(() => {
    if (!selectedClass) return null;
    return courses.find((course) => course.id === selectedClass.courseId) || null;
  }, [courses, selectedClass]);

  const selectedRoom = useMemo(() => {
    if (!selectedClass?.roomId) return null;
    return rooms.find((room) => room.id === selectedClass.roomId) || null;
  }, [rooms, selectedClass]);

  const reportRoom = useMemo(() => {
    if (!selectedClass) return null;
    if (selectedRoom) return selectedRoom;

    return {
      id: '__room_not_defined__',
      name: 'Sala não definida',
      capacity: 0,
      active: true,
    };
  }, [selectedClass, selectedRoom]);

  const selectedCompany = useMemo(() => {
    if (!selectedClass?.companyId) return null;
    return companies.find((company) => company.id === selectedClass.companyId) || null;
  }, [companies, selectedClass]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((student) => student.classId === selectedClassId);
  }, [students, selectedClassId]);

  const waitingListStudents = useMemo(
    () => classStudents.filter((student) => student.status === 'WaitingList'),
    [classStudents]
  );
  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        id: company.id,
        name: company.name,
        pricing: courses.map((courseItem) => ({
          courseId: courseItem.id,
          active: true,
          includedProductIds: [
            ...(courseItem.linkedProducts || []),
            ...(courseItem.linkedExtras || []),
          ],
        })),
      })),
    [companies, courses]
  );

  const courseOption = useMemo(
    () =>
      selectedCourse
        ? {
            id: selectedCourse.id,
            name: selectedCourse.name,
            linkedProducts: selectedCourse.linkedProducts || [],
            linkedExtras: selectedCourse.linkedExtras || [],
          }
        : null,
    [selectedCourse]
  );

  const classOption = useMemo(
    () =>
      selectedClass
        ? {
            id: selectedClass.id,
            code: selectedClass.code,
            startDate: selectedClass.startDate,
            endDate: selectedClass.endDate,
          }
        : null,
    [selectedClass]
  );

  const extraProductOptions = useMemo(
    () =>
      extraProducts.map((product) => ({
        id: product.id,
        code: product.id.slice(0, 6).toUpperCase(),
        name: product.name,
        price: product.price,
        type: product.type,
      })),
    [extraProducts]
  );

  const selectedInstructor = useMemo(() => {
    if (!selectedInstructorId) return null;
    return instructors.find((item) => item.id === selectedInstructorId) || null;
  }, [selectedInstructorId, instructors]);

  const primaryInstructor = useMemo(() => {
    if (!selectedClass?.instructors?.length) return null;
    const instructorId = selectedClass.instructors[0].instructorId;
    return instructors.find((item) => item.id === instructorId) || null;
  }, [selectedClass, instructors]);

  const linkedInstructorIds = useMemo(() => {
    if (!selectedClass?.instructors?.length) return [];
    return selectedClass.instructors.map((item) => item.instructorId);
  }, [selectedClass]);

  const scheduledExams = useMemo<ScheduledExam[]>(() => exams, [exams]);

  const generateStudentCode = useCallback(() => {
    const nextNumber = students.length + 1;
    return `A${nextNumber.toString().padStart(4, '0')}`;
  }, [students.length]);

  const resetEnrollmentForm = useCallback(() => {
    setEnrollmentDraft({
      name: '',
      taxId: '',
      rg: '',
      birthDate: '',
      address: '',
      phone: '',
      email: '',
      personType: 'individual',
      companyId: '',
      discount: 0,
      studentStartDate: selectedClass?.startDate || '',
      studentEndDate: selectedClass?.endDate || '',
      linkedProducts: [],
      linkedExtras: [],
    });
    setEnrollmentSearch('');
    setFoundStudent(null);
    setShowQrCode(false);
    setEnrollmentToken('');
  }, [selectedClass]);

  const calculateEnrollmentTotal = useCallback(() => {
    let total = 0;
    enrollmentDraft.linkedProducts.forEach((productId) => {
      const product = extraProducts.find((item) => item.id === productId);
      total += product?.price || 0;
    });
    enrollmentDraft.linkedExtras.forEach((extraId) => {
      const extra = extraProducts.find((item) => item.id === extraId);
      total += extra?.price || 0;
    });
    total -= enrollmentDraft.discount || 0;
    return total;
  }, [enrollmentDraft, extraProducts]);

  // ---------- HANDLERS ----------
  const handleToggleVisibility = useCallback((classId: string) => {
    setVisibleClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  }, []);

  const handleToggleExpansion = useCallback((classId: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  }, []);

  const handleSelectClass = useCallback((classId: string, date: Date) => {
    setSelectedClassId(classId);
    setSelectedDate(date);
    // Add to visible if not already
    setVisibleClasses((prev) => {
      const next = new Set(prev);
      next.add(classId);
      return next;
    });
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedClassId(null);
  }, []);

  const handleStudentSearch = useCallback(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) {
      toast.info('Digite o nome, CPF ou codigo do aluno para buscar');
      return;
    }

    const found = students.find((student) => {
      const name = student.name.toLowerCase();
      const taxId = (student.taxId || '').replace(/\D/g, '');
      const code = student.code.toLowerCase();
      const normalizedTerm = term.replace(/\D/g, '');

      return (
        name.includes(term) ||
        (normalizedTerm && taxId.includes(normalizedTerm)) ||
        code.includes(term)
      );
    });

    if (!found || !found.classId) {
      toast.info('Aluno não encontrado');
      return;
    }

    handleSelectClass(found.classId, new Date());
    setHighlightedStudentId(found.id);
    toast.success(`Aluno ${found.name} encontrado!`);
  }, [studentSearch, students, handleSelectClass]);

  const handleAddClass = useCallback(
    async (data: ClassFormData) => {
      try {
        const course = courses.find((c) => c.id === data.courseId);

        const createdClass = await classesService.create({
          courseId: data.courseId,
          roomId: data.roomId,
          companyId: data.companyId || undefined,
          displayName: data.displayName || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          maxStudents: 20,
        });

        addClass({
          ...createdClass,
          name: createdClass.name || data.displayName || course?.name || 'Nova Turma',
          price: createdClass.price || course?.price || 0,
        });
        toast.success('Turma criada com sucesso!');
      } catch {
        toast.error('Erro ao criar turma');
      }
    },
    [addClass, courses]
  );

  const handleEditClass = useCallback((classItem: Class) => {
    setEditingClassId(classItem.id);
    setEditClassData({
      displayName: classItem.displayName || '',
      startDate: classItem.startDate,
      endDate: classItem.endDate,
      roomId: classItem.roomId || '',
      status: classItem.status,
    });
    setEditClassOpen(true);
  }, []);

  // Dialog togglers
  const openDialog = useCallback((dialog: keyof typeof dialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialog]: true }));
  }, []);

  const closeDialog = useCallback((dialog: keyof typeof dialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialog]: false }));
  }, []);

  // Student actions - updated to use new interface
  const handleUpdateStudent = useCallback(
    (studentId: string, data: Partial<Student>) => {
      try {
        updateStudentStore(studentId, data);
        toast.success('Aluno atualizado');
      } catch (error) {
        toast.error('Erro ao atualizar aluno');
      }
    },
    [updateStudentStore]
  );

  const handleDeleteStudent = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      if (!confirm(`Confirma remoção do aluno ${student.name}?`)) return;
      try {
        if (student.examStatus?.active) {
          const relatedExams = exams.filter((exam) => exam.studentIds.includes(studentId));
          relatedExams.forEach((exam) => {
            const remainingStudentIds = exam.studentIds.filter((id) => id !== studentId);
            if (remainingStudentIds.length === 0) {
              deleteExam(exam.id);
              deleteCostEntriesByExam({
                instructorId: exam.instructorId,
                examNumber: exam.examNumber,
                classId: exam.classId,
              });
            } else {
              updateExam(exam.id, { studentIds: remainingStudentIds });
            }
          });
        }

        updateStudentStore(studentId, { status: 'Replaced', examStatus: { active: false } });
        toast.success('Aluno removido da turma');
      } catch (error) {
        toast.error('Erro ao remover aluno');
      }
    },
    [students, exams, updateExam, deleteExam, deleteCostEntriesByExam, updateStudentStore]
  );

  const handleMarkDayAttendance = useCallback(
    (studentId: string, date: string) => {
      try {
        const student = students.find((s) => s.id === studentId);
        if (!student) return;
        
        // Toggle attendance for the date (boolean)
        const attendanceByDay = { ...student.attendanceByDay };
        attendanceByDay[date] = !attendanceByDay[date];
        
        updateStudentStore(studentId, { attendanceByDay });
        toast.success('Presença atualizada');
      } catch (error) {
        toast.error('Erro ao atualizar presença');
      }
    },
    [students, updateStudentStore]
  );

  const handleOpenTransferStudent = useCallback((studentId: string) => {
    const student = students.find((item) => item.id === studentId) || null;
    if (!student) return;
    setTransferStudent(student);
    openDialog('transfer');
  }, [students, openDialog]);

  const handleOpenSubstituteStudent = useCallback(
    (studentId: string) => {
      const student = students.find((item) => item.id === studentId) || null;
      if (!student) return;
      setSubstituteStudent(student);
      openDialog('substitute');
    },
    [students, openDialog]
  );

  const handleConfirmSubstitute = useCallback(
    (newStudentId: string, reason: string) => {
      if (!selectedClass || !substituteStudent) return;

      const oldStudent = students.find((item) => item.id === substituteStudent.id);
      const newStudent = students.find((item) => item.id === newStudentId);
      if (!oldStudent || !newStudent) return;

      const relatedExams = exams.filter((exam) => exam.studentIds.includes(oldStudent.id));
      relatedExams.forEach((exam) => {
        const remainingStudentIds = exam.studentIds.filter((id) => id !== oldStudent.id);
        if (remainingStudentIds.length === 0) {
          deleteExam(exam.id);
          deleteCostEntriesByExam({
            instructorId: exam.instructorId,
            examNumber: exam.examNumber,
            classId: exam.classId,
          });
        } else {
          updateExam(exam.id, { studentIds: remainingStudentIds });
        }
      });

      const now = new Date().toISOString();

      updateStudentStore(oldStudent.id, {
        status: 'Replaced',
        isReplaced: true,
        isWaitingList: false,
        replacedStudentId: newStudent.id,
        replacementDate: now,
        replacementReason: reason,
        examStatus: { active: false },
      });

      updateStudentStore(newStudent.id, {
        status: 'Active',
        isWaitingList: false,
        isReplaced: false,
        replacedStudentId: oldStudent.id,
        replacementDate: now,
        replacementReason: reason,
        linkStatus: 'Scheduled',
        studentStartDate: newStudent.studentStartDate || selectedClass.startDate,
        studentEndDate: newStudent.studentEndDate || selectedClass.endDate,
      });

      toast.success('Aluno substituido com sucesso');
      closeDialog('substitute');
      setSubstituteStudent(null);
    },
    [
      selectedClass,
      substituteStudent,
      students,
      exams,
      updateExam,
      deleteExam,
      deleteCostEntriesByExam,
      updateStudentStore,
      closeDialog,
    ]
  );

  const handleTransferStudent = useCallback(
    (studentId: string, newClassId: string) => {
      const student = students.find((item) => item.id === studentId);
      if (!student) return;

      const relatedExams = exams.filter((exam) => exam.studentIds.includes(studentId));
      relatedExams.forEach((exam) => {
        const remainingStudentIds = exam.studentIds.filter((id) => id !== studentId);
        if (remainingStudentIds.length === 0) {
          deleteExam(exam.id);
          deleteCostEntriesByExam({
            instructorId: exam.instructorId,
            examNumber: exam.examNumber,
            classId: exam.classId,
          });
        } else {
          updateExam(exam.id, { studentIds: remainingStudentIds });
        }
      });

      updateStudentStore(studentId, {
        classId: newClassId,
        linkStatus: 'Scheduled',
        examStatus: { active: false },
      });

      toast.success('Aluno transferido com sucesso');
      closeDialog('transfer');
      setTransferStudent(null);
    },
    [students, exams, updateExam, deleteExam, deleteCostEntriesByExam, updateStudentStore, closeDialog]
  );

  const verifyExamCostsForTransfer = useCallback(
    (studentId: string) => {
      const relatedExams = exams.filter((exam) => exam.studentIds.includes(studentId));
      if (relatedExams.length === 0) return null;

      let shouldDelete = false;
      let reason = '';
      const collectedCosts = new Map<string, { id: string; codigo: string; valor: number; observacoes?: string }>();

      relatedExams.forEach((exam) => {
        const remainingStudentIds = exam.studentIds.filter((id) => id !== studentId);
        if (remainingStudentIds.length === 0) {
          shouldDelete = true;
          const examCosts = costEntries.filter(
            (entry) =>
              entry.instructorId === exam.instructorId &&
              entry.examNumber === exam.examNumber &&
              (!entry.classId || entry.classId === exam.classId)
          );
          examCosts.forEach((entry) => {
            if (!collectedCosts.has(entry.id)) {
              collectedCosts.set(entry.id, {
                id: entry.id,
                codigo: entry.code,
                valor: entry.value,
                observacoes: entry.notes,
              });
            }
          });
        } else {
          reason = 'Existem outros alunos vinculados a esta prova. Custos do instrutor serao mantidos.';
        }
      });

      if (shouldDelete) {
        return {
          custos: Array.from(collectedCosts.values()),
          excluir: true,
          motivo: reason || 'Este aluno e o unico na prova. Os custos do instrutor serao excluidos.',
        };
      }

      if (reason) {
        return { custos: [], excluir: false, motivo: reason };
      }

      return null;
    },
    [exams, costEntries]
  );

  const handleAddWaitingListStudent = useCallback(
    (studentData: {
      name: string;
      taxId: string;
      rg: string;
      birthDate: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!selectedClass) return;

      const now = new Date().toISOString();
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        code: generateStudentCode(),
        name: studentData.name,
        taxId: studentData.taxId,
        rg: studentData.rg,
        birthDate: studentData.birthDate,
        phone: studentData.phone,
        email: studentData.email,
        address: studentData.address,
        status: 'WaitingList',
        linkStatus: 'Scheduled',
        classId: selectedClass.id,
        isWaitingList: true,
        totalValue: 0,
        studentStartDate: selectedClass.startDate,
        studentEndDate: selectedClass.endDate,
        createdAt: now,
        updatedAt: now,
      };

      addStudent(newStudent);
      toast.success('Aluno adicionado à fila de espera');
    },
    [addStudent, generateStudentCode, selectedClass]
  );

  const handleSearchExistingStudent = useCallback(
    (term: string) => {
      const normalizedTerm = term.trim().toLowerCase();
      if (!normalizedTerm) {
        toast.info('Digite CPF ou codigo do aluno para buscar');
        return;
      }

      const normalizedCpf = normalizedTerm.replace(/\D/g, '');
      const found = students.find((student) => {
        const taxId = (student.taxId || '').replace(/\D/g, '');
        return (
          student.name.toLowerCase().includes(normalizedTerm) ||
          student.code.toLowerCase().includes(normalizedTerm) ||
          (normalizedCpf && taxId.includes(normalizedCpf))
        );
      });

      if (!found) {
        setFoundStudent(null);
        toast.info('Aluno nao encontrado');
        return;
      }

      setFoundStudent({
        id: found.id,
        name: found.name,
        taxId: found.taxId || '',
        rg: found.rg || '',
        birthDate: found.birthDate || '',
        address: found.address || '',
        phone: found.phone || '',
        email: found.email || '',
      });

      const existingProductIds = found.extraProductIds || [];
      const linkedProducts = extraProducts
        .filter((product) => product.type === 'product' && existingProductIds.includes(product.id))
        .map((product) => product.id);
      const linkedExtras = extraProducts
        .filter((product) => product.type === 'extra' && existingProductIds.includes(product.id))
        .map((product) => product.id);

      setEnrollmentDraft((prev) => ({
        ...prev,
        name: found.name,
        taxId: found.taxId || '',
        rg: found.rg || '',
        birthDate: found.birthDate || '',
        address: found.address || '',
        phone: found.phone || '',
        email: found.email || '',
        personType: found.personType || 'individual',
        companyId: found.companyId || '',
        discount: found.discount || 0,
        studentStartDate: found.studentStartDate || prev.studentStartDate,
        studentEndDate: found.studentEndDate || prev.studentEndDate,
        linkedProducts,
        linkedExtras,
      }));
    },
    [students, extraProducts]
  );

  const handleToggleLinkedProduct = useCallback((productId: string) => {
    setEnrollmentDraft((prev) => {
      const exists = prev.linkedProducts.includes(productId);
      return {
        ...prev,
        linkedProducts: exists
          ? prev.linkedProducts.filter((id) => id !== productId)
          : [...prev.linkedProducts, productId],
      };
    });
  }, []);

  const handleToggleLinkedExtra = useCallback((extraId: string) => {
    setEnrollmentDraft((prev) => {
      const exists = prev.linkedExtras.includes(extraId);
      return {
        ...prev,
        linkedExtras: exists
          ? prev.linkedExtras.filter((id) => id !== extraId)
          : [...prev.linkedExtras, extraId],
      };
    });
  }, []);

  const handleAddEnrollment = useCallback(async () => {
    if (!selectedClass) return;

    if (!enrollmentDraft.name || !enrollmentDraft.taxId || !enrollmentDraft.phone || !enrollmentDraft.email) {
      toast.error('Preencha os campos obrigatorios do aluno');
      return;
    }

    if (enrollmentDraft.personType === 'company' && !enrollmentDraft.companyId) {
      toast.error('Selecione a empresa para matricula PJ');
      return;
    }

    const now = new Date().toISOString();
    const totalValue = calculateEnrollmentTotal();
    const extraProductIds = [
      ...enrollmentDraft.linkedProducts,
      ...enrollmentDraft.linkedExtras,
    ];
    const studentStartDate = enrollmentDraft.studentStartDate || selectedClass.startDate;
    const studentEndDate = enrollmentDraft.studentEndDate || selectedClass.endDate;

    const payload: Partial<Student> = {
      name: enrollmentDraft.name,
      taxId: enrollmentDraft.taxId,
      rg: enrollmentDraft.rg || undefined,
      birthDate: enrollmentDraft.birthDate || undefined,
      address: enrollmentDraft.address || undefined,
      phone: enrollmentDraft.phone,
      email: enrollmentDraft.email,
      personType: enrollmentDraft.personType,
      companyId: enrollmentDraft.personType === 'company' ? enrollmentDraft.companyId : undefined,
      classId: selectedClass.id,
      status: 'Active',
      linkStatus: 'Scheduled',
      discount: enrollmentDraft.discount || 0,
      totalValue,
      extraProductIds,
      studentStartDate,
      studentEndDate,
      updatedAt: now,
    };

    const extraProductsPayload = extraProductIds.map((id) => ({
      extraProductId: id,
      quantity: 1,
    }));

    try {
      let createdEnrollmentId: string | null = null;

      if (foundStudent) {
        const enrollment = await enrollmentOperations.create({
          studentId: foundStudent.id,
          classId: selectedClass.id,
          observations: enrollmentDraft.discount ? `Desconto: ${enrollmentDraft.discount}` : undefined,
          extraProducts: extraProductsPayload,
        });

        createdEnrollmentId = enrollment.id || null;

        updateStudentStore(foundStudent.id, {
          ...payload,
          extraProductIds: enrollment.extraProductIds || extraProductIds,
        });
      } else {
        const createdStudent = await studentsService.create({
          name: enrollmentDraft.name,
          taxId: enrollmentDraft.taxId,
          rg: enrollmentDraft.rg || undefined,
          birthDate: enrollmentDraft.birthDate || undefined,
          address: enrollmentDraft.address || undefined,
          phone: enrollmentDraft.phone,
          email: enrollmentDraft.email,
          companyId: enrollmentDraft.personType === 'company' ? enrollmentDraft.companyId : undefined,
        });

        const enrollment = await enrollmentOperations.create({
          studentId: createdStudent.id,
          classId: selectedClass.id,
          observations: enrollmentDraft.discount ? `Desconto: ${enrollmentDraft.discount}` : undefined,
          extraProducts: extraProductsPayload,
        });

        createdEnrollmentId = enrollment.id || null;

        const newStudent: Student = {
          id: createdStudent.id,
          code: createdStudent.code,
          status: 'Active',
          totalValue,
          createdAt: createdStudent.createdAt || now,
          updatedAt: createdStudent.updatedAt || now,
          ...payload,
          extraProductIds: enrollment.extraProductIds || extraProductIds,
        } as Student;
        addStudent(newStudent);
      }

      let generatedToken = '';
      if (createdEnrollmentId) {
        try {
          const tokenResult = await enrollmentOperations.generateToken({
            enrollmentId: createdEnrollmentId,
            expiresInHours: 24,
          });
          generatedToken = tokenResult.enrollmentToken || '';
        } catch (error) {
          // NÃO fabricar token local: um token inválido (MAT-...) nunca seria
          // aceito pelo backend e o link do aluno quebraria sem diagnóstico.
          console.error('Falha ao gerar token oficial de matrícula:', error);
          toast.warning(
            'Matrícula registrada, mas o link oficial não pôde ser gerado agora. Tente novamente em breve.',
          );
        }
      }

      // Sem token real, não exibe QR code com link quebrado
      setEnrollmentToken(generatedToken);
      setShowQrCode(!!generatedToken);
      toast.success('Token de matricula gerado');
    } catch (error) {
      toast.error('Falha ao registrar matricula. Verifique os dados e tente novamente.');
    }
  }, [
    selectedClass,
    enrollmentDraft,
    calculateEnrollmentTotal,
    foundStudent,
    updateStudentStore,
    addStudent,
  ]);

  const handleAddInstructorToClass = useCallback(
    async (instructorId: string) => {
      if (!selectedClass) return;

      const current = selectedClass.instructors || [];
      if (current.some((item) => item.instructorId === instructorId)) {
        toast.info('Instrutor ja vinculado');
        return;
      }

      const nextInstructors = [...current, { instructorId, attendances: [] }];
      const nextInstructorIds = nextInstructors.map((item) => item.instructorId);

      try {
        const updatedClass = await classesService.update(selectedClass.id, {
          instructorIds: nextInstructorIds,
        });

        updateClass(selectedClass.id, {
          instructors: updatedClass.instructors || nextInstructors,
        });
      } catch {
        toast.error('Falha ao vincular instrutor no servidor');
        return;
      }

      toast.success('Instrutor vinculado a turma');
    },
    [selectedClass, updateClass]
  );

  const handleRemoveInstructorFromClass = useCallback(
    async (instructorId: string) => {
      if (!selectedClass) return;

      const updatedInstructors = (selectedClass.instructors || []).filter(
        (item) => item.instructorId !== instructorId
      );
      const nextInstructorIds = updatedInstructors.map((item) => item.instructorId);

      try {
        const updatedClass = await classesService.update(selectedClass.id, {
          instructorIds: nextInstructorIds,
          instructorId: nextInstructorIds[0] ?? null,
        });

        updateClass(selectedClass.id, {
          instructors: updatedClass.instructors || updatedInstructors,
        });
      } catch {
        toast.error('Falha ao desvincular instrutor no servidor');
        return;
      }

      const relatedExams = exams.filter(
        (exam) => exam.classId === selectedClass.id && exam.instructorId === instructorId
      );
      relatedExams.forEach((exam) => {
        exam.studentIds.forEach((studentId) => {
          updateStudentStore(studentId, { examStatus: { active: false } });
        });
        deleteExam(exam.id);
        deleteCostEntriesByExam({
          instructorId: exam.instructorId,
          examNumber: exam.examNumber,
          classId: exam.classId,
        });
      });

      deleteCostEntriesByInstructorClass({
        instructorId,
        classId: selectedClass.id,
      });

      toast.success('Instrutor desvinculado da turma');
    },
    [
      selectedClass,
      instructors,
      exams,
      updateClass,
      updateStudentStore,
      deleteExam,
      deleteCostEntriesByExam,
      deleteCostEntriesByInstructorClass,
    ]
  );

  const handleConfirmInstructorAttendance = useCallback(
    async (instructorId: string, date: string) => {
      if (!selectedClass) return;

      const attendances =
        selectedClass.instructors?.find((item) => item.instructorId === instructorId)
          ?.attendances || [];
      if (attendances.some((attendance) => attendance.date === date)) return;

      try {
        const updatedClass = await classesService.confirmInstructorAttendance(
          selectedClass.id,
          instructorId,
          date
        );
        updateClass(selectedClass.id, { instructors: updatedClass.instructors });
      } catch {
        toast.error('Falha ao confirmar presença do instrutor no servidor');
        return;
      }

      triggerAutomaticCosts('InstructorAttendance', {
        classId: selectedClass.id,
        instructorId,
      });
      toast.success('Presenca do instrutor confirmada');
    },
    [selectedClass, updateClass, triggerAutomaticCosts]
  );

  const handleScheduleExam = useCallback(
    (data: ExamScheduleInput) => {
      const createdExam = addExam({
        classId: data.classId,
        examNumber: data.examNumber,
        examName: data.examName,
        date: data.data,
        time: data.hora,
        instructorId: data.instructorId,
        studentIds: data.studentIds,
        status: 'Scheduled',
      });

      data.studentIds.forEach((studentId) => {
        updateStudentStore(studentId, {
          examStatus: {
            active: true,
            instructorId: data.instructorId,
            date: data.data,
            time: data.hora,
            examNumber: data.examNumber,
            examName: data.examName,
          },
        });
      });

      setEditingExam(null);
      setExamDialogInstructorId(undefined);
      closeDialog('scheduleExam');
      toast.success('Prova agendada com sucesso');
    },
    [addExam, updateStudentStore, closeDialog]
  );

  const handleEditExam = useCallback(
    (
      examId: string,
      data: {
        examNumber: string;
        examName: string;
        data: string;
        hora: string;
        instructorId: string;
        studentIds: string[];
      }
    ) => {
      const existing = scheduledExams.find((exam) => exam.id === examId);
      const previousStudentIds = existing?.studentIds || [];
      const previousInstructorId = existing?.instructorId;
      const previousExamNumber = existing?.examNumber;
      const previousClassId = existing?.classId;
      const removedStudentIds = previousStudentIds.filter(
        (studentId) => !data.studentIds.includes(studentId)
      );

      removedStudentIds.forEach((studentId) => {
        updateStudentStore(studentId, { examStatus: { active: false } });
        if (previousExamNumber) {
          deleteCostEntriesByStudentExam({
            studentId,
            examNumber: previousExamNumber,
            classId: previousClassId,
          });
        }
      });

      data.studentIds.forEach((studentId) => {
        updateStudentStore(studentId, {
          examStatus: {
            active: true,
            instructorId: data.instructorId,
            date: data.data,
            time: data.hora,
            examNumber: data.examNumber,
            examName: data.examName,
          },
        });
      });

      updateExam(examId, {
        examNumber: data.examNumber,
        examName: data.examName,
        date: data.data,
        time: data.hora,
        instructorId: data.instructorId,
        studentIds: data.studentIds,
      });

      if (
        previousInstructorId &&
        previousExamNumber &&
        previousInstructorId !== data.instructorId
      ) {
        deleteCostEntriesByExam({
          instructorId: previousInstructorId,
          examNumber: previousExamNumber,
          classId: previousClassId,
        });
        triggerAutomaticCosts('InstructorAssignedToExam', {
          classId: previousClassId,
          instructorId: data.instructorId,
          examNumber: data.examNumber,
          examName: data.examName,
        });
      }

      setEditingExam(null);
      setExamDialogInstructorId(undefined);
      closeDialog('scheduleExam');
      toast.success('Prova atualizada');
    },
    [
      scheduledExams,
      updateStudentStore,
      updateExam,
      closeDialog,
      deleteCostEntriesByStudentExam,
      deleteCostEntriesByExam,
      triggerAutomaticCosts,
    ]
  );

  const handleDeleteExam = useCallback(
    (examId: string) => {
      const exam = scheduledExams.find((item) => item.id === examId);
      if (!exam) return;

      exam.studentIds.forEach((studentId) => {
        updateStudentStore(studentId, { examStatus: { active: false } });
      });

      deleteCostEntriesByExamNumber({
        examNumber: exam.examNumber,
        classId: exam.classId,
      });

      deleteExam(examId);
    },
    [scheduledExams, updateStudentStore, deleteExam, deleteCostEntriesByExamNumber]
  );

  const handleLinkCost = useCallback(
    (costId: string) => {
      if (!selectedInstructorId) return;
      setInstructorCostLinks((prev) => {
        const current = new Set(prev[selectedInstructorId] || []);
        current.add(costId);
        return { ...prev, [selectedInstructorId]: Array.from(current) };
      });
    },
    [selectedInstructorId, setInstructorCostLinks]
  );

  const handleUnlinkCost = useCallback(
    (costId: string) => {
      if (!selectedInstructorId) return;
      setInstructorCostLinks((prev) => {
        const next = (prev[selectedInstructorId] || []).filter((id) => id !== costId);
        return { ...prev, [selectedInstructorId]: next };
      });
    },
    [selectedInstructorId, setInstructorCostLinks]
  );

  const handleOpenScheduleExam = useCallback(
    (instructorId?: string, exam?: ScheduledExam) => {
      setExamDialogInstructorId(instructorId);
      setEditingExam(exam || null);
      openDialog('scheduleExam');
    },
    [openDialog]
  );

  // Instructor dialogs
  const handleOpenInstructorExams = useCallback(
    (instructorId: string) => {
      setSelectedInstructorId(instructorId);
      openDialog('instructorExams');
    },
    [openDialog]
  );

  const handleOpenInstructorCosts = useCallback(
    (instructorId: string) => {
      setSelectedInstructorId(instructorId);
      openDialog('instructorCosts');
    },
    [openDialog]
  );

  // ---------- RENDER ----------
  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
        >
          {isSidebarCollapsed ? 'Mostrar Turmas Ativas' : 'Recolher Turmas Ativas'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDetailsCollapsed((prev) => !prev)}
        >
          {isDetailsCollapsed ? 'Mostrar Detalhes da Turma' : 'Recolher Detalhes da Turma'}
        </Button>
        <span className="text-xs text-slate-500">
          Layout: {isSidebarCollapsed && isDetailsCollapsed ? 'Agenda máxima' : isSidebarCollapsed || isDetailsCollapsed ? 'Agenda ampliada' : 'Padrão'}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
      {/* Left Sidebar */}
      {!isSidebarCollapsed && (
        <ClassSidebar
          classes={classes}
          courses={courses}
          rooms={rooms}
          companies={companies}
          students={students}
          visibleClasses={visibleClasses}
          expandedClasses={expandedClasses}
          onToggleVisibility={handleToggleVisibility}
          onToggleExpansion={handleToggleExpansion}
          onEditClass={handleEditClass}
          onSelectClass={handleSelectClass}
          courseSearch={courseSearch}
          className={isDetailsCollapsed ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-3'}
        />
      )}

      {/* Calendar */}
      <ClassCalendar
        classes={classes}
        courses={courses}
        rooms={rooms}
        students={students}
        visibleClasses={visibleClasses}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        onSelectClass={handleSelectClass}
        onOpenReportDialog={() => openDialog('report')}
        className={
          isSidebarCollapsed && isDetailsCollapsed
            ? 'col-span-12 space-y-4'
            : isSidebarCollapsed || isDetailsCollapsed
            ? 'col-span-12 lg:col-span-9 space-y-4'
            : 'col-span-12 lg:col-span-6 space-y-4'
        }
      />

      {/* Right Panel - Class Details */}
      {!isDetailsCollapsed && selectedClass ? (
        <ClassDetailsPanel
          selectedClass={selectedClass}
          courses={courses}
          rooms={rooms}
          companies={companies}
          instructors={instructors}
          students={students}
          extraProducts={extraProducts}
          users={users}
          currentUser={currentUser || undefined}
          highlightedStudentId={highlightedStudentId}
          onClose={handleCloseDetails}
          onOpenAttendance={() => openDialog('attendance')}
          onOpenWaitingList={() => openDialog('waitingList')}
          onOpenScheduleExam={() => handleOpenScheduleExam()}
          onOpenAddInstructor={() => openDialog('addInstructor')}
          onOpenReport={() => openDialog('report')}
          onOpenPaymentOverview={() => {
            if (!selectedClass) {
              toast.error('Selecione uma turma para abrir a visão financeira');
              return;
            }

            router.push(`/pagamentos?classId=${encodeURIComponent(selectedClass.id)}`);
          }}
          onOpenInstructorExams={handleOpenInstructorExams}
          onOpenInstructorCosts={handleOpenInstructorCosts}
          onOpenEnrollment={() => openDialog('enrollment')}
          onConfirmInstructorAttendance={handleConfirmInstructorAttendance}
          onRemoveInstructorFromClass={handleRemoveInstructorFromClass}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onMarkDayAttendance={handleMarkDayAttendance}
          onTransferStudent={handleOpenTransferStudent}
          onReplaceStudent={handleOpenSubstituteStudent}
          className="col-span-12 lg:col-span-3 space-y-4"
        />
      ) : !isDetailsCollapsed ? (
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Selecione uma turma para ver detalhes
          </div>
        </div>
      ) : null}

      </div>

    {selectedClass && selectedCourse && selectedRoom && (
      <AttendanceListDialog
        open={dialogStates.attendance}
        onOpenChange={(open) => (open ? openDialog('attendance') : closeDialog('attendance'))}
        classItem={selectedClass}
        course={selectedCourse}
        room={selectedRoom}
        students={classStudents}
        instructor={primaryInstructor || undefined}
      />
    )}

    {selectedClass && (
      <AddWaitingListDialog
        open={dialogStates.waitingList}
        onOpenChange={(open) => (open ? openDialog('waitingList') : closeDialog('waitingList'))}
        onAdd={handleAddWaitingListStudent}
        className={selectedClass.displayName || selectedClass.code}
      />
    )}

    {selectedClass && transferStudent && (
      <TransferClassDialog
        open={dialogStates.transfer}
        onOpenChange={(open) => {
          if (!open) {
            setTransferStudent(null);
          }
          open ? openDialog('transfer') : closeDialog('transfer');
        }}
        aluno={{
          id: transferStudent.id,
          nome: transferStudent.name,
          turmaId: transferStudent.classId || selectedClass.id,
        }}
        turmas={classes.map((classItem) => ({
          id: classItem.id,
          cursoId: classItem.courseId,
          codigo: classItem.code,
          nomePersonalizado: classItem.displayName,
          dataInicio: classItem.startDate,
          dataFim: classItem.endDate,
          salaId: classItem.roomId || '',
          preco: classItem.price,
        }))}
        cursos={courses.map((courseItem) => ({ id: courseItem.id, nome: courseItem.name }))}
        salas={rooms.map((room) => ({
          id: room.id,
          nome: room.name,
          localizacao: room.location || '',
        }))}
        lancamentosCusto={costEntries.map((entry) => ({
          id: entry.id,
          codigo: entry.code,
          valor: entry.value,
          observacoes: entry.notes,
        }))}
        onTransferirAluno={handleTransferStudent}
        verificarCustosProvaParaExcluir={verifyExamCostsForTransfer}
      />
    )}

    {selectedClass && substituteStudent && (
      <SelectSubstituteDialog
        open={dialogStates.substitute}
        onOpenChange={(open) => {
          if (!open) {
            setSubstituteStudent(null);
          }
          open ? openDialog('substitute') : closeDialog('substitute');
        }}
        alunoAntigo={substituteStudent}
        alunosFilaEspera={waitingListStudents}
        onConfirmar={handleConfirmSubstitute}
      />
    )}

    {selectedClass && selectedCourse && reportRoom && (
      <ClassReportDialog
        open={dialogStates.report}
        onOpenChange={(open) => (open ? openDialog('report') : closeDialog('report'))}
        classItem={selectedClass}
        course={selectedCourse}
        room={reportRoom}
        instructor={primaryInstructor || undefined}
        students={classStudents}
        company={selectedCompany || undefined}
        extraProducts={extraProducts}
      />
    )}

    {selectedClass && (
      <AddInstructorDialog
        open={dialogStates.addInstructor}
        onOpenChange={(open) => (open ? openDialog('addInstructor') : closeDialog('addInstructor'))}
        instructors={instructors}
        alreadyLinkedInstructorIds={linkedInstructorIds}
        onConfirm={handleAddInstructorToClass}
      />
    )}

    {selectedClass && (
      <ScheduleExamDialog
        open={dialogStates.scheduleExam}
        onOpenChange={(open) => {
          if (open) {
            openDialog('scheduleExam');
            return;
          }
          closeDialog('scheduleExam');
          setEditingExam(null);
          setExamDialogInstructorId(undefined);
        }}
        mode="select-students"
        instructorId={examDialogInstructorId}
        classId={selectedClass.id}
        classes={classes}
        students={students}
        instructors={instructors}
        autoExamNumber={getNextExamNumber()}
        existingExam={
          editingExam
            ? {
                id: editingExam.id,
                examNumber: editingExam.examNumber,
                examName: editingExam.examName,
                data: editingExam.date,
                hora: editingExam.time,
                instructorId: editingExam.instructorId,
                studentIds: editingExam.studentIds,
              }
            : undefined
        }
        onScheduleExam={handleScheduleExam}
        onEditExam={handleEditExam}
      />
    )}

    {selectedClass && selectedInstructor && (
      <InstructorExamsDialog
        open={dialogStates.instructorExams}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInstructorId(null);
          }
          open ? openDialog('instructorExams') : closeDialog('instructorExams');
        }}
        instructorId={selectedInstructor.id}
        classId={selectedClass.id}
        instructor={selectedInstructor}
        classItem={selectedClass}
        scheduledExams={scheduledExams}
        students={students}
        onNewExam={() => handleOpenScheduleExam(selectedInstructor.id)}
        onEditExam={(exam) => handleOpenScheduleExam(exam.instructorId, exam)}
        onDeleteExam={handleDeleteExam}
      />
    )}

    {selectedInstructor && (
      <InstructorCostsDialog
        open={dialogStates.instructorCosts}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInstructorId(null);
          }
          open ? openDialog('instructorCosts') : closeDialog('instructorCosts');
        }}
        instructor={selectedInstructor}
        linkedCostIds={instructorCostLinks[selectedInstructor.id] || []}
        availableCosts={auditableCosts}
        onLinkCost={handleLinkCost}
        onUnlinkCost={handleUnlinkCost}
      />
    )}

    <Dialog
      open={dialogStates.enrollment}
      onOpenChange={(open) => {
        if (!open) {
          resetEnrollmentForm();
        }
        open ? openDialog('enrollment') : closeDialog('enrollment');
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Formulario de Matricula</DialogTitle>
          <DialogDescription>
            Preencha os dados do aluno e gere o token de matricula.
          </DialogDescription>
        </DialogHeader>
        <EnrollmentForm
          showQRCode={showQrCode}
          enrollmentToken={enrollmentToken}
          enrollmentData={enrollmentDraft}
          studentSearch={enrollmentSearch}
          foundStudent={foundStudent}
          companies={companyOptions}
          extraProducts={extraProductOptions}
          course={courseOption}
          classItem={classOption}
          setEnrollmentData={setEnrollmentDraft}
          setStudentSearch={setEnrollmentSearch}
          searchExistingStudent={handleSearchExistingStudent}
          toggleLinkedProduct={handleToggleLinkedProduct}
          toggleLinkedExtra={handleToggleLinkedExtra}
          handleAddStudent={handleAddEnrollment}
          setShowQRCode={setShowQrCode}
        />
      </DialogContent>
    </Dialog>

    <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Turma</DialogTitle>
          <DialogDescription>Atualize os dados principais da turma.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-display-name">Nome exibido</Label>
            <Input
              id="edit-display-name"
              value={editClassData.displayName}
              onChange={(event) =>
                setEditClassData((prev) => ({ ...prev, displayName: event.target.value }))
              }
              placeholder="Nome opcional da turma"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Data de inicio</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={editClassData.startDate}
                onChange={(event) =>
                  setEditClassData((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">Data de termino</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={editClassData.endDate}
                onChange={(event) =>
                  setEditClassData((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room">Sala</Label>
              <Select
                value={editClassData.roomId}
                onValueChange={(value) =>
                  setEditClassData((prev) => ({ ...prev, roomId: value }))
                }
              >
                <SelectTrigger id="edit-room">
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editClassData.status}
                onValueChange={(value) =>
                  setEditClassData((prev) => ({ ...prev, status: value as ClassStatus }))
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planejada</SelectItem>
                  <SelectItem value="Confirmed">Confirmada</SelectItem>
                  <SelectItem value="InProgress">Em andamento</SelectItem>
                  <SelectItem value="Completed">Concluida</SelectItem>
                  <SelectItem value="Cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditClassOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editingClassId) return;

                try {
                  const updated = await classesService.update(editingClassId, {
                    displayName: editClassData.displayName || undefined,
                    startDate: editClassData.startDate,
                    endDate: editClassData.endDate,
                    roomId: editClassData.roomId || undefined,
                    status: editClassData.status,
                  });

                  updateClass(editingClassId, updated);
                  setEditClassOpen(false);
                  toast.success('Turma atualizada');
                } catch {
                  toast.error('Falha ao atualizar turma no servidor');
                }
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
