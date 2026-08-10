import { create } from 'zustand';
import { useClassesStore } from '@/stores/classes.store';
import { useCostsStore, type CostTriggerAction } from '@/stores/costs.store';
import { useExamsStore } from '@/stores/exams.store';

// ============================================
// Caiso - Students Store (Módulo 03)
// ============================================

export type StudentStatus = 'Active' | 'Inactive' | 'Pending' | 'WaitingList' | 'Replaced';
export type LinkStatus = 'Scheduled' | 'ToConfirm' | 'Confirmed' | 'Present';
export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partial' | 'Overdue' | 'Cancelled';
export type ExamResult = 'Pending' | 'Approved' | 'Failed' | 'NoShow';

export interface StudentDocument {
  id: string;
  name: string;
  type: 'upload' | 'text';
  fileUrl?: string;
  textValue?: string;
  submittedAt: string;
  status: DocumentStatus;
  rejectionReason?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  time: string;
  paymentMethod: string;
  notes?: string;
  recordedBy: string;
  confirmedBy?: string;
  confirmationDate?: string;
  confirmationTime?: string;
  boletoBarcode?: string;
  boletoDueDate?: string;
  invoiceNumber?: string;
  linkedTo?: string;
  paymentBatchId?: string;
  vinculadoA?: string;
  loteConfirmacaoPagamentoId?: string;
}

export interface StudentPayment {
  history: PaymentRecord[];
  totalPaid: number;
  pending: boolean;
}

export interface ExamStatus {
  active: boolean;
  instructorId?: string;
  date?: string;
  time?: string;
  examNumber?: string;
  examName?: string;
  result?: ExamResult;
}

export interface ExamResultDetails {
  score: any;
  status: ExamResult;
  date: string;
  time: string;
  notes: string;
  recordedBy: string;
  confirmedBy: string;
  confirmationDate: string;
  confirmationTime: string;
}

export interface Receipt {
  productId: string;
  productName: string;
  receiptNumber: string;
  generatedAt: string;
  productType: 'main' | 'extra';
  paidByIndividual?: boolean;
}

export interface ExtraProductPayment {
  id: string;
  productId: string;
  productName: string;
  totalValue: number;
  payments: StudentPayment;
  receipts?: { receiptNumber: string; generatedAt: string }[];
}

export interface Student {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  rg?: string;
  birthDate?: string;
  address?: string;
  photoUrl?: string;
  status: StudentStatus;
  linkStatus?: LinkStatus;
  classId?: string;
  enrollmentId?: string;
  companyId?: string;
  personType?: 'individual' | 'company';
  // Matrículas retornadas pela API (base para derivar enrollmentId/classId)
  enrollments?: Array<{
    id: string;
    classId?: string;
    status?: string;
    documentsStatus?: string;
    deletedAt?: string | null;
  }>;
  
  // Valores
  totalValue: number;
  discount?: number;
  
  // Documentos e Pagamentos
  documentsComplete?: boolean;
  documents?: StudentDocument[];
  paymentComplete?: boolean;
  payments?: StudentPayment;
  
  // Datas do Aluno na Turma
  studentStartDate?: string;
  studentEndDate?: string;
  
  // Prova
  examStatus?: ExamStatus;
  examResult?: ExamResultDetails;
  
  // Extras
  extraProductIds?: string[];
  extraProductPayments?: ExtraProductPayment[];
  pfProductPayments?: ExtraProductPayment[];  // Products paid by PF (for PJ students)
  receipts?: Receipt[];
  
  // Presença
  attendanceByDay?: Record<string, boolean>;
  
  // Substituição
  isReplaced?: boolean;
  isWaitingList?: boolean;
  replacedStudentId?: string;
  replacementDate?: string;
  replacementReason?: string;
  
  // Observações
  notes?: string;
  approvalBatchId?: string;
  
  createdAt: string;
  updatedAt: string;
}

interface StudentsState {
  students: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
  
  filters: {
    search: string;
    status: StudentStatus | null;
    classId: string | null;
    companyId: string | null;
  };

  setStudents: (students: Student[]) => void;
  setSelectedStudent: (student: Student | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<StudentsState['filters']>) => void;

  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  updateStudentsBatch: (updates: Record<string, Partial<Student>>) => void;
  deleteStudent: (id: string) => void;
  substituteStudent: (oldStudentId: string, newStudentId: string, reason?: string) => void;
  transferStudent: (studentId: string, newClassId: string) => void;
  markAttendanceDay: (studentId: string, date: string) => void;
  cancelExam: (studentId: string) => void;
  registerExamResult: (studentId: string, data: {
    status: ExamResult;
    notes?: string;
    score?: any;
    recordedBy?: string;
    confirmedBy?: string;
    confirmationDate?: string;
    confirmationTime?: string;
  }) => void;

  getFilteredStudents: () => Student[];

  reset: () => void;
}

const initialState = {
  students: [] as Student[],
  selectedStudent: null as Student | null,
  loading: false,
  error: null as string | null,
  filters: {
    search: '',
    status: null as StudentStatus | null,
    classId: null as string | null,
    companyId: null as string | null,
  },
};

export const useStudentsStore = create<StudentsState>()(
  (set, get) => ({
      ...initialState,

      setStudents: (students) => set({ students, error: null }),
      setSelectedStudent: (student) => set({ selectedStudent: student }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      addStudent: (student) => {
        set((state) => ({
          students: [...state.students, student],
        }));

        const classInfo = student.classId
          ? useClassesStore.getState().classes.find((c) => c.id === student.classId)
          : undefined;
        const context = {
          studentId: student.id,
          classId: student.classId,
          courseId: classInfo?.courseId,
          companyId: student.companyId,
          studentExtraProductIds: student.extraProductIds,
        };
        useCostsStore.getState().triggerAutomaticCosts('NewEnrollment', context);
      },

      updateStudent: (id, studentData) => {
        const state = get();
        const previous = state.students.find((student) => student.id === id);

        set((prevState) => ({
          students: prevState.students.map((student) =>
            student.id === id ? { ...student, ...studentData } : student
          ),
          selectedStudent:
            prevState.selectedStudent?.id === id
              ? { ...prevState.selectedStudent, ...studentData }
              : prevState.selectedStudent,
        }));

        if (!previous) return;

        const nextStudent = { ...previous, ...studentData };
        const classInfo = nextStudent.classId
          ? useClassesStore.getState().classes.find((c) => c.id === nextStudent.classId)
          : undefined;
        const context = {
          studentId: nextStudent.id,
          classId: nextStudent.classId,
          courseId: classInfo?.courseId,
          companyId: nextStudent.companyId,
          studentExtraProductIds: nextStudent.extraProductIds,
          instructorId: nextStudent.examStatus?.instructorId,
          examNumber: nextStudent.examStatus?.examNumber,
          examName: nextStudent.examStatus?.examName,
        };

        const actions: CostTriggerAction[] = [];

        if (studentData.linkStatus && studentData.linkStatus !== previous.linkStatus) {
          if (studentData.linkStatus === 'Scheduled') actions.push('StatusScheduled');
          if (studentData.linkStatus === 'ToConfirm') actions.push('StatusConfirm');
          if (studentData.linkStatus === 'Confirmed') actions.push('StatusConfirmed');
          if (studentData.linkStatus === 'Present') actions.push('StatusPresent');
        }

        if (studentData.status && studentData.status !== previous.status) {
          if (studentData.status === 'Replaced') actions.push('StudentReplaced');
        }

        if (studentData.classId && studentData.classId !== previous.classId) {
          actions.push('StudentTransferred');
        }

        if (studentData.attendanceByDay) {
          const prevAttendance = previous.attendanceByDay || {};
          const nextAttendance = studentData.attendanceByDay;
          const hasNewPresence = Object.keys(nextAttendance).some(
            (date) => nextAttendance[date] && !prevAttendance[date]
          );
          if (hasNewPresence) actions.push('AttendanceMarked');
        }

        if (studentData.examStatus) {
          const prevActive = previous.examStatus?.active;
          const nextActive = studentData.examStatus.active;
          if (!prevActive && nextActive) {
            actions.push('ExamScheduled');
            if (studentData.examStatus.instructorId) {
              actions.push('InstructorAssignedToExam');
            }
          }
          if (prevActive && !nextActive) {
            actions.push('ExamCancelled');
          }
        }

        if (studentData.examResult && studentData.examResult.status !== previous.examResult?.status) {
          if (studentData.examResult.status === 'Approved') actions.push('ExamPassed');
          if (studentData.examResult.status === 'Failed') actions.push('ExamFailed');
          if (studentData.examResult.status === 'NoShow') actions.push('ExamNoShow');
        }

        if (studentData.documentsComplete && !previous.documentsComplete) {
          actions.push('AllDocsApproved');
        }

        if (studentData.documents && studentData.documents.length > 0) {
          const prevDocs = previous.documents || [];
          const approvedNow = studentData.documents.some((doc) => doc.status === 'Approved');
          const approvedBefore = prevDocs.some((doc) => doc.status === 'Approved');
          if (approvedNow && !approvedBefore) {
            actions.push('DocApproved');
          }
        }

        if (studentData.payments) {
          const prevHistoryCount = previous.payments?.history?.length || 0;
          const nextHistoryCount = studentData.payments.history?.length || 0;
          if (prevHistoryCount === 0 && nextHistoryCount > 0) {
            actions.push('FirstPayment');
          }

          if (studentData.payments.pending === false && previous.payments?.pending !== false) {
            actions.push('PaymentConfirmed');
          }
        }

        if (studentData.paymentComplete && !previous.paymentComplete) {
          actions.push('PaymentConfirmed');
        }

        const editedFields = Object.keys(studentData).filter((key) => key !== 'linkStatus');
        if (editedFields.length > 0 && actions.length === 0) {
          actions.push('StudentEdited');
        }

        actions.forEach((action) => {
          useCostsStore.getState().triggerAutomaticCosts(action, context);
        });
      },

      updateStudentsBatch: (updates) =>
        set((state) => ({
          students: state.students.map((student) =>
            updates[student.id]
              ? { ...student, ...updates[student.id] }
              : student
          ),
          selectedStudent:
            state.selectedStudent && updates[state.selectedStudent.id]
              ? { ...state.selectedStudent, ...updates[state.selectedStudent.id] }
              : state.selectedStudent,
        })),

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((student) => student.id !== id),
          selectedStudent:
            state.selectedStudent?.id === id ? null : state.selectedStudent,
        }));

        useCostsStore.getState().deleteCostEntriesByStudentId(id);
      },

      substituteStudent: (oldStudentId, newStudentId, reason) => {
        const { students } = get();
        const oldStudent = students.find((item) => item.id === oldStudentId);
        const newStudent = students.find((item) => item.id === newStudentId);
        if (!oldStudent || !newStudent) return;

        const examsStore = useExamsStore.getState();
        const costsStore = useCostsStore.getState();
        const relatedExams = examsStore.exams.filter((exam) =>
          exam.studentIds.includes(oldStudent.id)
        );

        relatedExams.forEach((exam) => {
          const remainingStudentIds = exam.studentIds.filter(
            (id) => id !== oldStudent.id
          );
          if (remainingStudentIds.length === 0) {
            examsStore.deleteExam(exam.id);
            costsStore.deleteCostEntriesByExam({
              instructorId: exam.instructorId,
              examNumber: exam.examNumber,
              classId: exam.classId,
            });
          } else {
            examsStore.updateExam(exam.id, { studentIds: remainingStudentIds });
          }
        });

        const now = new Date().toISOString();
        const classInfo = oldStudent.classId
          ? useClassesStore.getState().classes.find((c) => c.id === oldStudent.classId)
          : undefined;

        get().updateStudent(oldStudent.id, {
          status: 'Replaced',
          isReplaced: true,
          isWaitingList: false,
          replacedStudentId: newStudent.id,
          replacementDate: now,
          replacementReason: reason,
          examStatus: { active: false },
        });

        get().updateStudent(newStudent.id, {
          status: 'Active',
          isWaitingList: false,
          isReplaced: false,
          replacedStudentId: oldStudent.id,
          replacementDate: now,
          replacementReason: reason,
          linkStatus: 'Scheduled',
          classId: oldStudent.classId || newStudent.classId,
          studentStartDate: newStudent.studentStartDate || classInfo?.startDate,
          studentEndDate: newStudent.studentEndDate || classInfo?.endDate,
        });
      },

      transferStudent: (studentId, newClassId) => {
        const { students } = get();
        const student = students.find((item) => item.id === studentId);
        if (!student) return;

        const examsStore = useExamsStore.getState();
        const costsStore = useCostsStore.getState();
        const relatedExams = examsStore.exams.filter((exam) =>
          exam.studentIds.includes(studentId)
        );

        relatedExams.forEach((exam) => {
          const remainingStudentIds = exam.studentIds.filter(
            (id) => id !== studentId
          );
          if (remainingStudentIds.length === 0) {
            examsStore.deleteExam(exam.id);
            costsStore.deleteCostEntriesByExam({
              instructorId: exam.instructorId,
              examNumber: exam.examNumber,
              classId: exam.classId,
            });
          } else {
            examsStore.updateExam(exam.id, { studentIds: remainingStudentIds });
          }
        });

        get().updateStudent(studentId, {
          classId: newClassId,
          linkStatus: 'Scheduled',
          examStatus: { active: false },
        });
      },

      markAttendanceDay: (studentId, date) => {
        const student = get().students.find((item) => item.id === studentId);
        if (!student) return;
        const nextAttendance = { ...(student.attendanceByDay || {}) };
        nextAttendance[date] = true;
        get().updateStudent(studentId, { attendanceByDay: nextAttendance });
      },

      cancelExam: (studentId) => {
        get().updateStudent(studentId, { examStatus: { active: false } });
      },

      registerExamResult: (studentId, data) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toISOString().split('T')[1].substring(0, 5);
        get().updateStudent(studentId, {
          examResult: {
            score: data.score,
            status: data.status,
            date,
            time,
            notes: data.notes || '',
            recordedBy: data.recordedBy || 'system',
            confirmedBy: data.confirmedBy || 'system',
            confirmationDate: data.confirmationDate || date,
            confirmationTime: data.confirmationTime || time,
          },
        });
      },

      getFilteredStudents: () => {
        const state = get();
        let filtered = [...state.students];

        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(search) ||
              s.code.toLowerCase().includes(search) ||
              s.taxId?.includes(search) ||
              s.email?.toLowerCase().includes(search)
          );
        }

        if (state.filters.status) {
          filtered = filtered.filter((s) => s.status === state.filters.status);
        }

        if (state.filters.classId) {
          filtered = filtered.filter(
            (s) => s.classId === state.filters.classId
          );
        }

        if (state.filters.companyId) {
          filtered = filtered.filter(
            (s) => s.companyId === state.filters.companyId
          );
        }

        return filtered;
      },

      reset: () => set(initialState),
    })
);
