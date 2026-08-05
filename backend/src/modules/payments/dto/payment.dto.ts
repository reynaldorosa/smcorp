import { z } from 'zod';

// ============================================
// PAYMENT DTOs
// ============================================

export const PAYMENT_METHODS = [
  'PIX',
  'BOLETO',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'TRANSFER',
  'CASH',
  'INVOICE', // Nota Fiscal (PJ)
] as const;

export const CreatePaymentSchema = z.object({
  enrollmentId: z.string().uuid('ID de matrícula inválido'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: 'Data de vencimento inválida' }),
  }),
  method: z.enum(PAYMENT_METHODS).optional(),
  installments: z.number().int().min(1).max(12).default(1),
  description: z.string().max(500).optional(),
});

export const RecordPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  paidAt: z.coerce.date().optional(),
  method: z.enum(PAYMENT_METHODS),
  transactionId: z.string().max(200).optional(),
  invoiceNumber: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdatePaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  reason: z.string().min(10).max(500).optional(),
});

export const GetPaymentsByEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export const GetPaymentStatisticsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
});

export const CreateBulkPaymentsSchema = z.object({
  enrollmentId: z.string().uuid(),
  totalAmount: z.number().min(0.01),
  installments: z.number().int().min(1).max(12),
  firstDueDate: z.coerce.date(),
  method: z.enum(PAYMENT_METHODS).optional(),
});

export const CreateExpensePaymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: 'Data de vencimento inválida' }),
  }),
  method: z.enum(PAYMENT_METHODS).optional(),
  category: z
    .enum([
      'EQUIPMENT',
      'MATERIAL',
      'INSTRUCTOR_FEE',
      'MAINTENANCE',
      'UTILITIES',
      'RENT',
      'MARKETING',
      'OTHER',
    ])
    .optional(),
  description: z.string().min(1).max(500),
  companyId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const CreateIncomePaymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: 'Data de vencimento inválida' }),
  }),
  method: z.enum(PAYMENT_METHODS).optional(),
  category: z
    .enum([
      'COURSE_FEE',
      'EQUIPMENT',
      'MATERIAL',
      'INSTRUCTOR_FEE',
      'MAINTENANCE',
      'UTILITIES',
      'RENT',
      'MARKETING',
      'OTHER',
    ])
    .optional(),
  description: z.string().min(1).max(500),
  companyId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;
export type UpdatePaymentStatusDto = z.infer<typeof UpdatePaymentStatusSchema>;
export type GetPaymentsByEnrollmentDto = z.infer<typeof GetPaymentsByEnrollmentSchema>;
export type GetPaymentStatisticsDto = z.infer<typeof GetPaymentStatisticsSchema>;
export type CreateBulkPaymentsDto = z.infer<typeof CreateBulkPaymentsSchema>;
export type CreateExpensePaymentDto = z.infer<typeof CreateExpensePaymentSchema>;
export type CreateIncomePaymentDto = z.infer<typeof CreateIncomePaymentSchema>;
