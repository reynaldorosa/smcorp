// ============================================
// SMCORP - Instructors Types (Módulo 07)
// ============================================
// NOTA: O store Zustand foi removido pois nunca era consumido
// por nenhum componente. Os dados de instrutores são buscados
// via TanStack Query em instructors-tab.tsx.
// Apenas as interfaces de tipo são mantidas aqui.
// ============================================

export interface Instructor {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  role?: string;
  specialties: string[];
  /** @deprecated Use specialties — alias mantido para compatibilidade com backend */
  specializations?: string[];
  certifications: InstructorCertification[];
  availability: InstructorAvailability[];
  costPerHour?: number;
  costPerDay?: number;
  classHourlyRate?: number;
  examHourlyRate?: number;
  notes?: string;
  linkedCostIds?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorCertification {
  id: string;
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface InstructorAvailability {
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
}
