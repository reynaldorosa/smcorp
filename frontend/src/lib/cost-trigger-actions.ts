import type { CostTriggerAction } from '@/stores/costs.store';

export const COST_TRIGGER_ACTIONS: { value: CostTriggerAction; label: string }[] = [
  { value: 'NewEnrollment', label: 'Nova Matrícula Criada' },
  { value: 'StatusScheduled', label: 'Status → Agendado' },
  { value: 'StatusConfirm', label: 'Status → Confirmar' },
  { value: 'StatusConfirmed', label: 'Status → Confirmado' },
  { value: 'StatusPresent', label: 'Status → Presente' },
  { value: 'FirstPayment', label: 'Primeiro Pagamento Registrado' },
  { value: 'PaymentConfirmed', label: 'Pagamento Confirmado (Master)' },
  { value: 'AllDocsApproved', label: 'Todos Documentos Aprovados' },
  { value: 'DocApproved', label: 'Documento Individual Aprovado' },
  { value: 'ExamScheduled', label: 'Prova Agendada' },
  { value: 'ExamCancelled', label: 'Prova Cancelada' },
  { value: 'ExamPassed', label: 'Resultado Prova → Aprovado' },
  { value: 'ExamFailed', label: 'Resultado Prova → Reprovado' },
  { value: 'ExamNoShow', label: 'Resultado Prova → No Show' },
  { value: 'StudentEdited', label: 'Aluno Editado' },
  { value: 'StudentReplaced', label: 'Aluno Substituído' },
  { value: 'StudentTransferred', label: 'Aluno Transferido' },
  { value: 'AttendanceMarked', label: 'Presença Marcada no Dia' },
  { value: 'LinkSent', label: 'Link Enviado (WhatsApp/Email)' },
  { value: 'InstructorLinkedToClass', label: 'Instrutor Vinculado à Turma' },
  { value: 'InstructorAttendance', label: 'Presença Instrutor Confirmada' },
  { value: 'InstructorAssignedToExam', label: 'Instrutor Vinculado à Prova' },
];

export const STUDENT_TRIGGER_ACTIONS: CostTriggerAction[] = [
  'NewEnrollment',
  'StatusScheduled',
  'StatusConfirm',
  'StatusConfirmed',
  'StatusPresent',
  'FirstPayment',
  'PaymentConfirmed',
  'AllDocsApproved',
  'DocApproved',
  'ExamScheduled',
  'ExamCancelled',
  'ExamPassed',
  'ExamFailed',
  'ExamNoShow',
  'StudentEdited',
  'StudentReplaced',
  'StudentTransferred',
  'AttendanceMarked',
  'LinkSent',
];

export const INSTRUCTOR_TRIGGER_ACTIONS: CostTriggerAction[] = [
  'InstructorLinkedToClass',
  'InstructorAttendance',
  'InstructorAssignedToExam',
];

export function getCostTriggerLabel(action: CostTriggerAction): string {
  return COST_TRIGGER_ACTIONS.find((item) => item.value === action)?.label ?? action;
}
