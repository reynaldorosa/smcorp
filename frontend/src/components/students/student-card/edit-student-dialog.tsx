'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Student, ExtraProduct } from '@/types';
import type { ExtraProductPayment } from '@/stores/students.store';
import type { EditStudentFormData } from './types';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  extraProducts?: ExtraProduct[];
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
}

/**
 * Edit Student Dialog
 * 
 * Full edit form with support for:
 * - Basic info (name, CPF, phone, email, discount, photo)
 * - Extra products selection
 * - PF flag for PJ students (generates separate PF payment entries)
 * 
 * @see CardAluno.tsx in figma for reference implementation
 */
export const EditStudentDialog: React.FC<EditStudentDialogProps> = ({
  open,
  onOpenChange,
  student,
  extraProducts = [],
  onUpdateStudent,
}) => {
  // Form data
  const [formData, setFormData] = useState<EditStudentFormData>({
    name: student.name,
    taxId: student.taxId || '',
    phone: student.phone || '',
    email: student.email || '',
    discount: student.discount || 0,
    photo: student.photoUrl || '',
    extraProducts: [],
  });

  // Selected extra product IDs
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(student.extraProductIds || [])
  );

  // Products marked as "paid by PF" (only for PJ students)
  const [pfProducts, setPfProducts] = useState<Set<string>>(new Set());

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: student.name,
        taxId: student.taxId || '',
        phone: student.phone || '',
        email: student.email || '',
        discount: student.discount || 0,
        photo: student.photoUrl || '',
        extraProducts: [],
      });
      setSelectedProducts(new Set(student.extraProductIds || []));
      setPfProducts(new Set());
    }
  }, [open, student]);

  const isPJ = student.personType === 'company';

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(productId)) {
      newSet.delete(productId);
      // Also remove from PF set if unchecked
      const newPfSet = new Set(pfProducts);
      newPfSet.delete(productId);
      setPfProducts(newPfSet);
    } else {
      newSet.add(productId);
    }
    setSelectedProducts(newSet);
  };

  // Toggle PF flag for a product
  const togglePfProduct = (productId: string) => {
    const newSet = new Set(pfProducts);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setPfProducts(newSet);
  };

  // Handle save
  const handleSave = () => {
    // Separate products into PJ and PF arrays
    const pjProductIds: string[] = [];
    const pfProductEntries: ExtraProductPayment[] = [];

    selectedProducts.forEach((productId) => {
      const product = extraProducts.find((p) => p.id === productId);
      if (!product) return;

      if (isPJ && pfProducts.has(productId)) {
        // PF payment: create separate entry
        pfProductEntries.push({
          id: `pf-${Date.now()}-${productId}`,
          productId: product.id,
          productName: product.name,
          totalValue: product.price || 0,
          payments: {
            history: [],
            totalPaid: 0,
            pending: false,
          },
        });
      } else {
        pjProductIds.push(productId);
      }
    });

    // Calculate new total (excluding PF products)
    const pjProductsValue = pjProductIds.reduce((total, id) => {
      const product = extraProducts.find((p) => p.id === id);
      return total + (product?.price || 0);
    }, 0);
    const newTotalValue = pjProductsValue - (formData.discount || 0);

    // Merge with existing PF payments
    const existingPfPayments = student.pfProductPayments || [];
    const mergedPfPayments = [...existingPfPayments, ...pfProductEntries];

    // Update student
    const updateData: Partial<Student> = {
      name: formData.name,
      taxId: formData.taxId || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      discount: formData.discount,
      photoUrl: formData.photo || undefined,
      extraProductIds: pjProductIds,
      totalValue: newTotalValue > 0 ? newTotalValue : student.totalValue,
    };

    // Only add PF payments if there are new PF entries
    if (pfProductEntries.length > 0) {
      updateData.pfProductPayments = mergedPfPayments;
    }

    onUpdateStudent?.(student.id, updateData);

    if (pfProductEntries.length > 0) {
      toast.success(
        `✅ Aluno atualizado! ${pfProductEntries.length} produto(s) criado(s) como lançamento PF separado.`
      );
    } else {
      toast.success('✅ Aluno atualizado com sucesso!');
    }

    onOpenChange(false);
    setPfProducts(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>✏️ Editar Aluno - {student.name}</DialogTitle>
          <DialogDescription>
            Altere os dados do aluno e salve.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do aluno"
              />
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="edit-taxId">CPF</Label>
              <Input
                id="edit-taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@email.com"
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label htmlFor="edit-discount">Desconto (R$)</Label>
              <Input
                id="edit-discount"
                type="number"
                min={0}
                step={0.01}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Photo URL */}
            <div className="space-y-2">
              <Label htmlFor="edit-photo">URL da Foto</Label>
              <Input
                id="edit-photo"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Extra Products */}
            {extraProducts.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-semibold">Produtos Extras</Label>
                <div className="space-y-2">
                  {extraProducts.map((product) => (
                    <div key={product.id} className="space-y-1">
                      {/* Product checkbox */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          {product.name}
                          {product.price != null && (
                            <span className="text-gray-500 ml-1">
                              — R$ {Number(product.price).toFixed(2)}
                            </span>
                          )}
                        </label>
                      </div>

                      {/* PF Flag — only for PJ students with selected products */}
                      {isPJ && selectedProducts.has(product.id) && (
                        <div className="ml-6 flex items-center gap-2 text-xs bg-orange-50 border border-orange-200 p-2 rounded">
                          <Checkbox
                            id={`pf-${product.id}`}
                            checked={pfProducts.has(product.id)}
                            onCheckedChange={() => togglePfProduct(product.id)}
                          />
                          <label
                            htmlFor={`pf-${product.id}`}
                            className="cursor-pointer text-orange-800 font-medium"
                          >
                            💳 Este produto será pago pela{' '}
                            <strong>Pessoa Física</strong>? (Gerará recibo separado)
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PF Summary */}
            {isPJ && pfProducts.size > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg text-sm">
                <p className="font-semibold text-orange-800 mb-1">
                  ⚠️ {pfProducts.size} produto(s) marcado(s) como PF
                </p>
                <p className="text-orange-700 text-xs">
                  Estes produtos serão separados do faturamento PJ e gerarão
                  lançamentos independentes para pagamento pela Pessoa Física.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={!formData.name.trim()}
          >
            <Save className="w-4 h-4 mr-1" />
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
