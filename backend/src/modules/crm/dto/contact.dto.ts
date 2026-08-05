import { z } from 'zod';

export const CreateContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  cpfCnpj: z.string().optional(),
  source: z.enum(['MANUAL', 'IMPORT', 'WEBSITE', 'WHATSAPP', 'REFERRAL', 'COMPANY']).optional(),
  status: z.enum(['LEAD', 'QUALIFIED', 'INTERESTED', 'NEGOTIATION', 'ENROLLED', 'LOST']).optional(),
  assignedToId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export type CreateContactDto = z.infer<typeof CreateContactSchema>;

export const UpdateContactSchema = CreateContactSchema.partial();
export type UpdateContactDto = z.infer<typeof UpdateContactSchema>;
