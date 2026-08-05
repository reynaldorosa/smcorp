import { z } from 'zod';

export const CreateExtraProductSchema = z.object({
  code: z.string().optional(),
  name: z.string(),
  type: z.enum(['product', 'extra']).optional(),
  description: z.string().optional(),
  price: z.number(),
  stock: z.number().int().optional(),
  associatedCosts: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type CreateExtraProductDto = z.infer<typeof CreateExtraProductSchema>;
