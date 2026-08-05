import { z } from 'zod';

const CompanyPricingSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  basePrice: z.number().optional(),
  discountPercent: z.number().optional(),
  finalPrice: z.number(),
  notes: z.string().optional(),
  includedProductIds: z.array(z.string()).optional(),
  validUntil: z.string().optional(),
  active: z.boolean().optional(),
});

export const CreateCompanySchema = z.object({
  name: z.string(),
  tradeName: z.string().optional(),
  companyTaxId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  isActive: z.boolean().optional(),
  portalAccess: z.boolean().optional(),
  portalLogin: z.string().optional(),
  portalPassword: z.string().min(6).optional(),
  allowedPaymentMethods: z.array(z.string()).optional(),
  pricing: z.array(CompanyPricingSchema).optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
