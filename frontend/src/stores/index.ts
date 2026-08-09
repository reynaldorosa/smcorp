// ============================================
// Caiso - Stores Index
// Exporta todas as stores Zustand do projeto
// ============================================

// Auth store - for login/session (uses its own User type)
export { useAuthStore } from './auth.store';
export type { User as AuthUser } from './auth.store';

// Sidebar store
export * from './sidebar.store';

// Stores migradas do Figma
export * from './courses.store';
export * from './classes.store';
export * from './students.store';

// Instructors types (store Zustand removida - dados via TanStack Query)
export type { Instructor, InstructorCertification, InstructorAvailability } from './instructors.store';

// Companies store
export * from './companies.store';

// Costs store
export * from './costs.store';

// Settings store - main User and Instructor types for the system
export * from './settings.store';
