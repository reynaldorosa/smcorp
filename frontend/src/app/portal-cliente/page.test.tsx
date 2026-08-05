import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PortalClientePJLoginPage from './page';

const pushMock = vi.fn();
const setAuthMock = vi.fn();
const loginPortalPjMock = vi.fn();
const getPortalPjProfileMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ setAuth: setAuthMock }),
}));

vi.mock('@/stores/companies.store', () => ({
  useCompaniesStore: () => ({
    companies: [],
  }),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    loginPortalPj: (...args: unknown[]) => loginPortalPjMock(...args),
    getPortalPjProfile: (...args: unknown[]) => getPortalPjProfileMock(...args),
  },
}));

describe('PortalClientePJLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('autentica PJ e persiste sessão com perfil retornado pela API', async () => {
    loginPortalPjMock.mockResolvedValue({
      accessToken: 'pj-token',
      refreshToken: '',
      user: {
        id: 'comp-1',
        email: 'contato@empresa.com.br',
        name: 'Empresa XPTO',
        role: 'CLIENT_PJ',
      },
    });

    getPortalPjProfileMock.mockResolvedValue({
      id: 'comp-1',
      name: 'Empresa XPTO',
      tradeName: 'XPTO',
      companyTaxId: '12.345.678/0001-99',
      email: 'contato@empresa.com.br',
      phone: '11999999999',
      code: 'PJ-0199',
    });

    render(<PortalClientePJLoginPage />);

    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'empresa_xpto' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(loginPortalPjMock).toHaveBeenCalledWith({
        login: 'empresa_xpto',
        password: 'Senha@123',
      });
      expect(getPortalPjProfileMock).toHaveBeenCalled();
      expect(setAuthMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/portal-cliente/dashboard');
    });

    const session = JSON.parse(sessionStorage.getItem('portalClienteLogado') || '{}');
    expect(session.id).toBe('comp-1');
    expect(session.code).toBe('PJ-0199');
    expect(session.companyTaxId).toBe('12.345.678/0001-99');
  });

  it('exibe link para login PF', () => {
    render(<PortalClientePJLoginPage />);
    const link = screen.getByRole('link', { name: 'Login PF' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/login');
  });
});
