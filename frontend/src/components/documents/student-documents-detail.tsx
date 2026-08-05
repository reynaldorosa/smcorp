"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  FileCheck,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Mail,
  X,
  Upload,
  Edit2,
  User,
  Camera,
  FileText,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PhotoEditor } from './photo-editor';
import { AdministrativeDocument, DocumentData } from './administrative-document';
import { useAuthStore } from '@/stores/auth.store';
import type { Student } from '@/stores/students.store';
import type { Course } from '@/stores/courses.store';
import type { Class } from '@/stores/classes.store';

import {
  documentOperations,
  SendPendingDocumentsNotificationResponse,
} from '@/services/operations.service';
import { studentsService } from '@/services/students.service';
import { RejectDocumentDto, ValidateDocumentDto } from '@/lib/schemas';

// ============================================
// Types
// ============================================

export interface RequiredDocument {
  name: string;
  requiresUpload: boolean;
}

export interface StudentDocumentsDetailProps {
  /** Student data */
  student: Student;
  /** Course data */
  course: Course;
  /** Class data */
  classData: Class;
  /** Room name (optional) */
  roomName?: string;
  /** List of required documents from course */
  requiredDocuments?: RequiredDocument[];
  /** Callback to update student data */
  onUpdateStudent: (studentId: string, data: Partial<Student>) => void;
  /** Callback when user closes the detail view */
  onClose: () => void;
  /** Custom class name */
  className?: string;
}

type NotificationType = 'whatsapp' | 'email' | 'both';

type ApiStudentDocument = {
  id: string;
  studentId: string;
  documentType: string;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  status: 'PENDING' | 'COMPLETE' | 'REJECTED';
  uploadedAt?: string;
  validatedAt?: string | null;
  validatedBy?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
};

// ============================================
// Helper Functions
// ============================================

function formatLocalDate(dateString: string): string {
  if (!dateString) return '-';
  // Prefer local parsing for YYYY-MM-DD to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// Component
// ============================================

export function StudentDocumentsDetail({
  student,
  course,
  classData,
  roomName,
  requiredDocuments = [],
  onUpdateStudent,
  onClose,
  className,
}: StudentDocumentsDetailProps) {
  const currentUser = useAuthStore((s) => s.user);

  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('both');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [apiDocuments, setApiDocuments] = useState<ApiStudentDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const docs = (await documentOperations.getByStudent(student.id)) as ApiStudentDocument[];
      setApiDocuments(Array.isArray(docs) ? docs : []);
    } catch {
      setApiDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [student.id]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const requiredDocsNormalized = useMemo(() => {
    // Segurança: se o backend retornar string[] e isso passar pra cá, normaliza
    const raw: unknown = requiredDocuments;
    if (Array.isArray(raw) && raw.every((d): d is string => typeof d === 'string')) {
      return raw.map((name) => ({ name, requiresUpload: true }));
    }
    return requiredDocuments;
  }, [requiredDocuments]);

  function toUiDocumentData(docReqName: string): DocumentData | undefined {
    const apiDoc = apiDocuments.find((d) => d.documentType === docReqName);
    if (!apiDoc) return undefined;

    const isTextDocument =
      requiredDocsNormalized.find((doc) => doc.name === docReqName)?.requiresUpload === false;

    let textValue: string | undefined;
    if (isTextDocument && typeof apiDoc.fileUrl === 'string' && apiDoc.fileUrl.startsWith('data:text/plain')) {
      const parts = apiDoc.fileUrl.split(',');
      if (parts.length > 1) {
        try {
          textValue = decodeURIComponent(parts[1] || '');
        } catch {
          textValue = parts[1] || '';
        }
      }
    }

    const status: DocumentData['status'] =
      apiDoc.status === 'COMPLETE' ? 'Approved' : apiDoc.status === 'REJECTED' ? 'Rejected' : 'Pending';

    return {
      name: apiDoc.documentType,
      type: isTextDocument ? 'text' : 'upload',
      fileUrl: apiDoc.fileUrl,
      textValue,
      submittedAt: apiDoc.uploadedAt || new Date().toISOString(),
      status,
    };
  }

  // Document stats
  const totalDocuments = requiredDocsNormalized.length;
  const approvedDocuments = requiredDocsNormalized.filter((doc) => {
    const apiDoc = apiDocuments.find((d) => d.documentType === doc.name);
    return apiDoc?.status === 'COMPLETE';
  }).length;
  const pendingDocuments = totalDocuments - approvedDocuments;

  const refreshCompleteStatus = useCallback(async () => {
    try {
      const status = await documentOperations.checkStatus(student.id);
      if (typeof status?.allComplete === 'boolean') {
        onUpdateStudent(student.id, { documentsComplete: status.allComplete });
      }
    } catch {
      toast.warning('Documento atualizado, mas não foi possível sincronizar o status geral.');
    }
  }, [student.id, onUpdateStudent]);

  // Approve document (backend COMPLETE)
  const handleApproveDocument = useCallback(
    async (documentName: string) => {
      const apiDoc = apiDocuments.find((d) => d.documentType === documentName);
      if (!apiDoc) {
        toast.error('Documento não encontrado');
        return;
      }
      if (!currentUser?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      try {
        const payload: ValidateDocumentDto = { documentId: apiDoc.id, validatorId: currentUser.id };
        await documentOperations.validate(payload);
        toast.success(`✅ Documento "${documentName}" aprovado!`);
        await refreshDocuments();
        await refreshCompleteStatus();
      } catch {
        toast.error('Erro ao validar documento');
      }
    },
    [apiDocuments, currentUser?.id, refreshDocuments, refreshCompleteStatus]
  );

  // Reject document (backend REJECTED)
  const handleRejectDocument = useCallback(
    async (documentName: string) => {
      const apiDoc = apiDocuments.find((d) => d.documentType === documentName);
      if (!apiDoc) {
        toast.error('Documento não encontrado');
        return;
      }
      if (!currentUser?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      const rejectedReason = window.prompt(
        `Informe o motivo para invalidar o documento "${documentName}":`,
        'Documento inválido. Reenviar com melhor qualidade ou documento correto.'
      );

      if (rejectedReason === null) {
        toast.info('Invalidar documento cancelado.');
        return;
      }

      const normalizedReason = rejectedReason.trim();
      if (normalizedReason.length < 5) {
        toast.error('Informe um motivo com pelo menos 5 caracteres.');
        return;
      }

      const confirmed = window.confirm(`Confirmar invalidação do documento "${documentName}"?`);
      if (!confirmed) {
        toast.info('Invalidar documento cancelado.');
        return;
      }

      try {
        const payload: RejectDocumentDto = {
          documentId: apiDoc.id,
          validatorId: currentUser.id,
          rejectedReason: normalizedReason,
        };
        await documentOperations.reject(payload);
        toast.warning(`Documento "${documentName}" invalidado.`);
        await refreshDocuments();
        await refreshCompleteStatus();
      } catch {
        toast.error('Erro ao invalidar documento');
      }
    },
    [apiDocuments, currentUser?.id, refreshDocuments, refreshCompleteStatus]
  );

  // Download document
  const handleDownloadDocument = useCallback(
    (documentName: string) => {
      const apiDoc = apiDocuments.find((d) => d.documentType === documentName);
      if (apiDoc?.fileUrl) {
        // data: URL ou URL externa
        const a = window.document.createElement('a');
        a.href = apiDoc.fileUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      } else {
        toast.error('Arquivo não encontrado');
      }
    },
    [apiDocuments]
  );

  const hasPhoneContact = !!student.phone?.trim();
  const hasEmailContact = !!student.email?.trim();

  // Send notification
  const handleSendNotification = useCallback(async () => {
    const pendingDocs = requiredDocsNormalized.filter((docReq) => {
      const apiDoc = apiDocuments.find((d) => d.documentType === docReq.name);
      return !apiDoc || apiDoc.status === 'PENDING' || apiDoc.status === 'REJECTED';
    });

    if (pendingDocs.length === 0) {
      toast.info('Sem documentos pendentes para este aluno');
      return;
    }

    if (notificationType === 'whatsapp' && !hasPhoneContact) {
      toast.error('Aluno sem telefone cadastrado para WhatsApp');
      return;
    }

    if (notificationType === 'email' && !hasEmailContact) {
      toast.error('Aluno sem email cadastrado');
      return;
    }

    if (notificationType === 'both' && !hasPhoneContact && !hasEmailContact) {
      toast.error('Aluno sem telefone e email cadastrados');
      return;
    }

    const defaultMessage = `Olá ${student.name}!

Identificamos documentos pendentes para o curso "${course.name}".

📄 Documentos Pendentes:
${pendingDocs.map((d) => `• ${d.name}`).join('\n')}

Por favor, acesse seu link de matrícula e envie os documentos faltantes.

Atenciosamente,
Equipe SMCORP`;

    setIsSendingNotification(true);

    try {
      const apiDoc = apiDocuments.find((d) => d.documentType === pendingDocs[0].name) || apiDocuments[0];
      if (!apiDoc) {
        toast.error('Nenhum documento base encontrado para registrar notificação');
        return;
      }

      const response = (await documentOperations.notifyPending(apiDoc.id, {
        notificationType,
        customMessage: customMessage.trim() || defaultMessage,
      })) as SendPendingDocumentsNotificationResponse;

      const finalMessage = response.previewMessage;
      const delivery = (response as { delivery?: Record<string, { attempted?: boolean; sent?: boolean; provider?: string; reason?: string }> }).delivery || {};
      const sentChannels: string[] = [];

      // Envio REAL via API (Uniq Suporte / SMTP)
      if (response.channels.whatsapp.requested) {
        const d = delivery.whatsapp;
        if (d?.sent) {
          sentChannels.push('WhatsApp');
        } else if (response.channels.whatsapp.available && response.channels.whatsapp.target) {
          // Fallback manual: abre wa.me com a mensagem pronta
          const phoneDigits = response.channels.whatsapp.target.replace(/\D/g, '');
          const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(finalMessage)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          sentChannels.push('WhatsApp (manual)');
        } else {
          toast.error('Aluno sem telefone cadastrado para WhatsApp');
        }
      }

      if (response.channels.email.requested) {
        const d = delivery.email;
        if (d?.sent) {
          sentChannels.push('E-mail');
        } else if (response.channels.email.available && response.channels.email.target) {
          // Fallback manual: abre cliente de e-mail
          const url = `mailto:${encodeURIComponent(response.channels.email.target)}?subject=${encodeURIComponent(response.subject)}&body=${encodeURIComponent(finalMessage)}`;
          window.location.href = url;
          sentChannels.push('E-mail (manual)');
        } else {
          toast.error('Aluno sem email cadastrado');
        }
      }

      if (sentChannels.length > 0) {
        toast.success(`Notificação enviada via ${sentChannels.join(' e ')}`);
      } else {
        toast.success('Notificação processada');
      }
      setIsNotificationDialogOpen(false);
      setCustomMessage('');
    } catch (error) {
      console.error('Falha ao notificar documentos pendentes:', error);
      const message =
        error instanceof Error && error.message ? error.message : 'Erro ao enviar notificação';
      toast.error(`Erro ao enviar notificação: ${message}`);
    } finally {
      setIsSendingNotification(false);
    }
  }, [
    student,
    course.name,
    requiredDocsNormalized,
    apiDocuments,
    customMessage,
    notificationType,
    hasPhoneContact,
    hasEmailContact,
  ]);

  // Photo handlers
  const handleOpenPhotoEditor = useCallback(() => {
    if (student.photoUrl) {
      setPhotoToEdit(student.photoUrl);
      setIsPhotoEditorOpen(true);
    } else {
      photoInputRef.current?.click();
    }
  }, [student.photoUrl]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('A imagem deve ter menos de 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoToEdit(reader.result as string);
      setIsPhotoEditorOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSavePhoto = useCallback(
    (photoBase64: string) => {
      // Persistir no backend: converte base64 em File e usa uploadPhoto
      try {
        const [meta, data] = photoBase64.split(',');
        const mime = meta?.match(/data:(.*);base64/)?.[1] || 'image/png';
        const bytes = atob(data);
        const array = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        const file = new File([blob], `photo.${mime.split('/')[1] || 'png'}`, { type: mime });

        studentsService
          .uploadPhoto(student.id, file)
          .then((url) => {
            onUpdateStudent(student.id, { photoUrl: url });
            toast.success('✅ Foto salva com sucesso!');
          })
          .catch(() => {
            toast.error('Erro ao salvar foto');
          })
          .finally(() => {
            setIsPhotoEditorOpen(false);
            setPhotoToEdit(null);
          });
      } catch {
        toast.error('Erro ao processar imagem');
      }
    },
    [student.id, onUpdateStudent]
  );

  // Pending docs for notification preview
  const pendingDocsForNotification = requiredDocuments.filter((docReq) => {
    const apiDoc = apiDocuments.find((d) => d.documentType === docReq.name);
    return !apiDoc || apiDoc.status === 'PENDING' || apiDoc.status === 'REJECTED';
  });

  const canSendCurrentChannel =
    notificationType === 'whatsapp'
      ? hasPhoneContact
      : notificationType === 'email'
        ? hasEmailContact
        : hasPhoneContact || hasEmailContact;

  return (
    <div className={cn('max-h-[80vh] overflow-y-auto space-y-6 pr-2', className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 space-y-3 border-b bg-background pb-4">
        <div>
          <h3 className="text-2xl font-bold">Validação de Documentos</h3>
          <p className="text-sm text-muted-foreground">
            {student.name} - {student.code}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            onClick={() => setIsNotificationDialogOpen(true)}
            className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Notificar Aluno
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Documents Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalDocuments}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{approvedDocuments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-red-600">{pendingDocuments}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Form Data */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Formulário Preenchido pelo Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome Completo</Label>
              <p className="font-semibold">{student.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CPF</Label>
              <p className="font-semibold">{student.taxId || '-'}</p>
            </div>
            {student.rg && (
              <div>
                <Label className="text-xs text-muted-foreground">RG</Label>
                <p className="font-semibold">{student.rg}</p>
              </div>
            )}
            {student.birthDate && (
              <div>
                <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                <p className="font-semibold">{formatLocalDate(student.birthDate)}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <p className="font-semibold">{student.phone || '-'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-semibold">{student.email || '-'}</p>
            </div>
            {student.address && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Endereço</Label>
                <p className="font-semibold">{student.address}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Curso</Label>
              <p className="font-semibold">{course.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Turma</Label>
              <p className="font-semibold">{classData.code}</p>
            </div>
            {roomName && (
              <div>
                <Label className="text-xs text-muted-foreground">Sala</Label>
                <p className="font-semibold">{roomName}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Data de Início</Label>
              <p className="font-semibold">
                {formatLocalDate(student.studentStartDate || classData.startDate)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data de Término</Label>
              <p className="font-semibold">
                {formatLocalDate(student.studentEndDate || classData.endDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Photo */}
      <Card
        className={cn(
          'border-2',
          student.photoUrl
            ? 'border-green-200 dark:border-green-800'
            : 'border-red-200 dark:border-red-800'
        )}
      >
        <CardHeader
          className={cn(
            student.photoUrl
              ? 'bg-green-50 dark:bg-green-950/30'
              : 'bg-red-50 dark:bg-red-950/30'
          )}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto do Aluno
            </span>
            <div className="flex items-center gap-2">
              {student.photoUrl ? (
                <Badge className="bg-green-600">Enviada</Badge>
              ) : (
                <>
                  <Badge variant="destructive">Pendente</Badge>
                  <span className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                    Enviar em nome do aluno
                  </span>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {student.photoUrl ? (
            <div className="flex justify-center">
              <Image
                src={student.photoUrl}
                alt={student.name}
                width={128}
                height={128}
                unoptimized
                className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
              />
            </div>
          ) : (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <p className="font-semibold text-lg">O aluno ainda não enviou a foto</p>
                <p className="text-sm mt-2">
                  Você pode enviar a foto em nome do aluno clicando abaixo.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <Button
              onClick={handleOpenPhotoEditor}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {student.photoUrl ? 'Editar Foto (Admin)' : 'Enviar Foto (Admin)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Obrigatórios do Curso
            </span>
            <div className="text-sm font-normal text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded">
              Você pode preencher e enviar documentos em nome do aluno
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {requiredDocsNormalized.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento obrigatório cadastrado para este curso
            </div>
          ) : (
            <div className="space-y-4">
              {requiredDocsNormalized.map((requiredDoc, index) => {
                const uiDoc = toUiDocumentData(requiredDoc.name);

                return (
                  <AdministrativeDocument
                    key={index}
                    documentName={requiredDoc.name}
                    documentType={requiredDoc.requiresUpload ? 'upload' : 'text'}
                    studentDocument={
                      uiDoc
                    }
                    onSaveText={
                      !requiredDoc.requiresUpload
                        ? async ({ textValue }) => {
                            const textBlob = new Blob([textValue], { type: 'text/plain' });
                            const textFile = new File(
                              [textBlob],
                              `${requiredDoc.name.replace(/[^a-zA-Z0-9-_]/g, '_') || 'documento'}.txt`,
                              { type: 'text/plain' },
                            );

                            await studentsService.uploadDocument(student.id, requiredDoc.name, textFile);
                            await refreshDocuments();
                            await refreshCompleteStatus();
                          }
                        : undefined
                    }
                    onUploadFile={
                      requiredDoc.requiresUpload
                        ? async ({ file }) => {
                            await studentsService.uploadDocument(student.id, requiredDoc.name, file);
                            await refreshDocuments();
                            await refreshCompleteStatus();
                          }
                        : undefined
                    }
                    onApprove={() => handleApproveDocument(requiredDoc.name)}
                    onReject={() => handleRejectDocument(requiredDoc.name)}
                    onDownload={() => handleDownloadDocument(requiredDoc.name)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {loadingDocuments && (
        <div className="text-center text-sm text-muted-foreground">
          Carregando documentos...
        </div>
      )}

      {/* Notification Dialog */}
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-red-600" />
              Notificar Aluno Sobre Documentos Pendentes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
            {/* Student Info */}
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <strong>Aluno:</strong> {student.name}
                  </div>
                  <div>
                    <strong>Telefone:</strong> {student.phone || 'Não informado'}
                  </div>
                  <div className="col-span-2">
                    <strong>Email:</strong> {student.email || 'Não informado'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Type */}
            <div>
              <Label>Canal</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  variant={notificationType === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setNotificationType('whatsapp')}
                  disabled={!hasPhoneContact}
                  className={cn(
                    'w-full',
                    notificationType === 'whatsapp' && 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant={notificationType === 'email' ? 'default' : 'outline'}
                  onClick={() => setNotificationType('email')}
                  disabled={!hasEmailContact}
                  className={cn(
                    'w-full',
                    notificationType === 'email' && 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={notificationType === 'both' ? 'default' : 'outline'}
                  onClick={() => setNotificationType('both')}
                  disabled={!hasPhoneContact && !hasEmailContact}
                  className={cn(
                    'w-full',
                    notificationType === 'both' && 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Ambos
                </Button>
              </div>
              {!canSendCurrentChannel && (
                <p className="mt-2 text-xs text-red-600">
                  Este aluno não possui contato disponível para o canal selecionado.
                </p>
              )}
            </div>

            {/* Custom Message */}
            <div>
              <Label>Mensagem (opcional - deixe em branco para padrão)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Digite uma mensagem personalizada..."
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Preview */}
            {!customMessage.trim() && (
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Pré-visualização da mensagem padrão:</strong>
                  </p>
                  <div className="text-sm whitespace-pre-line">
                    Olá {student.name}!{'\n\n'}
                    Identificamos documentos pendentes para o curso &quot;{course.name}&quot;.{"\n\n"}
                    Documentos pendentes:
                    {pendingDocsForNotification.map((d) => `\n• ${d.name}`)}
                    {'\n\n'}
                    Por favor, acesse seu link de matrícula e envie os documentos faltantes.
                    {'\n\n'}
                    Atenciosamente,{'\n'}
                    Equipe SMCORP
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="px-6 py-3 border-t flex-shrink-0 bg-white flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={() => setIsNotificationDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isSendingNotification || !canSendCurrentChannel}
              className="bg-red-600 hover:bg-red-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {isSendingNotification ? 'Enviando...' : 'Enviar Notificação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Editor Dialog */}
      <Dialog open={isPhotoEditorOpen} onOpenChange={setIsPhotoEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-blue-600" />
              Editar Foto do Aluno
            </DialogTitle>
          </DialogHeader>

          {photoToEdit && (
            <div className="space-y-4">
              <PhotoEditor
                originalImage={photoToEdit}
                onSave={handleSavePhoto}
                onCancel={() => setIsPhotoEditorOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default StudentDocumentsDetail;
