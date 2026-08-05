import { z } from 'zod';

export const CreateActivitySchema = z.object({
  contactId: z.string().uuid(),
  type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'TASK', 'FOLLOW_UP']),
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  createdById: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateActivityDto = z.infer<typeof CreateActivitySchema>;

export const UpdateActivitySchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateActivityDto = z.infer<typeof UpdateActivitySchema>;
