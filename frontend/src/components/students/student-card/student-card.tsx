'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Link2,
  Edit,
  Trash2,
  AlertCircle,
  User,
  UserX,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import type { StudentCardProps, ExamScheduleData, EditStudentFormData } from './types';
import type { ExtraProduct } from '@/types';
import {
  checkDocumentsComplete,
  calculateEnrollmentProgress,
  copyToClipboard,
  createLocalDate,
  buildEnrollmentLink,
} from './utils';
import { AttendanceControl } from './attendance-control';
import { LinkStatusControl } from './link-status-control';
import { PaymentButton } from './payment-button';
import { ExamDialog } from './exam-dialog';
import { WhatsAppDialog } from './whatsapp-dialog';
import { EditStudentDialog } from './edit-student-dialog';
import { PaymentDialog, type PaymentMethod } from '@/components/dialogs';
import { StudentDocumentsDialog } from '@/components/dialogs';
import { paymentsService, type PaymentMethod as ApiPaymentMethod } from '@/services/payments.service';

/**
 * StudentCard - Main student card component
 * 
 * Displays student information with collapsible details,
 * progress tracking, status controls, and action dialogs.
 * 
 * @see CODING_STANDARDS.md for naming conventions
 */
export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  classData,
  course,
  compact = false,
  highlighted = false,
  disabled = false,
  showWaitingPosition = false,
  currentDate,
  onUpdateStudent,
  onDeleteStudent,
  onMarkDayAttendance,
  onReplaceStudent,
  onTransferStudent,
  instructors = [],
  extraProducts = [],
  users = [],
  students = [],
  companies = [],
  currentUser,
  emailConfig = { enabled: true },
  whatsappConfig = { enabled: true },
}) => {
  // Expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Attendance confirmation dialog
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit student dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditStudentFormData>({
    name: student.name,
    taxId: student.taxId || '',
    phone: student.phone || '',
    email: student.email || '',
    discount: student.discount || 0,
    photo: student.photoUrl || '',
    extraProducts: [],
  });

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Exam dialog states
  const [examEditDialogOpen, setExamEditDialogOpen] = useState(false);
  const [examCancelDialogOpen, setExamCancelDialogOpen] = useState(false);
  const [examData, setExamData] = useState<ExamScheduleData>({
    examName: '',
    instructorId: '',
    date: '',
    time: '',
  });
  const [editExamData, setEditExamData] = useState<ExamScheduleData>({
    examName: student.examStatus?.examName || '',
    instructorId: student.examStatus?.instructorId || '',
    date: student.examStatus?.date || '',
    time: student.examStatus?.time || '',
  });

  // Calculate progress
  const documentsComplete = checkDocumentsComplete(student);
  const progress = calculateEnrollmentProgress(student, documentsComplete);

  // Resolve product names from IDs
  const getProductNames = (productIds: string[] = []): string => {
    return productIds
      .map((id) => extraProducts.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(' • ');
  };

  // Enrollment link
  const enrollmentLink = buildEnrollmentLink(student);

  const handleCopyEnrollmentLink = async () => {
    try {
      await copyToClipboard(enrollmentLink);
      toast.success('✅ Link copiado!');
    } catch {
      toast.error('Erro ao copiar o link.');
    }
  };

  const handleOpenEnrollmentLink = () => {
    window.open(enrollmentLink, '_blank');
  };

  const toDialogPaymentMethod = (method: string | undefined): PaymentMethod => {
    const normalized = (method || '').trim().toLowerCase();
    if (normalized === 'pix') return 'PIX';
    if (normalized === 'dinheiro' || normalized === 'cash') return 'Cash';
    if (normalized.includes('crédito') || normalized.includes('credito') || normalized === 'creditcard') {
      return 'CreditCard';
    }
    if (normalized.includes('débito') || normalized.includes('debito') || normalized === 'debitcard') {
      return 'DebitCard';
    }
    if (normalized.includes('transfer')) return 'BankTransfer';
    if (normalized.includes('cheque')) return 'Check';
    if (normalized.includes('boleto') || normalized.includes('invoice')) return 'Invoice';
    return 'PIX';
  };

  const fromDialogPaymentMethod = (method: PaymentMethod): string => {
    switch (method) {
      case 'Cash':
        return 'Dinheiro';
      case 'PIX':
        return 'PIX';
      case 'CreditCard':
        return 'Cartão de Crédito';
      case 'DebitCard':
        return 'Cartão de Débito';
      case 'BankTransfer':
        return 'Transferência Bancária';
      case 'Check':
        return 'Cheque';
      case 'Invoice':
        return 'Boleto';
      default:
        return 'PIX';
    }
  };

  const toApiPaymentMethod = (method: PaymentMethod): ApiPaymentMethod => {
    switch (method) {
      case 'Cash':
        return 'CASH';
      case 'PIX':
        return 'PIX';
      case 'CreditCard':
        return 'CREDIT_CARD';
      case 'DebitCard':
        return 'DEBIT_CARD';
      case 'BankTransfer':
        return 'TRANSFER';
      case 'Invoice':
        return 'BOLETO';
      case 'Check':
      default:
        return 'CASH';
    }
  };

  const allowedPaymentMethods: PaymentMethod[] | undefined = (() => {
    const companyAllowed = student.companyId
      ? companies.find((c) => c.id === student.companyId)?.allowedPaymentMethods
      : undefined;

    if (!companyAllowed || companyAllowed.length === 0) return undefined;

    return companyAllowed.map((m) => toDialogPaymentMethod(m));
  })();

  const dialogStudent = {
    id: student.id,
    code: student.code,
    name: student.name,
    totalAmount: student.totalValue || 0,
    paidAmount: student.payments?.totalPaid || 0,
    payments: (student.payments?.history || []).map((p) => {
      const time = p.time?.length === 5 ? `${p.time}:00` : p.time || '12:00:00';
      const dateTime = p.date ? `${p.date}T${time}` : new Date().toISOString();
      const confirmedTime = p.confirmationTime?.length === 5 ? `${p.confirmationTime}:00` : p.confirmationTime;
      const confirmedAt = p.confirmationDate && confirmedTime ? `${p.confirmationDate}T${confirmedTime}` : undefined;
      return {
        id: p.id,
        amount: p.amount,
        method: toDialogPaymentMethod(p.paymentMethod),
        date: dateTime,
        status: p.confirmedBy ? ('Confirmed' as const) : ('Pending' as const),
        confirmedBy: p.confirmedBy,
        confirmedAt,
        observations: p.notes,
        invoiceCode: p.boletoBarcode,
        invoiceDueDate: p.boletoDueDate,
      };
    }),
  };

  const dialogCurrentUser = {
    id: currentUser?.id || 'unknown',
    name: currentUser?.name || 'Usuário',
    role: currentUser?.role || 'Seller',
  };

  const upsertPayments = (
    history: NonNullable<typeof student.payments>['history']
  ) => {
    const totalPaid = history.reduce((sum, item) => sum + (item.amount || 0), 0);
    const pending = history.some((item) => !item.confirmedBy);
    const paymentComplete = totalPaid >= (student.totalValue || 0) && !pending;

    onUpdateStudent?.(student.id, {
      payments: {
        history,
        totalPaid,
        pending,
      },
      paymentComplete,
    });
  };

  // Get company name if corporate student
  const companyName = student.companyId
    ? companies.find((c) => c.id === student.companyId)?.name
    : null;

  return (
    <div
      id={`student-card-${student.id}`}
      className={`bg-white rounded-lg border transition-all scroll-mt-4 overflow-hidden ${
        highlighted
          ? 'border-red-600 shadow-xl ring-2 ring-red-600 ring-offset-2'
          : 'border-gray-200 hover:shadow-lg'
      }`}
    >
      {/* COMPACT VIEW */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          {/* Photo */}
          <div className="relative shrink-0">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Name and Products */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">
              {student.name}
            </h3>
            {student.extraProductIds && student.extraProductIds.length > 0 && (
              <div className="text-sm text-gray-600 mt-0.5 truncate">
                {getProductNames(student.extraProductIds)}
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Progress and Status Row */}
        <div className="mt-3 mb-3 flex items-center gap-3">
          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 font-medium">Progresso</span>
              <span className="text-[10px] text-gray-600 font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Status Control */}
          <div className="flex-1">
            {compact && currentDate ? (
              <AttendanceControl
                student={student}
                currentDate={currentDate}
                onMarkDayAttendance={onMarkDayAttendance}
                dialogOpen={attendanceDialogOpen}
                setDialogOpen={setAttendanceDialogOpen}
              />
            ) : (
              <LinkStatusControl
                student={student}
                onUpdateStudent={onUpdateStudent}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 w-full">
          <PaymentButton
            student={student}
            onClick={() => setPaymentDialogOpen(true)}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setDocumentsDialogOpen(true);
            }}
            className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${
              documentsComplete
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-red-50 border-red-500 text-red-700'
            }`}
          >
            {documentsComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            DOC
          </Button>

          <ExamDialog
            student={student}
            instructors={instructors}
            currentUser={currentUser}
            onUpdateStudent={onUpdateStudent}
            provaData={examData}
            setProvaData={setExamData}
            editProvaData={editExamData}
            setEditProvaData={setEditExamData}
            dialogOpen={examEditDialogOpen}
            setDialogOpen={setExamEditDialogOpen}
            cancelDialogOpen={examCancelDialogOpen}
            setCancelDialogOpen={setExamCancelDialogOpen}
          />

          <WhatsAppDialog
            student={student}
            classData={classData}
            course={course}
          />
        </div>
      </div>

      {/* EXPANDED VIEW */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3 bg-gray-50">
          {/* Codes and Class */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="default" className="bg-green-600 text-white font-mono text-xs">
                {student.code}
              </Badge>
              {student.examStatus?.active && student.examStatus.examNumber && (
                <Badge variant="default" className="bg-purple-600 text-white font-mono text-xs">
                  {student.examStatus.examNumber}
                </Badge>
              )}
            </div>

            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Turma:</span>
                <span className="font-medium">{classData?.code || '-'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Curso:</span>
                <span className="font-medium">{course?.name || '-'}</span>
              </div>
              {companyName && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Empresa:</span>
                  <span className="font-medium text-blue-700">🏢 {companyName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          {(student.studentStartDate || student.studentEndDate || classData) && (
            <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Início:</span>
                <span className="font-medium">
                  {student.studentStartDate
                    ? createLocalDate(student.studentStartDate).toLocaleDateString('pt-BR')
                    : classData?.startDate
                    ? createLocalDate(classData.startDate).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Término:</span>
                <span className="font-medium">
                  {student.studentEndDate
                    ? createLocalDate(student.studentEndDate).toLocaleDateString('pt-BR')
                    : classData?.endDate
                    ? createLocalDate(classData.endDate).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">CPF:</span>
              <span className="font-medium">{student.taxId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-medium">{student.phone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">E-mail:</span>
              <span className="font-medium truncate ml-2">{student.email || '-'}</span>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-semibold text-green-600">
                R$ {Number(student.totalValue || 0).toFixed(2)}
              </span>
            </div>
            {student.discount && student.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-medium text-orange-600">
                  - R$ {Number(student.discount).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Link Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="w-3 h-3 mr-1" />
                  Link
                </Button>
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>🔗 Link de Matrícula</DialogTitle>
                  <DialogDescription>
                    Copie ou abra o link público do aluno.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Link</Label>
                    <Input value={enrollmentLink} readOnly />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleCopyEnrollmentLink}>
                      Copiar
                    </Button>
                    <Button className="flex-1" onClick={handleOpenEnrollmentLink}>
                      Abrir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                setEditFormData({
                  name: student.name,
                  taxId: student.taxId || '',
                  phone: student.phone || '',
                  email: student.email || '',
                  discount: student.discount || 0,
                  photo: student.photoUrl || '',
                  extraProducts: [],
                });
                setEditDialogOpen(true);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>

            {onTransferStudent && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferStudent(student.id);
                }}
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                Transferir
              </Button>
            )}
            {onReplaceStudent && student.status === 'Active' && !disabled && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onReplaceStudent(student.id);
                }}
              >
                <UserX className="w-3 h-3 mr-1" />
                Substituir
              </Button>
            )}
          </div>

          {/* Delete Button */}
          <Popover open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-red-300 text-red-700 hover:bg-red-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Excluir Aluno
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-4 bg-white"
              align="start"
              side="bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      Excluir Aluno?
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      Tem certeza que deseja excluir{' '}
                      <strong>{student.name}</strong>? Esta ação não pode ser
                      desfeita.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStudent?.(student.id);
                      setDeleteDialogOpen(false);
                      toast.success('Aluno excluído com sucesso!');
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Sim, excluir
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Edit Student Dialog */}
      <EditStudentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        student={student}
        extraProducts={extraProducts}
        onUpdateStudent={onUpdateStudent}
      />

      <StudentDocumentsDialog
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
        student={{
          id: student.id,
          code: student.code,
          name: student.name,
        }}
        currentUser={currentUser ? { id: currentUser.id } : undefined}
      />

      {/* Payment Dialog (wired to PaymentButton) */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        student={dialogStudent}
        currentUser={dialogCurrentUser}
        allowedPaymentMethods={allowedPaymentMethods}
        onRegisterPayment={async (data) => {
          if (!student.enrollmentId) {
            toast.error('Aluno sem matrícula vinculada — não é possível registrar pagamento.');
            return;
          }

          try {
            const created = await paymentsService.create({
              enrollmentId: student.enrollmentId,
              amount: data.amount,
              dueDate: new Date().toISOString(),
              method: toApiPaymentMethod(data.method),
              description: data.observations || `Pagamento - ${student.name}`,
            });

            const newHistory = [
              ...(student.payments?.history || []),
              {
                id: created.id,
                amount: data.amount,
                date: created.createdAt.split('T')[0],
                time: created.createdAt.split('T')[1]?.slice(0, 5) || '12:00',
                paymentMethod: fromDialogPaymentMethod(data.method),
                notes: data.observations || undefined,
                recordedBy: currentUser?.name || 'Usuário',
                boletoBarcode: data.invoiceCode,
                boletoDueDate: data.invoiceDueDate,
                invoiceNumber: data.invoiceCode,
              },
            ];

            upsertPayments(newHistory);
          } catch {
            toast.error('Falha ao registrar pagamento no servidor');
          }
        }}
        onConfirmPayment={async (paymentId) => {
          const record = (student.payments?.history || []).find((p) => p.id === paymentId);
          if (!record) {
            toast.error('Pagamento não encontrado.');
            return;
          }

          try {
            await paymentsService.recordPayment({
              paymentId,
              method: toApiPaymentMethod(toDialogPaymentMethod(record.paymentMethod)),
              invoiceNumber: record.invoiceNumber || record.boletoBarcode,
              notes: record.notes,
            });

            const now = new Date();
            const confirmationDate = now.toISOString().split('T')[0];
            const confirmationTime = now.toTimeString().slice(0, 5);

            const newHistory = (student.payments?.history || []).map((p) =>
              p.id === paymentId
                ? {
                    ...p,
                    confirmedBy: currentUser?.name || 'Master',
                    confirmationDate,
                    confirmationTime,
                  }
                : p
            );

            upsertPayments(newHistory);
          } catch {
            toast.error('Falha ao confirmar pagamento no servidor');
          }
        }}
        onEditPayment={async (paymentId, data) => {
          const existing = (student.payments?.history || []).find((p) => p.id === paymentId);
          if (!existing) {
            toast.error('Pagamento não encontrado.');
            return;
          }

          const amountOrMethodChanged =
            existing.amount !== data.amount ||
            fromDialogPaymentMethod(data.method) !== existing.paymentMethod;

          if (!amountOrMethodChanged) {
            // Só dados de boleto (código/vencimento) mudaram — não existe
            // endpoint de edição no backend para isso; fica só guardado
            // localmente e vai junto no invoiceNumber quando confirmar
            // (onConfirmPayment lê record.invoiceNumber/boletoBarcode).
            const newHistory = (student.payments?.history || []).map((p) =>
              p.id === paymentId
                ? {
                    ...p,
                    boletoBarcode: data.invoiceCode,
                    boletoDueDate: data.invoiceDueDate,
                    invoiceNumber: data.invoiceCode,
                    notes: data.observations || undefined,
                  }
                : p
            );
            upsertPayments(newHistory);
            return;
          }

          if (!student.enrollmentId) {
            toast.error('Aluno sem matrícula vinculada — não é possível editar pagamento.');
            return;
          }

          // Não existe endpoint para editar valor/método de um pagamento já
          // criado (payments.controller.ts só tem record/updateStatus) —
          // remove o pendente antigo e cria um novo com os dados corrigidos.
          try {
            await paymentsService.delete(paymentId);
            const created = await paymentsService.create({
              enrollmentId: student.enrollmentId,
              amount: data.amount,
              dueDate: new Date().toISOString(),
              method: toApiPaymentMethod(data.method),
              description: data.observations || `Pagamento - ${student.name}`,
            });

            const newHistory = (student.payments?.history || [])
              .filter((p) => p.id !== paymentId)
              .concat([
                {
                  id: created.id,
                  amount: data.amount,
                  date: created.createdAt.split('T')[0],
                  time: created.createdAt.split('T')[1]?.slice(0, 5) || '12:00',
                  paymentMethod: fromDialogPaymentMethod(data.method),
                  notes: data.observations || undefined,
                  recordedBy: currentUser?.name || 'Usuário',
                  boletoBarcode: data.invoiceCode,
                  boletoDueDate: data.invoiceDueDate,
                  invoiceNumber: data.invoiceCode,
                },
              ]);

            upsertPayments(newHistory);
          } catch {
            toast.error('Falha ao atualizar pagamento no servidor');
          }
        }}
      />
    </div>
  );
};

export default StudentCard;
