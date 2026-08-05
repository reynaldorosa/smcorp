import { api } from '@/lib/api';
import { 
  CreateClassDto, 
  ScheduleExamDto,
  RecordExamResultDto,
  UploadDocumentDto,
  ValidateDocumentDto,
  RejectDocumentDto,
  CreatePaymentDto,
  RecordPaymentDto,
  GenerateTokenDto,
  ValidateTokenDto,
  RequestDiscountDto,
  ApproveDiscountDto,
  UpdateEnrollmentStatusDto
} from '@/lib/schemas';

export interface EnrollmentExtraProductItemDto {
  extraProductId: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface CreateEnrollmentDto {
  studentId: string;
  classId: string;
  paymentMethod?: string;
  observations?: string;
  extraProducts?: EnrollmentExtraProductItemDto[];
  /**
   * Estado inicial da matrícula. `WAITING_LIST` entra direto na fila de espera —
   * antes isso era sinalizado gravando '[WAITING_LIST]' dentro de `observations`
   * e lido de volta por substring.
   */
  status?: 'WAITING_LIST' | 'SCHEDULED';
}

export interface SendPendingDocumentsNotificationDto {
  notificationType: 'whatsapp' | 'email' | 'both';
  customMessage?: string;
}

export interface SendPendingDocumentsNotificationResponse {
  success: boolean;
  message: string;
  notificationType: 'whatsapp' | 'email' | 'both';
  pendingDocuments: string[];
  previewMessage: string;
  subject: string;
  channels: {
    whatsapp: {
      requested: boolean;
      available: boolean;
      target: string | null;
    };
    email: {
      requested: boolean;
      available: boolean;
      target: string | null;
    };
  };
}

// ============================================
// ENROLLMENT OPERATIONS
// ============================================

export const enrollmentOperations = {
  create: async (data: CreateEnrollmentDto) => {
    const response = await api.post('/enrollments', data);
    return response.data;
  },

  generateToken: async (data: GenerateTokenDto) => {
    const response = await api.post(`/enrollments/${data.enrollmentId}/generate-token`, data);
    return response.data;
  },

  validateToken: async (data: ValidateTokenDto) => {
    const response = await api.post('/enrollments/validate-token', data);
    return response.data;
  },

  requestDiscount: async (data: RequestDiscountDto) => {
    const response = await api.post(`/enrollments/${data.enrollmentId}/request-discount`, data);
    return response.data;
  },

  approveDiscount: async (data: ApproveDiscountDto) => {
    const response = await api.post(`/enrollments/${data.enrollmentId}/approve-discount`, {
      masterId: data.masterId,
    });
    return response.data;
  },

  updateStatus: async (data: UpdateEnrollmentStatusDto) => {
    const response = await api.post(`/enrollments/${data.enrollmentId}/status`, {
      status: data.status,
    });
    return response.data;
  },

  getByClass: async (classId: string) => {
    const response = await api.get(`/enrollments/class/${classId}`);
    return response.data;
  },

  getById: async (enrollmentId: string) => {
    const response = await api.get(`/enrollments/${enrollmentId}`);
    return response.data;
  },

  getExtraProducts: async (enrollmentId: string) => {
    const response = await api.get(`/enrollments/${enrollmentId}/extra-products`);
    return response.data;
  },

  addExtraProducts: async (enrollmentId: string, items: EnrollmentExtraProductItemDto[]) => {
    const response = await api.post(`/enrollments/${enrollmentId}/extra-products`, { items });
    return response.data;
  },

  removeExtraProduct: async (enrollmentId: string, extraProductId: string) => {
    const response = await api.delete(
      `/enrollments/${enrollmentId}/extra-products/${extraProductId}`,
    );
    return response.data;
  },

  revokeDiscount: async (enrollmentId: string, masterId: string) => {
    const response = await api.post(`/enrollments/${enrollmentId}/revoke-discount`, {
      masterId,
    });
    return response.data;
  },

  getQRCode: async (enrollmentId: string, format: 'png' | 'svg' = 'png') => {
    const endpoint =
      format === 'svg'
        ? `/enrollments/qrcode/${enrollmentId}/svg`
        : `/enrollments/qrcode/${enrollmentId}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  uploadPublicDocument: async (data: { token: string; documentType: string; file: File }) => {
    const token = (data.token || '').trim();
    const documentType = (data.documentType || '').trim();

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('type', documentType);

    const response = await api.post(`/enrollments/public/${token}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePublicDocument: async (data: { token: string; documentId: string }) => {
    const token = (data.token || '').trim();
    const documentId = (data.documentId || '').trim();
    const response = await api.delete(`/enrollments/public/${token}/documents/${documentId}`);
    return response.data;
  },
};

// ============================================
// STUDENT DOCUMENT OPERATIONS
// ============================================

export const documentOperations = {
  upload: async (data: UploadDocumentDto) => {
    const response = await api.post('/student-documents/upload', data);
    return response.data;
  },

  validate: async (data: ValidateDocumentDto) => {
    const response = await api.post(`/student-documents/${data.documentId}/validate`, {
      validatorId: data.validatorId,
      notes: (data as any).notes,
    });
    return response.data;
  },

  reject: async (data: RejectDocumentDto) => {
    const response = await api.post(`/student-documents/${data.documentId}/reject`, {
      validatorId: data.validatorId,
      rejectedReason: (data as any).rejectedReason,
    });
    return response.data;
  },

  getByStudent: async (studentId: string) => {
    const response = await api.get(`/student-documents/student/${studentId}`);
    return response.data;
  },

  checkStatus: async (studentId: string) => {
    const response = await api.get(`/student-documents/student/${studentId}/status`);
    return response.data;
  },

  delete: async (documentId: string) => {
    const response = await api.delete(`/student-documents/${documentId}`);
    return response.data;
  },

  notifyPending: async (
    documentId: string,
    data: SendPendingDocumentsNotificationDto,
  ): Promise<SendPendingDocumentsNotificationResponse> => {
    const response = await api.post(`/student-documents/${documentId}/notify-pending`, data);
    return response.data;
  },
};

// ============================================
// EXAM OPERATIONS
// ============================================

export const examOperations = {
  schedule: async (data: ScheduleExamDto) => {
    const response = await api.post('/exams/schedule', {
      ...data,
      scheduledDate: data.scheduledDate.toISOString(),
    });
    return response.data;
  },

  canSchedule: async (enrollmentId: string) => {
    const response = await api.get(`/exams/enrollment/${enrollmentId}/can-schedule`);
    return response.data;
  },

  recordResult: async (data: RecordExamResultDto) => {
    const response = await api.post(`/exams/${data.examId}/result`, {
      score: data.score,
      passed: data.passed,
      notes: data.notes,
    });
    return response.data;
  },

  updateStatus: async (examId: string, status: string) => {
    const response = await api.post(`/exams/${examId}/status`, { status });
    return response.data;
  },

  cancel: async (examId: string, reason: string) => {
    const response = await api.post(`/exams/${examId}/cancel`, { reason });
    return response.data;
  },

  getByEnrollment: async (enrollmentId: string) => {
    const response = await api.get(`/exams/enrollment/${enrollmentId}`);
    return response.data;
  },

  getByInstructor: async (instructorId: string, startDate?: Date, endDate?: Date) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get(`/exams/instructor/${instructorId}`, { params });
    return response.data;
  },

  getById: async (examId: string) => {
    const response = await api.get(`/exams/${examId}`);
    return response.data;
  },

  updateDate: async (examId: string, date: Date, time?: string) => {
    const response = await api.patch(`/exams/${examId}/date`, {
      scheduledDate: date.toISOString(),
      scheduledTime: time,
    });
    return response.data;
  },

  update: async (examId: string, data: Partial<ScheduleExamDto>) => {
    const response = await api.patch(`/exams/${examId}`, {
      ...data,
      scheduledDate: data.scheduledDate?.toISOString(),
    });
    return response.data;
  },

  delete: async (examId: string) => {
    const response = await api.delete(`/exams/${examId}`);
    return response.data;
  },
};

// ============================================
// PAYMENT OPERATIONS
// ============================================

export const paymentOperations = {
  create: async (data: CreatePaymentDto) => {
    const response = await api.post('/payments', {
      ...data,
      dueDate: data.dueDate.toISOString(),
    });
    return response.data;
  },

  createBulk: async (enrollmentId: string, totalAmount: number, installments: number, firstDueDate: Date) => {
    const response = await api.post('/payments/bulk', {
      enrollmentId,
      totalAmount,
      installments,
      firstDueDate: firstDueDate.toISOString(),
    });
    return response.data;
  },

  record: async (data: RecordPaymentDto) => {
    const response = await api.post(`/payments/${data.paymentId}/record`, {
      paidAt: data.paidAt?.toISOString(),
      paidAmount: data.paidAmount,
      method: data.method,
      transactionId: data.transactionId,
      notes: data.notes,
    });
    return response.data;
  },

  updateStatus: async (paymentId: string, status: string, reason?: string) => {
    const response = await api.put(`/payments/${paymentId}/status`, { status, reason });
    return response.data;
  },

  getByEnrollment: async (enrollmentId: string) => {
    const response = await api.get(`/payments/enrollment/${enrollmentId}`);
    return response.data;
  },

  getStatistics: async (filters?: { startDate?: Date; endDate?: Date; companyId?: string; status?: string }) => {
    const params: Record<string, string> = {};
    if (filters?.startDate) params.startDate = filters.startDate.toISOString();
    if (filters?.endDate) params.endDate = filters.endDate.toISOString();
    if (filters?.companyId) params.companyId = filters.companyId;
    if (filters?.status) params.status = filters.status;

    const response = await api.get('/payments/statistics', { params });
    return response.data;
  },

  markOverdue: async () => {
    const response = await api.post('/payments/mark-overdue');
    return response.data;
  },

  getAll: async (page: number = 1, limit: number = 20, status?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (status) params.status = status;

    const response = await api.get('/payments', { params });
    return response.data;
  },

  getById: async (paymentId: string) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  delete: async (paymentId: string) => {
    const response = await api.delete(`/payments/${paymentId}`);
    return response.data;
  },
};

// ============================================
// CLASS OPERATIONS
// ============================================

export const classOperations = {
  create: async (data: CreateClassDto) => {
    const response = await api.post('/classes', {
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate?.toISOString(),
    });
    return response.data;
  },

  calculateEndDate: async (courseId: string, startDate: Date) => {
    const response = await api.post('/classes/calculate-end-date', {
      courseId,
      startDate: startDate.toISOString(),
    });
    return response.data;
  },

  checkRoomConflict: async (roomId: string, startDate: Date, endDate: Date, excludeClassId?: string) => {
    const response = await api.post('/classes/check-room-conflict', {
      roomId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      excludeClassId,
    });
    return response.data;
  },

  checkCapacity: async (classId: string) => {
    const response = await api.get(`/classes/${classId}/check-capacity`);
    return response.data;
  },

  getByRoom: async (roomId: string, startDate?: Date, endDate?: Date) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get(`/classes/room/${roomId}`, { params });
    return response.data;
  },

  getByInstructor: async (instructorId: string, startDate?: Date, endDate?: Date) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get(`/classes/instructor/${instructorId}`, { params });
    return response.data;
  },

  getAll: async (page: number = 1, limit: number = 20) => {
    const response = await api.get('/classes', { params: { page, limit } });
    return response.data;
  },

  getById: async (classId: string) => {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  },

  update: async (classId: string, data: Partial<CreateClassDto>) => {
    const response = await api.put(`/classes/${classId}`, {
      ...data,
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
    });
    return response.data;
  },

  delete: async (classId: string) => {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  },
};

// ============================================
// DASHBOARD OPERATIONS
// ============================================

export const dashboardOperations = {
  getOverview: async (companyId?: string, startDate?: Date, endDate?: Date) => {
    const params: Record<string, string> = {};
    if (companyId) params.companyId = companyId;
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },

  getActiveClasses: async (companyId?: string, startDate?: Date, endDate?: Date) => {
    const params: Record<string, string> = {};
    if (companyId) params.companyId = companyId;
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get('/dashboard/active-classes', { params });
    return response.data;
  },

  getStudentsByStatus: async (classId?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (classId) params.classId = classId;
    if (status) params.status = status;

    const response = await api.get('/dashboard/students', { params });
    return response.data;
  },

  getPendingDocuments: async (companyId?: string, limit: number = 20) => {
    const params: Record<string, string | number> = { limit };
    if (companyId) params.companyId = companyId;

    const response = await api.get('/dashboard/pending-documents', { params });
    return response.data;
  },

  getUpcomingExams: async (instructorId?: string, startDate?: Date, endDate?: Date, limit: number = 20) => {
    const params: Record<string, string | number> = { limit };
    if (instructorId) params.instructorId = instructorId;
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get('/dashboard/upcoming-exams', { params });
    return response.data;
  },

  getRevenueReport: async (startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' = 'month', companyId?: string) => {
    const params: Record<string, string> = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy,
    };
    if (companyId) params.companyId = companyId;

    const response = await api.get('/dashboard/financial', { params });
    return response.data;
  },
};
