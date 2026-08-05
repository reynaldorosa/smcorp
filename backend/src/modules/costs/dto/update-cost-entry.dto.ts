import { z } from 'zod';
import { CreateCostEntrySchema } from './create-cost-entry.dto';

export const UpdateCostEntrySchema = CreateCostEntrySchema.partial();
export type UpdateCostEntryDto = z.infer<typeof UpdateCostEntrySchema>;

export const PayCostEntrySchema = z.object({
  paidAt: z.string().optional(),
});

export type PayCostEntryDto = z.infer<typeof PayCostEntrySchema>;
