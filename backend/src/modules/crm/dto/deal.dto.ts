import { z } from 'zod';

export const CreateDealSchema = z.object({
  contactId: z.string().uuid(),
  stageId: z.string().uuid(),
  title: z.string().min(2),
  value: z.number().min(0),
  expectedCloseDate: z.string().datetime().optional(),
  courseId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type CreateDealDto = z.infer<typeof CreateDealSchema>;

export const UpdateDealSchema = CreateDealSchema.partial();
export type UpdateDealDto = z.infer<typeof UpdateDealSchema>;

export const MoveDealSchema = z.object({
  stageId: z.string().uuid(),
});
export type MoveDealDto = z.infer<typeof MoveDealSchema>;

export const LostDealSchema = z.object({
  reason: z.string().min(3, 'Motivo deve ter pelo menos 3 caracteres'),
});
export type LostDealDto = z.infer<typeof LostDealSchema>;
