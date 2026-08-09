'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Search,
  Plus,
  Download,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  Filter,
  ChevronLeft,
  ChevronRight,
  Archive,
  RotateCcw,
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
import { useStudentsStore } from '@/stores/students.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useClassesStore } from '@/stores/classes.store';
import { useCertificatesStore, type Certificate, type CertificateStatus } from '@/stores/certificates.store';
import { certificatesService } from '@/services/certificates.service';
import { studentsService } from '@/services/students.service';
import { coursesService } from '@/services/courses.service';
import { classesService } from '@/services/classes.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import axios from 'axios';

// ============================================
// STATUS CONFIG
// ============================================
const STATUS_CONFIG: Record<CertificateStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: <FileText className="h-3 w-3" /> },
  ISSUED: { label: 'Emitido', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
  EXPIRED: { label: 'Expirado', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="h-3 w-3" /> },
  REVOKED: { label: 'Revogado', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
};


// ============================================
// PAGE
// ============================================
export default function CertificadosPage() {
  const { students } = useStudentsStore();
  const { setStudents } = useStudentsStore();
  const { courses, setCourses } = useCoursesStore();
  const { classes, setClasses } = useClassesStore();
  const { certificates, setCertificates, stats, setStats, updateCertificate, addCertificate } = useCertificatesStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  // ── Certificados excluídos (restauração) ──
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCerts, setDeletedCerts] = useState<Certificate[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    message?: string;
    certificate?: Partial<Certificate>;
  } | null>(null);
  const apiFallbackNotifiedRef = useRef(false);

  const notifyApiFallback = () => {
    if (apiFallbackNotifiedRef.current) return;
    apiFallbackNotifiedRef.current = true;
    toast.warning('API de certificados indisponível. Exibindo dados locais.');
  };

  // Garantir dados base (alunos PF + PJ e cursos) para emissão/consulta
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

  useEffect(() => {
    if (courses.length > 0) return;
    const loadCourses = async () => {
      try {
        const data = await coursesService.getAll();
        if (data.length > 0) setCourses(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadCourses();
  }, [courses.length, setCourses]);

  useEffect(() => {
    if (classes.length > 0) return;
    const loadClasses = async () => {
      try {
        const data = await classesService.getAll();
        if (data.length > 0) setClasses(data);
      } catch {
        notifyApiFallback();
      }
    };
    loadClasses();
  }, [classes.length, setClasses]);

  // Carregar dados — somente API real
  useEffect(() => {
    if (certificates.length === 0 && students.length > 0 && courses.length > 0) {
      const loadFromAPI = async () => {
        try {
          const apiCerts = await certificatesService.getAll();
          setCertificates(apiCerts);
          return;
        } catch {
          toast.error('Não foi possível carregar certificados (API indisponível).');
        }
      };
      loadFromAPI();
    }
  }, [students, courses, certificates.length, setCertificates]);

  // ── Certificados excluídos: carrega com includeDeleted e filtra os deletados ──
  const loadDeletedCertificates = async () => {
    try {
      const all = await certificatesService.getAll({ includeDeleted: true });
      setDeletedCerts(
        all.filter((c) => (c as Certificate & { deletedAt?: string | null }).deletedAt),
      );
    } catch {
      toast.error('Não foi possível carregar certificados excluídos.');
    }
  };

  const handleRestoreCertificate = async (id: string) => {
    setRestoringId(id);
    try {
      await certificatesService.restore(id);
      setDeletedCerts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Certificado restaurado com sucesso!');
      // Mantém a lista principal atualizada
      const apiCerts = await certificatesService.getAll();
      setCertificates(apiCerts);
    } catch {
      toast.error('Não foi possível restaurar o certificado.');
    } finally {
      setRestoringId(null);
    }
  };

  // Compute stats
  useEffect(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setStats({
      total: certificates.length,
      issued: certificates.filter((c) => c.status === 'ISSUED').length,
      draft: certificates.filter((c) => c.status === 'DRAFT').length,
      expired: certificates.filter((c) => c.status === 'EXPIRED').length,
      revoked: certificates.filter((c) => c.status === 'REVOKED').length,
      expiringIn30Days: certificates.filter(
        (c) => c.status === 'ISSUED' && c.expiresAt && new Date(c.expiresAt) <= in30Days && new Date(c.expiresAt) > now
      ).length,
    });
  }, [certificates, setStats]);

  // Filtros
  const filtered = certificates.filter((cert) => {
    const matchSearch =
      !search ||
      cert.code.toLowerCase().includes(search.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
      cert.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      cert.courseName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || cert.status === statusFilter;
    const matchCourse = courseFilter === 'all' || cert.courseId === courseFilter;
    
    // Filtro por tab ativa
    let matchTab = true;
    if (activeTab === 'draft') matchTab = cert.status === 'DRAFT';
    else if (activeTab === 'issued') matchTab = cert.status === 'ISSUED';
    else if (activeTab === 'expired') matchTab = cert.status === 'EXPIRED';
    
    return matchSearch && matchStatus && matchCourse && matchTab;
  });

  // Handlers
  const handleIssue = (cert: Certificate) => {
    setSelectedCert(cert);
    setShowIssueDialog(true);
  };

  const closeIssueDialog = () => {
    setShowIssueDialog(false);
    setSelectedCert(null);
  };

  const confirmIssue = async () => {
    if (!selectedCert) return;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + selectedCert.validityMonths);

    if (!user?.id) {
      toast.error('Você precisa estar logado para emitir certificados.');
      return;
    }

    try {
      const updated = await certificatesService.issue(selectedCert.id, { issuedById: user.id });
      updateCertificate(selectedCert.id, {
        ...updated,
      });
      toast.success(`Certificado ${selectedCert.code} emitido com sucesso!`);
      closeIssueDialog();
      return;
    } catch {
      toast.error('Erro ao emitir certificado (API indisponível).');
      return;
    }
  };

  const handleRevoke = (cert: Certificate) => {
    setSelectedCert(cert);
    setRevokeReason('');
    setShowRevokeDialog(true);
  };

  const closeRevokeDialog = () => {
    setShowRevokeDialog(false);
    setSelectedCert(null);
    setRevokeReason('');
  };

  const confirmRevoke = async () => {
    if (!selectedCert || !revokeReason.trim()) return;

    try {
      const updated = await certificatesService.revoke(selectedCert.id, { reason: revokeReason });
      updateCertificate(selectedCert.id, {
        ...updated,
      });
    } catch {
      toast.error('Erro ao revogar certificado (API indisponível).');
      return;
    }
    toast.success(`Certificado ${selectedCert.code} revogado.`);
    closeRevokeDialog();
  };

  const handleVerify = async () => {
    try {
      const result = await certificatesService.verify(verifyNumber.trim());
      setVerifyResult(result);
      return;
    } catch {
      toast.error('Não foi possível verificar o certificado (API indisponível).');
      setVerifyResult({ valid: false, message: 'Não foi possível verificar (API indisponível)' });
      return;
    }
  };

  const handleCreateDraft = async () => {
    if (students.length === 0 || courses.length === 0 || classes.length === 0) {
      toast.error('Não foi possível criar rascunho (dados base indisponíveis).');
      return;
    }

    const candidate = students.find(
      (s) =>
        !!s.enrollmentId &&
        !!s.classId &&
        !certificates.some((certificate) => certificate.enrollmentId === s.enrollmentId),
    );

    if (!candidate) {
      toast.info('Todos os alunos com matrícula vinculada já possuem certificado.');
      return;
    }

    if (!candidate?.enrollmentId || !candidate.classId) {
      toast.error('Não foi possível criar rascunho (aluno sem matrícula vinculada).');
      return;
    }

    const classItem = classes.find((c) => c.id === candidate.classId);
    if (!classItem?.courseId) {
      toast.error('Não foi possível criar rascunho (turma/curso não encontrado).');
      return;
    }

    const course = courses.find((c) => c.id === classItem.courseId);
    const validityMonths = course?.certificationValidity || 24;

    try {
      const created = await certificatesService.create({
        enrollmentId: candidate.enrollmentId,
        studentId: candidate.id,
        courseId: classItem.courseId,
        validityMonths,
      });
      addCertificate(created);
      toast.success('Rascunho de certificado criado!');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        try {
          const apiCerts = await certificatesService.getAll();
          setCertificates(apiCerts);
        } catch {
          toast.warning('Não foi possível atualizar a lista de certificados automaticamente.');
        }
        toast.info('Já existe um certificado para esta matrícula. Lista atualizada.');
        return;
      }
      toast.error('Erro ao criar rascunho (API indisponível).');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const tabs = ['all', 'draft', 'issued', 'expired'];
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Módulo Certificados</h1>
                    <p className="text-slate-600 text-sm">
                      Emissão, rastreamento e gestão de certificados de conclusão
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('prev')}
                    disabled={tabs.indexOf(activeTab) === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('next')}
                    disabled={tabs.indexOf(activeTab) === tabs.length - 1}
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
                    value="all"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Award className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Todos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="draft"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Rascunhos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="issued"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Emitidos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="expired"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Expirados</span>
                  </TabsTrigger>
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  <Button 
                    size="sm"
                    variant="outline"
                    className="rounded-none px-4 py-2.5 h-auto font-medium text-sm"
                    onClick={() => { setVerifyNumber(''); setVerifyResult(null); setShowVerifyDialog(true); }}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Verificar
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm shadow-md border border-red-700"
                    onClick={handleCreateDraft}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Certificado
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

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <Card className="bg-gray-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-700">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Emitidos</p>
                  <p className="text-xl font-bold text-green-700">{stats.issued}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Rascunhos</p>
                  <p className="text-xl font-bold text-blue-700">{stats.draft}</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Expirados</p>
                  <p className="text-xl font-bold text-yellow-700">{stats.expired}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Revogados</p>
                  <p className="text-xl font-bold text-red-700">{stats.revoked}</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-0 rounded-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-gray-500">Expirando 30d</p>
                  <p className="text-xl font-bold text-orange-700">{stats.expiringIn30Days}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <TabsContent value="all" className="mt-0 space-y-6">
            {/* Filtros */}
            <Card className="rounded-none">
              <CardContent className="p-3 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código, número, aluno ou curso..."
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="ISSUED">Emitido</SelectItem>
                    <SelectItem value="EXPIRED">Expirado</SelectItem>
                    <SelectItem value="REVOKED">Revogado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue placeholder="Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Cursos</SelectItem>
                    {courses.filter((c) => c.active).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

        {/* Certificados excluídos (restauração) */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-400" />
              Certificados Excluídos
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = !showDeleted;
                setShowDeleted(next);
                if (next) void loadDeletedCertificates();
              }}
            >
              {showDeleted ? 'Ocultar' : 'Ver excluídos'}
            </Button>
          </CardHeader>
          {showDeleted && (
            <CardContent className="p-0">
              {deletedCerts.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">Nenhum certificado excluído.</p>
              ) : (
                <div className="divide-y">
                  {deletedCerts.map((c) => {
                    const studentName =
                      (c as Certificate & { student?: { name?: string } }).student?.name ||
                      c.studentName;
                    const courseName =
                      (c as Certificate & { course?: { name?: string } }).course?.name ||
                      c.courseName;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{c.certificateNumber}</p>
                          <p className="text-xs text-gray-500">
                            {studentName || '—'} · {courseName || '—'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          disabled={restoringId === c.id}
                          onClick={() => handleRestoreCertificate(c.id)}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          {restoringId === c.id ? 'Restaurando...' : 'Restaurar'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {filtered.length} certificado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Código</th>
                    <th className="text-left p-3 font-medium text-gray-600">Nº Certificado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Aluno</th>
                    <th className="text-left p-3 font-medium text-gray-600">Curso</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-left p-3 font-medium text-gray-600">Emissão</th>
                    <th className="text-left p-3 font-medium text-gray-600">Validade</th>
                    <th className="text-right p-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum certificado encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((cert) => {
                      const statusCfg = STATUS_CONFIG[cert.status] || { color: 'bg-gray-100 text-gray-800', icon: Award, label: cert.status };
                      return (
                        <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-mono text-xs">{cert.code}</td>
                          <td className="p-3 font-mono text-xs">{cert.certificateNumber}</td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{cert.studentName}</div>
                            <div className="text-xs text-gray-500">{cert.studentCode}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-900">{cert.courseName}</div>
                            <div className="text-xs text-gray-500">{cert.courseCode}</div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${statusCfg.color} gap-1 text-xs`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-gray-600">{formatDate(cert.issuedAt)}</td>
                          <td className="p-3 text-xs text-gray-600">{formatDate(cert.expiresAt)}</td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {cert.status === 'DRAFT' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                                  onClick={() => handleIssue(cert)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Emitir
                                </Button>
                              )}
                              {cert.status === 'ISSUED' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={async () => {
                                      try {
                                        const blob = await certificatesService.download(cert.id);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `certificado_${cert.certificateNumber}.pdf`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        toast.success('Certificado baixado!');
                                      } catch (error) {
                                        console.error('Falha ao baixar certificado', cert.id, error);
                                        const message =
                                          error instanceof Error && error.message
                                            ? error.message
                                            : 'API indisponível';
                                        toast.error(`Erro ao baixar certificado: ${message}`);
                                      }
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    PDF
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => handleRevoke(cert)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Revogar
                                  </Button>
                                </>
                              )}
                              {(cert.status === 'EXPIRED' || cert.status === 'REVOKED') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setVerifyNumber(cert.certificateNumber || '');
                                    setVerifyResult(null);
                                    setShowVerifyDialog(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>          </TabsContent>

          <TabsContent value="draft" className="mt-0 space-y-6">
            <Card className="rounded-none">
              <CardContent className="p-8 text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Mostrando apenas certificados com status Rascunho</p>
                <p className="text-xs mt-1">Use os filtros acima para refinar a busca</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issued" className="mt-0 space-y-6">
            <Card className="rounded-none">
              <CardContent className="p-8 text-center text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Mostrando apenas certificados emitidos</p>
                <p className="text-xs mt-1">Use os filtros acima para refinar a busca</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expired" className="mt-0 space-y-6">
            <Card className="rounded-none">
              <CardContent className="p-8 text-center text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Mostrando apenas certificados expirados</p>
                <p className="text-xs mt-1">Use os filtros acima para refinar a busca</p>
              </CardContent>
            </Card>
          </TabsContent>

                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>
        {/* Dialog: Emitir */}
        <Dialog
          open={showIssueDialog}
          onOpenChange={(open) => {
            if (!open) closeIssueDialog();
            else setShowIssueDialog(true);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Emitir Certificado
              </DialogTitle>
              <DialogDescription>Confirme a emissao do certificado selecionado.</DialogDescription>
            </DialogHeader>
            {selectedCert && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <Label className="text-xs text-gray-500">Aluno</Label>
                    <p className="font-medium">{selectedCert.studentName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Curso</Label>
                    <p className="font-medium">{selectedCert.courseName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Nº Certificado</Label>
                    <p className="font-mono">{selectedCert.certificateNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Validade</Label>
                    <p>{selectedCert.validityMonths} meses</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-700">
                  <strong>Atenção:</strong> Após emitido, o certificado só pode ser revogado com justificativa.
                  Verifique se todos os pré-requisitos foram atendidos (frequência, provas, documentos).
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeIssueDialog}>
                Cancelar
              </Button>
              <Button onClick={confirmIssue} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar Emissão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Revogar */}
        <Dialog
          open={showRevokeDialog}
          onOpenChange={(open) => {
            if (!open) closeRevokeDialog();
            else setShowRevokeDialog(true);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Revogar Certificado
              </DialogTitle>
              <DialogDescription>Informe o motivo para revogar o certificado.</DialogDescription>
            </DialogHeader>
            {selectedCert && (
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Certificado:</strong> {selectedCert.certificateNumber}</p>
                  <p><strong>Aluno:</strong> {selectedCert.studentName}</p>
                  <p><strong>Curso:</strong> {selectedCert.courseName}</p>
                </div>
                <div>
                  <Label>Motivo da Revogação *</Label>
                  <Textarea
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Descreva o motivo da revogação..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeRevokeDialog}>
                Cancelar
              </Button>
              <Button
                onClick={confirmRevoke}
                disabled={revokeReason.trim().length < 5}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Confirmar Revogação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Verificar Autenticidade */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                Verificar Autenticidade
              </DialogTitle>
              <DialogDescription>Verifique a validade do certificado pelo numero.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Número do Certificado</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={verifyNumber}
                    onChange={(e) => setVerifyNumber(e.target.value)}
                    placeholder="Ex: Caiso-2026-00001"
                    className="font-mono"
                  />
                  <Button onClick={handleVerify} disabled={!verifyNumber.trim()}>
                    Verificar
                  </Button>
                </div>
              </div>
              {verifyResult && (
                <div
                  className={`p-4 rounded border ${
                    verifyResult.valid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {verifyResult.valid ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-green-700 font-bold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Certificado Válido
                      </p>
                      <p><strong>Aluno:</strong> {verifyResult.certificate?.studentName || '-'}</p>
                      <p><strong>Curso:</strong> {verifyResult.certificate?.courseName || '-'}</p>
                      <p><strong>Emitido:</strong> {formatDate(verifyResult.certificate?.issuedAt)}</p>
                      <p><strong>Válido até:</strong> {formatDate(verifyResult.certificate?.expiresAt)}</p>
                    </div>
                  ) : (
                    <p className="text-red-700 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> {verifyResult.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
