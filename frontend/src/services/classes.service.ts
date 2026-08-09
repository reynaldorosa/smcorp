import { api } from '@/lib/api';
import type { Class } from '@/stores/classes.store';

// ============================================
// Caiso - Classes Service (Módulo 02)
// ============================================

export interface CreateClassDTO {
  code?: string;
  name?: string;
  displayName?: string;
  courseId: string;
  instructorId?: string;
  instructorIds?: string[];
  companyId?: string;
  roomId?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  customPrice?: number;
  maxStudents: number;
}

export type UpdateClassDTO = Omit<Partial<CreateClassDTO>, 'instructorId'> & {
  instructorId?: string | null;
  instructorIds?: string[];
  status?: 'Planned' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';
};

type ApiClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

type ApiClass = {
  id: string;
  code: string;
  courseId: string;
  roomId?: string | null;
  instructorId?: string | null;
  companyId?: string | null;
  displayName?: string | null;
  customPrice?: number | string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  maxStudents?: number;
  status: ApiClassStatus;
  createdAt: string;
  updatedAt: string;
  course?: { name?: string };
  instructor?: { id: string; name?: string };
  instructors?: Array<{
    instructorId: string;
    attendances?: Array<{ date: string; confirmedAt: string; confirmedBy: string }>;
  }>;
  _count?: { enrollments?: number };
};

const apiToStoreStatus: Record<ApiClassStatus, Class['status']> = {
  SCHEDULED: 'Planned',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const storeToApiStatus: Record<NonNullable<UpdateClassDTO['status']>, ApiClassStatus> = {
  Planned: 'SCHEDULED',
  Confirmed: 'SCHEDULED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
};

function numberOrZero(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapApiClassToStore(item: ApiClass): Class {
  const currentStudents = item._count?.enrollments ?? 0;
  const maxStudents = item.maxStudents ?? 0;

  return {
    id: item.id,
    code: item.code,
    name: item.course?.name || item.displayName || '',
    displayName: item.displayName ?? undefined,
    courseId: item.courseId,
    roomId: item.roomId ?? undefined,
    startDate: item.startDate,
    endDate: item.endDate,
    schedule:
      item.startTime && item.endTime
        ? `${item.startTime} - ${item.endTime}`
        : undefined,
    maxStudents,
    availableSpots: Math.max(maxStudents - currentStudents, 0),
    currentStudents,
    status: apiToStoreStatus[item.status] || 'Planned',
    price: numberOrZero(item.customPrice),
    companyId: item.companyId ?? undefined,
    instructors:
      item.instructors && item.instructors.length > 0
        ? item.instructors.map((entry) => ({
            instructorId: entry.instructorId,
            attendances: entry.attendances || [],
          }))
        : item.instructorId
          ? [{ instructorId: item.instructorId, attendances: [] }]
          : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapStorePayloadToApi(data: Partial<CreateClassDTO | UpdateClassDTO>) {
  const payload: Record<string, unknown> = {
    ...(data.courseId ? { courseId: data.courseId } : {}),
    ...(data.instructorId !== undefined ? { instructorId: data.instructorId || null } : {}),
    ...(Array.isArray(data.instructorIds) ? { instructorIds: data.instructorIds } : {}),
    ...(data.roomId ? { roomId: data.roomId } : {}),
    ...(data.code ? { code: data.code } : {}),
    ...(data.startDate ? { startDate: data.startDate } : {}),
    ...(data.endDate ? { endDate: data.endDate } : {}),
    ...(data.maxStudents !== undefined ? { maxStudents: data.maxStudents } : {}),
    ...(data.displayName !== undefined ? { displayName: data.displayName || null } : {}),
    ...(data.companyId !== undefined ? { companyId: data.companyId || null } : {}),
    ...(data.customPrice !== undefined ? { customPrice: data.customPrice } : {}),
    ...(data.startTime ? { startTime: data.startTime } : {}),
    ...(data.endTime ? { endTime: data.endTime } : {}),
  };

  if ('status' in data && data.status) {
    payload.status = storeToApiStatus[data.status as NonNullable<UpdateClassDTO['status']>];
  }

  return payload;
}

export const classesService = {
  /**
   * Busca todas as turmas
   */
  getAll: async (): Promise<Class[]> => {
    const response = await api.get('/classes', {
      params: { limit: 1000 },
    });
    const records = (response.data.data || response.data || []) as ApiClass[];
    return (Array.isArray(records) ? records : []).map(mapApiClassToStore);
  },

  /**
   * Busca uma turma por ID
   */
  getById: async (id: string): Promise<Class> => {
    const response = await api.get(`/classes/${id}`);
    return mapApiClassToStore(response.data as ApiClass);
  },

  /**
   * Cria uma nova turma
   */
  create: async (data: CreateClassDTO): Promise<Class> => {
    const response = await api.post('/classes', mapStorePayloadToApi(data));
    return mapApiClassToStore(response.data as ApiClass);
  },

  /**
   * Atualiza uma turma existente
   */
  update: async (id: string, data: UpdateClassDTO): Promise<Class> => {
    const response = await api.put(`/classes/${id}`, mapStorePayloadToApi(data));
    return mapApiClassToStore(response.data as ApiClass);
  },

  /**
   * Remove uma turma
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  /**
   * Busca turmas por curso
   */
  getByCourse: async (courseId: string): Promise<Class[]> => {
    const response = await api.get(`/classes/course/${courseId}`);
    const records = response.data as ApiClass[];
    return (Array.isArray(records) ? records : []).map(mapApiClassToStore);
  },

  /**
   * Busca turmas por instrutor
   */
  getByInstructor: async (instructorId: string): Promise<Class[]> => {
    const response = await api.get(`/classes/instructor/${instructorId}`);
    const records = response.data as ApiClass[];
    return (Array.isArray(records) ? records : []).map(mapApiClassToStore);
  },

  /**
   * Busca turmas ativas (em andamento ou agendadas)
   */
  getActive: async (): Promise<Class[]> => {
    const response = await api.get('/classes', {
      params: { 
        status: ['SCHEDULED', 'IN_PROGRESS'],
        limit: 1000 
      },
    });
    const records = (response.data.data || response.data || []) as ApiClass[];
    return (Array.isArray(records) ? records : []).map(mapApiClassToStore);
  },

  /**
   * Busca turmas por intervalo de datas
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<Class[]> => {
    const response = await api.get('/classes', {
      params: { startDate, endDate, limit: 1000 },
    });
    const records = (response.data.data || response.data || []) as ApiClass[];
    return (Array.isArray(records) ? records : []).map(mapApiClassToStore);
  },

  /**
   * Confirma a presença do instrutor num dia de aula (M03)
   */
  confirmInstructorAttendance: async (
    classId: string,
    instructorId: string,
    date: string
  ): Promise<Class> => {
    const response = await api.post(
      `/classes/${classId}/instructors/${instructorId}/attendance`,
      { date }
    );
    return mapApiClassToStore(response.data as ApiClass);
  },

  /**
   * Remove a confirmação de presença do instrutor (date em YYYY-MM-DD)
   */
  removeInstructorAttendance: async (
    classId: string,
    instructorId: string,
    date: string
  ): Promise<Class> => {
    const response = await api.delete(
      `/classes/${classId}/instructors/${instructorId}/attendance/${date}`
    );
    return mapApiClassToStore(response.data as ApiClass);
  },
};
