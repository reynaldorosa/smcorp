import { z } from 'zod';
import { CreateCertificateSchema } from './create-certificate.dto';

export const UpdateCertificateSchema = CreateCertificateSchema.partial();
export type UpdateCertificateDto = z.infer<typeof UpdateCertificateSchema>;
