import { create } from 'zustand';
import { useCostsStore } from './costs.store';
import { useExamsStore } from './exams.store';

// ============================================
// Caiso - Classes Store (Módulo 02)
// ============================================

export type ClassStatus = 'Planned' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';

export interface InstructorAttendance {
  date: string;
  confirmedAt: string;
  confirmedBy: string;
}

export interface ClassInstructor {
  instructorId: string;
  attendances: InstructorAttendance[];
}

export interface Class {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  courseId: string;
  roomId?: string;
  startDate: string;
  endDate: string;
  schedule?: string; // Horário (ex: "08:00 - 17:00")
  maxStudents: number;
  availableSpots: number;
  currentStudents: number;
  status: ClassStatus;
  price: number;
  companyId?: string; // Cliente PJ
  instructors?: ClassInstructor[];
  enrolledStudentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ClassesState {
  classes: Class[];
  selectedClass: Class | null;
  loading: boolean;
  error: string | null;

  filters: {
    search: string;
    courseId: string | null;
    instructorId: string | null;
    status: ClassStatus | null;
    dateRange: { start: string | null; end: string | null };
  };

  setClasses: (classes: Class[]) => void;
  setSelectedClass: (classItem: Class | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ClassesState['filters']>) => void;

  addClass: (classItem: Class) => void;
  updateClass: (id: string, classItem: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  linkInstructorToClass: (classId: string, instructorId: string) => void;
  unlinkInstructorFromClass: (classId: string, instructorId: string) => void;
  confirmInstructorAttendance: (
    classId: string,
    instructorId: string,
    date: string,
    confirmedBy: string
  ) => void;

  getFilteredClasses: () => Class[];

  reset: () => void;
}

const initialState = {
  classes: [] as Class[],
  selectedClass: null as Class | null,
  loading: false,
  error: null as string | null,
  filters: {
    search: '',
    courseId: null as string | null,
    instructorId: null as string | null,
    status: null as ClassStatus | null,
    dateRange: { start: null as string | null, end: null as string | null },
  },
};

export const useClassesStore = create<ClassesState>()(
  (set, get) => ({
      ...initialState,

      setClasses: (classes) => set({ classes, error: null }),
      setSelectedClass: (classItem) => set({ selectedClass: classItem }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      addClass: (classItem) =>
        set((state) => ({
          classes: [...state.classes, classItem],
        })),

      updateClass: (id, classData) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, ...classData } : c
          ),
          selectedClass:
            state.selectedClass?.id === id
              ? { ...state.selectedClass, ...classData }
              : state.selectedClass,
        })),

      deleteClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          selectedClass:
            state.selectedClass?.id === id ? null : state.selectedClass,
        })),

      linkInstructorToClass: (classId, instructorId) => {
        // Side-effects: gerar custos automáticos quando instrutor é vinculado à turma
        try {
          useCostsStore.getState().triggerAutomaticCosts('InstructorLinkedToClass', {
            instructorId,
            classId,
          });
        } catch { /* costs store may not be initialized */ }

        set((state) => {
          const classes = state.classes.map((c) => {
            if (c.id !== classId) return c;
            const current = c.instructors || [];
            if (current.some((item) => item.instructorId === instructorId)) return c;
            return {
              ...c,
              instructors: [...current, { instructorId, attendances: [] }],
              updatedAt: new Date().toISOString(),
            };
          });

          const selectedClass =
            state.selectedClass?.id === classId
              ? classes.find((c) => c.id === classId) || state.selectedClass
              : state.selectedClass;

          return { classes, selectedClass };
        });
      },

      unlinkInstructorFromClass: (classId, instructorId) => {
        // Side-effects: cascade delete cost entries and exams for this instructor+class
        try {
          useCostsStore.getState().deleteCostEntriesByInstructorClass({ instructorId, classId });
        } catch { /* costs store may not be initialized */ }
        try {
          const examsStore = useExamsStore.getState();
          const examsToRemove = examsStore.exams.filter(
            (e) => e.instructorId === instructorId && e.classId === classId
          );
          examsToRemove.forEach((e) => examsStore.deleteExam(e.id));
        } catch { /* exams store may not be initialized */ }

        set((state) => {
          const classes = state.classes.map((c) => {
            if (c.id !== classId) return c;
            const updatedInstructors = (c.instructors || []).filter(
              (item) => item.instructorId !== instructorId
            );
            return {
              ...c,
              instructors: updatedInstructors,
              updatedAt: new Date().toISOString(),
            };
          });

          const selectedClass =
            state.selectedClass?.id === classId
              ? classes.find((c) => c.id === classId) || state.selectedClass
              : state.selectedClass;

          return { classes, selectedClass };
        });
      },

      confirmInstructorAttendance: (classId, instructorId, date, confirmedBy) =>
        set((state) => {
          const confirmedAt = new Date().toISOString();
          const classes = state.classes.map((c) => {
            if (c.id !== classId) return c;
            const instructors = (c.instructors || []).map((item) => {
              if (item.instructorId !== instructorId) return item;
              const attendances = item.attendances || [];
              const alreadyConfirmed = attendances.some((a) => a.date === date);
              if (alreadyConfirmed) return item;
              return {
                ...item,
                attendances: [...attendances, { date, confirmedAt, confirmedBy }],
              };
            });
            return { ...c, instructors, updatedAt: confirmedAt };
          });

          const selectedClass =
            state.selectedClass?.id === classId
              ? classes.find((c) => c.id === classId) || state.selectedClass
              : state.selectedClass;

          return { classes, selectedClass };
        }),

      getFilteredClasses: () => {
        const state = get();
        let filtered = [...state.classes];

        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.code.toLowerCase().includes(search)
          );
        }

        if (state.filters.courseId) {
          filtered = filtered.filter(
            (c) => c.courseId === state.filters.courseId
          );
        }

        if (state.filters.status) {
          filtered = filtered.filter((c) => c.status === state.filters.status);
        }

        return filtered;
      },

      reset: () => set(initialState),
    })
);
