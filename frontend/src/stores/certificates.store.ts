import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Caiso - Certificates Store (Módulo Certificados)
// ============================================

export interface Certificate {
  id: string;
  code: string;
  certificateNumber: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  templateId?: string;
  status: CertificateStatus;
  issuedAt?: string;
  expiresAt?: string;
  validityMonths: number;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  revokedAt?: string;
  revokedReason?: string;
  issuedById?: string;
  createdAt: string;
  updatedAt: string;
  // Populated
  studentName?: string;
  studentCode?: string;
  studentCpf?: string;
  courseName?: string;
  courseCode?: string;
  issuedByName?: string;
  templateName?: string;
}

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'EXPIRED' | 'REVOKED';

export interface CertificateTemplate {
  id: string;
  name: string;
  courseId?: string;
  htmlTemplate: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  signatureImageUrl?: string;
  logoUrl?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CertificateStats {
  total: number;
  issued: number;
  draft: number;
  expired: number;
  revoked: number;
  expiringIn30Days: number;
}

interface CertificatesState {
  certificates: Certificate[];
  selectedCertificate: Certificate | null;
  stats: CertificateStats | null;
  loading: boolean;
  error: string | null;

  setCertificates: (certificates: Certificate[]) => void;
  setSelectedCertificate: (certificate: Certificate | null) => void;
  setStats: (stats: CertificateStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addCertificate: (certificate: Certificate) => void;
  updateCertificate: (id: string, data: Partial<Certificate>) => void;
  deleteCertificate: (id: string) => void;

  reset: () => void;
}

const initialState = {
  certificates: [] as Certificate[],
  selectedCertificate: null as Certificate | null,
  stats: null as CertificateStats | null,
  loading: false,
  error: null as string | null,
};

export const useCertificatesStore = create<CertificatesState>()(
  persist(
    (set) => ({
      ...initialState,

      setCertificates: (certificates) => set({ certificates, error: null }),
      setSelectedCertificate: (certificate) => set({ selectedCertificate: certificate }),
      setStats: (stats) => set({ stats }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      addCertificate: (certificate) =>
        set((state) => ({
          certificates: [certificate, ...state.certificates],
        })),

      updateCertificate: (id, data) =>
        set((state) => ({
          certificates: state.certificates.map((cert) =>
            cert.id === id ? { ...cert, ...data } : cert
          ),
          selectedCertificate:
            state.selectedCertificate?.id === id
              ? { ...state.selectedCertificate, ...data }
              : state.selectedCertificate,
        })),

      deleteCertificate: (id) =>
        set((state) => ({
          certificates: state.certificates.filter((cert) => cert.id !== id),
          selectedCertificate:
            state.selectedCertificate?.id === id ? null : state.selectedCertificate,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'smcorp-certificates-storage',
      partialize: (state) => ({
        certificates: state.certificates,
      }),
    }
  )
);
