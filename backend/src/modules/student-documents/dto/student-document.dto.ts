import { z } from 'zod';

// ============================================
// STUDENT DOCUMENT DTOs
// ============================================

const ALLOWED_DOCUMENT_TYPES = [
  'RG',
  'CPF',
  'CNH',
  'ASO',
  'FOTO_3x4',
  'COMPROVANTE_RESIDENCIA',
  'CERTIFICADO_ANTERIOR',
  'OUTROS',
] as const;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadDocumentSchema = z.object({
  studentId: z.string().uuid('ID de aluno inválido'),
  documentType: z.enum(ALLOWED_DOCUMENT_TYPES, {
    errorMap: () => ({ message: 'Tipo de documento inválido' }),
  }),
  fileUrl: z.string().url('URL do arquivo inválida'),
  fileName: z.string().min(1).max(255).optional(),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_FILE_SIZE, 'Arquivo muito grande (máx 10MB)')
    .optional(),
  mimeType: z
    .enum(ALLOWED_MIME_TYPES, {
      errorMap: () => ({ message: 'Tipo de arquivo não permitido. Use JPEG, PNG ou PDF' }),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const ValidateDocumentSchema = z.object({
  documentId: z.string().uuid(),
  validatorId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const RejectDocumentSchema = z.object({
  documentId: z.string().uuid(),
  validatorId: z.string().uuid(),
  rejectedReason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres').max(500),
});

export const CheckDocumentsStatusSchema = z.object({
  studentId: z.string().uuid(),
});

export const GetStudentDocumentsSchema = z.object({
  studentId: z.string().uuid(),
  documentType: z.enum(ALLOWED_DOCUMENT_TYPES).optional(),
  status: z.enum(['PENDING', 'COMPLETE', 'REJECTED']).optional(),
});

export const SendPendingDocumentsNotificationSchema = z.object({
  notificationType: z.enum(['whatsapp', 'email', 'both']),
  customMessage: z.string().max(3000).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>;
export type ValidateDocumentDto = z.infer<typeof ValidateDocumentSchema>;
export type RejectDocumentDto = z.infer<typeof RejectDocumentSchema>;
export type CheckDocumentsStatusDto = z.infer<typeof CheckDocumentsStatusSchema>;
export type GetStudentDocumentsDto = z.infer<typeof GetStudentDocumentsSchema>;
export type SendPendingDocumentsNotificationDto = z.infer<
  typeof SendPendingDocumentsNotificationSchema
>;

export { ALLOWED_DOCUMENT_TYPES, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
