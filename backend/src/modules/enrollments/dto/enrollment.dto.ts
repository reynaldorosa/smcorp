import { z } from 'zod';

// ============================================
// ENROLLMENT DTOs
// ============================================

export const GenerateEnrollmentTokenSchema = z.object({
  enrollmentId: z.string().uuid('ID de matrícula inválido'),
  expiresInHours: z.number().int().min(1).max(168).default(24), // 1h a 7 dias
});

export const ValidateEnrollmentTokenSchema = z.object({
  token: z.string().min(32, 'Token inválido'),
});

export const RequestDiscountSchema = z.object({
  enrollmentId: z.string().uuid(),
  discount: z.number().min(0).max(100, 'Desconto máximo de 100%'),
  reason: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres').optional(),
});

export const ApproveDiscountSchema = z.object({
  enrollmentId: z.string().uuid(),
  masterId: z.string().uuid(),
});

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

export const EnrollmentExtraProductItemSchema = z.object({
  extraProductId: z.string().uuid('ID de produto extra invalido'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const CreateEnrollmentSchema = z.object({
  studentId: z.string().uuid('ID de aluno invalido'),
  classId: z.string().uuid('ID de turma invalido'),
  paymentMethod: z.string().optional(),
  observations: z.string().optional(),
  extraProducts: z.array(EnrollmentExtraProductItemSchema).optional(),
  /**
   * Estado inicial da matricula. Usado para entrar direto na fila de espera
   * (WAITING_LIST) em vez de marcar isso em texto livre nas observacoes.
   * Ausente = SCHEDULED (default do banco).
   */
  status: z.enum(['WAITING_LIST', 'SCHEDULED']).optional(),
});

export const AddEnrollmentExtraProductsSchema = z.object({
  items: z.array(EnrollmentExtraProductItemSchema).min(1),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GenerateEnrollmentTokenDto = z.infer<typeof GenerateEnrollmentTokenSchema>;
export type ValidateEnrollmentTokenDto = z.infer<typeof ValidateEnrollmentTokenSchema>;
export type RequestDiscountDto = z.infer<typeof RequestDiscountSchema>;
export type ApproveDiscountDto = z.infer<typeof ApproveDiscountSchema>;
export type UpdateEnrollmentStatusDto = z.infer<typeof UpdateEnrollmentStatusSchema>;
export type CreateEnrollmentDto = z.infer<typeof CreateEnrollmentSchema>;
export type AddEnrollmentExtraProductsBodyDto = z.infer<typeof AddEnrollmentExtraProductsSchema>;
export interface AddEnrollmentExtraProductsDto {
  enrollmentId: string;
  items: EnrollmentExtraProductItemDto[];
}
export type EnrollmentExtraProductItemDto = z.infer<typeof EnrollmentExtraProductItemSchema>;
