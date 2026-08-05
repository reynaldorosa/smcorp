import { z } from 'zod';

export const MasterPinAuthorizationSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'PIN inválido'),
});

export type MasterPinAuthorizationDto = z.infer<typeof MasterPinAuthorizationSchema>;
