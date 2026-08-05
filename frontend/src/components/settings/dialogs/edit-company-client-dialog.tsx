'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, DollarSign, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Company, CompanyPricing, Course, ExtraProduct } from '@/types';

// ============================================
// Types
// ============================================

interface PricingFormData {
  courseId: string;
  negotiatedPrice: number;
  includedProductIds: string[];
  notes: string;
  validUntil: string;
  active: boolean;
}

interface EditCompanyClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  courses: Course[];
  extraProducts: ExtraProduct[];
  onSave: (id: string, data: Partial<Omit<Company, 'id' | 'code'>>) => void;
}

// ============================================
// Component
// ============================================

export const EditCompanyClientDialog: React.FC<EditCompanyClientDialogProps> = ({
  open,
  onOpenChange,
  company,
  courses,
  extraProducts,
  onSave,
}) => {
  const [basicData, setBasicData] = useState({
    name: '',
    companyTaxId: '',
    tradeName: '',
    address: '',
    phone: '',
    email: '',
    allowedPaymentMethods: [] as string[],
    portalLogin: '',
    portalPassword: '',
    portalAccess: false,
  });

  const [pricingList, setPricingList] = useState<(CompanyPricing & { active?: boolean; includedProductIds?: string[]; validUntil?: string })[]>([]);
  const [newPricing, setNewPricing] = useState<PricingFormData>({
    courseId: '',
    negotiatedPrice: 0,
    includedProductIds: [],
    notes: '',
    validUntil: '',
    active: true,
  });

  const getLinkedProductsForCourse = (courseId: string) => {
    if (!courseId) return [];
    const course = courses.find((c) => c.id === courseId);
    if (!course) return [];

    const products: (ExtraProduct & { category: string })[] = [];

    if (course.linkedProducts) {
      course.linkedProducts.forEach((prodId) => {
        const product = extraProducts.find((p) => p.id === prodId);
        if (product) products.push({ ...product, category: 'Principal' });
      });
    }

    if (course.linkedExtras) {
      course.linkedExtras.forEach((extraId) => {
        const extra = extraProducts.find((p) => p.id === extraId);
        if (extra) products.push({ ...extra, category: 'Extra' });
      });
    }

    return products;
  };

  const getAlreadyIncludedProductIds = () => {
    const ids = new Set<string>();
    pricingList.forEach((p) => {
      if (p.active && p.includedProductIds) {
        p.includedProductIds.forEach((id) => ids.add(id));
      }
    });
    return ids;
  };

  const getAvailableProducts = (courseId: string) => {
    const allProducts = getLinkedProductsForCourse(courseId);
    const alreadyIncluded = getAlreadyIncludedProductIds();
    return allProducts.filter((p) => !alreadyIncluded.has(p.id));
  };

  useEffect(() => {
    if (company) {
      setBasicData({
        name: company.name,
        companyTaxId: company.companyTaxId,
        tradeName: company.tradeName || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allowedPaymentMethods: ((company as any).allowedPaymentMethods as string[]) || [],
        portalLogin: company.portalLogin || '',
        portalPassword: company.portalPassword || '',
        portalAccess: company.portalAccess || false,
      });
      setPricingList((company.pricing || []).map((p) => ({ ...p, active: true })));
    }
  }, [company]);

  useEffect(() => {
    if (!open) {
      setNewPricing({ courseId: '', negotiatedPrice: 0, includedProductIds: [], notes: '', validUntil: '', active: true });
    }
  }, [open]);

  const handleAddPricing = () => {
    if (!newPricing.courseId) {
      toast.error('Selecione um curso para a precificação.');
      return;
    }
    if (newPricing.includedProductIds.length === 0) {
      toast.error('Selecione pelo menos um produto para a precificação.');
      return;
    }

    const pricing: CompanyPricing & { active?: boolean; includedProductIds?: string[]; validUntil?: string } = {
      id: Date.now().toString(),
      courseId: newPricing.courseId,
      basePrice: 0,
      finalPrice: newPricing.negotiatedPrice,
      notes: newPricing.notes,
      includedProductIds: newPricing.includedProductIds,
      validUntil: newPricing.validUntil,
      active: true,
    };

    setPricingList([...pricingList, pricing]);
    setNewPricing({ courseId: '', negotiatedPrice: 0, includedProductIds: [], notes: '', validUntil: '', active: true });
    toast.success('Precificação adicionada!');
  };

  const handleRemovePricing = (id: string) => {
    setPricingList(pricingList.filter((p) => p.id !== id));
    toast.info('Precificação removida.');
  };

  const handleTogglePricingActive = (id: string) => {
    setPricingList(pricingList.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleSave = () => {
    if (!basicData.name?.trim()) {
      toast.error('Nome da empresa é obrigatório.');
      return;
    }
    if (!basicData.companyTaxId?.trim()) {
      toast.error('CNPJ é obrigatório.');
      return;
    }
    if (basicData.portalAccess && (!basicData.portalLogin || !basicData.portalPassword)) {
      toast.error('Login e senha são obrigatórios quando o acesso está ativo.');
      return;
    }
    if (company) {
      onSave(company.id, {
        ...basicData,
        pricing: pricingList,
      });
      toast.success('Cliente atualizado com sucesso!');
      onOpenChange(false);
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Curso não encontrado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            Editar Cliente Pessoa Jurídica
          </DialogTitle>
          <DialogDescription>
            {company?.code} - Edite as informações cadastrais e gerencie as precificações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-6 flex-1 min-h-0">
          {/* Basic Data */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Dados Básicos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input id="companyName" value={basicData.name} onChange={(e) => setBasicData({ ...basicData, name: e.target.value })} placeholder="Tech Solutions Ltda" />
              </div>
              <div>
                <Label htmlFor="companyTaxId">CNPJ *</Label>
                <Input id="companyTaxId" value={basicData.companyTaxId} onChange={(e) => setBasicData({ ...basicData, companyTaxId: e.target.value })} placeholder="12.345.678/0001-90" />
              </div>
              <div>
                <Label htmlFor="tradeName">Razão Social</Label>
                <Input id="tradeName" value={basicData.tradeName} onChange={(e) => setBasicData({ ...basicData, tradeName: e.target.value })} placeholder="Tech Solutions Tecnologia Ltda" />
              </div>
              <div>
                <Label htmlFor="companyPhone">Telefone</Label>
                <Input id="companyPhone" value={basicData.phone} onChange={(e) => setBasicData({ ...basicData, phone: e.target.value })} placeholder="(11) 3000-1000" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="companyEmail">E-mail</Label>
                <Input id="companyEmail" type="email" value={basicData.email} onChange={(e) => setBasicData({ ...basicData, email: e.target.value })} placeholder="contato@empresa.com" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="companyAddress">Endereço</Label>
                <Input id="companyAddress" value={basicData.address} onChange={(e) => setBasicData({ ...basicData, address: e.target.value })} placeholder="Av. Paulista, 1000 - São Paulo, SP" />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              Formas de Pagamento Permitidas
            </h3>
            <p className="text-xs text-gray-600 mb-3">Selecione as formas de pagamento que esta empresa está autorizada a utilizar:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque', 'Boleto', 'Nota Fiscal'].map((method) => (
                <div key={method} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={`edit-method-${method}`}
                    checked={basicData.allowedPaymentMethods?.includes(method) || false}
                    onCheckedChange={(checked) => {
                      const current = basicData.allowedPaymentMethods || [];
                      const updated = checked ? [...current, method] : current.filter((m) => m !== method);
                      setBasicData({ ...basicData, allowedPaymentMethods: updated });
                    }}
                  />
                  <Label htmlFor={`edit-method-${method}`} className="text-sm cursor-pointer flex-1">{method}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Portal Access */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Acesso à Área do Cliente</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="portalAccess" checked={basicData.portalAccess} onCheckedChange={(checked) => setBasicData({ ...basicData, portalAccess: checked as boolean })} />
                <Label htmlFor="portalAccess" className="cursor-pointer">Habilitar acesso à Área do Cliente (Módulo 06)</Label>
              </div>
              {basicData.portalAccess && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-red-200">
                  <div>
                    <Label htmlFor="portalLogin">Login *</Label>
                    <Input id="portalLogin" value={basicData.portalLogin} onChange={(e) => setBasicData({ ...basicData, portalLogin: e.target.value })} placeholder="usuario_empresa" />
                  </div>
                  <div>
                    <Label htmlFor="portalPassword">Senha *</Label>
                    <Input id="portalPassword" type="text" value={basicData.portalPassword} onChange={(e) => setBasicData({ ...basicData, portalPassword: e.target.value })} placeholder="senha123" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Management */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Precificações Negociadas</h3>
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-blue-900">Adicionar Nova Precificação</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6">
                      <Label htmlFor="newCourse" className="text-xs">Curso *</Label>
                      <Select value={newPricing.courseId} onValueChange={(value) => setNewPricing({ ...newPricing, courseId: value })}>
                        <SelectTrigger id="newCourse" className="bg-white h-10"><SelectValue placeholder="Selecione um curso" /></SelectTrigger>
                        <SelectContent>
                          {courses.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhum curso cadastrado</SelectItem>
                          ) : (
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>{course.code} - {course.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="newValidUntil" className="text-xs">Data de Vigência</Label>
                      <Input id="newValidUntil" type="date" value={newPricing.validUntil} onChange={(e) => setNewPricing({ ...newPricing, validUntil: e.target.value })} className="bg-white h-10 text-base" />
                    </div>
                  </div>

                  {newPricing.courseId && (
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-2">
                        <Package className="w-3 h-3 text-red-600" />
                        Produtos Inclusos na Precificação
                      </Label>
                      {getAvailableProducts(newPricing.courseId).length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-amber-700 text-center">
                            {getLinkedProductsForCourse(newPricing.courseId).length === 0
                              ? '⚠️ Este curso não possui produtos vinculados'
                              : '⚠️ Todos os produtos deste curso já estão inclusos em precificações ativas'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 border border-green-200 rounded-lg p-3 bg-white mt-2 max-h-[200px] overflow-y-auto">
                          <p className="text-xs text-green-700 mb-2">Selecione os produtos inclusos nesta precificação:</p>
                          {getAvailableProducts(newPricing.courseId).map((product) => (
                            <div key={product.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                              <Checkbox
                                id={`new-product-${product.id}`}
                                checked={newPricing.includedProductIds.includes(product.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...newPricing.includedProductIds, product.id]
                                    : newPricing.includedProductIds.filter((id) => id !== product.id);
                                  setNewPricing({ ...newPricing, includedProductIds: updated });
                                }}
                              />
                              <label htmlFor={`new-product-${product.id}`} className="flex-1 cursor-pointer text-xs">
                                <span className="font-medium">{product.name}</span>
                                <span className="ml-2 text-xs text-gray-600">R$ {Number(product.price).toFixed(2)}</span>
                                <Badge variant="outline" className={`ml-2 text-xs ${product.category === 'Principal' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-purple-100 text-purple-700 border-purple-300'}`}>
                                  {product.category}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="newNotes" className="text-xs">Observações</Label>
                    <Input id="newNotes" value={newPricing.notes} onChange={(e) => setNewPricing({ ...newPricing, notes: e.target.value })} placeholder="Ex: Desconto de 10% para turmas acima de 15 alunos" className="bg-white h-10 text-base" />
                  </div>

                  <Button onClick={handleAddPricing} disabled={!newPricing.courseId} className="w-full bg-blue-600 hover:bg-blue-700 h-10">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Precificação
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pricing List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pricingList.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  Nenhuma precificação cadastrada ainda.
                </div>
              ) : (
                pricingList.map((pricing) => (
                  <Card key={pricing.id} className={`border ${pricing.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{getCourseName(pricing.courseId)}</span>
                            <Badge variant={pricing.active ? 'default' : 'secondary'} className={pricing.active ? 'bg-green-600' : 'bg-gray-400'}>
                              {pricing.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs">
                            {pricing.includedProductIds && pricing.includedProductIds.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <span className="text-gray-500 font-semibold flex items-center gap-1">
                                  <Package className="w-3 h-3" /> Produtos Inclusos:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {pricing.includedProductIds.map((prodId) => {
                                    const product = extraProducts.find((p) => p.id === prodId);
                                    return product ? <Badge key={prodId} variant="outline" className="text-xs bg-white">{product.name}</Badge> : null;
                                  })}
                                </div>
                              </div>
                            )}
                            {pricing.validUntil && <div><span className="text-gray-500">Vigência: </span><span className="text-gray-700">{pricing.validUntil}</span></div>}
                            {pricing.notes && <div><span className="text-gray-500">Obs: </span><span className="text-gray-700">{pricing.notes}</span></div>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <Button onClick={() => handleTogglePricingActive(pricing.id)} variant="outline" size="sm" className="h-8">{pricing.active ? 'Desativar' : 'Ativar'}</Button>
                          <Button onClick={() => handleRemovePricing(pricing.id)} variant="outline" size="sm" className="h-8 border-red-300 text-red-600 hover:bg-red-50"><X className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
