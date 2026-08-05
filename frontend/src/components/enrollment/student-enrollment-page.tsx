'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  FileText,
  CreditCard,
  ClipboardList,
  Phone,
  Mail,
  Building2,
  Upload,
  Trash2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useStudentsStore } from '@/stores/students.store';
import { useClassesStore } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { studentsService } from '@/services/students.service';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { roomsService } from '@/services/rooms.service';
import { enrollmentOperations } from '@/services/operations.service';
import type { LinkStatus } from '@/stores/students.store';
import type { Student, StudentDocument } from '@/stores/students.store';

// ============================================
// CONSTANTS
// ============================================

const LINK_STATUS_FLOW: LinkStatus[] = ['Scheduled', 'ToConfirm', 'Confirmed', 'Present'];

const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  Scheduled: 'Agendado',
  ToConfirm: 'Confirmar',
  Confirmed: 'Confirmado',
  Present: 'Presente',
};

const LINK_STATUS_COLORS: Record<LinkStatus, string> = {
  Scheduled: 'bg-red-50 text-red-700 border-red-200',
  ToConfirm: 'bg-red-100 text-red-700 border-red-300',
  Confirmed: 'bg-red-100 text-red-800 border-red-300',
  Present: 'bg-red-200 text-red-900 border-red-400',
};

const MAX_PHOTO_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ============================================
// HELPERS
// ============================================

function calculateProgress(student: {
  linkStatus?: LinkStatus;
  documentsComplete?: boolean;
  paymentComplete?: boolean;
}): number {
  let progress = 0;
  if (student.linkStatus === 'Confirmed' || student.linkStatus === 'Present') progress += 33;
  if (student.documentsComplete) progress += 33;
  if (student.paymentComplete) progress += 34;
  return progress;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

interface StudentEnrollmentPageProps {
  enrollmentCode: string;
  token?: string | null;
}

function isLikelyEnrollmentToken(value: string): boolean {
  const trimmed = (value || '').trim();
  return /^[a-f0-9]{64}$/i.test(trimmed);
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

type PublicContext = {
  student: Student;
  classInfo: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    roomId?: string | null;
    schedule?: string;
  };
  courseInfo: {
    id: string;
    name: string;
    requiredDocuments?: string[];
  };
  roomInfo?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
};

export function StudentEnrollmentPage({ enrollmentCode, token }: StudentEnrollmentPageProps) {
  const { students, setStudents, updateStudent } = useStudentsStore();
  const { classes, setClasses } = useClassesStore();
  const { courses, setCourses } = useCoursesStore();
  const { rooms, institutionalData, whatsappConfig } = useSettingsStore();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const openWhatsAppToInstitution = useCallback(
    (message: string) => {
      const rawNumber =
        whatsappConfig?.number ||
        institutionalData?.phone ||
        process.env.NEXT_PUBLIC_INSTITUTION_WHATSAPP_NUMBER ||
        process.env.NEXT_PUBLIC_INSTITUTION_PHONE;
      let phoneDigits = (rawNumber || '').replace(/\D/g, '');

      // Normalização BR: se veio sem DDI (10/11 dígitos), prefixar 55.
      if (phoneDigits && !phoneDigits.startsWith('55') && (phoneDigits.length === 10 || phoneDigits.length === 11)) {
        phoneDigits = `55${phoneDigits}`;
      }

      if (!phoneDigits) {
        toast.error('WhatsApp da instituição não configurado');
        return;
      }

      const encoded = encodeURIComponent(message);
      const url = `https://wa.me/${phoneDigits}?text=${encoded}`;

      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (!popup) {
        window.location.href = url;
      }
    },
    [whatsappConfig?.number, institutionalData?.phone]
  );

  const [isResolving, setIsResolving] = useState(() => {
    const fromQuery = (token || '').trim();
    if (fromQuery) return true;
    const decoded = decodeURIComponent(enrollmentCode || '');
    return isLikelyEnrollmentToken(decoded);
  });
  const [publicContext, setPublicContext] = useState<PublicContext | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [publicRefreshKey, setPublicRefreshKey] = useState(0);
  const [publicDocumentType, setPublicDocumentType] = useState('');
  const [publicDocumentFile, setPublicDocumentFile] = useState<File | null>(null);
  const [isUploadingPublicDocument, setIsUploadingPublicDocument] = useState(false);
  const [isRemovingPublicDocumentId, setIsRemovingPublicDocumentId] = useState<string | null>(null);

  const tokenToValidate = useMemo(() => {
    const fromQuery = (token || '').trim();
    if (fromQuery) return fromQuery;
    const decoded = decodeURIComponent(enrollmentCode || '');
    return isLikelyEnrollmentToken(decoded) ? decoded : '';
  }, [token, enrollmentCode]);

  const isPublic = Boolean(tokenToValidate);

  // Parse enrollment code: "CODE-ID" format
  const { linkCode, linkId } = useMemo(() => {
    const parts = (enrollmentCode || '').split('-').filter(Boolean);
    return {
      linkCode: parts[0] || '',
      linkId: parts.length > 1 ? parts.slice(1).join('-') : '',
    };
  }, [enrollmentCode]);

  const storeStudent = useMemo(() => {
    if (!enrollmentCode) return null;
    return students.find((s) => s.code === linkCode || (linkId ? s.id === linkId : false)) ?? null;
  }, [enrollmentCode, students, linkCode, linkId]);

  const student = useMemo(() => {
    if (isPublic) return publicContext?.student ?? null;
    return storeStudent;
  }, [isPublic, publicContext, storeStudent]);

  // Resolve via token (modo 100% público)
  useEffect(() => {
    let cancelled = false;

    const resolveByToken = async () => {
      if (!isPublic) return;
      if (!tokenToValidate) return;

      setPublicError(null);
      setIsResolving(true);
      try {
        const enrollment = await enrollmentOperations.validateToken({ token: tokenToValidate });
        if (cancelled) return;

        const apiStudent = enrollment?.student;
        const apiClass = enrollment?.class;
        const apiCourse = apiClass?.course;

        if (!apiStudent || !apiClass || !apiCourse) {
          setPublicError('Dados de matrícula incompletos');
          setPublicContext(null);
          return;
        }

        const apiRequiredDocsRaw = apiCourse?.requiredDocuments;
        const requiredDocuments: string[] = Array.isArray(apiRequiredDocsRaw)
          ? apiRequiredDocsRaw
              .map((d: any) => {
                if (typeof d === 'string') {
                  return d.trim();
                }

                if (d && typeof d === 'object' && typeof d.name === 'string') {
                  return d.name.trim();
                }

                return '';
              })
              .filter(Boolean)
          : [];

        const docs: StudentDocument[] = Array.isArray(apiStudent.documents)
          ? apiStudent.documents.map((doc: any) => ({
              id: doc.id,
              name: doc.documentType,
              type: 'upload',
              fileUrl: doc.fileUrl,
              submittedAt: doc.uploadedAt,
              status:
                doc.status === 'COMPLETE'
                  ? 'Approved'
                  : doc.status === 'REJECTED'
                  ? 'Rejected'
                  : 'Pending',
              rejectionReason: doc.rejectedReason ?? undefined,
            }))
          : [];

        const enrollmentStatus: LinkStatus =
          enrollment.status === 'CONFIRMED'
            ? 'Confirmed'
            : enrollment.status === 'PRESENT'
            ? 'Present'
            : enrollment.status === 'TO_CONFIRM'
            ? 'ToConfirm'
            : 'Scheduled';

        const basePrice = asNumber(apiCourse.price);
        const customPrice = asNumber(apiClass.customPrice);
        const isCompany = Boolean(apiStudent.companyId);
        const totalValue = isCompany && customPrice > 0 ? customPrice : basePrice;

        const paymentComplete = enrollment.payment?.status === 'PAID';
        const documentsComplete = enrollment.documentsStatus === 'COMPLETE';

        const className = apiClass.displayName || apiClass.code;
        const schedule = apiClass.startTime && apiClass.endTime ? `${apiClass.startTime} — ${apiClass.endTime}` : undefined;

        const ctx: PublicContext = {
          student: {
            id: apiStudent.id,
            code: apiStudent.code,
            name: apiStudent.name,
            email: apiStudent.email ?? undefined,
            phone: apiStudent.phone ?? undefined,
            taxId: apiStudent.cpf ?? undefined,
            birthDate: apiStudent.birthDate ?? undefined,
            address: apiStudent.address ?? undefined,
            photoUrl: apiStudent.photoUrl ?? undefined,
            status: apiStudent.isActive ? 'Active' : 'Inactive',
            linkStatus: enrollmentStatus,
            classId: apiClass.id,
            enrollmentId: enrollment.id,
            companyId: apiStudent.companyId ?? undefined,
            personType: isCompany ? 'company' : 'individual',
            totalValue,
            discount: asNumber(enrollment.discount),
            documentsComplete,
            documents: docs,
            paymentComplete,
            createdAt: apiStudent.createdAt,
            updatedAt: apiStudent.updatedAt,
          },
          classInfo: {
            id: apiClass.id,
            name: className,
            startDate: apiClass.startDate,
            endDate: apiClass.endDate,
            roomId: apiClass.roomId,
            schedule,
          },
          courseInfo: {
            id: apiCourse.id,
            name: apiCourse.name,
            requiredDocuments,
          },
          roomInfo: apiClass.room
            ? {
                id: apiClass.room.id,
                name: apiClass.room.name,
                address: apiClass.room.address ?? apiClass.room.location ?? null,
              }
            : null,
        };

        setPublicContext(ctx);
      } catch (error) {
        console.error('Erro ao validar token de matrícula:', error);
        setPublicError('Token inválido ou expirado');
        setPublicContext(null);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolveByToken();
    return () => {
      cancelled = true;
    };
  }, [isPublic, tokenToValidate, publicRefreshKey]);

  // Resolve link quando abrir direto (store vazio): tenta buscar aluno/turma/curso via API.
  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (isPublic) return;
      if (student) return;
      if (!linkCode) return;

      setIsResolving(true);
      try {
        const fetchedStudent = await studentsService.getByCode(linkCode);
        if (cancelled) return;

        const nextStudents = [...students.filter((s) => s.id !== fetchedStudent.id), fetchedStudent];
        setStudents(nextStudents);

        const classId = fetchedStudent.classId;
        if (classId && !classes.some((c) => c.id === classId)) {
          const fetchedClass = await classesService.getById(classId);
          if (cancelled) return;
          setClasses([...classes.filter((c) => c.id !== fetchedClass.id), fetchedClass]);

          const courseId = fetchedClass.courseId;
          if (courseId && !courses.some((c) => c.id === courseId)) {
            const fetchedCourse = await coursesService.getById(courseId);
            if (cancelled) return;
            setCourses([...courses.filter((c) => c.id !== fetchedCourse.id), fetchedCourse]);
          }

          const roomId = fetchedClass.roomId;
          if (roomId && !rooms.some((r) => r.id === roomId)) {
            // rooms ficam no settings store; não temos setter aqui, então só busca quando já estiverem carregadas.
            // Ainda assim, tentar o fetch evita quebra e preenche contato quando o settings store suportar.
            await roomsService.getById(roomId).catch(() => undefined);
          }
        }
      } catch (error) {
        // Se o usuário não estiver autenticado, a API pode retornar 401. Nesse caso o link depende de login.
        console.error('Erro ao resolver link de matrícula:', error);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [isPublic, student, linkCode, students, setStudents, classes, setClasses, courses, setCourses, rooms]);

  const studentClass = useMemo(() => {
    if (isPublic) return publicContext?.classInfo ?? null;
    return student?.classId ? (classes.find((c) => c.id === student.classId) as any) : null;
  }, [isPublic, publicContext, student, classes]);

  const course = useMemo(() => {
    if (isPublic) return publicContext?.courseInfo ?? null;
    return (studentClass as any)?.courseId ? courses.find((c) => c.id === (studentClass as any).courseId) : null;
  }, [isPublic, publicContext, studentClass, courses]);

  const room = useMemo(() => {
    if (isPublic) return publicContext?.roomInfo ?? null;
    return (studentClass as any)?.roomId ? rooms.find((r) => r.id === (studentClass as any).roomId) : null;
  }, [isPublic, publicContext, studentClass, rooms]);

  const requiredDocuments = useMemo<string[]>(() => {
    if (isPublic) {
      return publicContext?.courseInfo?.requiredDocuments ?? [];
    }

    const rawRequiredDocuments = (course as any)?.requiredDocuments;
    if (!Array.isArray(rawRequiredDocuments)) return [];

    return rawRequiredDocuments
      .map((documentName: unknown) => {
        if (typeof documentName === 'string') {
          return documentName.trim();
        }

        if (
          documentName &&
          typeof documentName === 'object' &&
          'name' in (documentName as Record<string, unknown>)
        ) {
          return String((documentName as { name?: unknown }).name || '').trim();
        }

        return '';
      })
      .filter(Boolean);
  }, [isPublic, publicContext, course]);

  const progress = useMemo(
    () => (student ? calculateProgress(student) : 0),
    [student]
  );

  // Status advancement
  const handleAdvanceStatus = useCallback(() => {
    if (!student || !student.linkStatus) return;
    const currentIndex = LINK_STATUS_FLOW.indexOf(student.linkStatus);
    if (currentIndex < LINK_STATUS_FLOW.length - 1) {
      const nextStatus = LINK_STATUS_FLOW[currentIndex + 1];
      updateStudent(student.id, { linkStatus: nextStatus });
      toast.success(`Status atualizado para: ${LINK_STATUS_LABELS[nextStatus]}`);
    }
  }, [student, updateStudent]);

  // Photo upload
  const handlePhotoUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !student) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Formato inválido. Use JPG, PNG ou WebP.');
        return;
      }

      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo ${MAX_PHOTO_SIZE_MB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotoPreview(dataUrl);
        updateStudent(student.id, { photoUrl: dataUrl });
        toast.success('Foto atualizada com sucesso!');
      };
      reader.readAsDataURL(file);
    },
    [student, updateStudent]
  );

  const handleSendDocumentsViaWhatsApp = useCallback(() => {
    if (!student) return;

    const link = typeof window !== 'undefined' ? window.location.href : '';
    const defaultMessage = `Olá!\n\nSou ${student.name} (código: ${student.code}).\nGostaria de enviar meus documentos para concluir a matrícula.${link ? `\n\nLink: ${link}` : ''}\n\nObrigado!`;
    openWhatsAppToInstitution(defaultMessage);
  }, [student, openWhatsAppToInstitution]);

  const handleRequestPaymentConfirmationViaWhatsApp = useCallback(() => {
    if (!student) return;

    const link = typeof window !== 'undefined' ? window.location.href : '';
    const defaultMessage = `Olá!\n\nSou ${student.name} (código: ${student.code}).\nGostaria de confirmar o status do pagamento da matrícula.${link ? `\n\nLink: ${link}` : ''}\n\nObrigado!`;
    openWhatsAppToInstitution(defaultMessage);
  }, [student, openWhatsAppToInstitution]);

  const handleUploadPublicDocument = useCallback(async () => {
    if (!isPublic || !tokenToValidate || !publicDocumentType || !publicDocumentFile) {
      return;
    }

    setIsUploadingPublicDocument(true);
    try {
      await enrollmentOperations.uploadPublicDocument({
        token: tokenToValidate,
        documentType: publicDocumentType,
        file: publicDocumentFile,
      });

      const optimisticDocument: StudentDocument = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}`,
        name: publicDocumentType,
        type: 'upload',
        fileUrl: URL.createObjectURL(publicDocumentFile),
        submittedAt: new Date().toISOString(),
        status: 'Pending',
      };

      setPublicContext((previousContext) => {
        if (!previousContext) return previousContext;
        return {
          ...previousContext,
          student: {
            ...previousContext.student,
            documents: [...(previousContext.student.documents || []), optimisticDocument],
          },
        };
      });

      setPublicDocumentType('');
      setPublicDocumentFile(null);
      setPublicRefreshKey((currentKey) => currentKey + 1);
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar documento público:', error);
      toast.error('Não foi possível enviar o documento');
    } finally {
      setIsUploadingPublicDocument(false);
    }
  }, [isPublic, tokenToValidate, publicDocumentType, publicDocumentFile]);

  const handleRemovePublicDocument = useCallback(
    async (documentId: string, status?: StudentDocument['status']) => {
      if (!isPublic || !tokenToValidate) return;

      if (status === 'Approved') {
        toast.error('Documento aprovado não pode ser removido');
        return;
      }

      setIsRemovingPublicDocumentId(documentId);
      try {
        await enrollmentOperations.deletePublicDocument({
          token: tokenToValidate,
          documentId,
        });

        setPublicContext((previousContext) => {
          if (!previousContext) return previousContext;
          return {
            ...previousContext,
            student: {
              ...previousContext.student,
              documents: (previousContext.student.documents || []).filter((doc) => doc.id !== documentId),
            },
          };
        });

        setPublicRefreshKey((currentKey) => currentKey + 1);
        toast.success('Documento removido com sucesso');
      } catch (error) {
        console.error('Erro ao remover documento público:', error);
        toast.error('Não foi possível remover o documento');
      } finally {
        setIsRemovingPublicDocumentId(null);
      }
    },
    [isPublic, tokenToValidate],
  );

  // ============================================
  // INVALID LINK
  // ============================================
  if (!student) {
    if (isResolving || (isPublic && !publicError)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Carregando matrícula...</h2>
              <p className="text-sm text-gray-600">Buscando dados do servidor</p>
              <p className="text-xs text-gray-400 font-mono">Código: {enrollmentCode}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Link Inválido</h2>
            <p className="text-sm text-gray-600">
              Não foi possível encontrar a matrícula com o código informado.
              Verifique o link recebido ou entre em contato com a instituição.
            </p>
            {publicError && (
              <p className="text-xs text-red-600">{publicError}</p>
            )}
            <p className="text-xs text-gray-400 font-mono">
              Código: {enrollmentCode}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLinkStatus = student.linkStatus ?? 'Scheduled';
  const currentStatusIndex = LINK_STATUS_FLOW.indexOf(currentLinkStatus);
  const canAdvance = currentStatusIndex < LINK_STATUS_FLOW.length - 1;
  const displayPhoto = photoPreview ?? student.photoUrl;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {institutionalData?.name ?? 'SM Corp'}
            </h1>
            <p className="text-xs text-gray-500">Portal de Matrícula do Aluno</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Student Info + Progress */}
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {!isPublic && (
                  <>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl">{student.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="block text-sm">Código: {student.code}</span>
                  {student.taxId && (
                    <span className="block text-xs text-gray-400">CPF: {student.taxId}</span>
                  )}
                </CardDescription>
              </div>

              <Badge
                variant="outline"
                className={LINK_STATUS_COLORS[currentLinkStatus]}
              >
                {LINK_STATUS_LABELS[currentLinkStatus]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progresso da Matrícula</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <span className="rounded-md border bg-white px-2 py-1 text-gray-600">
                  Status: {currentLinkStatus === 'Confirmed' || currentLinkStatus === 'Present' ? '✅' : '⏳'}
                </span>
                <span className="rounded-md border bg-white px-2 py-1 text-gray-600">
                  Documentos: {student.documentsComplete ? '✅' : '⏳'}
                </span>
                <span className="rounded-md border bg-white px-2 py-1 text-gray-600">
                  Pagamento: {student.paymentComplete ? '✅' : '⏳'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Info */}
        {course && (
          <Card className="shadow-sm border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="w-5 h-5 text-red-600" />
                Informações do Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Curso</p>
                  <p className="font-medium">{course.name}</p>
                </div>
                {studentClass && (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Turma</p>
                      <p className="font-medium">{studentClass.name}</p>
                    </div>
                    <div className="space-y-1 flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Período</p>
                        <p className="font-medium">
                          {formatDate(studentClass.startDate)} — {formatDate(studentClass.endDate)}
                        </p>
                      </div>
                    </div>
                    {room && (
                      <div className="space-y-1 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Local</p>
                          <p className="font-medium">{room.name}</p>
                          {room.address && (
                            <p className="text-xs text-gray-400">{room.address}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {studentClass.schedule && (
                      <div className="space-y-1 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Horário</p>
                          <p className="font-medium">{studentClass.schedule}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Advancement */}
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-red-600" />
              Status da Matrícula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Flow */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {LINK_STATUS_FLOW.map((status, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = status === currentLinkStatus;

                return (
                  <React.Fragment key={status}>
                    {index > 0 && (
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-green-500' : 'text-gray-300'
                        }`}
                      />
                    )}
                    <Badge
                      variant="outline"
                      className={`shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-red-100 text-red-800 border-red-400 ring-2 ring-red-200'
                          : isActive
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      {isActive && index < currentStatusIndex && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {LINK_STATUS_LABELS[status]}
                    </Badge>
                  </React.Fragment>
                );
              })}
            </div>

            {canAdvance && !isPublic && (
              <Button
                onClick={handleAdvanceStatus}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Avançar para: {LINK_STATUS_LABELS[LINK_STATUS_FLOW[currentStatusIndex + 1]]}
              </Button>
            )}

            {!canAdvance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Presença confirmada!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Upload */}
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-red-600" />
              Documentos
            </CardTitle>
            <CardDescription>Envie os documentos necessários para a matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPublic && (
              <div className="space-y-3 rounded-lg border border-red-100 p-4 bg-red-50/40">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  {requiredDocuments.length > 0 ? (
                    <Select value={publicDocumentType} onValueChange={setPublicDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {requiredDocuments.map((doc) => (
                          <SelectItem key={doc} value={doc}>
                            {doc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={publicDocumentType}
                      onChange={(e) => setPublicDocumentType(e.target.value)}
                      placeholder="Ex: RG, CPF, ASO"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <Input
                    type="file"
                    className="h-10 bg-white"
                    onChange={(e) => setPublicDocumentFile(e.target.files?.[0] ?? null)}
                  />
                  {publicDocumentFile && (
                    <p className="text-xs text-gray-600">Selecionado: {publicDocumentFile.name}</p>
                  )}
                  <p className="text-xs text-gray-500">Tamanho máximo: 10MB</p>
                </div>

                <Button
                  onClick={handleUploadPublicDocument}
                  disabled={isUploadingPublicDocument || !publicDocumentType || !publicDocumentFile}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploadingPublicDocument ? 'Enviando...' : 'Enviar Documento'}
                </Button>
              </div>
            )}

            {student.documents && student.documents.length > 0 ? (
              student.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border ${
                    doc.status === 'Approved'
                      ? 'bg-green-50 border-green-200'
                      : doc.status === 'Rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        Enviado em: {formatDate(doc.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge
                      variant="outline"
                      className={
                        doc.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {doc.status === 'Approved'
                        ? 'Aprovado'
                        : doc.status === 'Rejected'
                        ? 'Rejeitado'
                        : 'Pendente'}
                    </Badge>
                    {isPublic && doc.status !== 'Approved' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        disabled={isRemovingPublicDocumentId === doc.id}
                        onClick={() => void handleRemovePublicDocument(doc.id, doc.status)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {isRemovingPublicDocumentId === doc.id ? 'Removendo...' : 'Remover'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum documento enviado ainda</p>
              </div>
            )}

            <Button
              type="button"
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleSendDocumentsViaWhatsApp}
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documentos via WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-red-600" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-red-100">
              <div className="space-y-1">
                <p className="text-sm font-medium">Valor da Matrícula</p>
                <p className="text-xs text-gray-500">
                  {student.personType === 'company' ? 'Faturado via empresa' : 'Pagamento individual'}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                R$ {(student.totalValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {student.discount && student.discount > 0 && (
              <div className="flex items-center justify-between text-sm px-3">
                <span className="text-gray-500">Desconto aplicado</span>
                <span className="text-green-600 font-medium">
                  -R$ {student.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {student.paymentComplete ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Pagamento confirmado!</p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleRequestPaymentConfirmationViaWhatsApp}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Solicitar confirmação via WhatsApp
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Exam Info */}
        {student.examStatus?.active && (
          <Card className="shadow-sm border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-5 h-5 text-red-600" />
                Prova
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {student.examStatus.examName && (
                  <div>
                    <p className="text-xs text-gray-500">Prova</p>
                    <p className="font-medium">{student.examStatus.examName}</p>
                  </div>
                )}
                {student.examStatus.examNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Número</p>
                    <p className="font-medium">{student.examStatus.examNumber}</p>
                  </div>
                )}
                {student.examStatus.date && (
                  <div>
                    <p className="text-xs text-gray-500">Data</p>
                    <p className="font-medium">{formatDate(student.examStatus.date)}</p>
                  </div>
                )}
                {student.examStatus.time && (
                  <div>
                    <p className="text-xs text-gray-500">Horário</p>
                    <p className="font-medium">{student.examStatus.time}</p>
                  </div>
                )}
                {student.examStatus.result && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Resultado</p>
                    <Badge
                      variant="outline"
                      className={
                        student.examStatus.result === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : student.examStatus.result === 'Failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {student.examStatus.result === 'Approved'
                        ? 'Aprovado'
                        : student.examStatus.result === 'Failed'
                        ? 'Reprovado'
                        : student.examStatus.result === 'NoShow'
                        ? 'Não Compareceu'
                        : 'Pendente'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-red-600" />
              Contato da Instituição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {institutionalData?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{institutionalData.phone}</span>
                </div>
              )}
              {institutionalData?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{institutionalData.email}</span>
                </div>
              )}
              {institutionalData?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>
                    {institutionalData.address}
                    {institutionalData.city && `, ${institutionalData.city}`}
                    {institutionalData.state && ` - ${institutionalData.state}`}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-gray-400">
          <p>Portal SM Corp © {new Date().getFullYear()}</p>
          <p className="mt-1">
            Código do aluno: <span className="font-mono">{student.code}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
