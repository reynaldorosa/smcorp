import { api } from '@/lib/api';
import type { Certificate, CertificateStats } from '@/stores/certificates.store';

// ============================================
// Caiso - Certificates Service
// ============================================

export interface CreateCertificateDTO {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  templateId?: string;
  validityMonths: number;
  metadata?: Record<string, unknown>;
}

export interface IssueCertificateDTO {
  issuedById?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface RevokeCertificateDTO {
  reason: string;
}

export const certificatesService = {
  getAll: async (filters?: {
    status?: string;
    courseId?: string;
    studentId?: string;
    search?: string;
  }): Promise<Certificate[]> => {
    const response = await api.get('/certificates', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Certificate> => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  getStats: async (): Promise<CertificateStats> => {
    const response = await api.get('/certificates/stats');
    return response.data;
  },

  create: async (data: CreateCertificateDTO): Promise<Certificate> => {
    const response = await api.post('/certificates', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCertificateDTO>): Promise<Certificate> => {
    const response = await api.patch(`/certificates/${id}`, data);
    return response.data;
  },

  issue: async (id: string, data: IssueCertificateDTO): Promise<Certificate> => {
    const response = await api.post(`/certificates/${id}/issue`, data);
    return response.data;
  },

  revoke: async (id: string, data: RevokeCertificateDTO): Promise<Certificate> => {
    const response = await api.post(`/certificates/${id}/revoke`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/certificates/${id}`);
  },

  verify: async (number: string): Promise<{
    valid: boolean;
    message?: string;
    certificate?: Record<string, unknown>;
  }> => {
    const response = await api.get(`/certificates/verify/${number}`);
    return response.data;
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/certificates/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
