'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  durationHours: number;
  price: number;
  validityMonths: number;
  isOffshore: boolean;
  isActive: boolean;
}

interface EditCourseModalProps {
  open: boolean;
  onClose: () => void;
  course: Course;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export function EditCourseModal({ open, onClose, course }: EditCourseModalProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: course.name,
    code: course.code,
    description: course.description || '',
    durationHours: course.durationHours,
    price: course.price,
    validityMonths: course.validityMonths,
    isOffshore: course.isOffshore,
    isActive: course.isActive,
  });

  const queryClient = useQueryClient();

  const handleUpdate = async () => {
    try {
      setUpdating(true);

      await api.patch(`/courses/${course.id}`, formData);

      toast({
        title: 'Curso atualizado!',
        description: 'As informações do curso foram atualizadas com sucesso.',
      });

      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar curso',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Editar Curso
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do curso {course.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome do Curso */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Curso *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: NR-35 - Trabalho em Altura"
            />
          </div>

          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="code">Código do Curso *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ex: NR35-B"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o conteúdo e objetivos do curso"
              rows={3}
            />
          </div>

          {/* Carga Horária e Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationHours">Carga Horária (horas) *</Label>
              <Input
                id="durationHours"
                type="number"
                min="1"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Validade */}
          <div className="space-y-2">
            <Label htmlFor="validityMonths">Validade do Certificado (meses) *</Label>
            <Input
              id="validityMonths"
              type="number"
              min="1"
              value={formData.validityMonths}
              onChange={(e) => setFormData({ ...formData, validityMonths: Number(e.target.value) })}
            />
          </div>

          {/* Switches */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOffshore"
                checked={formData.isOffshore}
                onCheckedChange={(checked) => setFormData({ ...formData, isOffshore: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="isOffshore"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Curso Offshore
                </Label>
                <p className="text-sm text-muted-foreground">
                  Este curso é específico para operações offshore
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Curso Ativo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cursos inativos não aparecem para novas matrículas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={updating}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
