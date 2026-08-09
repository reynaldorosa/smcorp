import { api } from '@/lib/api';

// ============================================
// Caiso - Extra Products Service (Módulo 00 - Settings)
// ============================================

export type ProductType = 'product' | 'extra';

export interface ExtraProduct {
  id: string;
  code: string;
  name: string;
  type: ProductType;
  price: number;
  description?: string;
  associatedCosts?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExtraProductDTO {
  name: string;
  type: ProductType;
  price: number;
  description?: string;
  associatedCosts?: string[];
}

export interface UpdateExtraProductDTO extends Partial<CreateExtraProductDTO> {
  active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const extraProductsService = {
  /**
   * Get all extra products with pagination
   */
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<ExtraProduct>> => {
    const response = await api.get('/extra-products', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get an extra product by ID
   */
  getById: async (id: string): Promise<ExtraProduct> => {
    const response = await api.get(`/extra-products/${id}`);
    return response.data;
  },

  /**
   * Create a new extra product
   */
  create: async (data: CreateExtraProductDTO): Promise<ExtraProduct> => {
    const response = await api.post('/extra-products', data);
    return response.data;
  },

  /**
   * Update an existing extra product
   */
  update: async (id: string, data: UpdateExtraProductDTO): Promise<ExtraProduct> => {
    const response = await api.put(`/extra-products/${id}`, data);
    return response.data;
  },

  /**
   * Delete an extra product
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/extra-products/${id}`);
  },

  /**
   * Get active extra products only
   */
  getActive: async (): Promise<ExtraProduct[]> => {
    const response = await api.get('/extra-products', {
      params: { active: true, page: 1, limit: 100 },
    });
    return response.data.data || response.data;
  },
};
