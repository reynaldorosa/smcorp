import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SignupPage from './page';

const pushMock = vi.fn();
const setAuthMock = vi.fn();
const signupMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('sonner', () => ({ toast }));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ setAuth: setAuthMock }),
}));

vi.mock('@/services/tenants.service', () => ({
  tenantsService: {
    signup: (...args: unknown[]) => signupMock(...args),
  },
}));

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText('Nome do centro *'), {
      target: { value: 'Centro Costa Norte' },
    });
    fireEvent.change(screen.getByLabelText('Slug *'), {
      target: { value: 'costa-norte' },
    });
    fireEvent.change(screen.getByLabelText('Administrador (nome) *'), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.change(screen.getByLabelText('E-mail *'), {
      target: { value: 'ana@costa.com.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha *'), {
      target: { value: 'Senha123' },
    });
  };

  it('cria o centro, autentica o admin e redireciona para /dashboard', async () => {
    signupMock.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'ana@costa.com.br', name: 'Ana Silva', role: 'ADMIN', tenantId: 't1' },
      tenant: {
        id: 't1',
        slug: 'costa-norte',
        name: 'Centro Costa Norte',
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      },
    });

    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar centro de treinamento' }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'costa-norte',
          adminEmail: 'ana@costa.com.br',
          tenantName: 'Centro Costa Norte',
        }),
      );
      expect(setAuthMock).toHaveBeenCalledWith('token', 'refresh', expect.objectContaining({ role: 'ADMIN' }));
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('valida slug inválido antes de chamar a API', async () => {
    render(<SignupPage />);
    fillForm();
    fireEvent.change(screen.getByLabelText('Slug *'), { target: { value: 'Costa Norte!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar centro de treinamento' }));

    await waitFor(() => {
      expect(signupMock).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'Slug deve conter apenas letras minúsculas, números e hífens',
      );
    });
  });

  it('mostra erro da API quando o signup falha (ex.: slug em uso)', async () => {
    signupMock.mockRejectedValue({
      response: { data: { message: 'Este slug já está em uso' } },
    });

    render(<SignupPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar centro de treinamento' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Este slug já está em uso');
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
