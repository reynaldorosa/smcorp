import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { PlatformHome } from './platform-home';
import type { PlatformTenant } from '@/services/tenants.service';

const getAllMock = vi.fn();
const updateStatusMock = vi.fn();
const requestConfirmationMock = vi.fn();
const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/tenants.service', () => ({
  platformService: {
    getAll: (...args: unknown[]) => getAllMock(...args),
    updateStatus: (...args: unknown[]) => updateStatusMock(...args),
  },
}));

vi.mock('@/components/ui/confirmation-dialog', () => ({
  useConfirmation: () => ({
    requestConfirmation: (options: { onConfirm: () => void }) => requestConfirmationMock(options),
  }),
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

const tenants: PlatformTenant[] = [
  {
    id: 't-smcorp',
    slug: 'smcorp',
    name: 'SMCORP',
    cnpj: null,
    status: 'ACTIVE',
    branding: {},
    trialEndsAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    subscription: { id: 'sub-1', planName: 'Plataforma', price: 0, status: 'ACTIVE', currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false },
    _count: { users: 5, enrollments: 20 },
  },
  {
    id: 't-trial',
    slug: 'centro-norte',
    name: 'Centro Norte',
    cnpj: null,
    status: 'TRIAL',
    branding: {},
    trialEndsAt: '2026-08-10T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    subscription: null,
    _count: { users: 1, enrollments: 0 },
  },
];

const metrics = {
  total: 2,
  trial: 1,
  active: 1,
  suspended: 0,
  cancelled: 0,
  invoicesMonth: 598,
  invoicesMonthCount: 2,
};

describe('PlatformHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue({ tenants, metrics });
    updateStatusMock.mockResolvedValue({ tenant: { id: 't-trial', status: 'SUSPENDED' } });
    requestConfirmationMock.mockImplementation((options: { onConfirm: () => void }) => {
      options.onConfirm();
    });
  });

  it('carrega métricas e lista os tenants (SMCORP como um tenant normal)', async () => {
    render(<PlatformHome />);

    await waitFor(() => {
      expect(screen.getByText('SMCORP')).toBeTruthy();
      expect(screen.getByText('Centro Norte')).toBeTruthy();
      // "2" aparece no card de total e no contador da tabela
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      // Faturas do mês (espaço de formatação pode variar entre ambientes ICU)
      expect(
        screen.getByText((content) => content.replace(/\s/g, ' ').includes('598,00')),
      ).toBeTruthy();
      expect(getAllMock).toHaveBeenCalled();
    });
  });

  it('suspende um tenant com confirmação e recarrega a lista', async () => {
    render(<PlatformHome />);

    await waitFor(() => expect(screen.getByText('Centro Norte')).toBeTruthy());

    const row = screen.getByText('Centro Norte').closest('tr')!;
    const suspend = within(row).getByRole('button', { name: /Suspender/i });
    fireEvent.click(suspend);

    await waitFor(() => {
      expect(requestConfirmationMock).toHaveBeenCalled();
      expect(updateStatusMock).toHaveBeenCalledWith('t-trial', 'SUSPENDED');
      // reload após a mudança
      expect(getAllMock).toHaveBeenCalledTimes(2);
    });
  });

  it('mostra erro ao falhar o carregamento', async () => {
    getAllMock.mockRejectedValue(new Error('network'));

    render(<PlatformHome />);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        'Não foi possível carregar os tenants. Recarregue a página.',
      );
    });
  });
});
