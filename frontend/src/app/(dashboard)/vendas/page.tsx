'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import {
  Send,
  Phone,
  Search,
  Check,
  CheckCheck,
  User,
  MessageCircle,
  Building2,
  Users,
  TrendingUp,
  QrCode,
  Copy,
  Link as LinkIcon,
  Mail,
} from 'lucide-react';
import { useCoursesStore } from '@/stores/courses.store';
import { useClassesStore } from '@/stores/classes.store';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useCompaniesStore, type Company, type CompanyContact } from '@/stores/companies.store';
import { useSettingsStore } from '@/stores/settings.store';
import { studentsService } from '@/services/students.service';
import { companiesService, type Company as ApiCompany } from '@/services/companies.service';
import { crmService } from '@/services/crm.service';
import { enrollmentOperations } from '@/services/operations.service';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  read: boolean;
}

interface Contact {
  id: string;
  crmContactId?: string;
  studentId?: string;
  enrollmentId?: string;
  name: string;
  phone: string;
  email?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  photo?: string;
  status: 'lead' | 'interested' | 'enrolled';
}

interface LeadStats {
  total: number;
  leads: number;
  interested: number;
  enrolled: number;
  conversionRate: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getStatusColor(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'bg-yellow-100 text-yellow-700';
    case 'interested':
      return 'bg-blue-100 text-blue-700';
    case 'enrolled':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatusLabel(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'Lead';
    case 'interested':
      return 'Interessado';
    case 'enrolled':
      return 'Matriculado';
    default:
      return status;
  }
}

function formatContactTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getStudentContactStatus(student: Student): Contact['status'] {
  if (student.paymentComplete || student.status === 'Active') return 'enrolled';
  if (student.classId || student.linkStatus) return 'interested';
  return 'lead';
}

function getCompanyContactStatus(company: Company): Contact['status'] {
  return company.portalAccess ? 'interested' : 'lead';
}

function normalizePhone(value?: string): string {
  return (value || '').replace(/\D/g, '');
}

function mapCrmStatusToContactStatus(
  status?: 'LEAD' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATION' | 'ENROLLED' | 'LOST',
): Contact['status'] {
  if (!status) return 'lead';
  if (status === 'ENROLLED') return 'enrolled';
  if (status === 'INTERESTED' || status === 'QUALIFIED' || status === 'NEGOTIATION') {
    return 'interested';
  }
  return 'lead';
}

function mapContactStatusToCrmStatus(status: Contact['status']) {
  if (status === 'enrolled') return 'ENROLLED';
  if (status === 'interested') return 'INTERESTED';
  return 'LEAD';
}

// ============================================
// COMPONENTS
// ============================================

// Status dot color based on contact status
function getStatusDotColor(status: Contact['status']): string {
  switch (status) {
    case 'lead':
      return 'bg-yellow-500';
    case 'interested':
      return 'bg-blue-500';
    case 'enrolled':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

// Ready message templates matching the Figma original
const READY_MESSAGES = [
  { label: 'Saudação inicial', text: 'Olá! Bem-vindo(a)! Como posso ajudar? 😊' },
  { label: 'Informações de matrícula', text: 'Para matrícula, precisamos dos seguintes documentos: RG, CPF e comprovante de residência. Posso enviar o link de inscrição?' },
  { label: 'Formas de pagamento', text: 'Aceitamos: PIX (5% desconto), cartão em até 12x, ou boleto bancário. Qual prefere?' },
  { label: 'Próximas turmas', text: 'Temos turmas iniciando em breve! Vou verificar a disponibilidade para você.' },
];

function ContactItem({
  contact,
  selected,
  onClick,
}: {
  contact: Contact;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
        selected ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        {contact.photo ? (
          <img
            src={contact.photo}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusDotColor(contact.status)}`} />
        {contact.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
            {contact.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">{contact.name}</h4>
          <span className="text-xs text-gray-500 flex-shrink-0">{contact.time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
          {contact.unreadCount > 0 && (
            <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              {contact.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="w-full">
      <div
        className={`rounded-lg px-3 py-3 ${
          message.sent
            ? 'bg-red-50 text-gray-900 border border-red-100'
            : 'bg-white text-gray-900 border border-gray-200'
        } shadow-sm`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[11px] font-medium text-gray-500">
            {message.sent ? 'Equipe Comercial' : 'Contato'}
          </span>
          <span className="text-[10px] text-gray-500">{message.time}</span>
          {message.sent && (
            <span className="text-gray-500">
              {message.read ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SalesPage() {
  // Stores
  const { courses } = useCoursesStore();
  const { classes } = useClassesStore();
  const { students, setStudents } = useStudentsStore();
  const companies = useCompaniesStore((state) => state.companies);
  const { whatsappConfig, currentUser } = useSettingsStore();

  const [apiCompanies, setApiCompanies] = useState<ApiCompany[]>([]);
  const [crmContacts, setCrmContacts] = useState<Array<{
    id: string;
    name: string;
    phone?: string;
    email?: string;
    status?: 'LEAD' | 'QUALIFIED' | 'INTERESTED' | 'NEGOTIATION' | 'ENROLLED' | 'LOST';
    updatedAt?: string;
  }>>([]);
  const apiFallbackNotifiedRef = useRef(false);

  const notifyApiFallback = () => {
    if (apiFallbackNotifiedRef.current) return;
    apiFallbackNotifiedRef.current = true;
    toast.warning('API da Central de Vendas indisponível. Exibindo dados locais.');
  };

  // Garantir que a Central de Vendas esteja conectada aos alunos (PF e PJ)
  useEffect(() => {
    if (students.length > 0) return;
    const loadStudents = async () => {
      try {
        const data = await studentsService.getAll();
        if (data.length > 0) setStudents(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadStudents();
  }, [students.length, setStudents]);

  // Fallback de empresas via API apenas para lista de contatos (sem alterar companies.store)
  useEffect(() => {
    if (companies.length > 0) return;
    if (apiCompanies.length > 0) return;
    const loadCompanies = async () => {
      try {
        const response = await companiesService.getAll(1, 200);
        setApiCompanies(response.data);
      } catch {
        notifyApiFallback();
      }
    };
    loadCompanies();
  }, [companies.length, apiCompanies.length]);

  const baseContacts = useMemo<Contact[]>(() => {
    const studentContacts: Contact[] = students.map((student) => ({
      id: `student-${student.id}`,
      studentId: student.id,
      enrollmentId: student.enrollmentId,
      name: student.name,
      phone: student.phone || '',
      email: student.email,
      lastMessage: 'Sem interação registrada',
      time: formatContactTime(student.updatedAt),
      unreadCount: 0,
      photo: student.photoUrl,
      status: getStudentContactStatus(student),
    }));

    const companyContactsFromStore: Contact[] = companies.flatMap((company) => {
      const contacts: CompanyContact[] =
        company.contacts && company.contacts.length > 0
          ? company.contacts
          : [
              {
                id: company.id,
                name: company.tradeName || company.name,
                phone: company.phone,
                email: company.email,
                isPrimary: true,
              },
            ];

      return contacts.map((contact) => ({
        id: `company-${company.id}-${contact.id}`,
        name: contact.name || company.name,
        phone: contact.phone || company.phone || '',
        email: contact.email || company.email || undefined,
        lastMessage: 'Sem interação registrada',
        time: formatContactTime(company.updatedAt),
        unreadCount: 0,
        status: getCompanyContactStatus(company),
      }));
    });

    const companyContactsFromApi: Contact[] =
      companies.length > 0
        ? []
        : apiCompanies.map((company) => ({
            id: `company-${company.id}-${company.id}`,
            name: company.tradeName || company.name,
            phone: company.phone || '',
            email: company.email || undefined,
            lastMessage: 'Sem interação registrada',
            time: formatContactTime(company.updatedAt),
            unreadCount: 0,
            status: 'lead' as const,
          }));

    return [...studentContacts, ...companyContactsFromStore, ...companyContactsFromApi];
  }, [students, companies, apiCompanies]);

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messagesByContact, setMessagesByContact] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCrmContacts = async () => {
      try {
        const data = await crmService.getContacts();
        setCrmContacts(
          (Array.isArray(data) ? data : []).map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            status: contact.status,
            updatedAt: contact.updatedAt,
          })),
        );
      } catch {
        notifyApiFallback();
      }
    };

    loadCrmContacts();
  }, []);

  const crmMappedContacts = useMemo<Contact[]>(
    () =>
      crmContacts.map((contact) => ({
        ...(students.find((student) => {
          const samePhone =
            normalizePhone(student.phone) !== '' &&
            normalizePhone(student.phone) === normalizePhone(contact.phone);
          const sameEmail =
            (student.email || '').trim().toLowerCase() !== '' &&
            (student.email || '').trim().toLowerCase() === (contact.email || '').trim().toLowerCase();
          return samePhone || sameEmail;
        })
          ? {
              studentId: students.find((student) => {
                const samePhone =
                  normalizePhone(student.phone) !== '' &&
                  normalizePhone(student.phone) === normalizePhone(contact.phone);
                const sameEmail =
                  (student.email || '').trim().toLowerCase() !== '' &&
                  (student.email || '').trim().toLowerCase() === (contact.email || '').trim().toLowerCase();
                return samePhone || sameEmail;
              })?.id,
              enrollmentId: students.find((student) => {
                const samePhone =
                  normalizePhone(student.phone) !== '' &&
                  normalizePhone(student.phone) === normalizePhone(contact.phone);
                const sameEmail =
                  (student.email || '').trim().toLowerCase() !== '' &&
                  (student.email || '').trim().toLowerCase() === (contact.email || '').trim().toLowerCase();
                return samePhone || sameEmail;
              })?.enrollmentId,
            }
          : {}),
        id: `crm-${contact.id}`,
        crmContactId: contact.id,
        name: contact.name,
        phone: contact.phone || '',
        email: contact.email,
        lastMessage: 'Sem interação registrada',
        time: formatContactTime(contact.updatedAt),
        unreadCount: 0,
        status: mapCrmStatusToContactStatus(contact.status),
      })),
    [crmContacts, students],
  );

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareToken, setShareToken] = useState('');
  const [shareEnrollmentId, setShareEnrollmentId] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const resolveStudentForContact = (contact: Contact | null): Student | null => {
    if (!contact) return null;
    if (contact.studentId) {
      return students.find((student) => student.id === contact.studentId) || null;
    }

    return (
      students.find((student) => {
        const samePhone =
          normalizePhone(student.phone) !== '' &&
          normalizePhone(student.phone) === normalizePhone(contact.phone);
        const sameEmail =
          (student.email || '').trim().toLowerCase() !== '' &&
          (student.email || '').trim().toLowerCase() === (contact.email || '').trim().toLowerCase();
        return samePhone || sameEmail;
      }) || null
    );
  };

  const ensureShareLink = async (): Promise<string | null> => {
    if (!selectedContact) {
      toast.error('Selecione um contato primeiro.');
      return null;
    }

    const selectedStudent = resolveStudentForContact(selectedContact);
    const enrollmentId = selectedContact.enrollmentId || selectedStudent?.enrollmentId;
    if (!enrollmentId) {
      toast.error('Este contato ainda não possui matrícula vinculada para gerar link.');
      return null;
    }

    if (shareLink && shareEnrollmentId === enrollmentId) return shareLink;

    try {
      setShareLoading(true);
      const result = await enrollmentOperations.generateToken({
        enrollmentId,
        expiresInHours: 24,
      });
      const token = result.enrollmentToken;
      if (!token) {
        toast.error('Não foi possível gerar o token de matrícula.');
        return null;
      }

      const baseUrl =
        (process.env.NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL || '').replace(/\/$/, '') ||
        (typeof window !== 'undefined' ? window.location.origin : '');
      const link = `${baseUrl}/enrollment/${token}`;
      setShareToken(token);
      setShareLink(link);
      setShareEnrollmentId(enrollmentId);
      return link;
    } catch {
      toast.error('Falha ao gerar link de matrícula.');
      return null;
    } finally {
      setShareLoading(false);
    }
  };

  const openShareDialog = async () => {
    const link = await ensureShareLink();
    if (!link) return;
    setShareDialogOpen(true);
  };

  const shareViaWhatsAppWeb = async () => {
    const link = await ensureShareLink();
    if (!link || !selectedContact) return;

    const phoneDigits = normalizePhone(selectedContact.phone);
    if (!phoneDigits) {
      toast.error('Contato sem telefone cadastrado.');
      return;
    }

    const message = `Olá ${selectedContact.name}! Segue o link de matrícula: ${link}`;
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('WhatsApp Web aberto para envio.');
  };

  const shareViaEmail = async () => {
    const link = await ensureShareLink();
    if (!link || !selectedContact) return;

    if (!selectedContact.email) {
      toast.error('Contato sem e-mail cadastrado.');
      return;
    }

    const subject = 'Link de matrícula - SM Corp';
    const body = `Olá ${selectedContact.name},\n\nSegue o link da sua matrícula:\n${link}\n\nAtenciosamente,\nEquipe SM Corp`;
    window.location.href = `mailto:${encodeURIComponent(selectedContact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyShareLink = async () => {
    const link = await ensureShareLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const mergedContacts = useMemo(() => {
    if (crmMappedContacts.length === 0) return baseContacts;

    const crmKeys = new Set(
      crmMappedContacts.map(
        (contact) =>
          `${normalizePhone(contact.phone)}|${(contact.email || '').toLowerCase()}|${contact.name.toLowerCase()}`,
      ),
    );

    const fallbackOnly = baseContacts.filter((contact) => {
      const key = `${normalizePhone(contact.phone)}|${(contact.email || '').toLowerCase()}|${contact.name.toLowerCase()}`;
      return !crmKeys.has(key);
    });

    return [...crmMappedContacts, ...fallbackOnly];
  }, [crmMappedContacts, baseContacts]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  useEffect(() => {
    setShareDialogOpen(false);
    setShareLink('');
    setShareToken('');
    setShareEnrollmentId(null);
  }, [selectedContactId]);

  const messages = useMemo(
    () => (selectedContactId ? messagesByContact[selectedContactId] || [] : []),
    [messagesByContact, selectedContactId]
  );

  useEffect(() => {
    setContacts((prev) => {
      const prevMap = new Map(prev.map((contact) => [contact.id, contact]));
      return mergedContacts.map((contact) => {
        const previous = prevMap.get(contact.id);
        return previous
          ? {
              ...contact,
              status: previous.status,
              lastMessage: previous.lastMessage || contact.lastMessage,
              time: previous.time || contact.time,
              unreadCount: previous.unreadCount,
            }
          : contact;
      });
    });
  }, [mergedContacts]);

  useEffect(() => {
    if (selectedContactId && contacts.some((contact) => contact.id === selectedContactId)) {
      return;
    }
    setSelectedContactId(contacts[0]?.id || null);
  }, [contacts, selectedContactId]);

  // Stats
  const stats: LeadStats = {
    total: contacts.length,
    leads: contacts.filter((c) => c.status === 'lead').length,
    interested: contacts.filter((c) => c.status === 'interested').length,
    enrolled: contacts.filter((c) => c.status === 'enrolled').length,
    conversionRate: Math.round(
      contacts.length > 0
        ? (contacts.filter((c) => c.status === 'enrolled').length / contacts.length) * 100
        : 0
    ),
  };

  // Handlers
  const recordInteraction = async (text: string) => {
    if (!text.trim() || !selectedContactId) return;

    const message: Message = {
      id: crypto.randomUUID(),
      text,
      sent: true,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setMessagesByContact((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), message],
    }));
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedContactId
          ? { ...contact, lastMessage: message.text, time: message.time, unreadCount: 0 }
          : contact
      )
    );
    let persistedInCrm = true;
    try {
      const selected = contacts.find((contact) => contact.id === selectedContactId);
      if (selected && currentUser?.id) {
        let contactId = selected.crmContactId;

        if (!contactId) {
          const created = await crmService.createContact({
            name: selected.name,
            email: selected.email,
            phone: selected.phone,
            source: 'MANUAL',
            status: mapContactStatusToCrmStatus(selected.status),
            assignedToId: currentUser.id,
          });

          contactId = created.id;
          setCrmContacts((prev) => [
            {
              id: created.id,
              name: created.name,
              phone: created.phone,
              email: created.email,
              status: created.status,
              updatedAt: created.updatedAt,
            },
            ...prev,
          ]);
        }

        await crmService.createActivity({
          contactId,
          type: 'WHATSAPP',
          title: 'Interação registrada pela Central de Vendas',
          description: message.text,
          createdById: currentUser.id,
        });
      }
    } catch {
      persistedInCrm = false;
      toast.warning('Interação salva localmente, mas não foi possível persistir no CRM agora.');
    }

    if (persistedInCrm) {
      toast.success('Interação registrada!');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await recordInteraction(newMessage.trim());
    setNewMessage('');
  };

  const handleUpdateContactStatus = async (contactId: string, status: Contact['status']) => {
    const target = contacts.find((contact) => contact.id === contactId);
    if (!target) return;

    try {
      if (target.crmContactId) {
        await crmService.updateContact(target.crmContactId, {
          status: mapContactStatusToCrmStatus(status),
        });
      } else {
        const created = await crmService.createContact({
          name: target.name,
          email: target.email,
          phone: target.phone,
          source: 'MANUAL',
          status: mapContactStatusToCrmStatus(status),
          assignedToId: currentUser?.id,
        });

        setCrmContacts((prev) => [
          {
            id: created.id,
            name: created.name,
            phone: created.phone,
            email: created.email,
            status: created.status,
            updatedAt: created.updatedAt,
          },
          ...prev,
        ]);
      }

      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, status } : c)));
      toast.success('Status do contato atualizado!');
    } catch {
      toast.error('Falha ao atualizar status no CRM');
    }
  };

  const handleQuickAction = async (text: string, status?: Contact['status']) => {
    if (!selectedContact) {
      toast.error('Selecione um contato primeiro.');
      return;
    }
    if (status) {
      await handleUpdateContactStatus(selectedContact.id, status);
    }
    await recordInteraction(text);
  };

  const openCallAction = () => {
    if (!selectedContact) {
      toast.error('Selecione um contato primeiro.');
      return;
    }

    const phoneDigits = normalizePhone(selectedContact.phone);
    if (!phoneDigits) {
      toast.error('Contato sem telefone cadastrado.');
      return;
    }

    window.open(`tel:${phoneDigits}`, '_self');
  };

  const openWhatsAppAction = () => {
    if (!selectedContact) {
      toast.error('Selecione um contato primeiro.');
      return;
    }

    const phoneDigits = normalizePhone(selectedContact.phone);
    if (!phoneDigits) {
      toast.error('Contato sem telefone cadastrado.');
      return;
    }

    const url = `https://wa.me/${phoneDigits}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filter contacts
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-none shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central de Vendas</h1>
              <p className="text-slate-600 text-sm">
                Relacionamento comercial integrado com CRM, matrícula e financeiro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  whatsappConfig?.enabled ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
              />
              <span className="text-xs font-medium">
                {whatsappConfig?.enabled ? 'Canal conectado' : 'Canal desconectado'}
              </span>
            </div>
            {(whatsappConfig?.number || whatsappConfig?.instanceId) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <span className="text-xs text-gray-600">Número:</span>
                <span className="text-xs font-mono font-medium">
                  {whatsappConfig?.number || whatsappConfig?.instanceId}
                </span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
        <div className="h-full mt-4">
            <Card className="h-full overflow-hidden border-slate-200 shadow-sm rounded-none">
              <div className="flex h-full min-w-0">
                {/* Contacts List */}
                <div className="hidden sm:flex sm:w-[240px] lg:w-[360px] shrink-0 border-r border-gray-200 flex-col bg-white">
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar contatos..."
                        className="flex-1 text-sm bg-transparent outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    {filteredContacts.map((contact) => (
                      <ContactItem
                        key={contact.id}
                        contact={contact}
                        selected={selectedContact?.id === contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                      />
                    ))}
                    {filteredContacts.length === 0 && (
                      <div className="p-6 text-sm text-gray-500 text-center">
                        Nenhum contato encontrado.
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Interaction Area */}
                <div className="flex-1 min-w-0 flex flex-col bg-slate-50">
                  {/* Interaction Header */}
                  <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedContact?.photo ? (
                        <img
                          src={selectedContact.photo}
                          alt={selectedContact.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {(selectedContact?.name || '—').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedContact?.name || 'Nenhum contato selecionado'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{selectedContact?.phone || ''}</p>
                          {selectedContact ? (
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(selectedContact.status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Sem contato
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedContact ? (
                        <Select
                          value={selectedContact.status}
                          onValueChange={(v: Contact['status']) =>
                            handleUpdateContactStatus(selectedContact.id, v)
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="interested">Interessado</SelectItem>
                            <SelectItem value="enrolled">Matriculado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select disabled>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Sem contato" />
                          </SelectTrigger>
                        </Select>
                      )}
                      <Button variant="outline" size="sm" onClick={openCallAction} disabled={!selectedContact}>
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={openWhatsAppAction} disabled={!selectedContact}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Interaction Timeline */}
                  <ScrollArea className="flex-1 p-4 bg-slate-50">
                    <div className="space-y-3 max-w-4xl mx-auto">
                      {messages.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-8">
                          {selectedContact ? 'Nenhuma interação registrada.' : 'Selecione um contato para iniciar.'}
                        </div>
                      )}
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Interaction Input */}
                  <div className="bg-white px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={selectedContact ? 'Registrar interação comercial' : 'Selecione um contato'}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-white"
                        disabled={!selectedContact}
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-red-600 hover:bg-red-700 h-10 px-4"
                        disabled={!selectedContact || !newMessage.trim()}
                      >
                        <Send className="w-4 h-4 mr-2 text-white" />
                        Registrar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contact Details & Quick Actions Sidebar */}
                <div className="hidden xl:block xl:w-[360px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
                  <div className="p-4">
                    {/* Contact Profile */}
                    <div className="text-center mb-4 pb-4 border-b border-gray-100">
                      {selectedContact?.photo ? (
                        <img
                          src={selectedContact.photo}
                          alt={selectedContact.name}
                          className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-2xl">
                            {(selectedContact?.name || '—').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900">
                        {selectedContact?.name || 'Nenhum contato selecionado'}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedContact?.phone || ''}</p>
                      {selectedContact ? (
                        <Badge className={`mt-2 ${getStatusColor(selectedContact.status)}`}>
                          {getStatusLabel(selectedContact.status)}
                        </Badge>
                      ) : (
                        <Badge className="mt-2 bg-gray-100 text-gray-600">Sem contato</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Acoes Rapidas */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Ações Rápidas</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                            onClick={openShareDialog}
                          >
                            Enviar Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                            onClick={() =>
                              handleQuickAction(
                                'Segue nossa tabela de preços atualizada. Posso ajudar com algum curso?'
                              )
                            }
                          >
                            Tabela Preços
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                            onClick={() => handleQuickAction('Obrigado pelo contato! Fico à disposição.', 'interested')}
                          >
                            Marcar Interessado
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                            onClick={() => handleQuickAction('Matrícula confirmada! Em breve envio os próximos passos.', 'enrolled')}
                          >
                            Marcar Matriculado
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                            onClick={() => {
                              const nextClass = classes[0];
                              const nextCourse = nextClass ? courses.find((c) => c.id === nextClass.courseId) : null;
                              const label = nextClass
                                ? `${nextClass.code} - ${nextCourse?.name || 'Curso'} (${nextClass.availableSpots} vagas)`
                                : 'Sem turmas disponíveis no momento.';
                              handleQuickAction(`Próxima turma: ${label}`);
                            }}
                          >
                            Próximas Turmas
                          </Button>
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Informações dos Cursos</h4>
                        <div className="space-y-2">
                          {courses.slice(0, 3).map((course) => (
                            <Button
                              key={course.id}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs h-auto whitespace-normal py-2"
                              onClick={() => {
                                setNewMessage(`${course.name} - ${formatCurrency(course.price)}`);
                              }}
                            >
                              {course.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Ready Messages - matching Figma */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Mensagens Prontas</h4>
                        <div className="space-y-1">
                          {READY_MESSAGES.map((msg, idx) => (
                            <button
                              key={idx}
                              onClick={() => setNewMessage(msg.text)}
                              className="w-full text-left text-xs text-green-700 hover:text-green-900 hover:bg-green-100 rounded px-2 py-1 transition-colors"
                            >
                              • {msg.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Next Classes */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-purple-900 mb-2">Próximas Turmas</h4>
                        <div className="space-y-2">
                          {classes.slice(0, 3).map((classItem) => {
                            const course = courses.find((c) => c.id === classItem.courseId);
                            return (
                              <div
                                key={classItem.id}
                                className="p-2 bg-white rounded text-xs border border-purple-100"
                              >
                                <p className="font-medium text-purple-900">{classItem.code}</p>
                                <p className="text-purple-600">
                                  {course?.name} • {classItem.availableSpots} vagas
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Statistics - matching Figma */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-yellow-900 mb-2">Estatísticas</h4>
                        <div className="space-y-1 text-xs text-yellow-700">
                          <p>• Leads ativos: {contacts.filter((c) => c.status === 'lead').length}</p>
                          <p>• Taxa de conversão: {contacts.length > 0 ? Math.round((contacts.filter((c) => c.status === 'enrolled').length / contacts.length) * 100) : 0}%</p>
                          <p>• Tempo médio de resposta: 15min</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
        </div>
        </div>
      </div>

      <Dialog
        open={shareDialogOpen}
        onOpenChange={(open) => {
          setShareDialogOpen(open);
          if (!open) {
            setShareLink('');
            setShareToken('');
            setShareEnrollmentId(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-red-600" />
              Compartilhar Matrícula
            </DialogTitle>
            <DialogDescription>
              Envie por WhatsApp Web, e-mail ou copie o link sem sair da Central de Vendas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border bg-gray-50 p-3 text-xs break-all">
              {shareLink || 'Gerando link...'}
            </div>

            {shareLink && (
              <div className="flex justify-center rounded-lg border p-3 bg-white">
                <QRCodeSVG value={shareLink} size={180} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={shareViaWhatsAppWeb}
                disabled={shareLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Web
              </Button>
              <Button
                type="button"
                onClick={shareViaEmail}
                disabled={shareLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Mail className="w-4 h-4 mr-2" /> E-mail
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyShareLink}
                disabled={shareLoading}
              >
                <Copy className="w-4 h-4 mr-2" /> Copiar Link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (shareLink) {
                    setNewMessage(`Link de matrícula: ${shareLink}`);
                    toast.success('Link pronto para envio no chat interno.');
                  }
                }}
                disabled={shareLoading || !shareLink}
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Usar no Chat
              </Button>
            </div>

            {shareToken && (
              <p className="text-[11px] text-gray-500 text-center">
                Token gerado: <span className="font-mono">{shareToken}</span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
