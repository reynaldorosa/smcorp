import { api } from '@/lib/api';

// ============================================
// Caiso - Suppliers Service (Módulo 00 - Settings)
// ============================================

export interface Supplier {
  id: string;
  code: string;
  name: string;
  companyTaxId?: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  companyTaxId?: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
}

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {
  active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const suppliersService = {
  /**
   * Get all suppliers with pagination
   */
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get('/suppliers', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get a supplier by ID
   */
  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Create a new supplier
   */
  create: async (data: CreateSupplierDTO): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  /**
   * Update an existing supplier
   */
  update: async (id: string, data: UpdateSupplierDTO): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a supplier
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  /**
   * Get active suppliers only
   */
  getActive: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers', {
      params: { active: true, page: 1, limit: 100 },
    });
    return response.data.data || response.data;
  },
};
