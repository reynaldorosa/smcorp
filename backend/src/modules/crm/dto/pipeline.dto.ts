import { z } from 'zod';

export const CreatePipelineStageSchema = z.object({
  name: z.string().min(2),
  order: z.number().int().min(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  isDefault: z.boolean().optional(),
});

export type CreatePipelineStageDto = z.infer<typeof CreatePipelineStageSchema>;

export const UpdatePipelineStageSchema = CreatePipelineStageSchema.partial();
export type UpdatePipelineStageDto = z.infer<typeof UpdatePipelineStageSchema>;

export const ReorderPipelineSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    }),
  ),
});
export type ReorderPipelineDto = z.infer<typeof ReorderPipelineSchema>;
