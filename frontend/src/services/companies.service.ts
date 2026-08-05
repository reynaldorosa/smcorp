import { api } from '@/lib/api';

// ============================================
// SMCORP - Companies Service (Módulo Empresas)
// ============================================

export interface Company {
  id: string;
  name: string;
  tradeName?: string | null;
  companyTaxId: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  isActive: boolean;
  portalAccess?: boolean;
  portalLogin?: string;
  allowedPaymentMethods?: string[];
  pricing?: Array<{
    id?: string;
    courseId: string;
    basePrice?: number;
    discountPercent?: number;
    finalPrice: number;
    notes?: string;
    includedProductIds?: string[];
    validUntil?: string;
    active?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDTO {
  name: string;
  tradeName?: string;
  companyTaxId: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  portalAccess?: boolean;
  portalLogin?: string;
  portalPassword?: string;
  allowedPaymentMethods?: string[];
  pricing?: Company['pricing'];
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {
  isActive?: boolean;
}

export interface CompanySettings {
  id: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
    tradeName?: string | null;
  };
  settings: {
    institutional?: {
      legalName?: string;
      website?: string;
      brandColor?: string;
      cashBox?: string;
      cashNotes?: string;
    };
    bank?: {
      bank?: string;
      agency?: string;
      account?: string;
      pixKey?: string;
    };
    smtp?: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      from?: string;
      fromName?: string;
      useSsl?: boolean;
      active?: boolean;
    };
    email?: {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      fromEmail?: string;
      fromName?: string;
      useSsl?: boolean;
      active?: boolean;
    };
    whatsapp?: {
      number?: string;
      apiKey?: string;
      webhook?: string;
      webhookUrl?: string;
      instanceId?: string;
      enabled?: boolean;
      defaultMessage?: string;
    };
    other?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

export type UpdateCompanySettingsDTO = Partial<CompanySettings['settings']>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const companiesService = {
  /**
   * Busca todas as empresas (paginado)
   */
  getAll: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<Company>> => {
    const response = await api.get('/companies', { params: { page, limit } });
    return response.data;
  },

  /**
   * Busca uma empresa por ID
   */
  getById: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova empresa
   */
  create: async (data: CreateCompanyDTO): Promise<Company> => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  /**
   * Atualiza uma empresa existente
   */
  update: async (id: string, data: UpdateCompanyDTO): Promise<Company> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma empresa (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  /**
   * Busca configurações da empresa
   */
  getSettings: async (companyId: string): Promise<CompanySettings> => {
    const response = await api.get(`/company-settings/${companyId}`);
    return response.data;
  },

  /**
   * Atualiza configurações da empresa
   */
  updateSettings: async (companyId: string, data: UpdateCompanySettingsDTO): Promise<CompanySettings> => {
    const response = await api.put(`/company-settings/${companyId}`, data);
    return response.data;
  },

  /**
   * Busca alunos de uma empresa (paginado)
   */
  getStudents: async (
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await api.get(`/companies/${companyId}/students`, {
      params: { page, limit },
    });
    return response.data;
  },
};
