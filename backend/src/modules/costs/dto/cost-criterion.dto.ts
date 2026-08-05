import { z } from 'zod';

const CostFrequencySchema = z.enum(['MONTHLY', 'DAILY', 'ONE_TIME']);
const CostLinkageSchema = z.enum(['ENROLLED_STUDENT', 'NOT_LINKED', 'INSTRUCTOR']);
const CostDueCriterionSchema = z.enum([
  'COURSE_END_DATE',
  'THIRTY_DAYS_AFTER_END',
  'MONTHLY_CLOSING',
  'SPECIFIC_DATE',
  'NO_DUE',
]);

export const CreateCostCriterionSchema = z.object({
  name: z.string().min(1),
  frequency: CostFrequencySchema,
  linkage: CostLinkageSchema,
  dueCriterion: CostDueCriterionSchema,
  daysUntilDue: z.number().int().optional(),
  monthlyClosingDay: z.number().int().min(1).max(31).optional(),
  daysAfterClosing: z.number().int().optional(),
  notes: z.string().optional(),
});

export type CreateCostCriterionDto = z.infer<typeof CreateCostCriterionSchema>;

export const UpdateCostCriterionSchema = CreateCostCriterionSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCostCriterionDto = z.infer<typeof UpdateCostCriterionSchema>;
