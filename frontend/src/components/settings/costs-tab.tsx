'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar,
  Users,
  Building2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { 
  costsService, 
  type Cost, 
  type CostCategory, 
  type CreateCostDTO, 
  type UpdateCostDTO,
  type CreateCostCriterionDTO,
  type UpdateCostCriterionDTO,
} from '@/services/costs.service';
import { suppliersService, type Supplier } from '@/services/suppliers.service';
import { companiesService, type Company } from '@/services/companies.service';
import { instructorsService } from '@/services/instructors.service';
import type { Instructor } from '@/stores/instructors.store';
import {
  useCostsStore,
  type CostCriterion,
  type CostTriggerAction,
} from '@/stores/costs.store';
import {
  STUDENT_TRIGGER_ACTIONS,
  INSTRUCTOR_TRIGGER_ACTIONS,
  getCostTriggerLabel,
} from '@/lib/cost-trigger-actions';

// ============================================
// Types
// ============================================

const COST_CATEGORIES: { value: CostCategory; label: string; icon: string }[] = [
  { value: 'FIXED', label: 'Fixo', icon: '📌' },
  { value: 'VARIABLE', label: 'Variável', icon: '📊' },
  { value: 'PERSONNEL', label: 'Pessoal', icon: '👤' },
  { value: 'INFRASTRUCTURE', label: 'Infraestrutura', icon: '🏢' },
  { value: 'EQUIPMENT', label: 'Equipamento', icon: '🔧' },
  { value: 'MATERIAL', label: 'Material', icon: '📦' },
  { value: 'SERVICES', label: 'Serviços', icon: '🔨' },
  { value: 'OTHER', label: 'Outros', icon: '📋' },
];

const COST_FREQUENCIES: { value: CostCriterion['frequency']; label: string }[] = [
  { value: 'Monthly', label: '📅 Mensalmente' },
  { value: 'Daily', label: '📆 Diariamente' },
  { value: 'OneTime', label: '🔹 Única vez' },
];

const DUE_DATE_CRITERIA: { value: CostCriterion['dueCriterion']; label: string }[] = [
  { value: 'CourseEndDate', label: '🎓 Data de Término do Curso' },
  { value: '30DaysAfterEnd', label: '📅 30 dias após término do curso' },
  { value: 'MonthlyClosing', label: '📊 Fechamento Mensal' },
  { value: 'SpecificDate', label: '📌 Data Específica' },
  { value: 'NoDue', label: '♾️ Sem Vencimento' },
];

const LINK_TYPES: { value: CostCriterion['linkage']; label: string }[] = [
  { value: 'EnrolledStudent', label: '👤 Aluno Matriculado' },
  { value: 'Instructor', label: '👨‍🏫 Instrutor' },
  { value: 'NotLinked', label: '🔓 Não Vinculado' },
];

interface CostFormData {
  description: string;
  amount: number;
  category: CostCategory;
  supplierId: string;
  companyId: string;
  instructorId: string;
  linkType: 'none' | 'company' | 'instructor';
  isRecurring: boolean;
  isAuditable: boolean;
  notes: string;
}

interface CriteriaFormData {
  name: string;
  frequency: CostCriterion['frequency'];
  linkage: CostCriterion['linkage'];
  dueCriterion: CostCriterion['dueCriterion'];
  monthlyClosingDay: number;
  daysAfterClosing: number;
  active: boolean;
  triggers: CostTriggerAction[];
}

const initialCostFormData: CostFormData = {
  description: '',
  amount: 0,
  category: 'FIXED',
  supplierId: '',
  companyId: '',
  instructorId: '',
  linkType: 'none',
  isRecurring: false,
  isAuditable: true,
  notes: '',
};

const initialCriteriaFormData: CriteriaFormData = {
  name: '',
  frequency: 'Monthly',
  linkage: 'EnrolledStudent',
  dueCriterion: 'CourseEndDate',
  monthlyClosingDay: 5,
  daysAfterClosing: 10,
  active: true,
  triggers: [],
};

// ============================================
// Component
// ============================================

export function CostsTab() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('costs');

  const { costCriteria, setCostCriteria } = useCostsStore();
  
  // Costs states
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [costFormData, setCostFormData] = useState<CostFormData>(initialCostFormData);
  
  // Criteria states (alinhado ao store)
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<CostCriterion | null>(null);
  const [criteriaFormData, setCriteriaFormData] = useState<CriteriaFormData>(initialCriteriaFormData);

  // Queries
  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ['costs', 'auditable'],
    queryFn: () => costsService.getAuditable(),
  });

  const { data: criteriaData, isLoading: criteriaLoading } = useQuery({
    queryKey: ['costs', 'criteria'],
    queryFn: () => costsService.getCriteria(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getAll(),
  });

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsService.getAll(),
  });

  const costs = costsData || [];
  const suppliers = suppliersData?.data || [];
  const companies = companiesData?.data || [];
  const instructors = instructorsData || [];

  useEffect(() => {
    if (criteriaData) {
      setCostCriteria(criteriaData as CostCriterion[]);
    }
  }, [criteriaData, setCostCriteria]);

  // Mutations
  const createCostMutation = useMutation({
    mutationFn: (data: CreateCostDTO) => costsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('✅ Custo criado com sucesso!');
      handleCloseCostDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar custo: ${error.message}`);
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostDTO }) => costsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('✅ Custo atualizado com sucesso!');
      handleCloseCostDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar custo: ${error.message}`);
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: (id: string) => costsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('✅ Custo removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover custo: ${error.message}`);
    },
  });

  const createCriteriaMutation = useMutation({
    mutationFn: (data: CreateCostCriterionDTO) => costsService.createCriterion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', 'criteria'] });
      toast.success('✅ Critério criado com sucesso!');
      handleCloseCriteriaDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar critério: ${error.message}`);
    },
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCriterionDTO }) =>
      costsService.updateCriterion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', 'criteria'] });
      toast.success('✅ Critério atualizado com sucesso!');
      handleCloseCriteriaDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar critério: ${error.message}`);
    },
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: (id: string) => costsService.deleteCriterion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', 'criteria'] });
      toast.success('✅ Critério removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover critério: ${error.message}`);
    },
  });

  // Cost Handlers
  const handleOpenCostDialog = (cost?: Cost) => {
    if (cost) {
      setEditingCost(cost);
      setCostFormData({
        description: cost.description,
        amount: Number(cost.amount),
        category: cost.category,
        supplierId: cost.supplierId ?? '',
        companyId: cost.companyId ?? '',
        instructorId: cost.instructorId ?? '',
        linkType: cost.linkType || 'none',
        isRecurring: cost.isRecurring,
        isAuditable: cost.isAuditable,
        notes: cost.notes || '',
      });
    } else {
      setEditingCost(null);
      setCostFormData(initialCostFormData);
    }
    setCostDialogOpen(true);
  };

  const handleCloseCostDialog = () => {
    setCostDialogOpen(false);
    setEditingCost(null);
    setCostFormData(initialCostFormData);
  };

  const handleSubmitCost = () => {
    if (!costFormData.description.trim()) {
      toast.error('Por favor, insira a descrição do custo');
      return;
    }
    if (costFormData.amount <= 0) {
      toast.error('Por favor, insira um valor maior que zero');
      return;
    }

    if (costFormData.linkType === 'company' && !costFormData.companyId) {
      toast.error('Selecione a empresa para vínculo de custo');
      return;
    }

    if (costFormData.linkType === 'instructor' && !costFormData.instructorId) {
      toast.error('Selecione o instrutor para vínculo de custo');
      return;
    }

    const data: CreateCostDTO = {
      description: costFormData.description,
      amount: costFormData.amount,
      category: costFormData.category,
      period: new Date().toISOString(),
      supplierId: costFormData.supplierId || undefined,
      companyId: costFormData.linkType === 'company' ? costFormData.companyId || undefined : undefined,
      instructorId: costFormData.linkType === 'instructor' ? costFormData.instructorId || undefined : undefined,
      linkType: costFormData.linkType,
      isRecurring: costFormData.isRecurring,
      isAuditable: costFormData.isAuditable,
      notes: costFormData.notes || undefined,
    };

    if (editingCost) {
      updateCostMutation.mutate({ id: editingCost.id, data });
    } else {
      createCostMutation.mutate(data);
    }
  };

  const handleDeleteCost = (id: string, description: string) => {
    if (confirm(`Deseja realmente excluir o custo "${description}"?\n\nEsta ação também removerá todos os lançamentos relacionados.`)) {
      deleteCostMutation.mutate(id);
    }
  };

  // Criteria Handlers (persistidos via API)
  const handleOpenCriteriaDialog = (criteria?: CostCriterion) => {
    if (criteria) {
      setEditingCriteria(criteria);
      setCriteriaFormData({
        name: criteria.name,
        frequency: criteria.frequency,
        linkage: criteria.linkage,
        dueCriterion: criteria.dueCriterion,
        monthlyClosingDay: criteria.monthlyClosingDay ?? 5,
        daysAfterClosing: criteria.daysAfterClosing ?? 0,
        active: criteria.active,
        triggers: criteria.triggers ?? [],
      });
    } else {
      setEditingCriteria(null);
      setCriteriaFormData(initialCriteriaFormData);
    }
    setCriteriaDialogOpen(true);
  };

  const handleCloseCriteriaDialog = () => {
    setCriteriaDialogOpen(false);
    setEditingCriteria(null);
    setCriteriaFormData(initialCriteriaFormData);
  };

  const handleSubmitCriteria = () => {
    if (!criteriaFormData.name.trim()) {
      toast.error('Por favor, insira o nome do critério');
      return;
    }

    const basePayload: CreateCostCriterionDTO = {
      name: criteriaFormData.name,
      frequency: criteriaFormData.frequency,
      linkage: criteriaFormData.linkage,
      dueCriterion: criteriaFormData.dueCriterion,
      monthlyClosingDay:
        criteriaFormData.dueCriterion === 'MonthlyClosing'
          ? criteriaFormData.monthlyClosingDay
          : undefined,
      daysAfterClosing:
        criteriaFormData.dueCriterion === 'MonthlyClosing'
          ? criteriaFormData.daysAfterClosing
          : undefined,
      daysUntilDue: undefined,
      triggers: criteriaFormData.triggers.length > 0 ? criteriaFormData.triggers : undefined,
      active: criteriaFormData.active,
    };

    if (editingCriteria) {
      updateCriteriaMutation.mutate({ id: editingCriteria.id, data: basePayload });
    } else {
      createCriteriaMutation.mutate(basePayload);
    }
  };

  const handleDeleteCriteria = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o critério "${name}"?`)) {
      deleteCriteriaMutation.mutate(id);
    }
  };

  const toggleTriggerAction = (action: CostTriggerAction) => {
    setCriteriaFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(action)
        ? prev.triggers.filter(a => a !== action)
        : [...prev.triggers, action],
    }));
  };

  // Helper functions
  const getCategoryLabel = (category: CostCategory) => {
    const cat = COST_CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.icon} ${cat.label}` : category;
  };

  const getFrequencyLabel = (frequency: string) => {
    const freq = COST_FREQUENCIES.find(f => f.value === frequency);
    return freq?.label || frequency;
  };

  const getDueDateLabel = (criteria: string) => {
    const due = DUE_DATE_CRITERIA.find(d => d.value === criteria);
    return due?.label || criteria;
  };

  const getLinkTypeLabel = (type: string) => {
    const link = LINK_TYPES.find(l => l.value === type);
    return link?.label || type;
  };

  // Loading state
  if (costsLoading || criteriaLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const costsWithCriteria = costs.filter(c => c.isAuditable);
  const costsWithoutCriteria = costs.filter(c => !c.isAuditable);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Custos Auditáveis
          </TabsTrigger>
          <TabsTrigger value="criteria" className="gap-2">
            <FileText className="h-4 w-4" />
            Critérios de Custo
          </TabsTrigger>
        </TabsList>

        {/* ====================================== */}
        {/* CUSTOS AUDITÁVEIS TAB */}
        {/* ====================================== */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Custos Auditáveis
                  </CardTitle>
                  <CardDescription>
                    Custos fixos que compõem a precificação dos cursos
                    <span className="ml-2 text-xs">
                      • {costsWithCriteria.length}/{costs.length} com critério vinculado
                    </span>
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenCostDialog()} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Custo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {costs.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum custo auditável cadastrado ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo Custo" para adicionar seu primeiro custo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {costs.map((cost) => {
                    const supplier = suppliers.find(s => s.id === cost.supplierId);
                    const company = companies.find(c => c.id === cost.companyId);
                    const instructor = instructors.find(i => i.id === cost.instructorId);
                    return (
                      <Card key={cost.id} className={cost.isAuditable ? 'border-2 border-green-300 bg-green-50' : 'border'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  {getCategoryLabel(cost.category)}
                                </Badge>
                                <span className="font-medium">{cost.description}</span>
                                {cost.isRecurring && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                    Recorrente
                                  </Badge>
                                )}
                              </div>
                              {supplier && (
                                <p className="text-xs text-muted-foreground">
                                  Fornecedor: {supplier.name}
                                </p>
                              )}
                              {company && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                  🏢 Empresa: {company.tradeName || company.name}
                                </p>
                              )}
                              {instructor && (
                                <p className="text-xs text-purple-600 mt-1 font-medium">
                                  👨‍🏫 Instrutor: {instructor.name}
                                </p>
                              )}
                              {cost.isAuditable ? (
                                <p className="text-xs text-green-700 mt-1 font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Custo auditável
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Sem vínculo de auditoria
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-primary text-lg">
                                R$ {Number(cost.amount).toFixed(2)}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenCostDialog(cost)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteCost(cost.id, cost.description)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================================== */}
        {/* CRITÉRIOS DE CUSTO TAB */}
        {/* ====================================== */}
        <TabsContent value="criteria">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    📋 Critérios de Custo
                  </CardTitle>
                  <CardDescription>
                    Configure critérios para lançamento e vencimento de custos
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenCriteriaDialog()} variant="outline" className="bg-green-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Critério
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {costCriteria.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum critério cadastrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Novo Critério" para adicionar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {costCriteria.map((criteria) => (
                    <Card 
                      key={criteria.id} 
                      className={`border-2 ${criteria.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-xs bg-purple-50 text-purple-700 border-purple-300">
                                {criteria.code}
                              </Badge>
                              <span className="font-semibold">{criteria.name}</span>
                              {criteria.active ? (
                                <Badge className="bg-green-600">Ativo</Badge>
                              ) : (
                                <Badge variant="outline">Inativo</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Frequência:</span>
                                <p className="font-medium">{getFrequencyLabel(criteria.frequency)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vínculo:</span>
                                <p className="font-medium">{getLinkTypeLabel(criteria.linkage)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vencimento:</span>
                                <p className="font-medium">
                                  {getDueDateLabel(criteria.dueCriterion)}
                                  {criteria.dueCriterion === 'MonthlyClosing' && (
                                    <span className="text-xs text-muted-foreground block">
                                      📅 Fecha dia {criteria.monthlyClosingDay ?? 5} | Paga +{criteria.daysAfterClosing ?? 0} dias
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Trigger Actions */}
                            {(criteria.triggers?.length || 0) > 0 && (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-purple-600 text-white text-xs">
                                    ⚡ COMANDO QUANDO
                                  </Badge>
                                  <span className="text-xs text-purple-700 font-medium">
                                    {criteria.triggers!.length} {criteria.triggers!.length === 1 ? 'ação definida' : 'ações definidas'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {criteria.triggers!.map((action) => (
                                    <Badge 
                                      key={action} 
                                      variant="outline" 
                                      className="bg-purple-50 text-purple-700 border-purple-300 text-xs"
                                    >
                                      {getCostTriggerLabel(action)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              Criado em: {new Date(criteria.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCriteriaDialog(criteria)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCriteria(criteria.id, criteria.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====================================== */}
      {/* COST DIALOG */}
      {/* ====================================== */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle>
              {editingCost ? 'Editar Custo Auditável' : 'Adicionar Novo Custo Auditável'}
            </DialogTitle>
            <DialogDescription>
              Cadastre um custo que compõe a precificação dos produtos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costDescription">Nome do Custo *</Label>
                <Input
                  id="costDescription"
                  value={costFormData.description}
                  onChange={(e) => setCostFormData({ ...costFormData, description: e.target.value })}
                  placeholder="Ex: Material Didático, Certificado"
                />
              </div>

              <div>
                <Label htmlFor="costAmount">Valor (R$) *</Label>
                <Input
                  id="costAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costFormData.amount || ''}
                  onChange={(e) => setCostFormData({ ...costFormData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="50.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costCategory">Categoria *</Label>
                <Select
                  value={costFormData.category}
                  onValueChange={(value: CostCategory) => setCostFormData({ ...costFormData, category: value })}
                >
                  <SelectTrigger id="costCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Vínculo</Label>
                <Select
                  value={costFormData.linkType}
                  onValueChange={(value: 'none' | 'company' | 'instructor') => 
                    setCostFormData({ 
                      ...costFormData, 
                      linkType: value,
                      companyId: '',
                      instructorId: '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de vínculo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vínculo</SelectItem>
                    <SelectItem value="company">🏢 Vínculo para Empresa</SelectItem>
                    <SelectItem value="instructor">👨‍🏫 Vínculo para Instrutor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {costFormData.linkType === 'company' && (
              <div>
                <Label htmlFor="costCompany">🏢 Empresa *</Label>
                <Select
                  value={costFormData.companyId}
                  onValueChange={(value) => setCostFormData({ ...costFormData, companyId: value })}
                >
                  <SelectTrigger id="costCompany">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.tradeName} - {company.companyTaxId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {costFormData.linkType === 'instructor' && (
              <div>
                <Label htmlFor="costInstructor">👨‍🏫 Instrutor *</Label>
                <Select
                  value={costFormData.instructorId}
                  onValueChange={(value) => setCostFormData({ ...costFormData, instructorId: value })}
                >
                  <SelectTrigger id="costInstructor">
                    <SelectValue placeholder="Selecione o instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor: Instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name} ({instructor.specialties?.[0] || 'Instrutor'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costSupplier">Fornecedor (opcional)</Label>
                <Select
                  value={costFormData.supplierId}
                  onValueChange={(value) => setCostFormData({ ...costFormData, supplierId: value })}
                >
                  <SelectTrigger id="costSupplier">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isRecurring"
                    checked={costFormData.isRecurring}
                    onCheckedChange={(checked) => setCostFormData({ ...costFormData, isRecurring: !!checked })}
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">Custo Recorrente</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isAuditable"
                    checked={costFormData.isAuditable}
                    onCheckedChange={(checked) => setCostFormData({ ...costFormData, isAuditable: !!checked })}
                  />
                  <Label htmlFor="isAuditable" className="cursor-pointer">Auditável</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="costNotes">Observações</Label>
              <Input
                id="costNotes"
                value={costFormData.notes}
                onChange={(e) => setCostFormData({ ...costFormData, notes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0 bg-white">
            <Button variant="outline" onClick={handleCloseCostDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitCost}
              disabled={createCostMutation.isPending || updateCostMutation.isPending}
            >
              {editingCost ? 'Salvar Alterações' : 'Salvar Custo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================== */}
      {/* CRITERIA DIALOG */}
      {/* ====================================== */}
      <Dialog open={criteriaDialogOpen} onOpenChange={setCriteriaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCriteria ? 'Editar Critério de Custo' : 'Adicionar Novo Critério de Custo'}
            </DialogTitle>
            <DialogDescription>
              Configure critérios para gestão automatizada de custos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="criteriaName">Nome do Critério *</Label>
              <Input
                id="criteriaName"
                value={criteriaFormData.name}
                onChange={(e) => setCriteriaFormData({ ...criteriaFormData, name: e.target.value })}
                placeholder="Ex: Material Didático Mensal, Taxa de Certificação"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="criteriaFrequency">Quando deve ser lançado *</Label>
                <Select
                  value={criteriaFormData.frequency}
                  onValueChange={(value: CostCriterion['frequency']) =>
                    setCriteriaFormData({ ...criteriaFormData, frequency: value })
                  }
                >
                  <SelectTrigger id="criteriaFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="criteriaLinkType">Vínculo *</Label>
                <Select
                  value={criteriaFormData.linkage}
                  onValueChange={(value: CostCriterion['linkage']) =>
                    setCriteriaFormData({ ...criteriaFormData, linkage: value, triggers: [] })
                  }
                >
                  <SelectTrigger id="criteriaLinkType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="criteriaDueDate">Critério de Vencimento *</Label>
              <Select
                value={criteriaFormData.dueCriterion}
                onValueChange={(value: CostCriterion['dueCriterion']) =>
                  setCriteriaFormData({ ...criteriaFormData, dueCriterion: value })
                }
              >
                <SelectTrigger id="criteriaDueDate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUE_DATE_CRITERIA.map((due) => (
                    <SelectItem key={due.value} value={due.value}>
                      {due.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {criteriaFormData.dueCriterion === 'MonthlyClosing' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="closingDay">Dia do Fechamento Mensal *</Label>
                    <Input
                      id="closingDay"
                      type="number"
                      min="1"
                      max="31"
                      value={criteriaFormData.monthlyClosingDay}
                      onChange={(e) => setCriteriaFormData({ 
                        ...criteriaFormData, 
                        monthlyClosingDay: parseInt(e.target.value) || 5 
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Dia do mês (1-31) para fechamento</p>
                  </div>
                  <div>
                    <Label htmlFor="daysAfterClosing">Dias p/ Pagamento após Fechamento *</Label>
                    <Input
                      id="daysAfterClosing"
                      type="number"
                      min="0"
                      max="365"
                      value={criteriaFormData.daysAfterClosing}
                      onChange={(e) => setCriteriaFormData({ 
                        ...criteriaFormData, 
                        daysAfterClosing: parseInt(e.target.value) || 10 
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Ex: 10 dias após o fechamento</p>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-0.5">ℹ️</div>
                    <div className="text-xs text-blue-800">
                      <strong>Como funciona:</strong> O sistema somará todos os custos lançados até o dia{' '}
                      <strong>{criteriaFormData.monthlyClosingDay}</strong> de cada mês e gerará um único lançamento 
                      com vencimento para <strong>{criteriaFormData.daysAfterClosing}</strong> dias após a data de fechamento.
                      <br />
                      <strong>Exemplo:</strong> Fechamento dia 25 + 10 dias = Vencimento dia 05 do mês seguinte
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Trigger Actions - Student */}
            {criteriaFormData.linkage === 'EnrolledStudent' && (
              <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold text-purple-900">
                      ⚡ COMANDO QUANDO (Opcional)
                    </Label>
                    <p className="text-xs text-purple-700 mt-1">
                      Define em qual <strong>momento/ação</strong> do card do aluno o custo será gerado.
                      <br />Se não marcar nenhuma opção, seguirá as configurações padrão do critério.
                    </p>
                  </div>
                  {criteriaFormData.triggers.length > 0 && (
                    <Badge className="bg-purple-600">
                      {criteriaFormData.triggers.length} {criteriaFormData.triggers.length === 1 ? 'ação' : 'ações'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-white rounded border">
                  {STUDENT_TRIGGER_ACTIONS.map((action) => (
                    <div key={action} className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded">
                      <Checkbox
                        id={`action-${action}`}
                        checked={criteriaFormData.triggers.includes(action)}
                        onCheckedChange={() => toggleTriggerAction(action)}
                      />
                      <Label
                        htmlFor={`action-${action}`}
                        className="text-xs font-normal cursor-pointer flex-1"
                      >
                        {getCostTriggerLabel(action)}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-purple-700 bg-purple-100 p-2 rounded">
                  <strong>💡 Dica:</strong> Marque as ações específicas que devem gerar este custo.
                  Por exemplo: "Todos Documentos Aprovados" ou "Status → Confirmado".
                </div>
              </div>
            )}

            {/* Trigger Actions - Instructor */}
            {criteriaFormData.linkage === 'Instructor' && (
              <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold text-orange-900">
                      ⚡ COMANDO QUANDO (Opcional)
                    </Label>
                    <p className="text-xs text-orange-700 mt-1">
                      Define em qual <strong>momento/ação</strong> o custo do instrutor será gerado.
                      <br />Se não marcar nenhuma opção, seguirá as configurações padrão do critério.
                    </p>
                  </div>
                  {criteriaFormData.triggers.length > 0 && (
                    <Badge className="bg-orange-600">
                      {criteriaFormData.triggers.length} {criteriaFormData.triggers.length === 1 ? 'ação' : 'ações'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 p-2 bg-white rounded border">
                  {INSTRUCTOR_TRIGGER_ACTIONS.map((action) => (
                    <div key={action} className="flex items-center space-x-2 p-2 hover:bg-orange-50 rounded">
                      <Checkbox
                        id={`action-instructor-${action}`}
                        checked={criteriaFormData.triggers.includes(action)}
                        onCheckedChange={() => toggleTriggerAction(action)}
                      />
                      <Label
                        htmlFor={`action-instructor-${action}`}
                        className="text-xs font-normal cursor-pointer flex-1"
                      >
                        {getCostTriggerLabel(action)}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  <strong>💡 Dica:</strong> Escolha quando gerar custos do instrutor:
                  <br />• "Presença Instrutor Confirmada" - ao confirmar presença em uma turma
                  <br />• "Instrutor Vinculado à Prova" - ao selecionar instrutor para uma prova no Módulo 03
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="criteriaActive"
                checked={criteriaFormData.active}
                onCheckedChange={(checked) => setCriteriaFormData({ ...criteriaFormData, active: !!checked })}
              />
              <Label htmlFor="criteriaActive" className="cursor-pointer">Critério Ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseCriteriaDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitCriteria}>
                {editingCriteria ? 'Salvar Alterações' : 'Salvar Critério'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
