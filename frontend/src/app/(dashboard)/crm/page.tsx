'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Tag,
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  FileText,
  Target,
  Filter,
  BarChart3,
  Kanban,
  Activity,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCRMStore,
  type CRMContact,
  type CRMContactStatus,
  type CRMContactSource,
  type CRMActivity,
  type CRMDeal,
  type CRMPipelineStage,
  type CRMActivityType,
} from '@/stores/crm.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useAuthStore } from '@/stores/auth.store';
import { studentsService } from '@/services/students.service';
import { companiesService } from '@/services/companies.service';
import { crmService } from '@/services/crm.service';
import { toast } from 'sonner';

function deriveCRMStatusFromStudent(student: Student): CRMContactStatus {
  if (student.paymentComplete || student.status === 'Active') return 'ENROLLED';
  if (student.classId || student.linkStatus) return 'INTERESTED';
  return 'LEAD';
}

function buildCRMContactFromStudent(student: Student, companyNameById: Record<string, string>): CRMContact {
  const companyName = student.companyId ? companyNameById[student.companyId] : undefined;

  return {
    id: `student:${student.id}`,
    code: student.code,
    name: student.name,
    email: student.email,
    phone: student.phone,
    company: companyName,
    source: student.companyId ? 'COMPANY' : 'MANUAL',
    status: deriveCRMStatusFromStudent(student),
    studentId: student.id,
    companyId: student.companyId,
    tags: student.companyId ? ['PJ'] : [],
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    activitiesCount: 0,
    dealsCount: 0,
    dealsValue: 0,
  };
}

function mergeContactsWithStudents(
  existingContacts: CRMContact[],
  students: Student[],
  companyNameById: Record<string, string>
): CRMContact[] {
  const studentsById = new Map(students.map((s) => [s.id, s] as const));

  const existingByStudentId = new Map<string, CRMContact>();
  for (const contact of existingContacts) {
    if (contact.studentId) existingByStudentId.set(contact.studentId, contact);
  }

  const merged = existingContacts.map((contact) => {
    if (!contact.studentId) return contact;
    const student = studentsById.get(contact.studentId);
    if (!student) return contact;

    const derived = buildCRMContactFromStudent(student, companyNameById);

    return {
      ...derived,
      id: contact.id,
      code: contact.code || derived.code,
      source: contact.source || derived.source,
      status: contact.status || derived.status,
      tags: contact.tags?.length ? contact.tags : derived.tags,
      notes: contact.notes ?? derived.notes,
      customFields: contact.customFields ?? derived.customFields,
      lastContactAt: contact.lastContactAt ?? derived.lastContactAt,
      activitiesCount: contact.activitiesCount ?? derived.activitiesCount,
      dealsCount: contact.dealsCount ?? derived.dealsCount,
      dealsValue: contact.dealsValue ?? derived.dealsValue,
    };
  });

  for (const student of students) {
    if (existingByStudentId.has(student.id)) continue;
    merged.push(buildCRMContactFromStudent(student, companyNameById));
  }

  return merged;
}

// ============================================
// CONSTANTS
// ============================================
const STATUS_CONFIG: Record<CRMContactStatus, { label: string; color: string }> = {
  LEAD: { label: 'Lead', color: 'bg-blue-100 text-blue-700' },
  QUALIFIED: { label: 'Qualificado', color: 'bg-purple-100 text-purple-700' },
  INTERESTED: { label: 'Interessado', color: 'bg-yellow-100 text-yellow-700' },
  NEGOTIATION: { label: 'Negociação', color: 'bg-orange-100 text-orange-700' },
  ENROLLED: { label: 'Matriculado', color: 'bg-green-100 text-green-700' },
  LOST: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
};

const SOURCE_CONFIG: Record<CRMContactSource, { label: string; icon: React.ReactNode }> = {
  MANUAL: { label: 'Manual', icon: <Users className="h-3 w-3" /> },
  IMPORT: { label: 'Importação', icon: <FileText className="h-3 w-3" /> },
  WEBSITE: { label: 'Site', icon: <Target className="h-3 w-3" /> },
  WHATSAPP: { label: 'WhatsApp', icon: <MessageSquare className="h-3 w-3" /> },
  REFERRAL: { label: 'Indicação', icon: <UserCheck className="h-3 w-3" /> },
  COMPANY: { label: 'Empresa', icon: <Building2 className="h-3 w-3" /> },
};

const ACTIVITY_CONFIG: Record<CRMActivityType, { label: string; icon: React.ReactNode; color: string }> = {
  CALL: { label: 'Ligação', icon: <Phone className="h-3 w-3" />, color: 'text-blue-600' },
  EMAIL: { label: 'E-mail', icon: <Mail className="h-3 w-3" />, color: 'text-green-600' },
  WHATSAPP: { label: 'WhatsApp', icon: <MessageSquare className="h-3 w-3" />, color: 'text-emerald-600' },
  MEETING: { label: 'Reunião', icon: <Calendar className="h-3 w-3" />, color: 'text-purple-600' },
  NOTE: { label: 'Nota', icon: <FileText className="h-3 w-3" />, color: 'text-gray-600' },
  TASK: { label: 'Tarefa', icon: <CheckCircle className="h-3 w-3" />, color: 'text-orange-600' },
  FOLLOW_UP: { label: 'Follow-up', icon: <Clock className="h-3 w-3" />, color: 'text-red-600' },
};

const DEFAULT_STAGES: CRMPipelineStage[] = [
  { id: 'stage-1', name: 'Novo Lead', order: 1, color: '#6366f1', isDefault: true, isActive: true },
  { id: 'stage-2', name: 'Qualificado', order: 2, color: '#8b5cf6', isDefault: false, isActive: true },
  { id: 'stage-3', name: 'Proposta Enviada', order: 3, color: '#f59e0b', isDefault: false, isActive: true },
  { id: 'stage-4', name: 'Negociação', order: 4, color: '#f97316', isDefault: false, isActive: true },
  { id: 'stage-5', name: 'Fechado/Ganho', order: 5, color: '#22c55e', isDefault: false, isActive: true },
];


// ============================================
// PAGE
// ============================================
export default function CRMPage() {
  const store = useCRMStore();
  const { courses } = useCoursesStore();
  const { students, setStudents } = useStudentsStore();
  const currentUser = useAuthStore((s) => s.user);
  const apiFallbackNotifiedRef = useRef(false);
  const [companyNameById, setCompanyNameById] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', notes: '', source: 'MANUAL' as CRMContactSource });
  const [activityForm, setActivityForm] = useState({ type: 'CALL' as CRMActivityType, title: '', description: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: '', stageId: 'stage-1' });
  const defaultStageId = store.pipelineStages[0]?.id ?? 'stage-1';

  const notifyApiFallback = () => {
    if (apiFallbackNotifiedRef.current) return;
    apiFallbackNotifiedRef.current = true;
    toast.warning('API do CRM indisponível. Exibindo dados locais.');
  };

  useEffect(() => {
    setDealForm((prev) => {
      if (prev.stageId) return prev;
      return { ...prev, stageId: defaultStageId };
    });
  }, [defaultStageId]);

  // Carregar alunos (inclui PF e PJ via companyId)
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

  // Carregar mapa de empresas (para exibir nome no CRM dos alunos PJ)
  useEffect(() => {
    if (Object.keys(companyNameById).length > 0) return;
    const loadCompanies = async () => {
      try {
        const response = await companiesService.getAll(1, 200);
        const map: Record<string, string> = {};
        for (const company of response.data) {
          map[company.id] = company.tradeName || company.name;
        }
        setCompanyNameById(map);
      } catch {
        notifyApiFallback();
      }
    };
    loadCompanies();
  }, [companyNameById]);

  // Inicializar dados — tenta API real; se vazio, deriva a base a partir de alunos PF/PJ
  useEffect(() => {
    if (store.contacts.length === 0) {
      const loadFromAPI = async () => {
        try {
          const [contacts, deals] = await Promise.all([
            crmService.getContacts(),
            crmService.getDeals(),
          ]);
          if (contacts.length > 0) {
            store.setContacts(contacts);
            store.setDeals(deals);
            const stages = await crmService.getPipelineStages().catch(() => DEFAULT_STAGES);
            store.setPipelineStages(stages.length > 0 ? stages : DEFAULT_STAGES);
            const activities = await crmService.getPendingFollowUps().catch(() => []);
            store.setActivities(activities);
            return;
          }
        } catch {
          notifyApiFallback();
        }

        if (students.length > 0) {
          const contactsFromStudents = students.map((s) => buildCRMContactFromStudent(s, companyNameById));
          store.setContacts(contactsFromStudents);
        } else {
          store.setContacts([]);
        }
        store.setDeals([]);
        store.setActivities([]);
        store.setPipelineStages(DEFAULT_STAGES);
      };
      loadFromAPI();
    }
  }, [store, students, companyNameById]);

  // Garantir que o CRM inclua alunos PF e PJ (mesmo com contatos manuais/API)
  useEffect(() => {
    if (students.length === 0) return;
    const next = mergeContactsWithStudents(store.contacts, students, companyNameById);
    if (next.length !== store.contacts.length) {
      store.setContacts(next);
    }
  }, [students, companyNameById, store]);

  // Stats computados
  const contactStats = useMemo(() => {
    const total = store.contacts.length;
    const byStatus = store.contacts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const enrolled = byStatus['ENROLLED'] || 0;
    return {
      total,
      ...byStatus,
      conversionRate: total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0',
    };
  }, [store.contacts]);

  const dealStats = useMemo(() => {
    const open = store.deals.filter((d) => d.status === 'OPEN');
    const won = store.deals.filter((d) => d.status === 'WON');
    return {
      totalValue: open.reduce((s, d) => s + d.value, 0),
      wonValue: won.reduce((s, d) => s + d.value, 0),
      openCount: open.length,
      wonCount: won.length,
    };
  }, [store.deals]);

  // Filtrar contatos
  const filteredContacts = store.contacts.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Deals por stage (kanban)
  const dealsByStage = useMemo(() => {
    const map = new Map<string, CRMDeal[]>();
    store.pipelineStages.forEach((s) => map.set(s.id, []));
    store.deals
      .filter((d) => d.status === 'OPEN')
      .forEach((d) => {
        const arr = map.get(d.stageId) || [];
        arr.push(d);
        map.set(d.stageId, arr);
      });
    return map;
  }, [store.deals, store.pipelineStages]);

  // Atividades pendentes
  const pendingActivities = useMemo(() => {
    return store.activities
      .filter((a) => !a.completedAt)
      .sort((a, b) => {
        if (a.scheduledAt && b.scheduledAt) return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [store.activities]);

  // Handlers
  // Garante que `contact` tenha um id real no backend do CRM antes de criar
  // atividades/deals vinculados a ele. Contatos derivados de alunos (id
  // sintético `student:xxx`) ainda não têm registro em /crm/contacts —
  // cria um agora, vinculado ao aluno, e substitui a entrada local pela real.
  const ensureRealContact = async (contact: CRMContact): Promise<CRMContact> => {
    if (!contact.studentId) return contact; // já é um contato real do CRM

    const created = await crmService.createContact({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      source: contact.source,
      status: contact.status,
      assignedToId: currentUser?.id,
    });

    const resolved: CRMContact = { ...contact, ...created, studentId: contact.studentId };
    store.setContacts(store.contacts.map((c) => (c.id === contact.id ? resolved : c)));
    if (selectedContact?.id === contact.id) setSelectedContact(resolved);
    return resolved;
  };

  const handleCreateContact = async () => {
    if (!contactForm.name.trim()) return;
    try {
      const created = await crmService.createContact({
        name: contactForm.name,
        email: contactForm.email || undefined,
        phone: contactForm.phone || undefined,
        company: contactForm.company || undefined,
        notes: contactForm.notes || undefined,
        source: contactForm.source,
        status: 'LEAD',
        assignedToId: currentUser?.id,
      });
      store.addContact({
        ...created,
        tags: created.tags ?? [],
        activitiesCount: created.activitiesCount ?? 0,
        dealsCount: created.dealsCount ?? 0,
        dealsValue: created.dealsValue ?? 0,
      });
      toast.success(`Contato ${created.code} - ${created.name} criado!`);
      setShowContactDialog(false);
      setContactForm({ name: '', email: '', phone: '', company: '', notes: '', source: 'MANUAL' });
    } catch {
      toast.error('Falha ao criar contato no servidor');
    }
  };

  const handleCreateActivity = async () => {
    if (!selectedContact || !activityForm.title.trim() || !currentUser?.id) return;
    try {
      const contact = await ensureRealContact(selectedContact);
      const created = await crmService.createActivity({
        contactId: contact.id,
        type: activityForm.type,
        title: activityForm.title,
        description: activityForm.description || undefined,
        createdById: currentUser.id,
      });
      store.addActivity({ createdByName: currentUser.name, ...created });
      toast.success('Atividade registrada!');
      setShowActivityDialog(false);
      setActivityForm({ type: 'CALL', title: '', description: '' });
    } catch {
      toast.error('Falha ao registrar atividade no servidor');
    }
  };

  const handleCreateDeal = async () => {
    if (!selectedContact || !dealForm.title.trim()) return;
    try {
      const contact = await ensureRealContact(selectedContact);
      const stage = store.pipelineStages.find((s) => s.id === dealForm.stageId);
      const created = await crmService.createDeal({
        contactId: contact.id,
        stageId: dealForm.stageId,
        title: dealForm.title,
        value: parseFloat(dealForm.value) || 0,
      });
      store.addDeal({
        contactName: contact.name,
        contactCode: contact.code,
        stageName: stage?.name || '',
        stageColor: stage?.color || '#6366f1',
        ...created,
      });
      toast.success(`Deal ${created.code} criado!`);
      setShowDealDialog(false);
      setDealForm({ title: '', value: '', stageId: 'stage-1' });
    } catch {
      toast.error('Falha ao criar deal no servidor');
    }
  };

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    const stage = store.pipelineStages.find((s) => s.id === newStageId);
    try {
      const updated = await crmService.moveDeal(dealId, newStageId);
      store.updateDeal(dealId, {
        ...updated,
        stageName: stage?.name ?? updated.stageName,
        stageColor: stage?.color ?? updated.stageColor,
      });
      toast.success('Deal movido!');
    } catch {
      toast.error('Falha ao mover deal no servidor');
    }
  };

  const handleConvertContact = async (contact: CRMContact) => {
    if (contact.studentId) {
      toast.error('Este contato já corresponde a um aluno matriculado.');
      return;
    }
    try {
      const result = await crmService.convertToStudent(contact.id);
      const studentId = (result as { studentId?: string; student?: { id?: string } })?.studentId
        ?? (result as { studentId?: string; student?: { id?: string } })?.student?.id;
      store.updateContact(contact.id, { status: 'ENROLLED', studentId });
      toast.success(`${contact.name} convertido para aluno!`);
    } catch {
      toast.error('Falha ao converter contato em aluno no servidor');
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDateTime = (d?: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tabs = ['contacts', 'pipeline', 'activities', 'dashboard'];
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(store.activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      store.setActiveTab(tabs[currentIndex - 1] as any);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      store.setActiveTab(tabs[currentIndex + 1] as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={store.activeTab} onValueChange={(v) => store.setActiveTab(v as any)} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM — Gestão de Relacionamento</h1>
                    <p className="text-slate-600 text-sm">
                      Contatos, funil de vendas, atividades e oportunidades
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('prev')}
                    disabled={tabs.indexOf(store.activeTab) === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('next')}
                    disabled={tabs.indexOf(store.activeTab) === tabs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Horizontal Tabs Navigation */}
              <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <TabsList className="flex w-max h-auto bg-slate-50/50 rounded-none p-1.5 gap-1.5">
                  <TabsTrigger 
                    value="contacts"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Contatos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pipeline"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Kanban className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Pipeline</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activities"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Activity className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Atividades</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dashboard"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Painel</span>
                  </TabsTrigger>
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  <Button 
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm shadow-md border border-red-700"
                    onClick={() => { setContactForm({ name: '', email: '', phone: '', company: '', notes: '', source: 'MANUAL' }); setShowContactDialog(true); }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Contato
                  </Button>
                </TabsList>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-6">

          {/* Stats Globais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-blue-50 border-0 rounded-none">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Contatos</p>
                <p className="text-xl font-bold text-blue-700">{contactStats.total}</p>
                <p className="text-xs text-gray-400">Taxa conv.: {contactStats.conversionRate}%</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-0 rounded-none">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Pipeline Aberto</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(dealStats.totalValue)}</p>
                <p className="text-xs text-gray-400">{dealStats.openCount} oportunidades</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-0 rounded-none">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Valor Ganho</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(dealStats.wonValue)}</p>
                <p className="text-xs text-gray-400">{dealStats.wonCount} fechados</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-0 rounded-none">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500">Follow-ups Pendentes</p>
                <p className="text-xl font-bold text-orange-700">{pendingActivities.length}</p>
                <p className="text-xs text-gray-400">a realizar</p>
              </CardContent>
            </Card>
          </div>

          {/* ═══════ TAB: CONTATOS ═══════ */}
          <TabsContent value="contacts" className="mt-0 space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="p-3 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar contato..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Lista de Contatos */}
            <div className="grid gap-3">
              {filteredContacts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum contato encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                filteredContacts.map((contact) => (
                  <Card key={contact.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {contact.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{contact.name}</h3>
                              <Badge className={`${STATUS_CONFIG[contact.status].color} text-xs`}>
                                {STATUS_CONFIG[contact.status].label}
                              </Badge>
                              <span className="text-xs text-gray-400 font-mono">{contact.code}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {contact.phone}
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {contact.email}
                                </span>
                              )}
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> {contact.company}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {contact.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                                  <Tag className="h-2.5 w-2.5 mr-0.5" /> {tag}
                                </Badge>
                              ))}
                              <span className="text-xs text-gray-400">
                                {SOURCE_CONFIG[contact.source]?.icon} {SOURCE_CONFIG[contact.source]?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedContact(contact);
                              setActivityForm({ type: 'CALL', title: '', description: '' });
                              setShowActivityDialog(true);
                            }}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Atividade
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedContact(contact);
                              setDealForm({ title: '', value: '', stageId: 'stage-1' });
                              setShowDealDialog(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Deal
                          </Button>
                          {contact.status !== 'ENROLLED' && contact.status !== 'LOST' && !contact.studentId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-700"
                              onClick={() => handleConvertContact(contact)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Converter
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Mini stats */}
                      <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-gray-400">
                        <span>{contact.activitiesCount || 0} atividades</span>
                        <span>{contact.dealsCount || 0} deals</span>
                        {(contact.dealsValue ?? 0) > 0 && <span>{formatCurrency(contact.dealsValue!)}</span>}
                        <span>Criado: {formatDate(contact.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ═══════ TAB: PIPELINE (KANBAN) ═══════ */}
          <TabsContent value="pipeline" className="mt-0 space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {store.pipelineStages.map((stage) => {
                const stageDeals = dealsByStage.get(stage.id) || [];
                const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                return (
                  <div key={stage.id} className="min-w-[280px] flex-shrink-0">
                    {/* Stage Header */}
                    <div
                      className="rounded-t-lg p-3 text-white text-sm font-medium flex items-center justify-between"
                      style={{ backgroundColor: stage.color }}
                    >
                      <span>{stage.name}</span>
                      <Badge className="bg-white/20 text-white text-xs">{stageDeals.length}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 border-x">
                      {formatCurrency(stageValue)}
                    </div>

                    {/* Deal Cards */}
                    <div className="bg-gray-50 rounded-b-lg border border-t-0 p-2 space-y-2 min-h-[200px]">
                      {stageDeals.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-8">
                          Nenhum deal neste estágio
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-gray-900">{deal.title}</span>
                                <span className="text-xs font-mono text-gray-400">{deal.code}</span>
                              </div>
                              <div className="text-xs text-gray-500">{deal.contactName} ({deal.contactCode})</div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-green-700">{formatCurrency(deal.value)}</span>
                                {/* Move buttons */}
                                <div className="flex gap-1">
                                  {stage.order > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const prev = store.pipelineStages.find((s) => s.order === stage.order - 1);
                                        if (prev) handleMoveDeal(deal.id, prev.id);
                                      }}
                                    >
                                      <ChevronRight className="h-3 w-3 rotate-180" />
                                    </Button>
                                  )}
                                  {stage.order < store.pipelineStages.length && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const next = store.pipelineStages.find((s) => s.order === stage.order + 1);
                                        if (next) handleMoveDeal(deal.id, next.id);
                                      }}
                                    >
                                      <ChevronRight className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════ TAB: ATIVIDADES ═══════ */}
          <TabsContent value="activities" className="mt-0 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Atividades Recentes & Pendentes ({store.activities.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {store.activities.map((act) => {
                    const cfg = ACTIVITY_CONFIG[act.type];
                    const contact = store.contacts.find((c) => c.id === act.contactId);
                    return (
                      <div key={act.id} className="p-3 flex items-start gap-3 hover:bg-gray-50">
                        <div className={`mt-1 ${cfg.color}`}>{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{act.title}</span>
                            <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                            {act.completedAt && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Concluído
                              </Badge>
                            )}
                          </div>
                          {act.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {contact && <span>{contact.name} ({contact.code})</span>}
                            <span>{formatDateTime(act.createdAt)}</span>
                            {act.scheduledAt && (
                              <span className="text-orange-600">
                                <Clock className="h-3 w-3 inline mr-0.5" />
                                Agendado: {formatDateTime(act.scheduledAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TAB: DASHBOARD ═══════ */}
          <TabsContent value="dashboard" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Leads por Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contatos por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                      const count = store.contacts.filter((c) => c.status === status).length;
                      const pct = store.contacts.length > 0
                        ? ((count / store.contacts.length) * 100).toFixed(0)
                        : '0';
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <Badge className={`${cfg.color} text-xs w-24 justify-center`}>{cfg.label}</Badge>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cfg.color.includes('blue') ? '#3b82f6'
                                  : cfg.color.includes('green') ? '#22c55e'
                                  : cfg.color.includes('yellow') ? '#eab308'
                                  : cfg.color.includes('orange') ? '#f97316'
                                  : cfg.color.includes('purple') ? '#8b5cf6'
                                  : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Leads por Origem */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contatos por Origem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(SOURCE_CONFIG).map(([source, cfg]) => {
                      const count = store.contacts.filter((c) => c.source === source).length;
                      return (
                        <div key={source} className="flex items-center justify-between py-1">
                          <span className="flex items-center gap-2 text-sm text-gray-600">
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Value */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valor por Etapa do Funil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {store.pipelineStages.map((stage) => {
                      const stageDeals = dealsByStage.get(stage.id) || [];
                      const value = stageDeals.reduce((s, d) => s + d.value, 0);
                      return (
                        <div key={stage.id} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="text-sm text-gray-600 flex-1">{stage.name}</span>
                          <span className="text-xs text-gray-400">{stageDeals.length} deals</span>
                          <span className="font-medium text-sm">{formatCurrency(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Gerais */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Métricas de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Taxa de Conversão</span>
                      <span className="text-lg font-bold text-green-700">{contactStats.conversionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ticket Médio</span>
                      <span className="text-lg font-bold text-blue-700">
                        {store.deals.length > 0
                          ? formatCurrency(store.deals.reduce((s, d) => s + d.value, 0) / store.deals.length)
                          : 'R$ 0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contatos / Mês</span>
                      <span className="text-lg font-bold text-purple-700">
                        {store.contacts.filter((c) => {
                          const d = new Date(c.createdAt);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>

        {/* ═══════ DIALOGS ═══════ */}

        {/* Novo Contato */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                Novo Contato
              </DialogTitle>
              <DialogDescription>Cadastre um novo contato no CRM.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Nome completo" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>E-mail</Label>
                  <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="email@empresa.com" className="mt-1" />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="(11) 99999-0000" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empresa</Label>
                  <Input value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} placeholder="Nome da empresa" className="mt-1" />
                </div>
                <div>
                  <Label>Origem</Label>
                  <Select value={contactForm.source || 'MANUAL'} onValueChange={(v) => setContactForm({ ...contactForm, source: v as CRMContactSource })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} placeholder="Notas..." className="mt-1" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateContact} disabled={!contactForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Criar Contato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nova Atividade */}
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Nova Atividade {selectedContact && `— ${selectedContact.name}`}
              </DialogTitle>
              <DialogDescription>Registre uma atividade para o contato selecionado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Select value={activityForm.type || 'CALL'} onValueChange={(v) => setActivityForm({ ...activityForm, type: v as CRMActivityType })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título *</Label>
                <Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="Ex: Ligar para apresentar proposta" className="mt-1" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Detalhes..." className="mt-1" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivityDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateActivity} disabled={!activityForm.title.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Novo Deal */}
        <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Nova Oportunidade {selectedContact && `— ${selectedContact.name}`}
              </DialogTitle>
              <DialogDescription>Crie uma oportunidade vinculada ao contato.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} placeholder="Ex: NR-35 turma fechada" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <Label>Etapa do Funil</Label>
                  <Select value={dealForm.stageId || defaultStageId} onValueChange={(v) => setDealForm({ ...dealForm, stageId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {store.pipelineStages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDealDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateDeal} disabled={!dealForm.title.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Criar Deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
