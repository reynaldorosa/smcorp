import { z } from 'zod';

export const CreateRoomSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  block: z.string().optional(),
  capacity: z.number().int(),
  costPerDay: z.number().optional(),
  dailyCost: z.number().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  hasAC: z.boolean().optional(),
  hasProjector: z.boolean().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type CreateRoomDto = z.infer<typeof CreateRoomSchema>;
