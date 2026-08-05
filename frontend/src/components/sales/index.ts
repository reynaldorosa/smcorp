// ============================================
// SMCORP - Sales Components (Módulo 04)
// ============================================

export { ContactItem } from './contact-item';
export { MessageBubble } from './message-bubble';
export { ChatSidebar } from './chat-sidebar';
export { SalesDashboard } from './sales-dashboard';
export type { Contact, Message, LeadStats, ReadyMessage } from './types';
export { READY_MESSAGES } from './constants';
export {
  formatCurrency,
  getStatusColor,
  getStatusDotColor,
  getStatusLabel,
} from './helpers';
