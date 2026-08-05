// ============================================
// SMCORP - Unified Types Index
// ============================================
// 
// ⚠️ THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL TYPES
// 
// Convention:
// - All type names: English
// - All property names: English (camelCase)
// - UI labels/messages: Portuguese (use LABEL constants below)
//
// @see CODING_STANDARDS.md for full guidelines
// ============================================

// Courses
export type { Course } from '@/stores/courses.store';

// Classes
export type { Class, ClassStatus, ClassInstructor, InstructorAttendance } from '@/stores/classes.store';

// Students
export type {
  Student,
  StudentStatus,
  StudentDocument,
  StudentPayment,
  PaymentRecord,
  ExamStatus,
  ExamResultDetails,
  ExtraProductPayment,
  Receipt,
  LinkStatus,
  DocumentStatus,
  PaymentStatus,
  ExamResult,
} from '@/stores/students.store';

// Companies
export type { Company, CompanyPricing, CompanyContact } from '@/stores/companies.store';

// Settings
export type {
  Room,
  Supplier,
  User,
  Instructor,
  ExtraProduct,
  InstitutionalData,
  EmailConfig,
  WhatsAppConfig,
} from '@/stores/settings.store';

// Costs
export type { AuditableCost, CostCriterion, CostEntry, CostTriggerAction } from '@/stores/costs.store';

// Exams
export type { ScheduledExam, ScheduledExamStatus } from '@/stores/exams.store';

// Attendance (from dialogs until refactored)
export type AttendanceStatus = 'Present' | 'Absent' | 'Justified';

// ============================================
// UI LABEL CONSTANTS (Portuguese)
// Use these for displaying text to users
// ============================================

import type { ClassStatus } from '@/stores/classes.store';
import type { StudentStatus, LinkStatus, ExamResult } from '@/stores/students.store';

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  Planned: 'Planejada',
  Confirmed: 'Confirmada',
  InProgress: 'Em Andamento',
  Completed: 'Concluída',
  Cancelled: 'Cancelada',
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  Active: 'Ativo',
  Inactive: 'Inativo',
  Pending: 'Pendente',
  WaitingList: 'Lista de Espera',
  Replaced: 'Substituído',
};

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  Scheduled: 'Agendado',
  ToConfirm: 'Confirmar',
  Confirmed: 'Confirmado',
  Present: 'Presente',
};

export const EXAM_RESULT_LABELS: Record<ExamResult, string> = {
  Pending: 'Pendente',
  Approved: 'Aprovado',
  Failed: 'Reprovado',
  NoShow: 'Faltou',
};

export const DOCUMENT_STATUS_LABELS = {
  Pending: 'Pendente',
  Approved: 'Aprovado',
  Rejected: 'Reprovado',
} as const;

export const PAYMENT_STATUS_LABELS = {
  Pending: 'Pendente',
  Partial: 'Parcial',
  Complete: 'Completo',
  Overdue: 'Vencido',
} as const;

export const USER_ROLE_LABELS = {
  Master: 'Master',
  Admin: 'Admin',
  Seller: 'Vendedor',
} as const;

// ============================================
// BADGE STYLE HELPERS
// ============================================

export function getClassStatusBadgeClass(status: ClassStatus): string {
  const variants: Record<ClassStatus, string> = {
    Planned: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-green-100 text-green-700',
    InProgress: 'bg-yellow-100 text-yellow-700',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return variants[status] || 'bg-gray-100 text-gray-700';
}

export function getStudentStatusBadgeClass(status: StudentStatus): string {
  const variants: Record<StudentStatus, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    WaitingList: 'bg-blue-100 text-blue-700',
    Replaced: 'bg-red-100 text-red-700',
  };
  return variants[status] || 'bg-gray-100 text-gray-700';
}

export function getLinkStatusBadgeClass(status: LinkStatus): string {
  const variants: Record<LinkStatus, string> = {
    Scheduled: 'bg-blue-100 text-blue-700',
    ToConfirm: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-green-100 text-green-700',
    Present: 'bg-emerald-100 text-emerald-700',
  };
  return variants[status] || 'bg-gray-100 text-gray-700';
}

export function getExamResultBadgeClass(status: ExamResult): string {
  const variants: Record<ExamResult, string> = {
    Pending: 'bg-gray-100 text-gray-700',
    Approved: 'bg-green-100 text-green-700',
    Failed: 'bg-red-100 text-red-700',
    NoShow: 'bg-orange-100 text-orange-700',
  };
  return variants[status] || 'bg-gray-100 text-gray-700';
}
