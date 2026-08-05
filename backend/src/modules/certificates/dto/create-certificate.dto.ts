import { z } from 'zod';

export const CreateCertificateSchema = z.object({
  enrollmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  validityMonths: z.number().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateCertificateDto = z.infer<typeof CreateCertificateSchema>;
