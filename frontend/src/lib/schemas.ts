import { z } from 'zod';

// ============================================
// ENROLLMENT SCHEMAS
// ============================================

export const GenerateTokenSchema = z.object({
  enrollmentId: z.string().uuid('ID de matrícula inválido'),
  expiresInHours: z.number().int().min(1).max(168).optional(),
});

export const ValidateTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export const RequestDiscountSchema = z.object({
  enrollmentId: z.string().uuid(),
  discountAmount: z.number().min(0.01, 'Desconto deve ser maior que zero'),
  requestedBy: z.string().uuid(),
  reason: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres').max(500),
});

export const ApproveDiscountSchema = z.object({
  enrollmentId: z.string().uuid(),
  masterId: z.string().uuid(),
});

// Espelha EnrollmentStatus do backend (backend/prisma/schema.prisma).
// Antes divergia: tinha COMPLETED e NO_SHOW, que o backend rejeita, e faltavam
// TO_CONFIRM e ABSENT, que ele aceita.
export const UpdateEnrollmentStatusSchema = z.object({
  enrollmentId: z.string().uuid(),
  status: z.enum([
    'WAITING_LIST',
    'SCHEDULED',
    'TO_CONFIRM',
    'CONFIRMED',
    'PRESENT',
    'ABSENT',
    'CANCELLED',
  ]),
});

// ============================================
// STUDENT DOCUMENT SCHEMAS
// ============================================

export const UploadDocumentSchema = z.object({
  studentId: z.string().uuid(),
  documentType: z.string().min(1),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(255).optional(),
  fileSize: z.number().max(10485760, 'Arquivo muito grande (máx 10MB)').optional(),
  mimeType: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const ValidateDocumentSchema = z.object({
  documentId: z.string().uuid(),
  validatorId: z.string().uuid(),
});

export const RejectDocumentSchema = z.object({
  documentId: z.string().uuid(),
  validatorId: z.string().uuid(),
  rejectedReason: z.string().min(10).max(500),
});

// ============================================
// EXAM SCHEMAS
// ============================================

export const ScheduleExamSchema = z.object({
  enrollmentId: z.string().uuid(),
  courseId: z.string().uuid(),
  instructorId: z.string().uuid(),
  examNumber: z.string().min(1).max(50),
  examType: z.string().max(100).optional(),
  scheduledDate: z.date(),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido (HH:MM)'),
  duration: z.number().int().min(1).max(480).optional(),
  notes: z.string().max(1000).optional(),
});

export const RecordExamResultSchema = z.object({
  examId: z.string().uuid(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const CreatePaymentSchema = z.object({
  enrollmentId: z.string().uuid(),
  amount: z.number().min(0.01),
  dueDate: z.date(),
  method: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'CASH']).optional(),
  installments: z.number().int().min(1).max(12).default(1),
  description: z.string().max(500).optional(),
});

export const RecordPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  paidAt: z.date().optional(),
  paidAmount: z.number().min(0.01).optional(),
  method: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'CASH']),
  transactionId: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// CLASS SCHEMAS
// ============================================

export const CreateClassSchema = z.object({
  courseId: z.string().uuid(),
  instructorId: z.string().uuid().optional(),
  roomId: z.string().uuid(),
  code: z.string().min(1).max(50).optional(), // Gerado automaticamente pelo backend
  displayName: z.string().max(100).nullable().optional(), // Nome personalizado para exibição
  startDate: z.date(),
  endDate: z.date().optional(),
  maxStudents: z.number().int().min(1).max(100).optional(),
  minStudents: z.number().int().min(0).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GenerateTokenDto = z.infer<typeof GenerateTokenSchema>;
export type ValidateTokenDto = z.infer<typeof ValidateTokenSchema>;
export type RequestDiscountDto = z.infer<typeof RequestDiscountSchema>;
export type ApproveDiscountDto = z.infer<typeof ApproveDiscountSchema>;
export type UpdateEnrollmentStatusDto = z.infer<typeof UpdateEnrollmentStatusSchema>;
export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>;
export type ValidateDocumentDto = z.infer<typeof ValidateDocumentSchema>;
export type RejectDocumentDto = z.infer<typeof RejectDocumentSchema>;
export type ScheduleExamDto = z.infer<typeof ScheduleExamSchema>;
export type RecordExamResultDto = z.infer<typeof RecordExamResultSchema>;
export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;
export type CreateClassDto = z.infer<typeof CreateClassSchema>;
