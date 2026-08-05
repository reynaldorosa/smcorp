import { z } from 'zod';

export const CreateRoomSchema = z.object({
  companyId: z.string().uuid('ID de empresa inválido'),
  name: z.string().min(1).max(100, 'Nome muito longo'),
  location: z.string().max(200).optional(),
  capacity: z.number().int().min(1).max(200, 'Capacidade inválida'),
  costPerDay: z.number().min(0).optional(),
  hasProjector: z.boolean().optional(),
  hasWhiteboard: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export const UpdateRoomSchema = CreateRoomSchema.partial();

export type CreateRoomDto = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomDto = z.infer<typeof UpdateRoomSchema>;
