import { z } from 'zod';
import { CreateExtraProductSchema } from './create-extra-product.dto';

export const UpdateExtraProductSchema = CreateExtraProductSchema.partial();
export type UpdateExtraProductDto = z.infer<typeof UpdateExtraProductSchema>;
