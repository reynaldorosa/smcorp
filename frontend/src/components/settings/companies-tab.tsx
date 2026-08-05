'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Briefcase,
  Pencil,
  Shield,
  DollarSign,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCompaniesStore, type Company } from '@/stores/companies.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { CompanyPricingDialog, EditCompanyClientDialog, type PricingRecord } from '@/components/settings/dialogs';
import { companiesService, type Company as ApiCompany } from '@/services/companies.service';

// ============================================
// TYPES
// ============================================

interface CompanyFormData {
  name: string;
  companyTaxId: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  portalAccess: boolean;
  notes: string;
  allowedPaymentMethods: string[];
  includedProducts: string[];
}

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Cheque',
  'Boleto',
  'Nota Fiscal',
];

const INITIAL_FORM_DATA: CompanyFormData = {
  name: '',
  companyTaxId: '',
  legalName: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  login: '',
  password: '',
  portalAccess: false,
  notes: '',
  allowedPaymentMethods: [],
  includedProducts: [],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCompanyTaxId(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CompaniesTab() {
  const { companies, addCompany, setCompanies, updateCompany, generateCode } = useCompaniesStore();
  const { courses } = useCoursesStore();
  const { extraProducts } = useSettingsStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>(INITIAL_FORM_DATA);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Pricing state
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [pricingCompany, setPricingCompany] = useState<Company | null>(null);

  const toStoreCompany = (
    apiCompany: ApiCompany,
    fallbackCode: string,
  ): Company => ({
    id: apiCompany.id,
    code: fallbackCode,
    name: apiCompany.name,
    tradeName: apiCompany.tradeName || undefined,
    companyTaxId: apiCompany.companyTaxId,
    phone: apiCompany.phone || undefined,
    email: apiCompany.email || undefined,
    address: apiCompany.address || undefined,
    city: apiCompany.city || undefined,
    state: apiCompany.state || undefined,
    zipCode: apiCompany.zipCode || undefined,
    portalAccess: apiCompany.portalAccess ?? false,
    portalLogin: apiCompany.portalLogin || undefined,
    allowedPaymentMethods: apiCompany.allowedPaymentMethods || [],
    pricing: (apiCompany.pricing || []).map((pricingItem) => ({
      id: pricingItem.id || crypto.randomUUID(),
      courseId: pricingItem.courseId,
      basePrice: Number(pricingItem.basePrice || 0),
      discountPercent: pricingItem.discountPercent,
      finalPrice: Number(pricingItem.finalPrice || 0),
      notes: pricingItem.notes,
      includedProductIds: pricingItem.includedProductIds || [],
      validUntil: pricingItem.validUntil,
      active: pricingItem.active !== false,
    })),
    active: apiCompany.isActive ?? true,
    createdAt: apiCompany.createdAt,
    updatedAt: apiCompany.updatedAt,
  });

  const applyApiCompany = (apiCompany: ApiCompany): Company => {
    const existing = companies.find((item) => item.id === apiCompany.id);
    const fallbackCode = existing?.code || generateCode();
    const mapped = toStoreCompany(apiCompany, fallbackCode);

    if (existing) {
      updateCompany(mapped.id, mapped);
    } else {
      addCompany(mapped);
    }

    return mapped;
  };

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      try {
        const response = await companiesService.getAll(1, 200);
        if (!mounted) return;

        const mapped = response.data.map((apiCompany, index) =>
          toStoreCompany(apiCompany, `EMP${String(index + 1).padStart(4, '0')}`),
        );

        setCompanies(mapped);
      } catch {
        toast.error('Falha ao carregar empresas do servidor');
      }
    };

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, [setCompanies]);

  // Get active courses
  const activeCourses = courses.filter(c => c.active && !c.deleted);

  // Handlers
  const handleAddCompany = async () => {
    if (!formData.name || !formData.companyTaxId || !formData.legalName) {
      toast.error('Preencha os campos obrigatórios: Nome, CNPJ e Razão Social');
      return;
    }

    try {
      const created = await companiesService.create({
        name: formData.name,
        tradeName: formData.legalName,
        companyTaxId: formData.companyTaxId.replace(/\D/g, ''),
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        portalAccess: formData.portalAccess,
        portalLogin: formData.login || undefined,
        portalPassword: formData.password || undefined,
        allowedPaymentMethods: formData.allowedPaymentMethods,
      });

      applyApiCompany(created);
      setFormData(INITIAL_FORM_DATA);
      setIsAddDialogOpen(false);
      toast.success(`Empresa ${formData.name} cadastrada com sucesso!`);
    } catch {
      toast.error('Falha ao cadastrar empresa no servidor');
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
  };

  const openPricingDialog = (company: Company) => {
    setPricingCompany(company);
    setIsPricingDialogOpen(true);
  };

  const getPricingRecords = (company: Company | null): PricingRecord[] => {
    if (!company?.pricing) return [];
    return company.pricing.map((pricing) => ({
      id: pricing.id,
      courseId: pricing.courseId,
      negotiatedPrice: pricing.finalPrice,
      includedProductIds: pricing.includedProductIds || [],
      notes: pricing.notes || '',
      validUntil: pricing.validUntil || '',
      active: pricing.active !== false,
    }));
  };

  const persistPricing = async (companyId: string, pricing: Company['pricing']) => {
    try {
      const updated = await companiesService.update(companyId, {
        pricing: pricing?.map((pricingItem) => ({
          id: pricingItem.id,
          courseId: pricingItem.courseId,
          basePrice: pricingItem.basePrice,
          discountPercent: pricingItem.discountPercent,
          finalPrice: pricingItem.finalPrice,
          notes: pricingItem.notes,
          includedProductIds: pricingItem.includedProductIds,
          validUntil: pricingItem.validUntil,
          active: pricingItem.active,
        })),
      });

      const mapped = applyApiCompany(updated);
      setPricingCompany(mapped);
    } catch {
      toast.error('Falha ao salvar precificações no servidor');
    }
  };

  // Company Form JSX (used in both Add and Edit dialogs)
  const renderCompanyForm = () => (
    <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nomeEmpresa">Nome Fantasia *</Label>
          <Input
            id="nomeEmpresa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: ABC Transportes"
          />
        </div>
        <div>
          <Label htmlFor="razaoSocialEmpresa">Razão Social *</Label>
          <Input
            id="razaoSocialEmpresa"
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            placeholder="Ex: ABC Transportes Ltda"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cnpjEmpresa">CNPJ *</Label>
        <Input
          id="cnpjEmpresa"
          value={formData.companyTaxId}
          onChange={(e) => setFormData({ ...formData, companyTaxId: formatCompanyTaxId(e.target.value) })}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
      </div>

      <div>
        <Label htmlFor="enderecoEmpresa">Endereço</Label>
        <Input
          id="enderecoEmpresa"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rua, número, bairro"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="cidadeEmpresa">Cidade</Label>
          <Input
            id="cidadeEmpresa"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Ex: São Paulo"
          />
        </div>
        <div>
          <Label htmlFor="estadoEmpresa">Estado</Label>
          <Input
            id="estadoEmpresa"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Ex: SP"
            maxLength={2}
          />
        </div>
        <div>
          <Label htmlFor="cepEmpresa">CEP</Label>
          <Input
            id="cepEmpresa"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telefoneEmpresa">Telefone</Label>
          <Input
            id="telefoneEmpresa"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
            placeholder="(11) 98765-4321"
            maxLength={15}
          />
        </div>
        <div>
          <Label htmlFor="emailEmpresa">E-mail</Label>
          <Input
            id="emailEmpresa"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contato@empresa.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notesEmpresa">Observações</Label>
        <Input
          id="notesEmpresa"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas internas sobre esta empresa"
        />
      </div>

      {/* Acesso à Área do Cliente */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-600" />
          <h3 className="font-semibold text-sm">Acesso à Área do Cliente (Módulo 06)</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="acessoAtivoEmpresa"
            checked={formData.portalAccess}
            onCheckedChange={(checked) => setFormData({ ...formData, portalAccess: checked as boolean })}
          />
          <Label htmlFor="acessoAtivoEmpresa" className="text-sm cursor-pointer">
            Permitir acesso à área do cliente (Módulo 06)
          </Label>
        </div>

        {formData.portalAccess && (
          <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-red-200">
            <div>
              <Label htmlFor="loginEmpresa">Login de Acesso *</Label>
              <Input
                id="loginEmpresa"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                placeholder="usuario_empresa"
              />
            </div>
            <div>
              <Label htmlFor="senhaEmpresa">Senha de Acesso *</Label>
              <Input
                id="senhaEmpresa"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 mb-2">
          <strong>💡 Dica:</strong> Empresas com acesso ativo poderão acessar o Módulo 06 para importar alunos e vincular a turmas usando o login e senha criados aqui.
        </p>
        <p className="text-xs text-blue-700">
          <strong>🎯 Precificações:</strong> Após criar a empresa, clique em &quot;Precificações&quot; para gerenciar os valores negociados por curso.
        </p>
      </div>

      {/* Formas de Pagamento Permitidas */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-red-600" />
          <h3 className="font-semibold text-sm">Formas de Pagamento Permitidas</h3>
        </div>
        
        <p className="text-xs text-gray-600">
          Selecione as formas de pagamento que esta empresa está autorizada a utilizar:
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {FORMAS_PAGAMENTO.map((forma) => (
            <div key={forma} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50">
              <Checkbox
                id={`forma-${forma}`}
                checked={formData.allowedPaymentMethods?.includes(forma) || false}
                onCheckedChange={(checked) => {
                  const formasAtuais = formData.allowedPaymentMethods || [];
                  const novasFormas = checked
                    ? [...formasAtuais, forma]
                    : formasAtuais.filter(f => f !== forma);
                  setFormData({ ...formData, allowedPaymentMethods: novasFormas });
                }}
              />
              <Label htmlFor={`forma-${forma}`} className="text-sm cursor-pointer flex-1">
                {forma}
              </Label>
            </div>
          ))}
        </div>
        
        {(!formData.allowedPaymentMethods || formData.allowedPaymentMethods.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-xs text-amber-700">
              ⚠️ Se nenhuma forma for selecionada, TODAS as formas de pagamento estarão disponíveis.
            </p>
          </div>
        )}
        
        {formData.allowedPaymentMethods && formData.allowedPaymentMethods.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <p className="text-xs text-green-700 font-semibold">
              ✓ {formData.allowedPaymentMethods.length} forma(s) de pagamento selecionada(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cadastro de Clientes PJ</CardTitle>
            <CardDescription>Empresas com precificação negociada e cursos vinculados</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                <DialogTitle>Adicionar Nova Empresa Cliente</DialogTitle>
                <DialogDescription>Cadastre uma nova empresa com precificação especial</DialogDescription>
              </DialogHeader>
              {renderCompanyForm()}
              <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0 bg-white">
                <Button variant="outline" onClick={() => { setFormData(INITIAL_FORM_DATA); setIsAddDialogOpen(false); }}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCompany} className="bg-red-600 hover:bg-red-700">
                  Salvar Empresa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma empresa cliente cadastrada ainda.</p>
            <p className="text-gray-400 text-xs mt-1">Clique em &quot;Nova Empresa&quot; para cadastrar seu primeiro cliente PJ.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((cliente) => {
              const pricingCount = cliente.pricing?.length || 0;
              return (
                <Card key={cliente.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-semibold text-gray-500">{cliente.code}</span>
                          <span className="font-medium text-gray-900">{cliente.name}</span>
                          {cliente.tradeName && (
                            <span className="text-xs text-gray-500">({cliente.tradeName})</span>
                          )}
                          {cliente.portalAccess && (
                            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Acesso Ativo
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-gray-500">CNPJ: </span>
                            <span className="text-gray-700">{cliente.companyTaxId}</span>
                          </div>
                          {cliente.phone && (
                            <div>
                              <span className="text-gray-500">Telefone: </span>
                              <span className="text-gray-700">{cliente.phone}</span>
                            </div>
                          )}
                          {cliente.email && (
                            <div>
                              <span className="text-gray-500">E-mail: </span>
                              <span className="text-gray-700">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.city && (
                            <div>
                              <span className="text-gray-500">Cidade: </span>
                              <span className="text-gray-700">{cliente.city}{cliente.state ? ` - ${cliente.state}` : ''}</span>
                            </div>
                          )}
                        </div>
                        {pricingCount > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs">
                              <span className="text-gray-500 font-semibold">Precificações: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cliente.pricing?.map(pricing => {
                                  const curso = courses.find(c => c.id === pricing.courseId);
                                  return (
                                    <Badge key={pricing.id} variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                                      {curso?.code || 'N/A'} - R$ {Number(pricing.finalPrice).toFixed(2)}
                                      {pricing.discountPercent && (
                                        <span className="ml-1 text-green-600">(-{pricing.discountPercent}%)</span>
                                      )}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                        <Button
                          onClick={() => openEditDialog(cliente)}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => openPricingDialog(cliente)}
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Precificações
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <EditCompanyClientDialog
        open={Boolean(editingCompany)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCompany(null);
          }
        }}
        company={editingCompany}
        courses={activeCourses}
        extraProducts={extraProducts}
        onSave={async (id, data) => {
          try {
            const updated = await companiesService.update(id, {
              name: data.name,
              tradeName: data.tradeName,
              companyTaxId: data.companyTaxId?.replace(/\D/g, ''),
              email: data.email,
              phone: data.phone,
              address: data.address,
              city: data.city,
              state: data.state,
              zipCode: data.zipCode,
              portalAccess: data.portalAccess,
              portalLogin: data.portalLogin,
              portalPassword: data.portalPassword,
              allowedPaymentMethods: data.allowedPaymentMethods,
              pricing: data.pricing?.map((pricingItem) => ({
                id: pricingItem.id,
                courseId: pricingItem.courseId,
                basePrice: pricingItem.basePrice,
                discountPercent: pricingItem.discountPercent,
                finalPrice: pricingItem.finalPrice,
                notes: pricingItem.notes,
                includedProductIds: pricingItem.includedProductIds,
                validUntil: pricingItem.validUntil,
                active: pricingItem.active,
              })),
            });

            applyApiCompany(updated);
          } catch {
            toast.error('Falha ao atualizar empresa no servidor');
          }
        }}
      />

      {pricingCompany && (
        <CompanyPricingDialog
          open={isPricingDialogOpen}
          onOpenChange={setIsPricingDialogOpen}
          companyId={pricingCompany.id}
          companyName={pricingCompany.name}
          pricingList={getPricingRecords(pricingCompany)}
          courses={activeCourses}
          extraProducts={extraProducts}
          onAddPricing={async (companyId, pricing) => {
            const course = courses.find((c) => c.id === pricing.courseId);
            const basePrice = Number(course?.price ?? 0);
            const discountPercent = basePrice > 0
              ? parseFloat((((basePrice - Number(pricing.negotiatedPrice)) / basePrice) * 100).toFixed(1))
              : undefined;

            const nextPricing = [
              ...(pricingCompany.pricing || []),
              {
              id: crypto.randomUUID(),
              courseId: pricing.courseId,
              basePrice,
              discountPercent,
              finalPrice: pricing.negotiatedPrice,
              notes: pricing.notes,
              includedProductIds: pricing.includedProductIds,
              validUntil: pricing.validUntil,
              active: pricing.active,
              },
            ];

            await persistPricing(companyId, nextPricing);
          }}
          onEditPricing={async (companyId, pricingId, data) => {
            const course = courses.find((c) => c.id === data.courseId || c.id === pricingCompany.pricing?.find((p) => p.id === pricingId)?.courseId);
            const basePrice = Number(course?.price ?? pricingCompany.pricing?.find((p) => p.id === pricingId)?.basePrice ?? 0);
            const negotiated = Number(data.negotiatedPrice ?? pricingCompany.pricing?.find((p) => p.id === pricingId)?.finalPrice ?? 0);
            const discountPercent = basePrice > 0
              ? parseFloat((((basePrice - negotiated) / basePrice) * 100).toFixed(1))
              : undefined;

            const nextPricing = (pricingCompany.pricing || []).map((p) =>
              p.id === pricingId
                ? {
                    ...p,
                    basePrice,
                    finalPrice: negotiated,
                    discountPercent,
                    notes: data.notes ?? p.notes,
                    includedProductIds: data.includedProductIds ?? p.includedProductIds,
                    validUntil: data.validUntil ?? p.validUntil,
                    active: data.active ?? p.active,
                  }
                : p,
            );

            await persistPricing(companyId, nextPricing);
          }}
          onDeletePricing={async (companyId, pricingId) => {
            const nextPricing = (pricingCompany.pricing || []).filter((p) => p.id !== pricingId);
            await persistPricing(companyId, nextPricing);
          }}
        />
      )}
    </Card>
  );
}
