import { api } from '@/lib/api';

// ============================================
// Caiso - Communication Service
// Status real dos provedores (backend Fase 3)
// ============================================

export interface CommunicationStatus {
  uniqSuporteConfigured: boolean;
  /** SMTP ativo configurado pelo próprio tenant (tem precedência no envio) */
  smtpConfigured?: boolean;
  channels: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
}

export const communicationService = {
  getStatus: async (): Promise<CommunicationStatus> => {
    const response = await api.get('/communication/status');
    return response.data;
  },
};
