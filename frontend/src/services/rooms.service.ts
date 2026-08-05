import { api } from '@/lib/api';

// ============================================
// SMCORP - Rooms Service (Módulo 00 - Settings)
// ============================================

export interface Room {
  id: string;
  code: string;
  name: string;
  location?: string;
  address?: string;
  capacity: number;
  dailyCost?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomDTO {
  name: string;
  location?: string;
  address?: string;
  capacity: number;
  dailyCost?: number;
}

export interface UpdateRoomDTO extends Partial<CreateRoomDTO> {
  active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const roomsService = {
  /**
   * Get all rooms with pagination
   */
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<Room>> => {
    const response = await api.get('/rooms', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get a room by ID
   */
  getById: async (id: string): Promise<Room> => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  /**
   * Create a new room
   */
  create: async (data: CreateRoomDTO): Promise<Room> => {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  /**
   * Update an existing room
   */
  update: async (id: string, data: UpdateRoomDTO): Promise<Room> => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  /**
   * Delete a room
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },

  /**
   * Get active rooms only
   */
  getActive: async (): Promise<Room[]> => {
    const response = await api.get('/rooms', {
      params: { active: true, page: 1, limit: 100 },
    });
    return response.data.data || response.data;
  },
};
