import { z } from 'zod';

export const IssueCertificateSchema = z.object({
  issuedById: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type IssueCertificateDto = z.infer<typeof IssueCertificateSchema>;
