import { api } from '@/lib/api';
import type { Instructor } from '@/stores/instructors.store';

// ============================================
// Caiso - Instructors Service (Módulo 07)
// ============================================

export interface CreateInstructorDTO {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  specialties?: string[];
  costPerHour?: number;
  costPerDay?: number;
  classHourlyRate?: number;
  examHourlyRate?: number;
  notes?: string;
}

export interface UpdateInstructorDTO extends Partial<CreateInstructorDTO> {
  active?: boolean;
}

export interface InstructorCertificationDTO {
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  documentUrl?: string;
}

type InstructorClass = Record<string, unknown>;
type InstructorAvailability = Record<string, unknown>;

export const instructorsService = {
  /**
   * Busca todos os instrutores
   */
  getAll: async (): Promise<Instructor[]> => {
    const response = await api.get('/instructors', {
      params: { limit: 1000 },
    });
    return response.data.data || response.data;
  },

  /**
   * Busca um instrutor por ID
   */
  getById: async (id: string): Promise<Instructor> => {
    const response = await api.get(`/instructors/${id}`);
    return response.data;
  },

  /**
   * Cria um novo instrutor
   */
  create: async (data: CreateInstructorDTO): Promise<Instructor> => {
    const response = await api.post('/instructors', data);
    return response.data;
  },

  /**
   * Atualiza um instrutor existente
   */
  update: async (id: string, data: UpdateInstructorDTO): Promise<Instructor> => {
    const response = await api.put(`/instructors/${id}`, data);
    return response.data;
  },

  /**
   * Remove um instrutor
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/instructors/${id}`);
  },

  /**
   * Busca instrutores ativos
   */
  getActive: async (): Promise<Instructor[]> => {
    const response = await api.get('/instructors', {
      params: { active: true, limit: 1000 },
    });
    return response.data.data || response.data;
  },

  /**
   * Adiciona certificação ao instrutor
   */
  addCertification: async (
    id: string,
    certification: InstructorCertificationDTO
  ): Promise<void> => {
    await api.post(`/instructors/${id}/certifications`, certification);
  },

  /**
   * Remove certificação do instrutor
   */
  removeCertification: async (
    instructorId: string,
    certificationId: string
  ): Promise<void> => {
    await api.delete(
      `/instructors/${instructorId}/certifications/${certificationId}`
    );
  },

  /**
   * Busca turmas do instrutor
   */
  getClasses: async (id: string): Promise<InstructorClass[]> => {
    const response = await api.get(`/instructors/${id}/classes`);
    return response.data;
  },

  /**
   * Busca disponibilidade do instrutor
   */
  getAvailability: async (id: string, date: string): Promise<InstructorAvailability> => {
    const response = await api.get(`/instructors/${id}/availability`, {
      params: { date },
    });
    return response.data;
  },
};
