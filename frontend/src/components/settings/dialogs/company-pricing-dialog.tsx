'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Pencil, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Course, ExtraProduct
} from '@/types';

// ============================================
// Types
// ============================================

export interface PricingRecord {
  id: string;
  courseId: string;
  negotiatedPrice: number;
  includedProductIds: string[];
  notes: string;
  validUntil: string;
  active: boolean;
}

interface CompanyPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  pricingList: PricingRecord[];
  courses: Course[];
  extraProducts: ExtraProduct[];
  onAddPricing: (companyId: string, pricing: Omit<PricingRecord, 'id'>) => void;
  onEditPricing: (companyId: string, pricingId: string, data: Partial<PricingRecord>) => void;
  onDeletePricing: (companyId: string, pricingId: string) => void;
}

// ============================================
// Component
// ============================================

export const CompanyPricingDialog: React.FC<CompanyPricingDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  companyName,
  pricingList,
  courses,
  extraProducts,
  onAddPricing,
  onEditPricing,
  onDeletePricing,
}) => {
  const [newPricing, setNewPricing] = useState({
    courseId: 'none',
    negotiatedPrice: 0,
    includedProductIds: [] as string[],
    notes: '',
    validUntil: '',
    active: true,
  });

  const [editing, setEditing] = useState<PricingRecord | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (newPricing.courseId && newPricing.courseId !== 'none') {
      const linkedProducts = getLinkedProductsForCourse(newPricing.courseId);
      const validIds = linkedProducts.map((p) => p.id);
      const filtered = newPricing.includedProductIds.filter((id) => validIds.includes(id));
      if (filtered.length !== newPricing.includedProductIds.length) {
        setNewPricing((prev) => ({ ...prev, includedProductIds: filtered }));
      }
    }
  }, [newPricing.courseId]);

  const handleAddPricing = () => {
    if (newPricing.courseId === 'none') {
      toast.error('Selecione um curso');
      return;
    }
    if (newPricing.negotiatedPrice <= 0) {
      toast.error('Valor negociado deve ser maior que zero');
      return;
    }
    const alreadyExists = pricingList.some((p) => p.courseId === newPricing.courseId && p.active);
    if (alreadyExists) {
      toast.error('Já existe uma precificação ativa para este curso');
      return;
    }

    onAddPricing(companyId, newPricing);
    toast.success('Precificação adicionada com sucesso!');
    setNewPricing({ courseId: 'none', negotiatedPrice: 0, includedProductIds: [], notes: '', validUntil: '', active: true });
  };

  const handleEditPricing = () => {
    if (!editing) return;
    onEditPricing(companyId, editing.id, {
      negotiatedPrice: editing.negotiatedPrice,
      includedProductIds: editing.includedProductIds,
      notes: editing.notes,
      validUntil: editing.validUntil,
      active: editing.active,
    });
    toast.success('Precificação atualizada com sucesso!');
    setEditing(null);
    setEditMode(false);
  };

  const handleDeletePricing = (pricingId: string) => {
    if (confirm('Deseja realmente excluir esta precificação?')) {
      onDeletePricing(companyId, pricingId);
      toast.success('Precificação excluída com sucesso!');
    }
  };

  const handleToggleActive = (pricing: PricingRecord) => {
    onEditPricing(companyId, pricing.id, { active: !pricing.active });
    toast.success(`Precificação ${!pricing.active ? 'ativada' : 'desativada'} com sucesso!`);
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Curso não encontrado';
  };

  const getCourseBasePrice = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.price ?? 0;
  };

  const calculateDiscount = (basePrice: number, negotiatedPrice: number) => {
    const base = Number(basePrice) || 0;
    const negotiated = Number(negotiatedPrice) || 0;
    if (!base || base === 0) return '0.0';
    return (((base - negotiated) / base) * 100).toFixed(1);
  };

  const availableCourses = courses.filter((course) => {
    const hasActivePricing = pricingList.some((p) => p.courseId === course.id && p.active);
    return !course.deleted && !hasActivePricing;
  });

  const getLinkedProductsForCourse = (courseId: string) => {
    if (courseId === 'none') return [];
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

  const toggleIncludedProduct = (productId: string) => {
    const current = newPricing.includedProductIds;
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    setNewPricing({ ...newPricing, includedProductIds: updated });
  };

  const toggleEditingProduct = (productId: string) => {
    if (!editing) return;
    const current = editing.includedProductIds || [];
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    setEditing({ ...editing, includedProductIds: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Precificações - {companyName}
          </DialogTitle>
          <DialogDescription>
            Gerencie as precificações customizadas vinculadas aos cursos do Módulo 01
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 overflow-y-auto flex-1 min-h-0">
          {/* Add New Pricing Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Nova Precificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricingCourse" className="text-xs">Curso *</Label>
                  <Select value={newPricing.courseId} onValueChange={(value) => setNewPricing({ ...newPricing, courseId: value })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Selecione um curso" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione um curso</SelectItem>
                      {availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name} (Base: R$ {Number(course.price ?? 0).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableCourses.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Todos os cursos já possuem precificação ativa</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="negotiatedPrice" className="text-xs">Valor Negociado (R$) *</Label>
                  <Input id="negotiatedPrice" type="number" step="0.01" value={newPricing.negotiatedPrice} onChange={(e) => setNewPricing({ ...newPricing, negotiatedPrice: parseFloat(e.target.value) || 0 })} className="h-10 text-base" placeholder="0.00" />
                  {newPricing.courseId !== 'none' && newPricing.negotiatedPrice > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Desconto: {calculateDiscount(getCourseBasePrice(newPricing.courseId), newPricing.negotiatedPrice)}%
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="pricingValidUntil" className="text-xs">Data de Vigência</Label>
                <Input id="pricingValidUntil" type="date" value={newPricing.validUntil} onChange={(e) => setNewPricing({ ...newPricing, validUntil: e.target.value })} className="h-10 text-base" />
              </div>

              <div>
                <Label htmlFor="pricingNotes" className="text-xs">Observações</Label>
                <Textarea id="pricingNotes" value={newPricing.notes} onChange={(e) => setNewPricing({ ...newPricing, notes: e.target.value })} placeholder="Ex: Desconto de 10% para turmas acima de 15 alunos" rows={2} className="text-base" />
              </div>

              <div>
                <Label className="text-xs">Produtos Inclusos</Label>
                {getLinkedProductsForCourse(newPricing.courseId).length > 0 ? (
                  <div className="space-y-2 border rounded-lg p-3 bg-gray-50 mt-1">
                    {getLinkedProductsForCourse(newPricing.courseId).map((product) => (
                      <div key={product.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={newPricing.includedProductIds.includes(product.id)} onChange={() => toggleIncludedProduct(product.id)} className="w-4 h-4" />
                        <span className="text-sm">
                          {product.code ? `${product.code} - ${product.name}` : product.name}
                          <Badge variant="outline" className="ml-2 text-xs">{product.category}</Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 italic">Selecione um curso para ver os produtos disponíveis</p>
                )}
              </div>

              <Button onClick={handleAddPricing} className="w-full bg-red-600 hover:bg-red-700 h-10" disabled={availableCourses.length === 0}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Precificação
              </Button>
            </CardContent>
          </Card>

          {/* Existing Pricing List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-900 border-b pb-2">
              Precificações Cadastradas ({pricingList.length})
            </h3>

            {pricingList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma precificação cadastrada</p>
                <p className="text-xs mt-1">Adicione precificações customizadas usando o formulário acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pricingList.map((pricing) => {
                  const basePrice = getCourseBasePrice(pricing.courseId);
                  const discount = calculateDiscount(basePrice, pricing.negotiatedPrice || 0);

                  return (
                    <Card key={pricing.id} className={!pricing.active ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        {editMode && editing?.id === pricing.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Curso</Label>
                                <p className="text-sm font-medium">{getCourseName(pricing.courseId)}</p>
                              </div>
                              <div>
                                <Label htmlFor="editPrice" className="text-xs">Valor Negociado (R$) *</Label>
                                <Input id="editPrice" type="number" step="0.01" value={editing.negotiatedPrice} onChange={(e) => setEditing({ ...editing, negotiatedPrice: parseFloat(e.target.value) || 0 })} />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="editValidUntil" className="text-xs">Data de Vigência</Label>
                              <Input id="editValidUntil" type="date" value={editing.validUntil || ''} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} />
                            </div>
                            <div>
                              <Label htmlFor="editNotes" className="text-xs">Observações</Label>
                              <Textarea id="editNotes" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
                            </div>
                            <div>
                              <Label className="text-xs">Produtos Inclusos</Label>
                              <div className="space-y-2">
                                {getLinkedProductsForCourse(pricing.courseId).map((product) => (
                                  <div key={product.id} className="flex items-center gap-2">
                                    <input type="checkbox" checked={editing.includedProductIds?.includes(product.id) || false} onChange={() => toggleEditingProduct(product.id)} />
                                    <span className="text-sm">{product.code ? `${product.code} - ${product.name}` : product.name} ({product.category})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleEditPricing} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Salvar
                              </Button>
                              <Button onClick={() => { setEditing(null); setEditMode(false); }} variant="outline" className="flex-1" size="sm">
                                <XCircle className="w-4 h-4 mr-2" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-sm">{getCourseName(pricing.courseId)}</h4>
                                  <Badge className={`text-xs ${pricing.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {pricing.active ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div><span className="text-gray-600">Valor Base:</span><p className="font-semibold">R$ {Number(basePrice ?? 0).toFixed(2)}</p></div>
                                  <div><span className="text-gray-600">Valor Negociado:</span><p className="font-semibold text-green-600">R$ {Number(pricing.negotiatedPrice ?? 0).toFixed(2)}</p></div>
                                  <div><span className="text-gray-600">Desconto:</span><p className="font-semibold text-blue-600">{discount}%</p></div>
                                </div>
                                {pricing.validUntil && (
                                  <p className="text-xs text-gray-600 mt-2"><strong>Vigência:</strong> até {new Date(pricing.validUntil).toLocaleDateString('pt-BR')}</p>
                                )}
                                {pricing.notes && (
                                  <p className="text-xs text-gray-600 mt-1"><strong>Observações:</strong> {pricing.notes}</p>
                                )}
                                {pricing.includedProductIds && pricing.includedProductIds.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-1">
                                      <Package className="w-3 h-3" /> Produtos Inclusos:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {pricing.includedProductIds.map((prodId) => {
                                        const product = extraProducts.find((p) => p.id === prodId);
                                        return product ? (
                                          <Badge key={prodId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">{product.code || product.name}</Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 ml-4">
                                <Button onClick={() => { setEditing(pricing); setEditMode(true); }} variant="outline" size="sm" className="h-8 w-8 p-0"><Pencil className="w-3 h-3" /></Button>
                                <Button onClick={() => handleToggleActive(pricing)} variant="outline" size="sm" className="h-8 w-8 p-0">
                                  {pricing.active ? <XCircle className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-green-600" />}
                                </Button>
                                <Button onClick={() => handleDeletePricing(pricing.id)} variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-600" /></Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">i</div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Cascata de Dados</h4>
                <p className="text-xs text-blue-700">
                  As precificações customizadas ficam vinculadas aos cursos do Módulo 01 e podem ser utilizadas automaticamente
                  ao criar turmas específicas para esta empresa no Módulo 02. Precificações inativas são mantidas no histórico
                  mas não aparecem para seleção em novos cadastros.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
