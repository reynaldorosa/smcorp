import { z } from 'zod';

// ============================================
// STUDENT DTOs
// ============================================

export const CreateStudentSchema = z.object({
  code: z.string().min(1).max(10).optional(), // Gerado automaticamente (A0001, A0002...)
  name: z.string().min(1, 'Nome obrigatório'),
  taxId: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  rg: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  companyId: z.string().uuid().optional(),
  photoUrl: z.string().url('URL inválida').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
});

export const UpdateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  taxId: z
    .string()
    .regex(/^\d{11}$/)
    .optional(),
  rg: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  companyId: z.string().uuid().optional(),
  photoUrl: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;
