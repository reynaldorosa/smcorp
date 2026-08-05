import { z } from 'zod';
import { CreateCostSchema } from './create-cost.dto';

export const UpdateCostSchema = CreateCostSchema.partial();
export type UpdateCostDto = z.infer<typeof UpdateCostSchema>;
