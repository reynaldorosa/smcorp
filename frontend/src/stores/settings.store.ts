import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUserRole, UserPermissions } from '@/lib/user-permissions';
import type { Instructor } from './instructors.store';

// Re-export Instructor from canonical source
export type { Instructor } from './instructors.store';

// ============================================
// Caiso - Settings Store (Módulo 00)
// ============================================

// Types
export interface InstitutionalData {
  id: string;
  name: string;
  legalName?: string;
  companyTaxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  brandColor?: string;
  logo?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
  cashBox?: number;
  cashNotes?: string;
  receiptCounter?: number;
}

export interface EmailConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
  active?: boolean;
}

export interface WhatsAppConfig {
  id: string;
  apiKey: string;
  instanceId: string;
  webhookUrl?: string;
  enabled: boolean;
  number?: string;
  defaultMessage?: string;
}

export interface Room {
  id: string;
  name: string;
  location?: string;
  address?: string;
  capacity: number;
  dailyCost?: number;
  active: boolean;
}

export interface Supplier {
  id: string;
  code?: string;
  name: string;
  companyTaxId?: string;
  phone?: string;
  email?: string;
  category: string;
  active: boolean;
}

export interface User {
  id: string;
  code?: string;
  name: string;
  email: string;
  role: AppUserRole;
  pin?: string; // PIN para validação de ações sensíveis
  permissions?: UserPermissions;
  active: boolean;
  createdAt: string;
}

// Instructor type is now re-exported from instructors.store.ts (canonical source)

export interface ExtraProduct {
  id: string;
  code?: string;
  name: string;
  type: 'product' | 'extra';
  price: number;
  description?: string;
  associatedCosts?: string[];
  active: boolean;
}

interface SettingsState {
  // State
  institutionalData: InstitutionalData | null;
  emailConfig: EmailConfig | null;
  whatsappConfig: WhatsAppConfig | null;
  rooms: Room[];
  suppliers: Supplier[];
  users: User[];
  currentUser: User | null;
  instructors: Instructor[];
  extraProducts: ExtraProduct[];
  receiptCounter: number;
  loading: boolean;
  error: string | null;

  // Setters
  setInstitutionalData: (data: InstitutionalData) => void;
  setEmailConfig: (config: EmailConfig) => void;
  setWhatsappConfig: (config: WhatsAppConfig) => void;
  setRooms: (rooms: Room[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  setInstructors: (instructors: Instructor[]) => void;
  setExtraProducts: (products: ExtraProduct[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD Rooms
  addRoom: (room: Room) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  // CRUD Suppliers
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // CRUD Users
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // CRUD Instructors
  addInstructor: (instructor: Instructor) => void;
  updateInstructor: (id: string, instructor: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;

  // CRUD Extra Products
  addExtraProduct: (product: ExtraProduct) => void;
  updateExtraProduct: (id: string, product: Partial<ExtraProduct>) => void;
  deleteExtraProduct: (id: string) => void;

  // Receipt number generator
  getNextReceiptNumber: () => string;

  // Reset
  reset: () => void;
}

const initialState = {
  institutionalData: null as InstitutionalData | null,
  emailConfig: null as EmailConfig | null,
  whatsappConfig: null as WhatsAppConfig | null,
  rooms: [] as Room[],
  suppliers: [] as Supplier[],
  users: [] as User[],
  currentUser: null as User | null,
  instructors: [] as Instructor[],
  extraProducts: [
    { id: 'pv-001', code: 'PV0001', name: 'Apostila Premium', type: 'product', price: 80, description: 'Material impresso premium', active: true },
    { id: 'pv-002', code: 'PV0002', name: 'Material Didático Completo', type: 'product', price: 120, description: 'Kit completo de material didático', active: true },
    { id: 'pv-003', code: 'PV0003', name: 'Uniforme Completo', type: 'product', price: 95, description: 'Uniforme padrão completo', active: true },
    { id: 'pv-004', code: 'PV0004', name: 'IRATA N1 PJ', type: 'product', price: 2650, description: 'Curso IRATA N1 Pessoa Jurídica', active: true },
    { id: 'pv-005', code: 'PV0005', name: 'IRATA N1 PF', type: 'product', price: 2500, description: 'Curso IRATA N1 Pessoa Física', active: true },
    { id: 'ex-001', code: 'EX0001', name: 'Kit Ferramentas', type: 'extra', price: 150, description: 'Kit de ferramentas básicas', active: true },
    { id: 'ex-002', code: 'EX0002', name: 'Acesso por Cordas N1', type: 'extra', price: 350, description: 'Treinamento de acesso por cordas nível 1', active: true },
    { id: 'ex-003', code: 'EX0003', name: 'Certificação NR35', type: 'extra', price: 280, description: 'Certificação Norma NR-35', active: true },
  ] as ExtraProduct[],
  receiptCounter: 1,
  loading: false,
  error: null as string | null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Setters
      setInstitutionalData: (data) => set({ institutionalData: data }),
      setEmailConfig: (config) => set({ emailConfig: config }),
      setWhatsappConfig: (config) => set({ whatsappConfig: config }),
      setRooms: (rooms) => set({ rooms }),
      setSuppliers: (suppliers) => set({ suppliers }),
      setUsers: (users) => set({ users }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setInstructors: (instructors) => set({ instructors }),
      setExtraProducts: (products) => set({ extraProducts: products }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // CRUD Rooms
      addRoom: (room) =>
        set((state) => ({
          rooms: [...state.rooms, room],
        })),
      updateRoom: (id, roomData) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id ? { ...room, ...roomData } : room
          ),
        })),
      deleteRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
        })),

      // CRUD Suppliers
      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [...state.suppliers, supplier],
        })),
      updateSupplier: (id, supplierData) =>
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === id ? { ...supplier, ...supplierData } : supplier
          ),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        })),

      // CRUD Users
      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),
      updateUser: (id, userData) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...userData } : user
          ),
        })),
      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        })),

      // CRUD Instructors
      addInstructor: (instructor) =>
        set((state) => ({
          instructors: [...state.instructors, instructor],
        })),
      updateInstructor: (id, instructorData) =>
        set((state) => ({
          instructors: state.instructors.map((instructor) =>
            instructor.id === id ? { ...instructor, ...instructorData } : instructor
          ),
        })),
      deleteInstructor: (id) =>
        set((state) => ({
          instructors: state.instructors.filter((instructor) => instructor.id !== id),
        })),

      // CRUD Extra Products
      addExtraProduct: (product) =>
        set((state) => ({
          extraProducts: [...state.extraProducts, product],
        })),
      updateExtraProduct: (id, productData) =>
        set((state) => ({
          extraProducts: state.extraProducts.map((product) =>
            product.id === id ? { ...product, ...productData } : product
          ),
        })),
      deleteExtraProduct: (id) =>
        set((state) => ({
          extraProducts: state.extraProducts.filter((product) => product.id !== id),
        })),

      // Receipt number generator (CP0001, CP0002, etc.)
      getNextReceiptNumber: () => {
        const counter = get().receiptCounter;
        const number = `CP${String(counter).padStart(4, '0')}`;
        set({ receiptCounter: counter + 1 });
        return number;
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'smcorp-settings-storage',
      partialize: (state) => ({
        institutionalData: state.institutionalData,
        emailConfig: state.emailConfig,
        whatsappConfig: state.whatsappConfig,
        rooms: state.rooms,
        suppliers: state.suppliers,
        users: state.users,
        instructors: state.instructors,
        extraProducts: state.extraProducts,
        receiptCounter: state.receiptCounter,
      }),
    }
  )
);
