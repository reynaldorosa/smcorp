import { z } from 'zod';
import { CreateRoomSchema } from './create-room.dto';

export const UpdateRoomSchema = CreateRoomSchema.partial();
export type UpdateRoomDto = z.infer<typeof UpdateRoomSchema>;
