import { api } from '@/lib/api';
import type { Student } from '@/stores/students.store';

type ApiStudent = {
  id: string;
  code: string;
  name: string;
  cpf: string;
  rg?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  companyId?: string | null;
  photoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments?: Array<{
    id: string;
    classId: string;
    documentsStatus: 'PENDING' | 'COMPLETE' | 'REJECTED' | null;
    status: string;
    notes?: string | null;
  }>;
};

function mapApiStudentToStoreStudent(apiStudent: ApiStudent): Student {
  const latestEnrollment = apiStudent.enrollments?.[0];
  // Fila de espera é um estado de domínio (EnrollmentStatus.WAITING_LIST).
  // Antes era inferida por substring em `notes`, um campo de texto livre —
  // qualquer pessoa que digitasse '[WAITING_LIST]' nas observações mudava
  // o status do aluno.
  const isWaitingList = latestEnrollment?.status === 'WAITING_LIST';

  return {
    id: apiStudent.id,
    code: apiStudent.code,
    name: apiStudent.name,
    email: apiStudent.email ?? undefined,
    phone: apiStudent.phone ?? undefined,
    taxId: apiStudent.cpf,
    rg: apiStudent.rg ?? undefined,
    birthDate: apiStudent.birthDate ?? undefined,
    address: apiStudent.address ?? undefined,
    photoUrl: apiStudent.photoUrl ?? undefined,
    status: apiStudent.isActive ? (isWaitingList ? 'WaitingList' : 'Active') : 'Inactive',
    classId: latestEnrollment?.classId,
    enrollmentId: latestEnrollment?.id,
    companyId: apiStudent.companyId ?? undefined,
    totalValue: 0,
    documentsComplete: latestEnrollment?.documentsStatus === 'COMPLETE',
    createdAt: apiStudent.createdAt,
    updatedAt: apiStudent.updatedAt,
  };
}

// ============================================
// Caiso - Students Service (Módulo 03)
// ============================================

export interface CreateStudentDTO {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  rg?: string;
  birthDate?: string;
  address?: string;
  classId?: string;
  companyId?: string;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  status?: 'Ativo' | 'Inativo' | 'Pendente';
  photoUrl?: string;
}

export interface EnrollStudentDTO {
  studentId: string;
  classId: string;
  companyId?: string;
  paymentMethod?: string;
  observations?: string;
}

export const studentsService = {
  /**
   * Busca todos os alunos
   */
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');

    const payload = response.data;
    const data: ApiStudent[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return data.map(mapApiStudentToStoreStudent);
  },

  /**
   * Busca um aluno por ID
   */
  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    // /students/:id retorna um shape mais rico; aqui mantemos o mínimo compatível
    const apiStudent = response.data as ApiStudent;
    return mapApiStudentToStoreStudent(apiStudent);
  },

  /**
   * Busca aluno por código de matrícula
   */
  getByCode: async (code: string): Promise<Student> => {
    const response = await api.get(`/students/code/${code}`);
    const apiStudent = response.data as ApiStudent;
    return mapApiStudentToStoreStudent(apiStudent);
  },

  /**
   * Cria um novo aluno
   */
  create: async (data: CreateStudentDTO): Promise<Student> => {
    const response = await api.post('/students', data);
    return response.data;
  },

  /**
   * Atualiza um aluno existente
   */
  update: async (id: string, data: UpdateStudentDTO): Promise<Student> => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  /**
   * Remove um aluno
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  /**
   * Busca alunos por turma
   */
  getByClass: async (classId: string): Promise<Student[]> => {
    const response = await api.get(`/students/class/${classId}`);
    return response.data;
  },

  /**
   * Busca alunos por empresa
   */
  getByCompany: async (companyId: string): Promise<Student[]> => {
    const response = await api.get(`/students/company/${companyId}`);
    return response.data;
  },

  /**
   * Matricula aluno em uma turma
   */
  enroll: async (data: EnrollStudentDTO): Promise<void> => {
    await api.post('/enrollments', data);
  },

  /**
   * Upload de foto do aluno
   */
  uploadPhoto: async (id: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/students/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },

  /**
   * Upload de documento do aluno
   */
  uploadDocument: async (
    id: string,
    documentType: string,
    file: File
  ): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);
    await api.post(`/students/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
