import { z } from 'zod';

const RequiredDocumentSchema = z.object({
  name: z.string().min(1),
  requiresUpload: z.boolean().optional(),
});

export const CreateCourseSchema = z.object({
  code: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  syllabus: z.string().optional(),
  durationHours: z.number().min(1),
  hoursPerDay: z.number().optional(),
  defaultStartTime: z.string().optional(),
  defaultEndTime: z.string().optional(),
  breakDuration: z.number().optional(),
  allowWeekends: z.boolean().optional(),
  allowSaturday: z.boolean().optional(),
  allowSunday: z.boolean().optional(),
  requiredDocuments: z.array(z.union([z.string(), RequiredDocumentSchema])).optional(),
  learningTime: z.number().optional(),
  certificationInfo: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  linkedProducts: z.array(z.string()).optional(),
  linkedExtras: z.array(z.string()).optional(),
  cashValue: z.number().optional(),
  price: z.number(),
  validityMonths: z.number().min(0),
  isOffshore: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCourseDto = z.infer<typeof CreateCourseSchema>;
