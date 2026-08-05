import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const CreateUserSchema = z
  .object({
    email: z.string().email('Invalid email').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    masterPin: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Master PIN must have 6 digits')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === UserRole.MASTER && !data.masterPin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['masterPin'],
        message: 'Master PIN is required for MASTER users',
      });
    }
  });

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
