import { z } from 'zod';

export const RevokeCertificateSchema = z.object({
  reason: z.string().min(5, 'Motivo de revogação deve ter pelo menos 5 caracteres'),
});

export type RevokeCertificateDto = z.infer<typeof RevokeCertificateSchema>;
