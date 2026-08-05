import { z } from 'zod';

const BankSettingsSchema = z
  .object({
    account: z.string().optional(),
    agency: z.string().optional(),
    bank: z.string().optional(),
    accountType: z.string().optional(),
    pixKey: z.string().optional(),
  })
  .partial();

const SmtpSettingsSchema = z
  .object({
    host: z.string().optional(),
    port: z.number().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
    from: z.string().optional(),
    fromName: z.string().optional(),
    useSsl: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .partial();

const WhatsAppSettingsSchema = z
  .object({
    number: z.string().optional(),
    apiKey: z.string().optional(),
    webhook: z.string().optional(),
    webhookUrl: z.string().optional(),
    instanceId: z.string().optional(),
    enabled: z.boolean().optional(),
    defaultMessage: z.string().optional(),
  })
  .partial();

const InstitutionalSettingsSchema = z
  .object({
    legalName: z.string().optional(),
    website: z.string().optional(),
    brandColor: z.string().optional(),
    cashBox: z.string().optional(),
    cashNotes: z.string().optional(),
  })
  .partial();

const EmailSettingsSchema = z
  .object({
    smtpHost: z.string().optional(),
    smtpPort: z.number().optional(),
    smtpUser: z.string().optional(),
    smtpPassword: z.string().optional(),
    fromEmail: z.string().optional(),
    fromName: z.string().optional(),
    useSsl: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .partial();

export const UpdateCompanySettingsSchema = z.object({
  institutional: InstitutionalSettingsSchema.optional(),
  bank: BankSettingsSchema.optional(),
  smtp: SmtpSettingsSchema.optional(),
  email: EmailSettingsSchema.optional(),
  whatsapp: WhatsAppSettingsSchema.optional(),
  other: z.record(z.unknown()).optional(),
});

export type UpdateCompanySettingsDto = z.infer<typeof UpdateCompanySettingsSchema>;
