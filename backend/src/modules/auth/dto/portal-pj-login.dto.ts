import { z } from 'zod';

export const PortalPjLoginSchema = z.object({
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type PortalPjLoginDto = z.infer<typeof PortalPjLoginSchema>;
