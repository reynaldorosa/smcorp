import { z } from 'zod';

// ============================================
// TENANT DTOs (onboarding SaaS)
// ============================================

export const TenantSignupSchema = z.object({
  tenantName: z.string().min(2, 'Nome do centro de treinamento é obrigatório').max(120),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  cnpj: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
    .optional(),
  adminName: z.string().min(2, 'Nome do administrador é obrigatório').max(120),
  adminEmail: z.string().email('E-mail inválido').max(200),
  adminPassword: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(72)
    .regex(/[A-Za-z]/, 'Senha deve conter letras')
    .regex(/[0-9]/, 'Senha deve conter números'),
});

export type TenantSignupDto = z.infer<typeof TenantSignupSchema>;
