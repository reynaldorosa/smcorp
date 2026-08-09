import { api } from '@/lib/api';

// ============================================
// Caiso - Users Service (Módulo 00 - Settings)
// ============================================

export type UserRole = 'MASTER' | 'ADMIN' | 'COLLABORATOR' | 'SELLER';

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  masterPin?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
  masterPin?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const usersService = {
  /**
   * Get all users with pagination
   */
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<User>> => {
    const skip = (page - 1) * limit;
    const response = await api.get('/users', {
      params: { skip, take: limit },
    });
    return response.data;
  },

  /**
   * Get a user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserDTO): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update an existing user
   */
  update: async (id: string, data: UpdateUserDTO): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete a user
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Change user password
   */
  changePassword: async (id: string, data: ChangePasswordDTO): Promise<void> => {
    await api.post(`/users/${id}/change-password`, data);
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Get active users only
   */
  getActive: async (): Promise<User[]> => {
    const response = await api.get('/users', {
      params: { active: true, limit: 100 },
    });
    return response.data.data || response.data;
  },
};
