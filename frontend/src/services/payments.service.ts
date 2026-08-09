import { api } from '@/lib/api';

// ============================================
// Caiso - Payments Service (Módulo Pagamentos)
// Backend: /payments
// ============================================

export type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'CASH' | 'INVOICE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: string;
  enrollmentId: string | null;
  companyId: string | null;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  invoiceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  enrollment?: {
    student?: { name: string };
    class?: { code: string; course?: { name: string } };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreatePaymentDTO {
  enrollmentId: string;
  amount: number;
  dueDate: string; // ISO string or yyyy-mm-dd (backend zod coerces)
  method?: PaymentMethod;
  installments?: number;
  description?: string;
}

export interface CreateExpensePaymentDTO {
  amount: number;
  dueDate: string;
  method?: PaymentMethod;
  category?: 'EQUIPMENT' | 'MATERIAL' | 'INSTRUCTOR_FEE' | 'MAINTENANCE' | 'UTILITIES' | 'RENT' | 'MARKETING' | 'OTHER';
  description: string;
  companyId?: string;
  notes?: string;
}

export interface CreateIncomePaymentDTO {
  amount: number;
  dueDate: string;
  method?: PaymentMethod;
  category?: 'COURSE_FEE' | 'EQUIPMENT' | 'MATERIAL' | 'INSTRUCTOR_FEE' | 'MAINTENANCE' | 'UTILITIES' | 'RENT' | 'MARKETING' | 'OTHER';
  description: string;
  companyId?: string;
  notes?: string;
}

export interface RecordPaymentDTO {
  paymentId: string;
  paidAt?: string;
  method: PaymentMethod;
  transactionId?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentStatusDTO {
  paymentId: string;
  status: PaymentStatus;
  reason?: string;
}

export interface PaymentStatisticsFilters {
  startDate?: string;
  endDate?: string;
  companyId?: string;
  status?: PaymentStatus;
}

export const paymentsService = {
  create: async (data: CreatePaymentDTO): Promise<Payment> => {
    const response = await api.post('/payments', {
      enrollmentId: data.enrollmentId,
      amount: data.amount,
      dueDate: data.dueDate,
      method: data.method,
      installments: data.installments ?? 1,
      description: data.description,
    });
    return response.data;
  },

  createExpense: async (data: CreateExpensePaymentDTO): Promise<Payment> => {
    const response = await api.post('/payments/expense', {
      amount: data.amount,
      dueDate: data.dueDate,
      method: data.method,
      category: data.category,
      description: data.description,
      companyId: data.companyId,
      notes: data.notes,
    });
    return response.data;
  },

  createIncome: async (data: CreateIncomePaymentDTO): Promise<Payment> => {
    const response = await api.post('/payments/income', {
      amount: data.amount,
      dueDate: data.dueDate,
      method: data.method,
      category: data.category,
      description: data.description,
      companyId: data.companyId,
      notes: data.notes,
    });
    return response.data;
  },

  createBulk: async (data: {
    enrollmentId: string;
    totalAmount: number;
    installments: number;
    firstDueDate: string;
    method?: PaymentMethod;
  }): Promise<{ count: number }> => {
    const response = await api.post('/payments/bulk', data);
    return response.data;
  },

  recordPayment: async (data: RecordPaymentDTO): Promise<Payment> => {
    const response = await api.post(`/payments/${data.paymentId}/record`, {
      paidAt: data.paidAt,
      method: data.method,
      transactionId: data.transactionId,
      invoiceNumber: data.invoiceNumber,
      notes: data.notes,
    });
    return response.data;
  },

  updateStatus: async (data: UpdatePaymentStatusDTO): Promise<Payment> => {
    const response = await api.put(`/payments/${data.paymentId}/status`, {
      status: data.status,
      reason: data.reason,
    });
    return response.data;
  },

  getByEnrollment: async (enrollmentId: string): Promise<Payment[]> => {
    const response = await api.get(`/payments/enrollment/${enrollmentId}`);
    return response.data;
  },

  getStatistics: async (filters?: PaymentStatisticsFilters): Promise<unknown> => {
    const response = await api.get('/payments/statistics', { params: filters });
    return response.data;
  },

  markOverdue: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post('/payments/mark-overdue');
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
  }): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getById: async (paymentId: string): Promise<Payment> => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  delete: async (paymentId: string): Promise<void> => {
    await api.delete(`/payments/${paymentId}`);
  },
};
