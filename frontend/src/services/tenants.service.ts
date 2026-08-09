import { api } from '@/lib/api';

// ============================================
// Caiso - Tenants Service (SaaS: billing)
// ============================================

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  cnpj: string | null;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  branding: Record<string, unknown> | null;
  trialEndsAt: string | null;
  createdAt: string;
  subscription?: {
    id: string;
    planName: string | null;
    price: number;
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface BillingInfo extends TenantInfo {
  paymentGatewayConfigured: boolean;
  invoices: Array<{
    id: string;
    description: string;
    amount: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
  }>;
}

export interface CheckoutResult {
  paymentId: string;
  amount: number;
  description: string;
  qrCode: string;
  qrCodeBase64: string;
  providerPaymentId: string;
  status: string;
}

// ============================================
// PLATAFORMA (superadmin MASTER)
// ============================================

export interface PlatformTenant {
  id: string;
  slug: string;
  name: string;
  cnpj: string | null;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  branding: Record<string, unknown> | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    planName: string | null;
    price: number;
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  _count?: { users: number; enrollments: number; payments?: number };
}

export interface PlatformMetrics {
  total: number;
  trial: number;
  active: number;
  suspended: number;
  cancelled: number;
  invoicesMonth: number;
  invoicesMonthCount: number;
}

export interface PlatformTenantDetail extends PlatformTenant {
  invoices: Array<{
    id: string;
    description: string;
    amount: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
  }>;
}

export const platformService = {
  /** [MASTER] Lista todos os tenants + métricas da plataforma */
  getAll: async (): Promise<{ tenants: PlatformTenant[]; metrics: PlatformMetrics }> => {
    const response = await api.get('/tenant/all');
    return response.data;
  },

  /** [MASTER] Detalhe de um tenant (assinatura + faturas) */
  getById: async (id: string): Promise<PlatformTenantDetail> => {
    const response = await api.get(`/tenant/${id}`);
    return response.data;
  },

  /** [MASTER] Cria um tenant manualmente (com admin) */
  create: async (data: {
    tenantName: string;
    slug: string;
    cnpj?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const response = await api.post('/tenant', data);
    return response.data;
  },

  /** [MASTER] Altera o status de um tenant */
  updateStatus: async (
    id: string,
    status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED',
  ) => {
    const response = await api.patch(`/tenant/${id}/status`, { status });
    return response.data;
  },
};

export const tenantsService = {
  getTenantInfo: async (): Promise<{ tenant: TenantInfo | null }> => {
    const response = await api.get('/tenant/me');
    return response.data;
  },

  getBilling: async (): Promise<BillingInfo> => {
    const response = await api.get('/tenant/billing');
    return response.data;
  },

  subscribe: async (data: { planName?: string; price?: number }) => {
    const response = await api.post('/tenant/billing/subscribe', data);
    return response.data;
  },

  cancelBilling: async () => {
    const response = await api.post('/tenant/billing/cancel');
    return response.data;
  },
};

export const checkoutService = {
  createCheckout: async (enrollmentId: string): Promise<CheckoutResult> => {
    const response = await api.post('/payments/checkout', { enrollmentId });
    return response.data;
  },

  getStatus: async (paymentId: string) => {
    const response = await api.get(`/payments/${paymentId}/checkout-status`);
    return response.data;
  },
};
