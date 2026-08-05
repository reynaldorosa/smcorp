'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Building2,
  Users,
  Pencil,
  Trash2,
  FileText,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Globe,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  BookOpen,
  BarChart3,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  ChevronRight,
  Contact,
  Receipt,
  Hash,
  ChevronLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCompaniesStore, type Company, type CompanyPricing, type CompanyContact } from '@/stores/companies.store';
import { useClassesStore, type Class } from '@/stores/classes.store';
import { useStudentsStore, type Student } from '@/stores/students.store';
import { useCoursesStore, type Course } from '@/stores/courses.store';

// ============================================
// TYPES
// ============================================

interface CompanyFormData {
  name: string;
  tradeName: string;
  companyTaxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  portalAccess: boolean;
  portalLogin: string;
  portalPassword: string;
  notes: string;
  active: boolean;
}

const INITIAL_FORM_DATA: CompanyFormData = {
  name: '',
  tradeName: '',
  companyTaxId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  portalAccess: false,
  portalLogin: '',
  portalPassword: '',
  notes: '',
  active: true,
};

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCompanyTaxId(companyTaxId: string): string {
  const cleaned = companyTaxId.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ClientePJPage() {
  // Stores
  const { companies, addCompany, updateCompany, deleteCompany, generateCode, addPricing, updatePricing, deletePricing } = useCompaniesStore();
  const { classes } = useClassesStore();
  const { students } = useStudentsStore();
  const { courses } = useCoursesStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState('all');
  
  const tabs = ['all', 'active', 'inactive'];
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
      setFilterStatus(tabs[currentIndex - 1] as 'all' | 'active' | 'inactive');
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
      setFilterStatus(tabs[currentIndex + 1] as 'all' | 'active' | 'inactive');
    }
  };

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>(INITIAL_FORM_DATA);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Summary stats
  const summaryStats = useMemo(() => {
    const active = companies.filter(c => c.active).length;
    const withPortal = companies.filter(c => c.portalAccess).length;
    const totalStudents = students.filter(s => companies.some(c => c.id === s.companyId)).length;
    const totalRevenue = students
      .filter(s => companies.some(c => c.id === s.companyId))
      .reduce((acc, s) => acc + s.totalValue, 0);
    return { total: companies.length, active, withPortal, totalStudents, totalRevenue };
  }, [companies, students]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (filterStatus === 'active') result = result.filter(c => c.active);
    if (filterStatus === 'inactive') result = result.filter(c => !c.active);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.companyTaxId.includes(query) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(query))
      );
    }
    return result;
  }, [companies, searchQuery, filterStatus]);

  // Get company stats
  const getCompanyStats = (companyId: string) => {
    const companyClasses = classes.filter((c) => c.companyId === companyId);
    const companyStudents = students.filter((s) => s.companyId === companyId);
    const totalRevenue = companyStudents.reduce((acc, s) => acc + s.totalValue, 0);
    const paidRevenue = companyStudents.filter((s) => s.paymentComplete).reduce((acc, s) => acc + s.totalValue, 0);

    return {
      classCount: companyClasses.length,
      studentCount: companyStudents.length,
      totalRevenue,
      paidRevenue,
      pendingRevenue: totalRevenue - paidRevenue,
    };
  };

  // Handlers
  const handleAddCompany = () => {
    const now = new Date().toISOString();
    const newCompany: Company = {
      id: crypto.randomUUID(),
      code: generateCode(),
      name: formData.name,
      tradeName: formData.tradeName || undefined,
      companyTaxId: formData.companyTaxId.replace(/\D/g, ''),
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      portalAccess: formData.portalAccess,
      portalLogin: formData.portalLogin || undefined,
      portalPassword: formData.portalPassword || undefined,
      notes: formData.notes || undefined,
      active: formData.active,
      createdAt: now,
      updatedAt: now,
    };

    addCompany(newCompany);
    setFormData(INITIAL_FORM_DATA);
    setIsAddDialogOpen(false);
    toast.success('Empresa cadastrada com sucesso!');
  };

  const handleEditCompany = () => {
    if (!editingCompany) return;

    updateCompany(editingCompany.id, {
      name: formData.name,
      tradeName: formData.tradeName || undefined,
      companyTaxId: formData.companyTaxId.replace(/\D/g, ''),
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      portalAccess: formData.portalAccess,
      portalLogin: formData.portalLogin || undefined,
      portalPassword: formData.portalPassword || undefined,
      notes: formData.notes || undefined,
      active: formData.active,
      updatedAt: new Date().toISOString(),
    });

    setFormData(INITIAL_FORM_DATA);
    setEditingCompany(null);
    setIsEditDialogOpen(false);
    if (selectedCompany?.id === editingCompany.id) {
      setSelectedCompany({ ...selectedCompany, ...formData, companyTaxId: formData.companyTaxId.replace(/\D/g, '') });
    }
    toast.success('Empresa atualizada com sucesso!');
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      tradeName: company.tradeName || '',
      companyTaxId: formatCompanyTaxId(company.companyTaxId),
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zipCode: company.zipCode || '',
      portalAccess: company.portalAccess,
      portalLogin: company.portalLogin || '',
      portalPassword: company.portalPassword || '',
      notes: company.notes || '',
      active: company.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCompany = () => {
    if (!companyToDelete) return;
    deleteCompany(companyToDelete.id);
    setCompanyToDelete(null);
    setIsDeleteDialogOpen(false);
    if (selectedCompany?.id === companyToDelete.id) {
      setSelectedCompany(null);
    }
    toast.success('Empresa removida com sucesso!');
  };

  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const handleAddPricing = (companyId: string, pricing: CompanyPricing) => {
    addPricing(companyId, pricing);
    setSelectedCompany(useCompaniesStore.getState().companies.find((c) => c.id === companyId) || selectedCompany);
    toast.success('Precificação adicionada com sucesso!');
  };

  const handleDeletePricing = (companyId: string, pricingId: string) => {
    if (!confirm('Deseja realmente excluir esta precificação?')) {
      return;
    }

    deletePricing(companyId, pricingId);
    setSelectedCompany(useCompaniesStore.getState().companies.find((c) => c.id === companyId) || selectedCompany);
    toast.success('Precificação excluída com sucesso!');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setFilterStatus(v as 'all' | 'active' | 'inactive'); }} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes PJ</h1>
                    <p className="text-slate-600 text-sm">Gestão de empresas parceiras e contratantes</p>
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
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Todas ({companies.length})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Ativas ({companies.filter(c => c.active).length})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="inactive"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Inativas ({companies.filter(c => !c.active).length})</span>
                  </TabsTrigger>
                  
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 rounded-none px-4 py-2.5 h-auto font-medium text-sm shadow-md border border-red-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Empresa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                        <DialogDescription>
                          Adicione um novo cliente corporativo ao sistema
                        </DialogDescription>
                      </DialogHeader>
                      <CompanyForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleAddCompany}
                        onCancel={() => setIsAddDialogOpen(false)}
                        submitLabel="Cadastrar Empresa"
                      />
                    </DialogContent>
                  </Dialog>
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <Card className="bg-slate-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            Total Empresas
                          </p>
                          <p className="text-xl font-bold text-slate-600">{summaryStats.total}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            Ativas
                          </p>
                          <p className="text-xl font-bold text-green-600">{summaryStats.active}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            Com Portal
                          </p>
                          <p className="text-xl font-bold text-blue-600">{summaryStats.withPortal}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            Total Alunos
                          </p>
                          <p className="text-xl font-bold text-purple-600">{summaryStats.totalStudents}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-emerald-50 border-0 rounded-none">
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            Receita Total
                          </p>
                          <p className="text-xl font-bold text-emerald-600">{formatCurrency(summaryStats.totalRevenue)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Content */}
                    <TabsContent value={activeTab} className="mt-0">
                      <div className="flex-1 overflow-hidden">
                        <div className="grid grid-cols-12 h-full">
                          {/* Companies List */}
                          <div className="col-span-12 lg:col-span-4 border-r border-slate-200 bg-white overflow-hidden flex flex-col">
                            <div className="p-4 space-y-3 border-b border-slate-100">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                  placeholder="Buscar por nome, código ou CNPJ..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-10 bg-slate-50 border-slate-200"
                                />
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                              {filteredCompanies.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                  <Building2 className="w-10 h-10 mb-3" />
                                  <p className="text-sm font-medium">Nenhuma empresa encontrada</p>
                                  <p className="text-xs mt-1">Cadastre uma nova empresa para começar</p>
                                </div>
                              ) : (
                                filteredCompanies.map((company) => {
                                  const stats = getCompanyStats(company.id);
                                  const isSelected = selectedCompany?.id === company.id;
                                  return (
                                    <div
                                      key={company.id}
                                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                                        isSelected
                                          ? 'border-red-300 bg-red-50/50 ring-1 ring-red-200'
                                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                      onClick={() => setSelectedCompany(company)}
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5 bg-slate-50">{company.code}</Badge>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                company.active
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                              variant="outline"
                            >
                              {company.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            {company.portalAccess && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-600 border-blue-200">
                                Portal
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-sm text-slate-800 truncate">{company.name}</p>
                          {company.tradeName && (
                            <p className="text-xs text-slate-500 truncate">{company.tradeName}</p>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${isSelected ? 'text-red-500' : 'text-slate-300'}`} />
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {stats.studentCount} alunos
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <BookOpen className="w-3 h-3" />
                                          {stats.classCount} turmas
                                        </span>
                                        <span className="flex items-center gap-1 ml-auto font-medium text-slate-700">
                                          {formatCurrency(stats.totalRevenue)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Company Details */}
                          <div className="col-span-12 lg:col-span-8 overflow-y-auto bg-slate-50/50">
                            {selectedCompany ? (
                              <CompanyDetails
                                company={selectedCompany}
                                classes={classes.filter((c) => c.companyId === selectedCompany.id)}
                                students={students.filter((s) => s.companyId === selectedCompany.id)}
                                courses={courses}
                                allClasses={classes}
                                stats={getCompanyStats(selectedCompany.id)}
                                onEdit={() => openEditDialog(selectedCompany)}
                                onDelete={() => openDeleteDialog(selectedCompany)}
                                onAddPricing={(pricing) => handleAddPricing(selectedCompany.id, pricing)}
                                onDeletePricing={(pricingId) => handleDeletePricing(selectedCompany.id, pricingId)}
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center px-8">
                                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-10 h-10 text-slate-300" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Selecione uma Empresa</h3>
                                  <p className="text-sm text-slate-400 max-w-sm">
                                    Clique em uma empresa da lista ao lado para visualizar detalhes, contratos, alunos e informações financeiras.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Atualize os dados da empresa</DialogDescription>
          </DialogHeader>
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditCompany}
            onCancel={() => setIsEditDialogOpen(false)}
            submitLabel="Salvar Alterações"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{companyToDelete?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// SUMMARY CARD
// ============================================

function SummaryCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  };
  const colorClass = accent ? colors[accent] || 'text-slate-600 bg-slate-50' : 'text-slate-600 bg-slate-50';
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-bold text-slate-800 text-sm">{typeof value === 'number' ? value : value}</p>
      </div>
    </div>
  );
}

// ============================================
// COMPANY DETAILS COMPONENT
// ============================================

interface CompanyDetailsProps {
  company: Company;
  classes: Class[];
  students: Student[];
  courses: Course[];
  allClasses?: Class[];
  stats: {
    classCount: number;
    studentCount: number;
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onAddPricing?: (pricing: any) => void;
  onDeletePricing?: (pricingId: string) => void;
}

function CompanyDetails({
  company,
  classes,
  students,
  courses,
  allClasses,
  stats,
  onEdit,
  onDelete,
  onAddPricing,
  onDeletePricing,
}: CompanyDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">{company.code}</Badge>
              <Badge variant={company.active ? 'default' : 'secondary'}>
                {company.active ? 'Ativa' : 'Inativa'}
              </Badge>
              {company.portalAccess && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Acesso ao Portal
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{company.name}</CardTitle>
            {company.tradeName && (
              <CardDescription className="text-base mt-1">
                {company.tradeName}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="classes">Turmas ({stats.classCount})</TabsTrigger>
            <TabsTrigger value="students">Alunos ({stats.studentCount})</TabsTrigger>
            <TabsTrigger value="contacts">Contatos ({company.contacts?.length || 0})</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Informações de Contato</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>CNPJ: {formatCompanyTaxId(company.companyTaxId)}</span>
                  </div>
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{formatPhone(company.phone)}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{company.email}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {company.address}
                        {company.city && `, ${company.city}`}
                        {company.state && ` - ${company.state}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <h4 className="font-semibold">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{stats.classCount}</div>
                    <div className="text-sm text-muted-foreground">Turmas</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{stats.studentCount}</div>
                    <div className="text-sm text-muted-foreground">Alunos</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.paidRevenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">Recebido</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(stats.pendingRevenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">Pendente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {company.notes && (
              <div className="space-y-2">
                <h4 className="font-semibold">Observações</h4>
                <p className="text-sm text-muted-foreground">{company.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="classes" className="mt-4">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma turma associada a esta empresa
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((classItem) => {
                  const course = courses.find((c) => c.id === classItem.courseId);
                  return (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{classItem.displayName || course?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {classItem.code} • {classItem.startDate} até {classItem.endDate}
                        </div>
                      </div>
                      <Badge>{classItem.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno associado a esta empresa
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.code} • {student.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={student.paymentComplete ? 'default' : 'secondary'}>
                        {student.paymentComplete ? 'Pago' : 'Pendente'}
                      </Badge>
                      <span className="font-medium">{formatCurrency(student.totalValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="financial" className="mt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Recebido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.paidRevenue)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Pendente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(stats.pendingRevenue)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Bar */}
              {stats.totalRevenue > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso de Cobrança</span>
                    <span>{Math.round((stats.paidRevenue / stats.totalRevenue) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(stats.paidRevenue / stats.totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4 mt-4">
            {(!company.contacts || company.contacts.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum contato cadastrado</p>
                <p className="text-sm">Adicione contatos desta empresa em Configurações &gt; Empresas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {company.contacts.map((contact: CompanyContact) => (
                  <div
                    key={contact.id}
                    className={`p-4 border rounded-lg ${contact.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{contact.name}</span>
                            {contact.isPrimary && (
                              <Badge variant="default" className="text-xs">Principal</Badge>
                            )}
                          </div>
                          {contact.role && (
                            <p className="text-xs text-muted-foreground">{contact.role}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPANY FORM COMPONENT
// ============================================

interface CompanyFormProps {
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

function CompanyForm({ formData, setFormData, onSubmit, onCancel, submitLabel }: CompanyFormProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Razão Social *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Razão social da empresa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeName">Nome Fantasia</Label>
          <Input
            id="tradeName"
            value={formData.tradeName}
            onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
            placeholder="Nome fantasia (se diferente)"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyTaxId">CNPJ *</Label>
          <Input
            id="companyTaxId"
            value={formData.companyTaxId}
            onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contato@empresa.com.br"
          />
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Endereço completo"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            maxLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="00000-000"
          />
        </div>
      </div>

      {/* Portal Access */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            id="portalAccess"
            checked={formData.portalAccess}
            onCheckedChange={(v) => setFormData({ ...formData, portalAccess: v })}
          />
          <Label htmlFor="portalAccess">Habilitar Acesso ao Portal</Label>
        </div>

        {formData.portalAccess && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portalLogin">Login do Portal</Label>
              <Input
                id="portalLogin"
                value={formData.portalLogin}
                onChange={(e) => setFormData({ ...formData, portalLogin: e.target.value })}
                placeholder="Usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalPassword">Senha do Portal</Label>
              <Input
                id="portalPassword"
                type="password"
                value={formData.portalPassword}
                onChange={(e) => setFormData({ ...formData, portalPassword: e.target.value })}
                placeholder="Senha"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(v) => setFormData({ ...formData, active: v })}
        />
        <Label htmlFor="active">Empresa Ativa</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={!formData.name || !formData.companyTaxId}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
