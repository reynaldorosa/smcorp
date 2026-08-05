import { z } from 'zod';
import { CreateCompanySchema } from './create-company.dto';

export const UpdateCompanySchema = CreateCompanySchema.partial();
export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>;
