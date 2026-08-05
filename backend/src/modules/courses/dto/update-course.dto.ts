import { z } from 'zod';
import { CreateCourseSchema } from './create-course.dto';

export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseDto = z.infer<typeof UpdateCourseSchema>;
