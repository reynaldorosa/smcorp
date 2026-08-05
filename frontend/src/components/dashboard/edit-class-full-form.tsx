'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classOperations } from '@/services/operations.service';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Calendar, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CreateClassDto } from '@/lib/schemas';
import { api } from '@/lib/api';

const EditClassFullFormSchema = z.object({
  courseId: z.string().min(1, 'Selecione um curso'),
  displayName: z.string().optional(),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  startTime: z.string().min(1, 'Horário de início obrigatório'),
  endTime: z.string().min(1, 'Horário de término obrigatório'),
  roomId: z.string().optional(),
  companyId: z.string().optional(),
  customPrice: z.string().optional(),
});

type EditClassFullFormData = z.infer<typeof EditClassFullFormSchema>;

interface Course {
  id: string;
  code: string;
  name: string;
  durationHours: number;
  price?: number;
}

interface Room {
  id: string;
  name: string;
  code?: string;
  capacity?: number;
}

interface Company {
  id: string;
  name: string;
  tradeName?: string;
  companyTaxId?: string;
}

interface ClassItem {
  id: string;
  courseId?: string;
  displayName?: string | null;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  roomId?: string | null;
  companyId?: string | null;
  customPrice?: number | null;
}

type UpdateClassPayload = Partial<CreateClassDto> & {
  startTime: string;
  endTime: string;
  displayName?: string | null;
  roomId?: string;
  companyId?: string;
  customPrice?: number;
};

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as ErrorWithResponse).response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

interface EditClassFullFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classItem: ClassItem | null;
}

export function EditClassFullForm({ open, onClose, onSuccess, classItem }: EditClassFullFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [calculatedEndDate, setCalculatedEndDate] = useState<string>('');

  // Buscar dados necessários
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data?.data || response.data;
    },
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get('/rooms', { params: { limit: 1000 } });
      return response.data?.data || response.data;
    },
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get('/companies', { params: { limit: 1000 } });
      return response.data?.data || response.data;
    },
  });

  const form = useForm<EditClassFullFormData>({
    resolver: zodResolver(EditClassFullFormSchema),
    defaultValues: {
      courseId: classItem?.courseId || '',
      displayName: classItem?.displayName || '',
      startDate: classItem?.startDate ? format(parseISO(classItem.startDate), 'yyyy-MM-dd') : '',
      startTime: classItem?.startTime || '08:00',
      endTime: classItem?.endTime || '18:00',
      roomId: classItem?.roomId || '',
      companyId: classItem?.companyId || '',
      customPrice: classItem?.customPrice ? String(classItem.customPrice) : '',
    },
  });

  // Recalcular endDate quando courseId ou startDate mudar
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      if (value.courseId && value.startDate) {
        try {
          const startDate = new Date(`${value.startDate}T00:00:00.000Z`);
          const data = await classOperations.calculateEndDate(value.courseId, startDate);
          if (data?.endDate) {
            setCalculatedEndDate(format(parseISO(data.endDate), "dd/MM/yyyy", { locale: ptBR }));
          }
        } catch (error) {
          console.error('Erro ao calcular data de término:', error);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Atualizar form quando classItem mudar
  useEffect(() => {
    if (classItem) {
      form.reset({
        courseId: classItem.courseId || '',
        displayName: classItem.displayName || '',
        startDate: classItem.startDate ? format(parseISO(classItem.startDate), 'yyyy-MM-dd') : '',
        startTime: classItem.startTime || '08:00',
        endTime: classItem.endTime || '18:00',
        roomId: classItem.roomId || '',
        companyId: classItem.companyId || '',
        customPrice: classItem.customPrice ? String(classItem.customPrice) : '',
      });
    }
  }, [classItem, form]);

  const handleSubmit = async (data: EditClassFullFormData) => {
    if (!classItem) return;
    try {
      setIsUpdating(true);

      // Combinar data + hora para criar DateTime
      const startDateTime = new Date(`${data.startDate}T${data.startTime}:00.000Z`);
      const endDateTime = new Date(`${data.startDate}T${data.endTime}:00.000Z`);

      const updateData: UpdateClassPayload = {
        courseId: data.courseId,
        displayName: data.displayName || null,
        startDate: startDateTime,
        startTime: data.startTime,
        endTime: data.endTime,
        roomId: data.roomId || undefined,
        companyId: data.companyId || undefined,
      };

      if (data.customPrice) {
        updateData.customPrice = parseFloat(data.customPrice);
      }

      await classOperations.update(classItem.id, updateData);

      toast({
        title: 'Turma atualizada!',
        description: 'A turma foi atualizada com sucesso.',
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

  const selectedCourse = courses?.find((c) => c.id === form.watch('courseId'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Turma Completa
          </DialogTitle>
          <DialogDescription>
            Edite todos os dados da turma. A data de término será recalculada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Curso Base */}
          <div className="space-y-2">
            <Label htmlFor="courseId">Curso Base *</Label>
            <Select
              value={form.watch('courseId')}
              onValueChange={(value) => form.setValue('courseId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name} ({course.durationHours}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.courseId && (
              <p className="text-sm text-destructive">{form.formState.errors.courseId.message}</p>
            )}
          </div>

          {/* Nome Personalizado */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome Personalizado (opcional)</Label>
            <Input
              id="displayName"
              {...form.register('displayName')}
              placeholder="Deixe em branco para usar o nome do curso"
            />
            <p className="text-xs text-muted-foreground">
              Padrão: {selectedCourse?.name || 'Selecione um curso'}
            </p>
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início *</Label>
            <Input
              id="startDate"
              type="date"
              {...form.register('startDate')}
            />
            {form.formState.errors.startDate && (
              <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
            )}
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário Início *</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register('startTime')}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário Término *</Label>
              <Input
                id="endTime"
                type="time"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Preview da Data de Término */}
          {calculatedEndDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900">
                📅 Data de Término Calculada: <span className="font-bold">{calculatedEndDate}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Baseado na carga horária do curso ({selectedCourse?.durationHours}h) e dias úteis
              </p>
            </div>
          )}

          {/* Sala/Campo */}
          <div className="space-y-2">
            <Label htmlFor="roomId">Sala/Campo</Label>
            <Select
              value={form.watch('roomId') || '__NONE__'}
              onValueChange={(value) =>
                form.setValue('roomId', value === '__NONE__' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Sem sala</SelectItem>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.code} - {room.name} ({room.capacity} pessoas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente PJ */}
          <div className="space-y-2">
            <Label htmlFor="companyId">Cliente PJ (Turma Fechada)</Label>
            <Select
              value={form.watch('companyId') || '__NONE__'}
              onValueChange={(value) =>
                form.setValue('companyId', value === '__NONE__' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Turma Aberta (Geral)</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.tradeName || company.name} - {company.companyTaxId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preço Customizado */}
          <div className="space-y-2">
            <Label htmlFor="customPrice">Preço Customizado (opcional)</Label>
            <Input
              id="customPrice"
              type="number"
              step="0.01"
              placeholder={selectedCourse ? `Padrão: R$ ${selectedCourse.price}` : '0.00'}
              {...form.register('customPrice')}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o preço do curso
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
