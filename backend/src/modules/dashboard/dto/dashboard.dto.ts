import { z } from 'zod';

// ============================================
// DASHBOARD DTOs
// ============================================

export const GetDashboardOverviewSchema = z.object({
  companyId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GetActiveClassesSchema = z.object({
  companyId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GetStudentsByStatusSchema = z.object({
  classId: z.string().uuid().optional(),
  status: z
    .enum(['SCHEDULED', 'CONFIRMED', 'PRESENT', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
});

export const GetPendingDocumentsSchema = z.object({
  companyId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const GetUpcomingExamsSchema = z.object({
  instructorId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const GetRevenueReportSchema = z.object({
  companyId: z.string().uuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type GetDashboardOverviewDto = z.infer<typeof GetDashboardOverviewSchema>;
export type GetActiveClassesDto = z.infer<typeof GetActiveClassesSchema>;
export type GetStudentsByStatusDto = z.infer<typeof GetStudentsByStatusSchema>;
export type GetPendingDocumentsDto = z.infer<typeof GetPendingDocumentsSchema>;
export type GetUpcomingExamsDto = z.infer<typeof GetUpcomingExamsSchema>;
export type GetRevenueReportDto = z.infer<typeof GetRevenueReportSchema>;
