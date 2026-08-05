import { z } from 'zod';
import { TenantStatus } from '@prisma/client';

// ============================================
// TENANT DTO (superadmin / plataforma)
// ============================================

export const UpdateTenantStatusSchema = z.object({
  status: z.nativeEnum(TenantStatus, {
    errorMap: () => ({ message: 'Status inválido (TRIAL, ACTIVE, SUSPENDED ou CANCELLED)' }),
  }),
});

export type UpdateTenantStatusDto = z.infer<typeof UpdateTenantStatusSchema>;
