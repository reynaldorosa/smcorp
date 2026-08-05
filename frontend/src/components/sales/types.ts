// ============================================
// SMCORP - Sales Module Types (Módulo 04)
// ============================================

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  read: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  photo?: string;
  status: 'lead' | 'interested' | 'enrolled';
}

export interface LeadStats {
  total: number;
  leads: number;
  interested: number;
  enrolled: number;
  conversionRate: number;
}

export interface ReadyMessage {
  label: string;
  text: string;
}
