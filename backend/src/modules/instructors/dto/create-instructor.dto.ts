import { z } from 'zod';

export const CreateInstructorSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  costPerHour: z.number().optional(),
  costPerDay: z.number().optional(),
  dailyRate: z.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type CreateInstructorDto = z.infer<typeof CreateInstructorSchema>;
