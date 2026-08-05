import { z } from 'zod';

// ============================================
// EXAM DTOs
// ============================================

export const ScheduleExamSchema = z.object({
  enrollmentId: z.string().uuid('ID de matrícula inválido'),
  courseId: z.string().uuid('ID de curso inválido'),
  instructorId: z.string().uuid('ID de instrutor inválido'),
  examNumber: z.string().min(1).max(50, 'Número da prova muito longo'),
  examType: z.string().min(1).max(100).optional(),
  scheduledDate: z.coerce.date({
    errorMap: () => ({ message: 'Data inválida' }),
  }),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido (use HH:MM)'),
  duration: z.number().int().min(1).max(480).optional(), // Máx 8 horas
  notes: z.string().max(1000).optional(),
});

export const RecordExamResultSchema = z.object({
  examId: z.string().uuid(),
  score: z.number().min(0).max(100, 'Nota deve estar entre 0 e 100'),
  passed: z.boolean(),
  notes: z.string().max(1000).optional(),
});

export const UpdateExamStatusSchema = z.object({
  examId: z.string().uuid(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'FAILED', 'CANCELLED']),
});

export const CancelExamSchema = z.object({
  examId: z.string().uuid(),
  reason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres').max(500),
});

export const GetExamsByEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
});

export const GetExamsByInstructorSchema = z.object({
  instructorId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const UpdateExamSchema = z
  .object({
    examNumber: z.string().min(1).max(50, 'Número da prova muito longo').optional(),
    examType: z.string().min(1).max(100).optional(),
    scheduledDate: z.coerce
      .date({
        errorMap: () => ({ message: 'Data inválida' }),
      })
      .optional(),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido (use HH:MM)')
      .optional(),
    duration: z.number().int().min(1).max(480).optional(),
    notes: z.string().max(1000).optional(),
    instructorId: z.string().uuid('ID de instrutor inválido').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  });

// ============================================
// TYPE EXPORTS
// ============================================

export type ScheduleExamDto = z.infer<typeof ScheduleExamSchema>;
export type RecordExamResultDto = z.infer<typeof RecordExamResultSchema>;
export type UpdateExamStatusDto = z.infer<typeof UpdateExamStatusSchema>;
export type CancelExamDto = z.infer<typeof CancelExamSchema>;
export type GetExamsByEnrollmentDto = z.infer<typeof GetExamsByEnrollmentSchema>;
export type GetExamsByInstructorDto = z.infer<typeof GetExamsByInstructorSchema>;
export type UpdateExamDto = z.infer<typeof UpdateExamSchema>;
