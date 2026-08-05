'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface AvailableProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  type: 'product' | 'extra';
}

interface StudentFormData {
  name: string;
  taxId: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  selectedProductId?: string;
}

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: StudentFormData) => void;
  className: string;
  coursePrice: number;
  availableProducts?: AvailableProduct[];
}

// ============================================
// HELPERS
// ============================================

function formatTaxId(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================
// COMPONENT
// ============================================

export function AddStudentDialog({
  open,
  onOpenChange,
  onAdd,
  className,
  coursePrice,
  availableProducts = [],
}: AddStudentDialogProps) {
  const hasProducts = availableProducts.length > 0;

  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    taxId: '',
    rg: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    selectedProductId: '',
  });

  const [step, setStep] = useState<'student' | 'product'>('student');

  useEffect(() => {
    if (open) return;

    setStep('student');
    setFormData({
      name: '',
      taxId: '',
      rg: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      selectedProductId: '',
    });
  }, [open]);

  const validateStudentFields = () => {
    if (!formData.name || !formData.taxId || !formData.phone || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios.');
      return false;
    }

    const cleanedCPF = formData.taxId.replace(/\D/g, '');
    if (cleanedCPF.length !== 11) {
      toast.error('CPF inválido. Informe 11 dígitos.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('E-mail inválido.');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateStudentFields()) return;

    if (hasProducts) {
      setStep('product');
      return;
    }

    onAdd(formData);
    onOpenChange(false);
    toast.success('Aluno adicionado com sucesso!');
  };

  const handleFinalSubmit = () => {
    if (!validateStudentFields()) return;

    onAdd(formData);
    onOpenChange(false);
    toast.success('Aluno adicionado com sucesso!');
  };

  const handleChange = (field: keyof StudentFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'taxId') {
      formattedValue = formatTaxId(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const selectedProduct = availableProducts.find(p => p.id === formData.selectedProductId);
  const displayPrice = selectedProduct?.price || coursePrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-600" />
            Adicionar Aluno Individual
          </DialogTitle>
          <DialogDescription>
            Turma: <strong>{className}</strong>
            {hasProducts ? ' | Após preencher, você selecionará os produtos.' : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'student' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Digite o nome do aluno"
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => handleChange('rg', e.target.value)}
                  placeholder="Digite o RG"
                />
              </div>

              <div>
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="aluno@exemplo.com"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="flex items-center gap-2 text-blue-700">
                <Package className="w-4 h-4" />
                Selecionar Produto/Curso
              </Label>
              <Select
                value={formData.selectedProductId}
                onValueChange={(value) => handleChange('selectedProductId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.name} ({formatCurrency(product.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-blue-600">
                Preço: <strong>{formatCurrency(displayPrice)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === 'student' ? (
            <Button onClick={handleContinue} className="bg-red-600 hover:bg-red-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Continuar para Aprovação
            </Button>
          ) : (
            <Button onClick={handleFinalSubmit} className="bg-red-600 hover:bg-red-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Aluno
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
