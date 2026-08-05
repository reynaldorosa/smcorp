'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  FileText,
  CheckSquare,
  Upload,
  Type,
  DollarSign,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCoursesStore, type Course } from '@/stores/courses.store';
import { coursesService } from '@/services/courses.service';
import type { DocumentoObrigatorio } from './course-card';

// ============================================
// TYPES
// ============================================

interface CourseFormData {
  code: string;
  name: string;
  description: string;
  totalHours: number;
  hoursPerDay: number;
  startTime: string;
  endTime: string;
  breakDuration: number;
  certificationValidity: number;
  allowSaturday: boolean;
  allowSunday: boolean;
  requiredDocuments: DocumentoObrigatorio[];
  linkedProducts: string[];
  linkedExtras: string[];
  cashValue: number;
  active: boolean;
}

interface ProductInfo {
  id: string;
  code: string;
  name: string;
  price: number;
  type: string;
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  availableProducts: ProductInfo[];
  availableExtras: ProductInfo[];
}

const INITIAL_FORM_DATA: CourseFormData = {
  code: '',
  name: '',
  description: '',
  totalHours: 40,
  hoursPerDay: 8,
  startTime: '08:00',
  endTime: '17:00',
  breakDuration: 60,
  certificationValidity: 12,
  allowSaturday: false,
  allowSunday: false,
  requiredDocuments: [],
  linkedProducts: [],
  linkedExtras: [],
  cashValue: 0,
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

function calculateRequiredDays(totalHours: number, hoursPerDay: number): number {
  if (!totalHours || !hoursPerDay) return 0;
  return Math.ceil(totalHours / hoursPerDay);
}

// ============================================
// COMPONENT
// ============================================

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  availableProducts,
  availableExtras,
}: CourseFormDialogProps) {
  const { courses, addCourse, updateCourse } = useCoursesStore();
  const isEditing = !!course;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CourseFormData>(() => {
    if (course) {
      return {
        code: course.code,
        name: course.name,
        description: course.description || '',
        totalHours: course.duration,
        hoursPerDay: course.hoursPerDay || 8,
        startTime: course.startTime || '08:00',
        endTime: course.endTime || '17:00',
        breakDuration: course.breakDuration || 60,
        certificationValidity: course.certificationValidity || 12,
        allowSaturday: course.allowSaturday ?? course.useWeekends ?? false,
        allowSunday: course.allowSunday ?? course.useWeekends ?? false,
        requiredDocuments: (course.requiredDocuments as DocumentoObrigatorio[]) || [],
        linkedProducts: (course.linkedProducts as string[]) || [],
        linkedExtras: (course.linkedExtras as string[]) || [],
        cashValue: course.cashValue || 0,
        active: course.active,
      };
    }
    return INITIAL_FORM_DATA;
  });

  // Document input state
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentType, setNewDocumentType] = useState<'upload' | 'texto'>('upload');
  const requiredDays = calculateRequiredDays(formData.totalHours, formData.hoursPerDay);

  // Reset form when dialog opens/closes or course changes
  React.useEffect(() => {
    if (open) {
      if (course) {
        setFormData({
          code: course.code,
          name: course.name,
          description: course.description || '',
          totalHours: course.duration,
          hoursPerDay: course.hoursPerDay || 8,
          startTime: course.startTime || '08:00',
          endTime: course.endTime || '17:00',
          breakDuration: course.breakDuration || 60,
          certificationValidity: course.certificationValidity || 12,
          allowSaturday: course.allowSaturday ?? course.useWeekends ?? false,
          allowSunday: course.allowSunday ?? course.useWeekends ?? false,
          requiredDocuments: (course.requiredDocuments as DocumentoObrigatorio[]) || [],
          linkedProducts: (course.linkedProducts as string[]) || [],
          linkedExtras: (course.linkedExtras as string[]) || [],
          cashValue: course.cashValue || 0,
          active: course.active,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
      setNewDocumentName('');
      setNewDocumentType('upload');
    }
  }, [open, course]);

  // Generate unique code
  const generateCode = (): string => {
    const prefix = 'CRS';
    const number = String(courses.length + 1).padStart(4, '0');
    return `${prefix}${number}`;
  };

  // Document handlers
  const addDocument = () => {
    if (newDocumentName.trim()) {
      setFormData({
        ...formData,
        requiredDocuments: [
          ...formData.requiredDocuments,
          { name: newDocumentName.trim(), requiresUpload: newDocumentType === 'upload' }
        ]
      });
      setNewDocumentName('');
      setNewDocumentType('upload');
    }
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      requiredDocuments: formData.requiredDocuments.filter((_, i) => i !== index)
    });
  };

  // Product/Extra toggle handlers
  const toggleLinkedProduct = (produtoId: string) => {
    const products = formData.linkedProducts.includes(produtoId)
      ? formData.linkedProducts.filter(id => id !== produtoId)
      : [...formData.linkedProducts, produtoId];
    setFormData({ ...formData, linkedProducts: products });
  };

  const toggleLinkedExtra = (extraId: string) => {
    const extras = formData.linkedExtras.includes(extraId)
      ? formData.linkedExtras.filter(id => id !== extraId)
      : [...formData.linkedExtras, extraId];
    setFormData({ ...formData, linkedExtras: extras });
  };

  // Valor total calculado (produtos + extras vinculados)
  const calculatedTotalPrice = 
    availableProducts.filter(p => formData.linkedProducts.includes(p.id)).reduce((acc, p) => acc + p.price, 0) +
    availableExtras.filter(e => formData.linkedExtras.includes(e.id)).reduce((acc, e) => acc + e.price, 0);

  // Submit handler
  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome do curso');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const selectedProducts = availableProducts.filter(p => formData.linkedProducts.includes(p.id));
    const selectedExtras = availableExtras.filter(e => formData.linkedExtras.includes(e.id));
    const totalPrice = selectedProducts.reduce((acc, p) => acc + p.price, 0) + 
               selectedExtras.reduce((acc, e) => acc + e.price, 0);

    const payload = {
      code: formData.code || undefined,
      name: formData.name,
      description: formData.description,
      syllabus: formData.description,
      durationHours: formData.totalHours,
      hoursPerDay: formData.hoursPerDay,
      defaultStartTime: formData.startTime,
      defaultEndTime: formData.endTime,
      breakDuration: formData.breakDuration,
      allowWeekends: formData.allowSaturday || formData.allowSunday,
      allowSaturday: formData.allowSaturday,
      allowSunday: formData.allowSunday,
      validityMonths: formData.certificationValidity,
      price: totalPrice,
      cashValue: formData.cashValue,
      isActive: formData.active,
      requiredDocuments: formData.requiredDocuments,
      linkedProducts: formData.linkedProducts,
      linkedExtras: formData.linkedExtras,
      learningTime: requiredDays,
    };

    try {
      if (isEditing && course) {
        const updatedCourse = await coursesService.update(course.id, payload);
        updateCourse(course.id, updatedCourse);
        toast.success('Curso atualizado com sucesso!');
      } else {
        const createdCourse = await coursesService.create({
          ...payload,
          code: payload.code || generateCode(),
        });
        addCourse(createdCourse as Course);
        toast.success('Curso criado com sucesso!');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      toast.error('Erro ao salvar curso no servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle>{isEditing ? 'Editar Curso' : 'Adicionar Novo Curso'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do curso.' : 'Insira os detalhes do novo curso que deseja adicionar ao catálogo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
          {/* Identificação */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Identificação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseCode">Código do Curso</Label>
                <Input
                  id="courseCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Auto-gerado se vazio"
                />
              </div>
              <div>
                <Label htmlFor="courseName">Nome do Curso *</Label>
                <Input
                  id="courseName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: AC N1 IRATA"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="conteudo">Conteúdo Programático</Label>
              <Textarea
                id="conteudo"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o conteúdo do curso..."
                rows={3}
              />
            </div>
          </div>

          {/* Configuração de Tempo */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Configuração de Tempo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cargaTotal">Carga Horária Total (h)</Label>
                <Input
                  id="cargaTotal"
                  type="number"
                  value={formData.totalHours || ''}
                  onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) || 0 })}
                  placeholder="40"
                />
              </div>
              <div>
                <Label htmlFor="horasDia">Horas de Aula por Dia</Label>
                <Input
                  id="horasDia"
                  type="number"
                  value={formData.hoursPerDay || ''}
                  onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) || 0 })}
                  placeholder="8"
                />
              </div>
            </div>
            <div>
              <Label>Dias Necessários (auto)</Label>
              <div className="mt-1 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {requiredDays > 0 ? `${requiredDays} dia(s)` : 'Informe a carga horaria e horas/dia'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="inicio">Horário Início</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fim">Horário Fim</Label>
                <Input
                  id="fim"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="breakDuration">Intervalo (min)</Label>
                <Input
                  id="breakDuration"
                  type="number"
                  value={formData.breakDuration || ''}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dias de Fim de Semana</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSaturday"
                  checked={formData.allowSaturday}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowSaturday: checked })}
                />
                <Label htmlFor="allowSaturday">Pode ocupar Sábado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSunday"
                  checked={formData.allowSunday}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowSunday: checked })}
                />
                <Label htmlFor="allowSunday">Pode ocupar Domingo</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="validade">Validade da Certificação (meses)</Label>
              <Input
                id="validade"
                type="number"
                  value={formData.certificationValidity || ''}
                  onChange={(e) => setFormData({ ...formData, certificationValidity: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 12, 24, 36"
              />
              <p className="text-xs text-gray-500 mt-1">Deixe 0 para certificação sem validade</p>
            </div>
          </div>

          {/* Requisitos de Matrícula */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Requisitos de Matrícula
            </h3>
            <div className="flex gap-2">
              <Input
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                placeholder="Ex: RG, CPF, ASO..."
                onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                className="flex-1"
              />
              <Select value={newDocumentType} onValueChange={(value: 'upload' | 'texto') => setNewDocumentType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Arquivo
                    </div>
                  </SelectItem>
                  <SelectItem value="texto">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Preenchimento
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addDocument}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.requiredDocuments.map((doc, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="cursor-pointer flex items-center gap-1 hover:bg-red-100" 
                  onClick={() => removeDocument(index)}
                >
                  {doc.requiresUpload ? <Upload className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                  {doc.name} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Vínculo Financeiro */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Vínculo Financeiro
            </h3>
            
            {/* Produtos */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-600">Produtos / Valores de Curso</Label>
              <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                {availableProducts.length > 0 ? (
                  availableProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`product-${product.id}`}
                        checked={formData.linkedProducts.includes(product.id)}
                        onChange={() => toggleLinkedProduct(product.id)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`product-${product.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-blue-600 text-white text-xs">{product.code}</Badge>
                          <span>{product.name}</span>
                        </div>
                        <span className="text-blue-700 font-semibold">{formatCurrency(product.price)}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum produto cadastrado no Módulo 00</p>
                )}
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-purple-600">Produtos Extras</Label>
              <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                {availableExtras.length > 0 ? (
                  availableExtras.map((extra) => (
                    <div key={extra.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`extra-${extra.id}`}
                        checked={formData.linkedExtras.includes(extra.id)}
                        onChange={() => toggleLinkedExtra(extra.id)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`extra-${extra.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-purple-600 text-white text-xs">{extra.code}</Badge>
                          <span>{extra.name}</span>
                        </div>
                        <span className="text-purple-700 font-semibold">{formatCurrency(extra.price)}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum extra cadastrado no Módulo 00</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados Financeiros - Caixa */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dados Financeiros - Caixa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor à Vista (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.cashValue || ''}
                  onChange={(e) => setFormData({ ...formData, cashValue: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total Calculado (R$)</Label>
                <Input
                  type="text"
                  value={formatCurrency(calculatedTotalPrice)}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Curso Ativo</Label>
          </div>
        </div>

        <div className="px-6 py-3 border-t flex-shrink-0 bg-white">
          <Button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
            {isEditing ? 'Salvar Alterações' : 'Salvar Curso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
