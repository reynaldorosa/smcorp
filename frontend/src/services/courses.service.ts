import { api } from '@/lib/api';
import type { Course } from '@/stores/courses.store';

// ============================================
// SMCORP - Courses Service (Módulo 01)
// ============================================

type RequiredDocumentInput = string | { name: string; requiresUpload?: boolean };

export interface CreateCourseDTO {
  code?: string;
  name: string;
  displayName?: string;
  description?: string;
  syllabus?: string;
  durationHours: number;
  hoursPerDay?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  breakDuration?: number;
  allowWeekends?: boolean;
  allowSaturday?: boolean;
  allowSunday?: boolean;
  requiredDocuments?: RequiredDocumentInput[];
  learningTime?: number;
  certificationInfo?: string;
  linkedProducts?: string[];
  linkedExtras?: string[];
  cashValue?: number;
  price: number;
  validityMonths: number;
  isOffshore?: boolean;
  isActive?: boolean;
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  active?: boolean;
}

type ApiCourse = {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  description?: string;
  syllabus?: string;
  category?: string;
  durationHours?: number;
  duration?: number;
  hoursPerDay?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  breakDuration?: number;
  allowWeekends?: boolean;
  allowSaturday?: boolean;
  allowSunday?: boolean;
  requiredDocuments?: RequiredDocumentInput[];
  learningTime?: number | null;
  certificationInfo?: string | null;
  linkedProducts?: string[];
  linkedExtras?: string[];
  cashValue?: number;
  price?: number;
  validityMonths?: number;
  isOffshore?: boolean;
  isActive?: boolean;
  active?: boolean;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeRequiredDocuments(input: RequiredDocumentInput[] | undefined) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((doc) => {
      if (typeof doc === 'string') {
        const name = doc.trim();
        return name ? { name, requiresUpload: true } : null;
      }

      const name = String(doc?.name ?? '').trim();
      if (!name) {
        return null;
      }

      return {
        name,
        requiresUpload: doc.requiresUpload ?? true,
      };
    })
    .filter((doc): doc is { name: string; requiresUpload: boolean } => Boolean(doc));
}

function mapApiCourseToStore(course: ApiCourse): Course {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    displayName: course.displayName,
    description: course.description,
    category: course.category,
    duration: course.durationHours ?? course.duration ?? 0,
    hoursPerDay: course.hoursPerDay ?? 8,
    startTime: course.defaultStartTime,
    endTime: course.defaultEndTime,
    breakDuration: course.breakDuration,
    useWeekends: course.allowWeekends ?? false,
    allowSaturday: course.allowSaturday ?? course.allowWeekends ?? false,
    allowSunday: course.allowSunday ?? course.allowWeekends ?? false,
    price: course.price ?? 0,
    certificationValidity: course.validityMonths ?? 0,
    syllabus: course.syllabus,
    requiredDocuments: normalizeRequiredDocuments(course.requiredDocuments),
    linkedProducts: Array.isArray(course.linkedProducts) ? course.linkedProducts : [],
    linkedExtras: Array.isArray(course.linkedExtras) ? course.linkedExtras : [],
    learningTime: course.learningTime ?? null,
    certificationInfo: course.certificationInfo ?? null,
    cashValue: course.cashValue ?? 0,
    isOffshore: course.isOffshore,
    active: course.isActive ?? course.active ?? true,
    deleted: course.deleted,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export const coursesService = {
  /**
   * Busca todos os cursos
   */
  getAll: async (): Promise<Course[]> => {
    const response = await api.get('/courses');

    const courses = response.data as ApiCourse[];
    return (Array.isArray(courses) ? courses : []).map(mapApiCourseToStore);
  },

  /**
   * Busca um curso por ID
   */
  getById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return mapApiCourseToStore(response.data as ApiCourse);
  },

  /**
   * Cria um novo curso
   */
  create: async (data: CreateCourseDTO): Promise<Course> => {
    const response = await api.post('/courses', data);
    return mapApiCourseToStore(response.data as ApiCourse);
  },

  /**
   * Atualiza um curso existente
   */
  update: async (id: string, data: UpdateCourseDTO): Promise<Course> => {
    const response = await api.patch(`/courses/${id}`, data);
    return mapApiCourseToStore(response.data as ApiCourse);
  },

  /**
   * Remove um curso
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  /**
   * Busca cursos ativos
   */
  getActive: async (): Promise<Course[]> => {
    const response = await api.get('/courses', {
      params: { active: true },
    });
    const courses = response.data as ApiCourse[];
    return (Array.isArray(courses) ? courses : []).map(mapApiCourseToStore);
  },
};
