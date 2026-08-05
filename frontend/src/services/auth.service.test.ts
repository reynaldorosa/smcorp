import { describe, it, expect, vi, beforeEach } from 'vitest';

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: unknown[]) => postMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { authService } from './auth.service';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama endpoint de login PJ corretamente', async () => {
    postMock.mockResolvedValue({
      data: { accessToken: 'a', refreshToken: '', user: { id: '1', email: 'x', name: 'Empresa', role: 'CLIENT_PJ' } },
    });

    await authService.loginPortalPj({ login: 'empresa', password: '12345678' });

    expect(postMock).toHaveBeenCalledWith('/auth/portal-pj/login', {
      login: 'empresa',
      password: '12345678',
    });
  });

  it('chama endpoint de perfil PJ corretamente', async () => {
    getMock.mockResolvedValue({
      data: {
        id: 'comp-1',
        name: 'Empresa XPTO',
        tradeName: 'XPTO',
        companyTaxId: '12.345.678/0001-99',
        email: 'contato@empresa.com.br',
        phone: '11999999999',
        code: 'PJ-0199',
      },
    });

    const response = await authService.getPortalPjProfile();

    expect(getMock).toHaveBeenCalledWith('/auth/portal-pj/profile');
    expect(response.code).toBe('PJ-0199');
  });
});
