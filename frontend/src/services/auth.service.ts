import api from '@/lib/api';
import { User } from '@/stores/auth.store';

interface LoginRequest {
  email: string;
  password: string;
}

interface PortalPjLoginRequest {
  login: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PortalPjProfileResponse {
  id: string;
  name: string;
  tradeName: string | null;
  companyTaxId: string;
  email: string | null;
  phone: string | null;
  code: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async loginPortalPj(data: PortalPjLoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/portal-pj/login', data);
    return response.data;
  },

  async getPortalPjProfile(): Promise<PortalPjProfileResponse> {
    const response = await api.get<PortalPjProfileResponse>('/auth/portal-pj/profile');
    return response.data;
  },

  async authorizeMasterPin(pin: string): Promise<{ authorized: boolean }> {
    const response = await api.post<{ authorized: boolean }>('/auth/master-pin/authorize', { pin });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
