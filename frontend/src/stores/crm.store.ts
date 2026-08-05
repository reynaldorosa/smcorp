import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// SMCORP - CRM Store (Módulo CRM)
// ============================================

export type CRMContactSource = 'MANUAL' | 'IMPORT' | 'WEBSITE' | 'WHATSAPP' | 'REFERRAL' | 'COMPANY';
export type CRMContactStatus = 'LEAD' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATION' | 'ENROLLED' | 'LOST';
export type CRMActivityType = 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP';
export type CRMDealStatus = 'OPEN' | 'WON' | 'LOST';

export interface CRMContact {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  cpfCnpj?: string;
  source: CRMContactSource;
  status: CRMContactStatus;
  assignedToId?: string;
  studentId?: string;
  companyId?: string;
  tags: string[];
  notes?: string;
  customFields?: Record<string, unknown>;
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated
  assignedToName?: string;
  studentName?: string;
  companyName?: string;
  activitiesCount?: number;
  dealsCount?: number;
  dealsValue?: number;
}

export interface CRMActivity {
  id: string;
  contactId: string;
  type: CRMActivityType;
  title: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdById: string;
  createdByName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CRMPipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  dealsCount?: number;
  dealsValue?: number;
}

export interface CRMDeal {
  id: string;
  code: string;
  contactId: string;
  stageId: string;
  title: string;
  value: number;
  expectedCloseDate?: string;
  status: CRMDealStatus;
  courseId?: string;
  classId?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  notes?: string;
  createdAt: string;
  // Populated
  contactName?: string;
  contactCode?: string;
  contactPhone?: string;
  stageName?: string;
  stageColor?: string;
  courseName?: string;
}

export interface CRMContactStats {
  total: number;
  lead: number;
  qualified: number;
  interested: number;
  negotiation: number;
  enrolled: number;
  lost: number;
  conversionRate: string;
}

export interface CRMDealStats {
  total: number;
  open: number;
  won: number;
  lost: number;
  totalValue: number;
  wonValue: number;
  winRate: string;
}

interface CRMState {
  contacts: CRMContact[];
  selectedContact: CRMContact | null;
  activities: CRMActivity[];
  deals: CRMDeal[];
  pipelineStages: CRMPipelineStage[];
  contactStats: CRMContactStats | null;
  dealStats: CRMDealStats | null;
  loading: boolean;
  error: string | null;
  activeTab: 'contacts' | 'pipeline' | 'activities' | 'dashboard';

  setContacts: (contacts: CRMContact[]) => void;
  setSelectedContact: (contact: CRMContact | null) => void;
  setActivities: (activities: CRMActivity[]) => void;
  setDeals: (deals: CRMDeal[]) => void;
  setPipelineStages: (stages: CRMPipelineStage[]) => void;
  setContactStats: (stats: CRMContactStats) => void;
  setDealStats: (stats: CRMDealStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'contacts' | 'pipeline' | 'activities' | 'dashboard') => void;

  addContact: (contact: CRMContact) => void;
  updateContact: (id: string, data: Partial<CRMContact>) => void;
  deleteContact: (id: string) => void;

  addDeal: (deal: CRMDeal) => void;
  updateDeal: (id: string, data: Partial<CRMDeal>) => void;
  deleteDeal: (id: string) => void;

  addActivity: (activity: CRMActivity) => void;

  reset: () => void;
}

const initialState = {
  contacts: [] as CRMContact[],
  selectedContact: null as CRMContact | null,
  activities: [] as CRMActivity[],
  deals: [] as CRMDeal[],
  pipelineStages: [] as CRMPipelineStage[],
  contactStats: null as CRMContactStats | null,
  dealStats: null as CRMDealStats | null,
  loading: false,
  error: null as string | null,
  activeTab: 'contacts' as const,
};

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      ...initialState,

      setContacts: (contacts) => set({ contacts, error: null }),
      setSelectedContact: (contact) => set({ selectedContact: contact }),
      setActivities: (activities) => set({ activities }),
      setDeals: (deals) => set({ deals }),
      setPipelineStages: (stages) => set({ pipelineStages: stages }),
      setContactStats: (stats) => set({ contactStats: stats }),
      setDealStats: (stats) => set({ dealStats: stats }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      addContact: (contact) =>
        set((state) => ({
          contacts: [contact, ...state.contacts],
        })),

      updateContact: (id, data) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
          selectedContact:
            state.selectedContact?.id === id
              ? { ...state.selectedContact, ...data }
              : state.selectedContact,
        })),

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
          selectedContact:
            state.selectedContact?.id === id ? null : state.selectedContact,
        })),

      addDeal: (deal) =>
        set((state) => ({
          deals: [deal, ...state.deals],
        })),

      updateDeal: (id, data) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        })),

      deleteDeal: (id) =>
        set((state) => ({
          deals: state.deals.filter((d) => d.id !== id),
        })),

      addActivity: (activity) =>
        set((state) => ({
          activities: [activity, ...state.activities],
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'smcorp-crm-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        deals: state.deals,
        pipelineStages: state.pipelineStages,
        activeTab: state.activeTab,
      }),
    }
  )
);
