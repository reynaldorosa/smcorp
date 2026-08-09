import { create } from 'zustand';
import { useCostsStore } from './costs.store';
import { useStudentsStore } from './students.store';
import { useClassesStore } from './classes.store';
import { examsService } from '@/services/exams.service';

// ============================================
// Caiso - Scheduled Exams Store (Module 03)
// ============================================

export type ScheduledExamStatus = 'Scheduled' | 'Cancelled';

export interface ScheduledExam {
  id: string;
  backendExamIds?: string[];
  classId: string;
  examNumber: string;
  examName: string;
  date: string;
  time: string;
  instructorId: string;
  studentIds: string[];
  status: ScheduledExamStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExamsState {
  exams: ScheduledExam[];
  loading: boolean;
  error: string | null;
  examCounter: number;

  setExams: (exams: ScheduledExam[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadOperationalExams: () => Promise<void>;

  addExam: (exam: Omit<ScheduledExam, 'id' | 'createdAt' | 'updatedAt'>) => ScheduledExam;
  updateExam: (id: string, exam: Partial<ScheduledExam>) => void;
  deleteExam: (id: string) => void;
  getNextExamNumber: () => string;

  getExamsByClass: (classId: string) => ScheduledExam[];
  getExamsByInstructor: (instructorId: string) => ScheduledExam[];
  getStudentsInSameExam: (params: {
    examNumber: string;
    classId?: string;
    instructorId?: string;
  }) => string[];

  reset: () => void;
}

const initialState = {
  exams: [] as ScheduledExam[],
  loading: false,
  error: null as string | null,
  examCounter: 1,
};

const formatExamNumber = (counter: number) => `P${String(counter).padStart(4, '0')}`;

const getCounterFromExams = (exams: ScheduledExam[]) => {
  const maxCounter = exams.reduce((max, exam) => {
    const match = /^P(\d+)$/.exec(exam.examNumber);
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return maxCounter + 1;
};

function toIsoDate(value: string): string {
  if (value.includes('T')) return value;
  return `${value}T00:00:00.000Z`;
}

async function syncExamCreate(exam: ScheduledExam): Promise<string[]> {
  const classInfo = useClassesStore
    .getState()
    .classes.find((item) => item.id === exam.classId);
  if (!classInfo?.courseId) return [];

  const students = useStudentsStore.getState().students;
  const backendExamIds: string[] = [];

  for (const studentId of exam.studentIds) {
    const student = students.find((item) => item.id === studentId);
    if (!student?.enrollmentId) continue;

    try {
      const created = await examsService.schedule({
        enrollmentId: student.enrollmentId,
        courseId: classInfo.courseId,
        instructorId: exam.instructorId,
        examNumber: exam.examNumber,
        examType: exam.examName,
        scheduledDate: toIsoDate(exam.date),
        scheduledTime: exam.time,
        duration: 60,
      });
      backendExamIds.push(created.id);
    } catch {
      // ignora erro unitário para não travar fluxo operacional
    }
  }

  return backendExamIds;
}

async function syncExamUpdate(exam: ScheduledExam) {
  if (!exam.backendExamIds?.length) return;
  await Promise.all(
    exam.backendExamIds.map((id) =>
      examsService.update(id, {
        examNumber: exam.examNumber,
        examType: exam.examName,
        scheduledDate: toIsoDate(exam.date),
        scheduledTime: exam.time,
        instructorId: exam.instructorId,
      })
    )
  ).catch(() => undefined);
}

async function syncExamDelete(exam: ScheduledExam) {
  if (!exam.backendExamIds?.length) return;
  await Promise.all(exam.backendExamIds.map((id) => examsService.cancel(id))).catch(
    () => undefined
  );
}

export const useExamsStore = create<ExamsState>()(
  (set, get) => ({
      ...initialState,

      setExams: (exams) =>
        set({
          exams,
          examCounter: getCounterFromExams(exams),
          error: null,
        }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      loadOperationalExams: async () => {
        set({ loading: true, error: null });
        try {
          const exams = await examsService.getOperational();
          set({
            exams,
            examCounter: getCounterFromExams(exams),
            loading: false,
            error: null,
          });
        } catch {
          set({
            loading: false,
            error: 'Falha ao carregar provas da API',
          });
        }
      },

      addExam: (examData) => {
        const { examCounter } = get();
        const now = new Date().toISOString();
        const examNumber = examData.examNumber?.trim() || formatExamNumber(examCounter);
        const exam: ScheduledExam = {
          id: `exam-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          ...examData,
          status: examData.status ?? 'Scheduled',
          examNumber,
        };
        set((state) => ({
          exams: [...state.exams, exam],
          examCounter:
            examNumber === formatExamNumber(state.examCounter)
              ? state.examCounter + 1
              : state.examCounter,
        }));

        void syncExamCreate(exam).then((backendExamIds) => {
          if (backendExamIds.length === 0) return;
          set((state) => ({
            exams: state.exams.map((item) =>
              item.id === exam.id ? { ...item, backendExamIds } : item
            ),
          }));
        });

        return exam;
      },

      updateExam: (id, examData) => {
        const current = get().exams.find((exam) => exam.id === id);
        const updated: ScheduledExam | null = current
          ? {
              ...current,
              ...examData,
              updatedAt: new Date().toISOString(),
            }
          : null;

        set((state) => ({
          exams: state.exams.map((exam) =>
            exam.id === id
              ? { ...exam, ...examData, updatedAt: new Date().toISOString() }
              : exam
          ),
        }));

        if (updated) {
          void syncExamUpdate(updated);
        }
      },

      deleteExam: (id) => {
        // Side-effects: cancel cost entries triggered by 'ExamScheduled' for each student
        const exam = get().exams.find((e) => e.id === id);
        if (exam) {
          void syncExamDelete(exam);
          try {
            const costsStore = useCostsStore.getState();
            // Cancel costs for each student in the exam
            exam.studentIds.forEach((studentId) => {
              costsStore.cancelCostEntriesByAction({
                action: 'ExamScheduled',
                studentId,
                classId: exam.classId,
              });
            });
            // Verify and delete instructor exam costs if this is the last student
            exam.studentIds.forEach((studentId) => {
              const result = costsStore.verifyExamCostsForDeletion({
                studentId,
                classId: exam.classId,
                instructorId: exam.instructorId,
                examNumber: exam.examNumber,
                studentIdsInExam: exam.studentIds,
              });
              if (result.shouldDelete) {
                result.costs.forEach((c) => costsStore.deleteCostEntry(c.id));
              }
            });
          } catch { /* costs store may not be initialized */ }
        }
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
        }));
      },

      getNextExamNumber: () => formatExamNumber(get().examCounter),

      getExamsByClass: (classId) =>
        get().exams.filter((exam) => exam.classId === classId),

      getExamsByInstructor: (instructorId) =>
        get().exams.filter((exam) => exam.instructorId === instructorId),

      getStudentsInSameExam: ({ examNumber, classId, instructorId }) => {
        const exam = get().exams.find((item) => {
          if (item.examNumber !== examNumber) return false;
          if (classId && item.classId !== classId) return false;
          if (instructorId && item.instructorId !== instructorId) return false;
          return true;
        });
        return exam ? [...exam.studentIds] : [];
      },

      reset: () => set(initialState),
    })
);
