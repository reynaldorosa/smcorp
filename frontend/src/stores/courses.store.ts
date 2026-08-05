import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// SMCORP - Courses Store (Módulo 01)
// ============================================

export interface Course {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  workloadHours?: number;
  duration: number; // Carga horária total em horas
  totalWorkloadHours?: number;
  hoursPerDay?: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  breakDuration?: number; // Intervalo em minutos
  useWeekends?: boolean; // Compatibilidade retroativa
  allowSaturday?: boolean;
  allowSunday?: boolean;
  price: number;
  certificationValidity?: number; // Em meses
  syllabus?: string; // Conteúdo programático
  linkedProducts?: string[];
  linkedExtras?: string[];
  requiredDocuments?: { name: string; requiresUpload: boolean }[];
  // DNA Técnico (M01)
  isOffshore?: boolean;
  learningTime?: number | null;
  certificationInfo?: string | null;
  prerequisites?: string[];
  // Dados Financeiros
  cashValue?: number; // Valor Caixa
  active: boolean;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CoursesState {
  courses: Course[];
  selectedCourse: Course | null;
  loading: boolean;
  error: string | null;

  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addCourse: (course: Course) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  reset: () => void;
}

const initialState = {
  courses: [] as Course[],
  selectedCourse: null as Course | null,
  loading: false,
  error: null as string | null,
};

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set) => ({
      ...initialState,

      setCourses: (courses) => set({ courses, error: null }),
      setSelectedCourse: (course) => set({ selectedCourse: course }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      addCourse: (course) =>
        set((state) => ({
          courses: [...state.courses, course],
        })),

      updateCourse: (id, courseData) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id ? { ...course, ...courseData } : course
          ),
          selectedCourse:
            state.selectedCourse?.id === id
              ? { ...state.selectedCourse, ...courseData }
              : state.selectedCourse,
        })),

      deleteCourse: (id) =>
        set((state) => {
          const updatedAt = new Date().toISOString();
          return {
            courses: state.courses.map((course) =>
              course.id === id
                ? { ...course, deleted: true, active: false, updatedAt }
                : course
            ),
            selectedCourse:
              state.selectedCourse?.id === id
                ? { ...state.selectedCourse, deleted: true, active: false, updatedAt }
                : state.selectedCourse,
          };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'smcorp-courses-storage',
      partialize: (state) => ({
        courses: state.courses,
      }),
    }
  )
);
