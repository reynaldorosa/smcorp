import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// O backend ROTACIONA o refresh token a cada uso (auth.service.ts grava um novo
// hash no banco a cada /auth/refresh bem-sucedido). Sem essa promise compartilhada,
// duas requisições que expiram ao mesmo tempo (comum: um dashboard dispara várias
// chamadas em paralelo) disparavam DOIS /auth/refresh com o MESMO token antigo —
// o primeiro tinha sucesso e rotacionava, o segundo recebia 401 do token já
// invalidado e deslogava o usuário mesmo com a sessão válida.
let refreshInFlight: Promise<{ accessToken: string; refreshToken: string }> | null = null;

function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshInFlight) {
    const refreshToken = useAuthStore.getState().refreshToken;
    refreshInFlight = axios
      .post(`${API_URL}/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      .then((response) => response.data)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken();
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Só desloga quando o refresh é RECUSADO (token expirado/inválido).
          // Falhas de rede/backend não devem derrubar a sessão do usuário.
          const refreshStatus = (refreshError as { response?: { status?: number } })
            ?.response?.status;
          if (refreshStatus === 401 || refreshStatus === 403) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
