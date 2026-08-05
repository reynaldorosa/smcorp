import { z } from 'zod';
import { CreateInstructorSchema } from './create-instructor.dto';

export const UpdateInstructorSchema = CreateInstructorSchema.partial();
export type UpdateInstructorDto = z.infer<typeof UpdateInstructorSchema>;
