'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Plus, Edit, Trash2, FileText, Link, Award, Phone, Search, Filter, Calendar, Clock, DollarSign } from 'lucide-react';
import { instructorsService, type CreateInstructorDTO, type UpdateInstructorDTO, type InstructorCertificationDTO } from '@/services/instructors.service';
import type { Instructor, InstructorCertification } from '@/stores/instructors.store';
import { useCostsStore } from '@/stores/costs.store';
import { useClassesStore } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { InstructorReportDialog, InstructorCostsDialog, type CostData } from './dialogs';

// ============================================
// Types
// ============================================

interface InstructorFormData {
  name: string;
  role: string;
  email: string;
  phone: string;
  taxId: string;
  specialties: string;
  costPerHour: number;
  costPerDay: number;
  classHourlyRate: number;
  examHourlyRate: number;
  notes: string;
}

const initialFormData: InstructorFormData = {
  name: '',
  role: '',
  email: '',
  phone: '',
  taxId: '',
  specialties: '',
  costPerHour: 0,
  costPerDay: 0,
  classHourlyRate: 0,
  examHourlyRate: 0,
  notes: '',
};

// ============================================
// Component
// ============================================

export function InstructorsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [formData, setFormData] = useState<InstructorFormData>(initialFormData);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [costsDialogOpen, setCostsDialogOpen] = useState(false);
  const [certsDialogOpen, setCertsDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [certFormData, setCertFormData] = useState<InstructorCertificationDTO>({
    name: '',
    issuedBy: '',
    issuedAt: new Date().toISOString().slice(0, 10),
    expiresAt: '',
    documentUrl: '',
  });
  const { auditableCosts, linkInstructorCost, unlinkInstructorCost } = useCostsStore();
  const { classes: allClasses } = useClassesStore();
  const { courses: allCourses } = useCoursesStore();

  const availableCosts = useMemo(
    () => auditableCosts.filter((cost) => cost.active && cost.linkType !== 'company'),
    [auditableCosts]
  );

  const costOptions = useMemo<CostData[]>(
    () =>
      availableCosts.map((cost) => ({
        id: cost.id,
        code: cost.code,
        name: cost.name,
        value: cost.value,
        bindingType: cost.linkType === 'instructor' ? 'instructor' : undefined,
      })),
    [availableCosts]
  );

  const linkedCostIds = useMemo(() => {
    if (!selectedInstructor) return [];
    return availableCosts
      .filter((cost) => cost.instructorId === selectedInstructor.id)
      .map((cost) => cost.id);
  }, [availableCosts, selectedInstructor]);

  // Query
  const { data: instructors = [], isLoading, error } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsService.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateInstructorDTO) => instructorsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Instrutor criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar instrutor: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstructorDTO }) => instructorsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Instrutor atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar instrutor: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Instrutor removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover instrutor: ${error.message}`);
    },
  });

  const addCertMutation = useMutation({
    mutationFn: ({ id, cert }: { id: string; cert: InstructorCertificationDTO }) =>
      instructorsService.addCertification(id, cert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Certificação adicionada com sucesso!');
      setCertFormData({ name: '', issuedBy: '', issuedAt: new Date().toISOString().slice(0, 10), expiresAt: '', documentUrl: '' });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar certificação: ${error.message}`);
    },
  });

  const removeCertMutation = useMutation({
    mutationFn: ({ instructorId, certId }: { instructorId: string; certId: string }) =>
      instructorsService.removeCertification(instructorId, certId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Certificação removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover certificação: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      instructorsService.update(id, { active }),
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success(active ? 'Instrutor ativado!' : 'Instrutor desativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  // Filtered instructors
  const filteredInstructors = useMemo(() => {
    return instructors.filter((inst) => {
      const matchesSearch =
        !searchTerm ||
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.specialties?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && inst.active) ||
        (statusFilter === 'inactive' && !inst.active);
      return matchesSearch && matchesStatus;
    });
  }, [instructors, searchTerm, statusFilter]);

  // Handlers
  const handleOpenDialog = (instructor?: Instructor) => {
    if (instructor) {
      setEditingInstructor(instructor);
      setFormData({
        name: instructor.name,
        role: instructor.role || '',
        email: instructor.email || '',
        phone: instructor.phone || '',
        taxId: instructor.taxId || '',
        specialties: instructor.specialties?.join(', ') || '',
        costPerHour: instructor.costPerHour || 0,
        costPerDay: instructor.costPerDay || 0,
        classHourlyRate: instructor.classHourlyRate || 0,
        examHourlyRate: instructor.examHourlyRate || 0,
        notes: instructor.notes || '',
      });
    } else {
      setEditingInstructor(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInstructor(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome do instrutor');
      return;
    }

    const specialties = formData.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const data: CreateInstructorDTO = {
      name: formData.name,
      role: formData.role || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      taxId: formData.taxId || undefined,
      specialties: specialties.length > 0 ? specialties : undefined,
      costPerHour: formData.costPerHour || undefined,
      costPerDay: formData.costPerDay || undefined,
      classHourlyRate: formData.classHourlyRate || undefined,
      examHourlyRate: formData.examHourlyRate || undefined,
      notes: formData.notes || undefined,
    };

    if (editingInstructor) {
      updateMutation.mutate({ id: editingInstructor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o instrutor "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenReport = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setReportDialogOpen(true);
  };

  const handleOpenCosts = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setCostsDialogOpen(true);
  };

  const handleLinkCost = (costId: string) => {
    if (!selectedInstructor) return;
    linkInstructorCost(costId, selectedInstructor.id);
  };

  const handleUnlinkCost = (costId: string) => {
    unlinkInstructorCost(costId);
  };

  const handleOpenCerts = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setCertsDialogOpen(true);
  };

  const handleAddCert = () => {
    if (!selectedInstructor || !certFormData.name.trim() || !certFormData.issuedBy.trim()) {
      toast.error('Preencha nome e órgão emissor da certificação');
      return;
    }
    addCertMutation.mutate({
      id: selectedInstructor.id,
      cert: {
        ...certFormData,
        expiresAt: certFormData.expiresAt || undefined,
        documentUrl: certFormData.documentUrl || undefined,
      },
    });
  };

  const handleRemoveCert = (certId: string) => {
    if (!selectedInstructor) return;
    if (confirm('Tem certeza que deseja remover esta certificação?')) {
      removeCertMutation.mutate({ instructorId: selectedInstructor.id, certId });
    }
  };

  const handleToggleActive = (instructor: Instructor) => {
    toggleActiveMutation.mutate({ id: instructor.id, active: !instructor.active });
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) {
      toast.error('Instrutor não possui telefone cadastrado');
      return;
    }
    const cleaned = phone.replace(/\D/g, '');
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Erro ao carregar instrutores: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['instructors'] })}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Instrutores</CardTitle>
            <CardDescription>Gerencie os instrutores cadastrados</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4" />
            Novo Instrutor
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou especialização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos ({instructors.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Ativos ({instructors.filter((i) => i.active).length})
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
                className={statusFilter === 'inactive' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                Inativos ({instructors.filter((i) => !i.active).length})
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredInstructors.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum instrutor cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Novo Instrutor&quot; para cadastrar
                </p>
              </div>
            ) : (
              filteredInstructors.map((instructor) => (
                <div key={instructor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{instructor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {instructor.role || 'Instrutor'}
                        {instructor.specialties?.length ? ` • ${instructor.specialties.join(', ')}` : ''}
                        {instructor.costPerHour ? ` • ${formatCurrency(instructor.costPerHour)}/hora` : ''}
                        {instructor.costPerDay ? ` • ${formatCurrency(instructor.costPerDay)}/dia` : ''}
                      </p>
                      {instructor.certifications?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-muted-foreground">
                            {instructor.certifications.length} certificação(ões)
                          </span>
                        </div>
                      )}
                      {instructor.availability?.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-muted-foreground">
                            {instructor.availability.map((a) => {
                              const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                              return `${days[a.dayOfWeek]} ${a.startTime}-${a.endTime}`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={instructor.active ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(instructor)}
                      title={instructor.active ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      {instructor.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {instructor.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWhatsApp(instructor.phone || '')}
                        title="Abrir WhatsApp"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenCerts(instructor)}
                      title="Certificações"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Award className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenReport(instructor)}
                      title="Ver Relatório"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenCosts(instructor)}
                      title="Gerenciar Custos"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(instructor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(instructor.id, instructor.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{editingInstructor ? 'Editar Instrutor' : 'Novo Instrutor'}</DialogTitle>
            <DialogDescription>
              {editingInstructor ? 'Atualize as informações do instrutor.' : 'Insira os dados do novo instrutor que deseja cadastrar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
            {/* Identificação */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Identificação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Nome *</Label>
                  <Input
                    id="instructorName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorRole">Função</Label>
                  <Input
                    id="instructorRole"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Instrutor"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorTaxId">CPF</Label>
                <Input
                  id="instructorTaxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contato
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorEmail">E-mail</Label>
                  <Input
                    id="instructorEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorPhone">Telefone</Label>
                  <Input
                    id="instructorPhone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Especialização */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" />
                Especialização
              </h3>
              <div className="space-y-2">
                <Label htmlFor="instructorSpecialties">Especializações (separadas por vírgula)</Label>
                <Textarea
                  id="instructorSpecialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Ex: NR-10, NR-33, CIPA, Primeiros Socorros"
                  rows={2}
                />
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valores
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorCostPerHour">Valor por Hora (R$)</Label>
                  <Input
                    id="instructorCostPerHour"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.costPerHour}
                    onChange={(e) => setFormData({ ...formData, costPerHour: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorCostPerDay">Valor por Diária (R$)</Label>
                  <Input
                    id="instructorCostPerDay"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.costPerDay}
                    onChange={(e) => setFormData({ ...formData, costPerDay: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorClassHourlyRate">Valor/Hora Aula (R$)</Label>
                  <Input
                    id="instructorClassHourlyRate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.classHourlyRate}
                    onChange={(e) => setFormData({ ...formData, classHourlyRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorExamHourlyRate">Valor/Hora Prova (R$)</Label>
                  <Input
                    id="instructorExamHourlyRate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.examHourlyRate}
                    onChange={(e) => setFormData({ ...formData, examHourlyRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </h3>
              <div className="space-y-2">
                <Textarea
                  id="instructorNotes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações sobre o instrutor"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-3 border-t flex-shrink-0 bg-white flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : editingInstructor ? 'Salvar Alterações' : 'Salvar Instrutor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <InstructorReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        instructor={selectedInstructor ? {
          id: selectedInstructor.id,
          code: selectedInstructor.code || `INS${selectedInstructor.id.slice(0, 4).toUpperCase()}`,
          name: selectedInstructor.name,
          role: selectedInstructor.role || selectedInstructor.specialties?.join(', ') || 'Instrutor',
          phone: selectedInstructor.phone,
          linkedCostIds,
        } : null}
        classes={allClasses.map(c => ({ id: c.id, name: c.displayName || c.code, courseId: c.courseId, status: c.status as any, instructors: c.instructors?.map(i => ({ instructorId: i.instructorId, presences: (i as any).presences || i.attendances?.map((a: any) => ({ id: a.id || crypto.randomUUID(), date: a.date, confirmed: a.confirmed })) || [] })) }))}
        courses={allCourses.map(c => ({ id: c.id, name: c.name }))}
      />

      {/* Costs Dialog */}
      <InstructorCostsDialog
        open={costsDialogOpen}
        onOpenChange={setCostsDialogOpen}
        instructor={selectedInstructor ? {
          id: selectedInstructor.id,
          code: selectedInstructor.code || `INS${selectedInstructor.id.slice(0, 4).toUpperCase()}`,
          name: selectedInstructor.name,
          role: selectedInstructor.role || selectedInstructor.specialties?.join(', ') || 'Instrutor',
          linkedCosts: linkedCostIds,
        } : null}
        availableCosts={costOptions}
        onLinkCost={handleLinkCost}
        onUnlinkCost={handleUnlinkCost}
      />

      {/* Certifications Dialog */}
      <Dialog open={certsDialogOpen} onOpenChange={setCertsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Certificações — {selectedInstructor?.name}
            </DialogTitle>
            <DialogDescription>Gerencie as certificações do instrutor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Existing Certifications */}
            {selectedInstructor?.certifications && selectedInstructor.certifications.length > 0 ? (
              <div className="space-y-2">
                {selectedInstructor.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Emitido por: {cert.issuedBy} • {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}
                        {cert.expiresAt && (
                          <>
                            {' '}• Expira: {new Date(cert.expiresAt).toLocaleDateString('pt-BR')}
                            {new Date(cert.expiresAt) < new Date() && (
                              <Badge variant="destructive" className="ml-1 text-[10px]">Vencida</Badge>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCert(cert.id)}
                      disabled={removeCertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma certificação cadastrada
              </p>
            )}

            {/* Add New Certification */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Adicionar Certificação</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da Certificação *</Label>
                  <Input
                    placeholder="Ex: NR-35"
                    value={certFormData.name}
                    onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Órgão Emissor *</Label>
                  <Input
                    placeholder="Ex: ABENDI"
                    value={certFormData.issuedBy}
                    onChange={(e) => setCertFormData({ ...certFormData, issuedBy: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Emissão</Label>
                  <Input
                    type="date"
                    value={certFormData.issuedAt}
                    onChange={(e) => setCertFormData({ ...certFormData, issuedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Expiração</Label>
                  <Input
                    type="date"
                    value={certFormData.expiresAt}
                    onChange={(e) => setCertFormData({ ...certFormData, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL do Documento</Label>
                <Input
                  placeholder="https://..."
                  value={certFormData.documentUrl}
                  onChange={(e) => setCertFormData({ ...certFormData, documentUrl: e.target.value })}
                />
              </div>
              <Button
                onClick={handleAddCert}
                disabled={addCertMutation.isPending}
                className="w-full"
              >
                {addCertMutation.isPending ? 'Adicionando...' : 'Adicionar Certificação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
