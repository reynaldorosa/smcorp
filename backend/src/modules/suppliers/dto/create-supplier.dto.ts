import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  code: z.string().optional(),
  name: z.string(),
  tradeName: z.string().optional(),
  companyTaxId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;
