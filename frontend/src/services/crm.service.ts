import { api } from '@/lib/api';
import type {
  CRMContact,
  CRMActivity,
  CRMDeal,
  CRMPipelineStage,
  CRMContactStats,
  CRMDealStats,
} from '@/stores/crm.store';

// ============================================
// Caiso - CRM Service
// ============================================

export interface CreateContactDTO {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  cpfCnpj?: string;
  source?: string;
  status?: string;
  assignedToId?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateActivityDTO {
  contactId: string;
  type: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  createdById: string;
}

export interface CreateDealDTO {
  contactId: string;
  stageId: string;
  title: string;
  value: number;
  expectedCloseDate?: string;
  courseId?: string;
  classId?: string;
  notes?: string;
}

export interface CreatePipelineStageDTO {
  name: string;
  order: number;
  color?: string;
  isDefault?: boolean;
}

export const crmService = {
  // ── Dashboard ──
  getDashboard: async () => {
    const response = await api.get('/crm/dashboard');
    return response.data;
  },

  // ── Contatos ──
  getContacts: async (filters?: {
    status?: string;
    source?: string;
    assignedToId?: string;
    search?: string;
    tag?: string;
  }): Promise<CRMContact[]> => {
    const response = await api.get('/crm/contacts', { params: filters });
    return response.data;
  },

  getContactById: async (id: string): Promise<CRMContact> => {
    const response = await api.get(`/crm/contacts/${id}`);
    return response.data;
  },

  getContactStats: async (): Promise<CRMContactStats> => {
    const response = await api.get('/crm/contacts/stats');
    return response.data;
  },

  createContact: async (data: CreateContactDTO): Promise<CRMContact> => {
    const response = await api.post('/crm/contacts', data);
    return response.data;
  },

  updateContact: async (id: string, data: Partial<CreateContactDTO>): Promise<CRMContact> => {
    const response = await api.patch(`/crm/contacts/${id}`, data);
    return response.data;
  },

  deleteContact: async (id: string): Promise<void> => {
    await api.delete(`/crm/contacts/${id}`);
  },

  convertToStudent: async (id: string) => {
    const response = await api.post(`/crm/contacts/${id}/convert`);
    return response.data;
  },

  // ── Atividades ──
  getContactActivities: async (contactId: string): Promise<CRMActivity[]> => {
    const response = await api.get(`/crm/contacts/${contactId}/activities`);
    return response.data;
  },

  createActivity: async (data: CreateActivityDTO): Promise<CRMActivity> => {
    const response = await api.post('/crm/activities', data);
    return response.data;
  },

  updateActivity: async (id: string, data: Partial<CreateActivityDTO>): Promise<CRMActivity> => {
    const response = await api.patch(`/crm/activities/${id}`, data);
    return response.data;
  },

  deleteActivity: async (id: string): Promise<void> => {
    await api.delete(`/crm/activities/${id}`);
  },

  getPendingFollowUps: async (): Promise<CRMActivity[]> => {
    const response = await api.get('/crm/follow-ups');
    return response.data;
  },

  // ── Deals ──
  getDeals: async (filters?: {
    status?: string;
    stageId?: string;
    contactId?: string;
  }): Promise<CRMDeal[]> => {
    const response = await api.get('/crm/deals', { params: filters });
    return response.data;
  },

  getDealStats: async (): Promise<CRMDealStats> => {
    const response = await api.get('/crm/deals/stats');
    return response.data;
  },

  createDeal: async (data: CreateDealDTO): Promise<CRMDeal> => {
    const response = await api.post('/crm/deals', data);
    return response.data;
  },

  updateDeal: async (id: string, data: Partial<CreateDealDTO>): Promise<CRMDeal> => {
    const response = await api.patch(`/crm/deals/${id}`, data);
    return response.data;
  },

  moveDeal: async (id: string, stageId: string): Promise<CRMDeal> => {
    const response = await api.patch(`/crm/deals/${id}/move`, { stageId });
    return response.data;
  },

  markDealWon: async (id: string): Promise<CRMDeal> => {
    const response = await api.post(`/crm/deals/${id}/won`);
    return response.data;
  },

  markDealLost: async (id: string, reason: string): Promise<CRMDeal> => {
    const response = await api.post(`/crm/deals/${id}/lost`, { reason });
    return response.data;
  },

  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/crm/deals/${id}`);
  },

  // ── Pipeline ──
  getPipelineStages: async (): Promise<CRMPipelineStage[]> => {
    const response = await api.get('/crm/pipeline');
    return response.data;
  },

  createPipelineStage: async (data: CreatePipelineStageDTO): Promise<CRMPipelineStage> => {
    const response = await api.post('/crm/pipeline', data);
    return response.data;
  },

  updatePipelineStage: async (id: string, data: Partial<CreatePipelineStageDTO>): Promise<CRMPipelineStage> => {
    const response = await api.patch(`/crm/pipeline/${id}`, data);
    return response.data;
  },

  reorderPipelineStages: async (stages: { id: string; order: number }[]): Promise<void> => {
    await api.patch('/crm/pipeline/reorder', { stages });
  },

  deletePipelineStage: async (id: string): Promise<void> => {
    await api.delete(`/crm/pipeline/${id}`);
  },
};
