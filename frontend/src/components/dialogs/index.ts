// Dialog components barrel export
export { AddStudentDialog } from './add-student-dialog';
export { ScheduleExamDialog } from './schedule-exam-dialog';
export { AttendanceDialog, type AttendanceStatus } from './attendance-dialog';
export { TransferStudentDialog } from './transfer-student-dialog';
export { SubstituteDialog } from './substitute-dialog';
export { StudentDocumentsDialog, type DocumentStatus } from './student-documents-dialog';
export { PaymentDialog, type PaymentMethod, type PaymentStatus } from './payment-dialog';

// New dialogs from Figma alignment
export { AttendanceListDialog } from './attendance-list-dialog';
export { AuthorizePaymentDialog } from './authorize-payment-dialog';
export { BatchPaymentDialog } from './batch-payment-dialog';
export { UploadSpreadsheetDialog, type ExcelStudent } from './upload-spreadsheet-dialog';
export { InstructorCostsDialog } from './instructor-costs-dialog';
export { UserPermissionsDialog, type UserPermissionsPayload } from './user-permissions-dialog';
