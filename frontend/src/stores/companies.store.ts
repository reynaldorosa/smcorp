import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// SMCORP - Companies Store (Módulo 05)
// B2B Client Management
// ============================================

export interface CompanyPricing {
  id: string;
  courseId: string;
  basePrice: number;
  discountPercent?: number;
  finalPrice: number;
  notes?: string;
  includedProductIds?: string[];
  validUntil?: string;
  active?: boolean;
}

export interface CompanyContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  tradeName?: string;
  companyTaxId: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contacts?: CompanyContact[];
  pricing?: CompanyPricing[];
  allowedPaymentMethods?: string[];
  portalAccess: boolean;
  portalLogin?: string;
  portalPassword?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompaniesState {
  companies: Company[];
  selectedCompany: Company | null;
  loading: boolean;
  error: string | null;

  filters: {
    search: string;
    courseId: string | null;
    hasPortalAccess: boolean | null;
  };

  setCompanies: (companies: Company[]) => void;
  setSelectedCompany: (company: Company | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<CompaniesState['filters']>) => void;

  addCompany: (company: Company) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addPricing: (companyId: string, pricing: CompanyPricing) => void;
  updatePricing: (companyId: string, pricingId: string, data: Partial<CompanyPricing>) => void;
  deletePricing: (companyId: string, pricingId: string) => void;

  getFilteredCompanies: () => Company[];
  getCompanyById: (id: string) => Company | undefined;
  generateCode: () => string;

  reset: () => void;
}

const initialState = {
  companies: [] as Company[],
  selectedCompany: null as Company | null,
  loading: false,
  error: null as string | null,
  filters: {
    search: '',
    courseId: null as string | null,
    hasPortalAccess: null as boolean | null,
  },
};

export const useCompaniesStore = create<CompaniesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCompanies: (companies) => set({ companies, error: null }),
      setSelectedCompany: (company) => set({ selectedCompany: company }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      addCompany: (company) =>
        set((state) => ({
          companies: [...state.companies, company],
        })),

      updateCompany: (id, companyData) =>
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === id ? { ...company, ...companyData } : company
          ),
          selectedCompany:
            state.selectedCompany?.id === id
              ? { ...state.selectedCompany, ...companyData }
              : state.selectedCompany,
        })),

      deleteCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((company) => company.id !== id),
          selectedCompany:
            state.selectedCompany?.id === id ? null : state.selectedCompany,
        })),

      addPricing: (companyId, pricing) =>
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === companyId
              ? { ...company, pricing: [...(company.pricing || []), pricing] }
              : company
          ),
        })),

      updatePricing: (companyId, pricingId, data) =>
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === companyId
              ? {
                  ...company,
                  pricing: company.pricing?.map((p) =>
                    p.id === pricingId ? { ...p, ...data } : p
                  ),
                }
              : company
          ),
        })),

      deletePricing: (companyId, pricingId) =>
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === companyId
              ? {
                  ...company,
                  pricing: company.pricing?.filter((p) => p.id !== pricingId),
                }
              : company
          ),
        })),

      getFilteredCompanies: () => {
        const state = get();
        let filtered = [...state.companies];

        if (state.filters.search) {
          const search = state.filters.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.code.toLowerCase().includes(search) ||
              c.companyTaxId.includes(search)
          );
        }

        if (state.filters.hasPortalAccess !== null) {
          filtered = filtered.filter(
            (c) => c.portalAccess === state.filters.hasPortalAccess
          );
        }

        return filtered;
      },

      getCompanyById: (id) => {
        return get().companies.find((c) => c.id === id);
      },

      generateCode: () => {
        const companies = get().companies;
        const prefix = 'EMP';
        const number = String(companies.length + 1).padStart(4, '0');
        return `${prefix}${number}`;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'smcorp-companies-storage',
      partialize: (state) => ({
        companies: state.companies,
      }),
    }
  )
);
