import { api } from '@/lib/api';

export interface ScheduleExamDTO {
  enrollmentId: string;
  courseId: string;
  instructorId: string;
  examNumber: string;
  examType?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  notes?: string;
}

export interface UpdateExamDTO {
  examNumber?: string;
  examType?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
  notes?: string;
  instructorId?: string;
}

export interface ExamApiResponse {
  id: string;
  examCode: string;
  enrollmentId: string;
  courseId: string;
  instructorId: string;
  examNumber: string;
  examType?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalExamApiResponse {
  id: string;
  backendExamIds: string[];
  classId: string;
  examNumber: string;
  examName: string;
  date: string;
  time: string;
  instructorId: string;
  studentIds: string[];
  status: 'Scheduled' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export const examsService = {
  schedule: async (data: ScheduleExamDTO): Promise<ExamApiResponse> => {
    const response = await api.post('/exams/schedule', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExamDTO): Promise<ExamApiResponse> => {
    const response = await api.patch(`/exams/${id}`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  getByEnrollment: async (enrollmentId: string): Promise<ExamApiResponse[]> => {
    const response = await api.get(`/exams/enrollment/${enrollmentId}`);
    return response.data;
  },

  getOperational: async (): Promise<OperationalExamApiResponse[]> => {
    const response = await api.get('/exams/operational');
    return response.data;
  },
};
