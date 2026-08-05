import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email').min(1, 'Email is required').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  masterPin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Master PIN must have 6 digits')
    .optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
