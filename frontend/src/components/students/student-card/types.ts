// ============================================
// StudentCard Types - English Convention
// ============================================
// 
// All type names and properties in English
// UI labels rendered in Portuguese
// 
// IMPORTANT: Student type comes from stores/students.store.ts
// See types/index.ts for all type exports
// ============================================

import type {
  Student,
  Class,
  Course,
  Instructor,
  ExtraProduct,
  User,
  Company,
} from '@/types';

// Props for StudentCard component
export interface StudentCardProps {
  student: Student;
  classData?: Class;
  course?: Course;
  compact?: boolean;
  highlighted?: boolean;
  disabled?: boolean;  // Disables interactions (for replaced students)
  showWaitingPosition?: boolean; // Show waiting list position
  currentDate?: string; // YYYY-MM-DD format for weekly attendance control
  
  // Callbacks
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onMarkDayAttendance?: (studentId: string, date: string) => void;
  onReplaceStudent?: (oldStudentId: string) => void;
  onTransferStudent?: (studentId: string) => void;
  
  // Reference data
  instructors?: Instructor[];
  extraProducts?: ExtraProduct[];
  users?: User[];
  students?: Student[];
  companies?: Company[];
  currentUser?: User;
  emailConfig?: { enabled: boolean };
  whatsappConfig?: { enabled: boolean };
}

// Exam schedule data (for form state)
export interface ExamScheduleData {
  examName: string;
  instructorId: string;
  date: string;
  time: string;
}

// Edit student form data
export interface EditStudentFormData {
  name: string;
  taxId: string;
  phone: string;
  email: string;
  discount: number;
  photo: string;
  extraProducts: ExtraProduct[];
}

// Email fallback data
export interface EmailFallbackData {
  recipient: string;
  subject: string;
  body: string;
}

// WhatsApp message types
export type WhatsAppTemplateType =
  | 'enrollment'
  | 'documents'
  | 'payment'
  | 'exam'
  | 'welcome';
