'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useClassesStore, Class } from '@/stores/classes.store';
import { useCoursesStore, Course } from '@/stores/courses.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { classesService } from '@/services/classes.service';
import { toast } from '@/hooks/use-toast';

// ============================================
// TYPES
// ============================================

interface Room {
  id: string;
  name: string;
  location?: string;
  capacity: number;
}

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToEdit?: Class | null;
}

interface FormState {
  courseId: string;
  roomId: string;
  companyId: string;
  startDate: string;
  endDate: string;
  displayName: string;
}

const INITIAL_FORM_STATE: FormState = {
  courseId: '',
  roomId: '',
  companyId: '',
  startDate: '',
  endDate: '',
  displayName: '',
};

// ============================================
// HELPERS
// ============================================

function toDateInputValue(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function calculateEndDate(startDate: string, course: Course | undefined): string {
  if (!startDate || !course) return '';

  const duration = course.duration || 40;
  const hoursPerDay = course.hoursPerDay || 8;
  const daysNeeded = Math.ceil(duration / hoursPerDay);

  const [year, month, day] = startDate.split('-').map(Number);
  const current = new Date(year, month - 1, day);

  const allowSaturday = Boolean(course.useWeekends || course.allowSaturday);
  const allowSunday = Boolean(course.useWeekends || course.allowSunday);

  let countedDays = 0;

  while (countedDays < daysNeeded) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const countsToday =
      !isWeekend ||
      (dayOfWeek === 6 && allowSaturday) ||
      (dayOfWeek === 0 && allowSunday);

    if (countsToday) countedDays++;

    if (countedDays < daysNeeded) {
      current.setDate(current.getDate() + 1);
    }
  }

  const endYear = current.getFullYear();
  const endMonth = String(current.getMonth() + 1).padStart(2, '0');
  const endDay = String(current.getDate()).padStart(2, '0');
  return `${endYear}-${endMonth}-${endDay}`;
}

// ============================================
// COMPONENT
// ============================================

export function ClassFormDialog({
  open,
  onOpenChange,
  classToEdit,
}: ClassFormDialogProps) {
  const { addClass, updateClass, classes } = useClassesStore();
  const { courses } = useCoursesStore();
  const { rooms } = useSettingsStore();
  const { companies } = useCompaniesStore();

  const isEditing = Boolean(classToEdit);

  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [endDateManuallyEdited, setEndDateManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encontrar curso selecionado
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseId),
    [courses, form.courseId]
  );

  // Resetar form quando abre/fecha ou muda classToEdit
  useEffect(() => {
    if (open && classToEdit) {
      setForm({
        courseId: classToEdit.courseId || '',
        roomId: classToEdit.roomId || '',
        companyId: classToEdit.companyId || '',
        startDate: toDateInputValue(classToEdit.startDate),
        endDate: toDateInputValue(classToEdit.endDate),
        displayName: classToEdit.displayName || '',
      });
      setEndDateManuallyEdited(true);
    } else if (open && !classToEdit) {
      setForm(INITIAL_FORM_STATE);
      setEndDateManuallyEdited(false);
    }
  }, [open, classToEdit]);

  // Auto-calcular data de término quando curso ou data início muda
  useEffect(() => {
    if (form.startDate && selectedCourse && !endDateManuallyEdited) {
      const endDate = calculateEndDate(form.startDate, selectedCourse);
      setForm((prev) => ({ ...prev, endDate }));
    }
  }, [form.startDate, selectedCourse, endDateManuallyEdited]);

  // Gerar próximo código
  const generateNextCode = (): string => {
    const year = new Date().getFullYear();
    const existingCodes = classes
      .map((c) => c.code)
      .filter((code) => code.startsWith(`T${year}`))
      .map((code) => parseInt(code.replace(`T${year}-`, ''), 10))
      .filter((n) => !isNaN(n));
    
    const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return `T${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.courseId || !form.startDate || !form.roomId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha: Curso, Data de Início e Sala/Campo.',
        variant: 'destructive',
      });
      return;
    }

    if (isSubmitting) {
      return;
    }

    const classData = {
      courseId: form.courseId,
      displayName: form.displayName || undefined,
      roomId: form.roomId,
      companyId: form.companyId || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      maxStudents: rooms.find((r) => r.id === form.roomId)?.capacity || 1,
    };

    setIsSubmitting(true);

    try {
      if (isEditing && classToEdit) {
        const updatedClass = await classesService.update(classToEdit.id, classData);
        updateClass(classToEdit.id, updatedClass);
        toast({ title: 'Turma atualizada com sucesso!' });
      } else {
        const createdClass = await classesService.create({
          ...classData,
          code: generateNextCode(),
          maxStudents: classData.maxStudents,
        });
        addClass(createdClass as Class);
        toast({ title: 'Turma adicionada com sucesso!' });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar turma:', error);
      toast({
        title: 'Erro ao salvar turma',
        description: 'Verifique conflito de sala/capacidade e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'endDate') {
      setEndDateManuallyEdited(true);
    }
    if (field === 'startDate' || field === 'courseId') {
      setEndDateManuallyEdited(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            {isEditing ? 'Editar Turma Completa' : 'Abrir Nova Turma'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere os dados da turma, incluindo data de início, sala e preço.'
              : 'Insira os detalhes para abrir uma nova turma.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="courseId">Curso</Label>
                <Select value={form.courseId} onValueChange={(v) => updateField('courseId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses
                      .filter((c) => c.active && !c.deleted)
                      .map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="displayName">Nome Personalizado da Turma</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="Ex: Turma Manhã, Turma A, Turma Janeiro..."
                />
                <p className="text-xs text-gray-500 mt-1">Deixe em branco para usar o nome do curso</p>
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
                {form.endDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Término automático: {form.endDate.split('-').reverse().join('/')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="roomId">Sala/Campo</Label>
                <Select value={form.roomId} onValueChange={(v) => updateField('roomId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rooms as Room[]).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}{room.location ? ` - ${room.location}` : ''} (Cap: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="companyId">Cliente PJ (Opcional)</Label>
                <Select
                  value={form.companyId || 'sem-vinculo'}
                  onValueChange={(v) => updateField('companyId', v === 'sem-vinculo' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Turma aberta (sem vínculo PJ)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-vinculo">Turma aberta</SelectItem>
                    {companies
                      .filter((c) => c.active)
                      .map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isEditing ? 'Salvar Alterações' : 'Abrir Turma'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
