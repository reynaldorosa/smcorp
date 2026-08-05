import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';

const pushMock = vi.fn();
const setAuthMock = vi.fn();
const toastMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ setAuth: setAuthMock }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('realiza login com credenciais válidas e redireciona para dashboard', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        id: 'u1',
        email: 'admin@smcorp.com.br',
        name: 'Admin',
        role: 'ADMIN',
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('E-mail Corporativo'), {
      target: { value: 'admin@smcorp.com.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Admin@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar na Plataforma' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'admin@smcorp.com.br',
        password: 'Admin@123',
      });
      expect(setAuthMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redireciona MASTER (superadmin) para /platform em vez do dashboard do tenant', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        id: 'm1',
        email: 'master@smcorp.com.br',
        name: 'Master',
        role: 'MASTER',
        tenantId: undefined,
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('E-mail Corporativo'), {
      target: { value: 'master@smcorp.com.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Admin@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar na Plataforma' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/platform');
    });
  });
});
