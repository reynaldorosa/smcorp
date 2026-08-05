'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { classOperations } from '@/services/operations.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Edit, Save, X } from 'lucide-react';

const EditClassFormSchema = z.object({
  displayName: z.string().optional(),
});

type EditClassFormData = z.infer<typeof EditClassFormSchema>;

interface CourseInfo {
  name?: string;
}

interface InstructorInfo {
  name?: string;
}

interface RoomInfo {
  name?: string;
}

interface ClassItem {
  id: string;
  code?: string;
  displayName?: string | null;
  course?: CourseInfo;
  instructor?: InstructorInfo;
  room?: RoomInfo;
  startDate?: string;
  endDate?: string;
}

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as ErrorWithResponse).response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

interface EditClassFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classItem: ClassItem | null;
}

export function EditClassForm({ open, onClose, onSuccess, classItem }: EditClassFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<EditClassFormData>({
    resolver: zodResolver(EditClassFormSchema),
    defaultValues: {
      displayName: classItem?.displayName || '',
    },
  });

  // Atualiza form quando classItem muda
  useEffect(() => {
    if (classItem) {
      form.reset({
        displayName: classItem.displayName || '',
      });
    }
  }, [classItem, form]);

  const handleSubmit = async (data: EditClassFormData) => {
    if (!classItem) return;
    try {
      setIsUpdating(true);

      await classOperations.update(classItem.id, {
        displayName: data.displayName || null,
      });

      toast({
        title: 'Turma atualizada!',
        description: 'O nome da turma foi atualizado com sucesso.',
      });

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar turma',
        description: getErrorMessage(error, 'Ocorreu um erro ao atualizar a turma.'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getDisplayName = () => {
    return classItem?.displayName || classItem?.course?.name || 'Turma';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Turma
          </DialogTitle>
          <DialogDescription>
            Personalize o nome de exibição da turma. Deixe em branco para usar o nome do curso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Nome Padrão (somente leitura) */}
          <div className="space-y-2">
            <Label>Nome do Curso (padrão)</Label>
            <Input
              value={classItem?.course?.name || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Este é o nome original do catálogo de cursos
            </p>
          </div>

          {/* Nome Personalizado */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Nome Personalizado (opcional)
            </Label>
            <Input
              id="displayName"
              placeholder={`Ex: ${classItem?.course?.name} - Turma Especial`}
              {...form.register('displayName')}
            />
            <p className="text-xs text-muted-foreground">
              Este nome será exibido no calendário e listas. Deixe vazio para usar o nome do curso.
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-muted p-3 rounded-lg space-y-1">
            <p className="text-sm font-medium">Informações da Turma</p>
            <p className="text-xs text-muted-foreground">
              <strong>Código:</strong> {classItem?.code}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Instrutor:</strong> {classItem?.instructor?.name || 'Não atribuído'}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Sala:</strong> {classItem?.room?.name || 'Não atribuída'}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Período:</strong> {classItem?.startDate ? new Date(classItem.startDate).toLocaleDateString('pt-BR') : 'N/A'} até {classItem?.endDate ? new Date(classItem.endDate).toLocaleDateString('pt-BR') : 'Indefinido'}
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
