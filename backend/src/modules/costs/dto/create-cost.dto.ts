import { z } from 'zod';

const CostCategorySchema = z.enum([
  'FIXED',
  'VARIABLE',
  'PERSONNEL',
  'INFRASTRUCTURE',
  'EQUIPMENT',
  'MATERIAL',
  'SERVICES',
  'OTHER',
]);

export const CreateCostSchema = z.object({
  category: CostCategorySchema,
  description: z.string(),
  amount: z.number(),
  period: z.string(),
  supplierId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  linkType: z.enum(['none', 'company', 'instructor']).optional(),
  isRecurring: z.boolean().optional(),
  isAuditable: z.boolean().optional(),
  notes: z.string().optional(),
});

export type CreateCostDto = z.infer<typeof CreateCostSchema>;
