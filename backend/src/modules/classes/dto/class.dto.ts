import { z } from 'zod';

// ============================================
// CLASS DTOs
// ============================================

export const CreateClassSchema = z.object({
  courseId: z.string().uuid('ID de curso inválido'),
  instructorId: z.string().uuid('ID de instrutor inválido').optional(),
  instructorIds: z.array(z.string().uuid('ID de instrutor inválido')).optional(),
  companyId: z.string().uuid('ID de empresa inválido').optional(),
  roomId: z.string().uuid('ID de sala inválido'),
  code: z.string().min(1).max(50, 'Código muito longo').optional(), // Gerado automaticamente se não fornecido
  displayName: z.string().max(100).optional(),
  customPrice: z.number().min(0).optional(),
  startDate: z.coerce.date({
    errorMap: () => ({ message: 'Data de início inválida' }),
  }),
  // endDate é opcional - será calculado automaticamente se não fornecido
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxStudents: z.number().int().min(1).max(100).optional(),
  minStudents: z.number().int().min(0).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateClassSchema = z.object({
  courseId: z.string().uuid().optional(),
  instructorId: z.string().uuid().nullable().optional(),
  instructorIds: z.array(z.string().uuid('ID de instrutor inválido')).optional(),
  companyId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().optional(),
  code: z.string().min(1).max(50).optional(),
  displayName: z.string().max(100).nullable().optional(), // Nome personalizado para exibição
  customPrice: z.number().min(0).nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxStudents: z.number().int().min(1).max(100).optional(),
  minStudents: z.number().int().min(0).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional(),
});

export const CalculateEndDateSchema = z.object({
  courseId: z.string().uuid(),
  startDate: z.coerce.date(),
});

export const CheckRoomConflictSchema = z.object({
  roomId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  excludeClassId: z.string().uuid().optional(), // Para edição
});

export const CheckCapacitySchema = z.object({
  classId: z.string().uuid(),
});

export const GetClassesByRoomSchema = z.object({
  roomId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GetClassesByInstructorSchema = z.object({
  instructorId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Presença do instrutor num dia de aula (M03).
 * `date` é o dia da aula em formato YYYY-MM-DD.
 */
export const InstructorAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateClassDto = z.infer<typeof CreateClassSchema>;
export type UpdateClassDto = z.infer<typeof UpdateClassSchema>;
export type CalculateEndDateDto = z.infer<typeof CalculateEndDateSchema>;
export type CheckRoomConflictDto = z.infer<typeof CheckRoomConflictSchema>;
export type CheckCapacityDto = z.infer<typeof CheckCapacitySchema>;
export type InstructorAttendanceDto = z.infer<typeof InstructorAttendanceSchema>;
export type GetClassesByRoomDto = z.infer<typeof GetClassesByRoomSchema>;
export type GetClassesByInstructorDto = z.infer<typeof GetClassesByInstructorSchema>;
