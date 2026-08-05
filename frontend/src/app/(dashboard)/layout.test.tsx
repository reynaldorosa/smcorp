import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardLayout from './layout';
import { createDefaultUserPermissions, type UserPermissions } from '@/lib/user-permissions';
import { getModuleGateForPathname, isAllowedByModuleGate } from '@/lib/route-module-map';

const pushMock = vi.fn();
const pathnameMock = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameMock(),
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => authStoreValue,
}));

vi.mock('@/stores/sidebar.store', () => ({
  useSidebarStore: () => ({ collapsed: false }),
}));

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: () => settingsStoreValue,
}));

// route-module-map NÃO é mockado de propósito: o gating por módulo é
// justamente o que estes testes precisam exercitar de ponta a ponta.

vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

vi.mock('@/components/layout/header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('@/components/layout/floating-test-buttons', () => ({
  FloatingTestButtons: () => null,
}));

let authStoreValue: { isAuthenticated: boolean; user: { role: string } | null } = {
  isAuthenticated: false,
  user: null,
};

let settingsStoreValue: { currentUser: { permissions: UserPermissions } | null } = {
  currentUser: null,
};

describe('DashboardLayout (guard de tenant)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreValue = { isAuthenticated: false, user: null };
    settingsStoreValue = { currentUser: null };
    pathnameMock.mockReturnValue('/dashboard');
  });

  it('redireciona MASTER para /platform e não renderiza o dashboard de tenant', async () => {
    authStoreValue = { isAuthenticated: true, user: { role: 'MASTER' } };

    render(
      <DashboardLayout>
        <div>Conteúdo do tenant</div>
      </DashboardLayout>,
    );

    expect(pushMock).toHaveBeenCalledWith('/platform');
    expect(screen.queryByText('Conteúdo do tenant')).toBeNull();
  });

  it('deixa ADMIN autenticado renderizar o dashboard normalmente', () => {
    authStoreValue = { isAuthenticated: true, user: { role: 'ADMIN' } };

    render(
      <DashboardLayout>
        <div>Conteúdo do tenant</div>
      </DashboardLayout>,
    );

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('Conteúdo do tenant')).toBeTruthy();
  });

  it('não deixa o Seller preso em /dashboard (regressão: tela em branco)', () => {
    // Seller não tem modulo09, então /dashboard lhe é negado. O fallback não
    // pode ser /dashboard de novo — senão o layout renderiza null para sempre.
    authStoreValue = { isAuthenticated: true, user: { role: 'COLLABORATOR' } };
    settingsStoreValue = { currentUser: { permissions: createDefaultUserPermissions('Seller') } };

    render(
      <DashboardLayout>
        <div>Conteúdo do tenant</div>
      </DashboardLayout>,
    );

    expect(pushMock).toHaveBeenCalled();
    const destino = pushMock.mock.calls[0][0] as string;

    // O invariante: o destino não é a própria rota negada e o Seller pode entrar nele.
    expect(destino).not.toBe('/dashboard');
    const permissoes = createDefaultUserPermissions('Seller').modulos;
    const gate = getModuleGateForPathname(destino);
    expect(gate ? isAllowedByModuleGate(permissoes, gate) : true).toBe(true);
  });

  it('deixa o Seller renderizar uma rota que ele tem permissão', () => {
    authStoreValue = { isAuthenticated: true, user: { role: 'COLLABORATOR' } };
    settingsStoreValue = { currentUser: { permissions: createDefaultUserPermissions('Seller') } };
    pathnameMock.mockReturnValue('/vendas');

    render(
      <DashboardLayout>
        <div>Conteúdo do tenant</div>
      </DashboardLayout>,
    );

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('Conteúdo do tenant')).toBeTruthy();
  });

  it('redireciona para /login quando não autenticado', () => {
    render(
      <DashboardLayout>
        <div>Conteúdo do tenant</div>
      </DashboardLayout>,
    );

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Conteúdo do tenant')).toBeNull();
  });
});
