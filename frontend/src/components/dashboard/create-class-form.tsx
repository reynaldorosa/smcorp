'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { classOperations } from '@/services/operations.service';
import { coursesService } from '@/services/courses.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Users, MapPin, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Schema do formulário com startTime/endTime
const CreateClassFormSchema = z.object({
  courseId: z.string().min(1, 'Curso é obrigatório'),
  instructorId: z.string().min(1, 'Instrutor é obrigatório'),
  roomId: z.string().min(1, 'Sala é obrigatória'),
  startDate: z.date(),
  startTime: z.string(),
  endDate: z.date(),
  endTime: z.string(),
  maxStudents: z.number().min(1).max(100),
});

type CreateClassFormData = z.infer<typeof CreateClassFormSchema>;

interface CourseOption {
  id: string;
  name: string;
  workload: number;
  hoursPerDay: number;
  allowSaturday: boolean;
  allowSunday: boolean;
}

interface RoomConflictResult {
  hasConflict: boolean;
  message?: string;
  conflictingClass?: {
    startDate: string;
    endDate: string;
  };
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

// Combinar data + horário
const combineDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

interface CreateClassFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateClassForm({ open, onClose, onSuccess }: CreateClassFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(null);
  const [roomConflict, setRoomConflict] = useState<RoomConflictResult | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateClassFormData>({
    resolver: zodResolver(CreateClassFormSchema),
    defaultValues: {
      courseId: '',
      instructorId: '',
      roomId: '',
      startDate: new Date(),
      endDate: new Date(),
      startTime: '08:00',
      endTime: '17:00',
      maxStudents: 10,
    },
  });

  const { data: apiCourses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: () => coursesService.getActive(),
    enabled: open,
    staleTime: 60_000,
  });

  const courses: CourseOption[] =
    apiCourses && apiCourses.length > 0
      ? apiCourses
          .filter((course) => course.active && !course.deleted)
          .map((course) => {
            const hoursPerDay = course.hoursPerDay ?? 8;
            const workload = course.workloadHours ?? course.totalWorkloadHours ?? course.duration ?? 0;
            const allowSaturday = Boolean(course.useWeekends || course.allowSaturday);
            const allowSunday = Boolean(course.useWeekends || course.allowSunday);

            return {
              id: course.id,
              name: course.displayName ?? course.name,
              workload,
              hoursPerDay,
              allowSaturday,
              allowSunday,
            };
          })
      : [];

  // Calcular endDate automaticamente
  useEffect(() => {
    const startDate = form.watch('startDate');
    const courseId = form.watch('courseId');

    if (!startDate || !courseId) return;

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setSelectedCourse(course);

    // Calcular dias necessários
    const totalDays = Math.ceil(course.workload / course.hoursPerDay);
    
    let calculatedDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < totalDays - 1) {
      calculatedDate = addDays(calculatedDate, 1);
      const dayOfWeek = calculatedDate.getDay();
      
      // Pular fins de semana conforme configuração do curso
      if (dayOfWeek === 6 && !course.allowSaturday) continue;
      if (dayOfWeek === 0 && !course.allowSunday) continue;

      daysAdded++;
    }

    setCalculatedEndDate(calculatedDate);
    form.setValue('endDate', calculatedDate);
  }, [form.watch('startDate'), form.watch('courseId')]);

  // Verificar conflito de sala
  const checkRoomConflict = async () => {
    const roomId = form.watch('roomId');
    const startDate = form.watch('startDate');
    const endDate = form.watch('endDate');
    const startTime = form.watch('startTime');
    const endTime = form.watch('endTime');

    if (!roomId || !startDate || !endDate) return;

    try {
      setCheckingConflict(true);
      const startDateTime = combineDateTime(startDate, startTime);
      const endDateTime = combineDateTime(endDate, endTime);
      
      const result = await classOperations.checkRoomConflict(
        roomId,
        startDateTime,
        endDateTime
      );

      setRoomConflict(result);
    } catch (error) {
      console.error('Erro ao verificar conflito:', error);
    } finally {
      setCheckingConflict(false);
    }
  };

  useEffect(() => {
    if (form.watch('roomId') && form.watch('startDate') && form.watch('endDate')) {
      checkRoomConflict();
    }
  }, [form.watch('roomId'), form.watch('startDate'), form.watch('endDate')]);

  const handleSubmit = async (data: CreateClassFormData) => {
    if (roomConflict?.hasConflict) {
      toast({
        title: 'Conflito de sala',
        description: 'A sala selecionada já possui uma turma agendada neste período.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);

      // Converter data + horário para DateTime
      const startDateTime = combineDateTime(data.startDate, data.startTime);
      const endDateTime = combineDateTime(data.endDate, data.endTime);

      // Transformar para formato da API (sem startTime/endTime e sem code - será gerado automaticamente)
      const apiPayload = {
        courseId: data.courseId,
        instructorId: data.instructorId,
        roomId: data.roomId,
        startDate: startDateTime,
        endDate: endDateTime,
        maxStudents: data.maxStudents,
      };

      await classOperations.create(apiPayload);

      toast({
        title: 'Turma criada!',
        description: `Turma de ${selectedCourse?.name} criada com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ['activeClasses'] });
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao criar turma',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Criar Nova Turma
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da turma. A data de término será calculada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Seleção de Curso */}
          <div>
            <Label htmlFor="courseId">Curso *</Label>
            <Select
              value={form.watch('courseId')}
              onValueChange={(value) => {
                form.setValue('courseId', value);
              }}
              disabled={isCoursesLoading || courses.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isCoursesLoading
                      ? 'Carregando cursos...'
                      : courses.length === 0
                        ? 'Nenhum curso disponível (API)'
                        : 'Selecione o curso...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Não foi possível carregar cursos da API.
                  </div>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.workload}h)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {courses.length === 0 && !isCoursesLoading && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-700" />
                <span>Sem cursos disponíveis. Verifique a API.</span>
              </div>
            )}
            {selectedCourse && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                <p><strong>Carga horária:</strong> {selectedCourse.workload}h</p>
                <p><strong>Horas por dia:</strong> {selectedCourse.hoursPerDay}h</p>
              </div>
            )}
          </div>

          {/* Instrutor e Sala */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instructorId">Instrutor (ID) *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="instructorId"
                  {...form.register('instructorId')}
                  placeholder="Cole o ID do instrutor..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="roomId">Sala (ID) *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="roomId"
                  {...form.register('roomId')}
                  placeholder="Cole o ID da sala..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Conflito de Sala */}
          {checkingConflict && (
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
              <CardContent className="pt-4 flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Verificando disponibilidade da sala...</span>
              </CardContent>
            </Card>
          )}

          {roomConflict?.hasConflict && (
            <Card className="bg-red-50 dark:bg-red-950 border-red-200">
              <CardContent className="pt-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-700">Conflito de Sala</p>
                  <p className="text-sm text-red-600">
                    {roomConflict.conflictingClass 
                      ? `Já existe uma turma agendada nesta sala entre ${format(new Date(roomConflict.conflictingClass.startDate), 'dd/MM/yyyy')} e ${format(new Date(roomConflict.conflictingClass.endDate), 'dd/MM/yyyy')}`
                      : roomConflict.message || 'Conflito detectado nesta sala'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {roomConflict && !roomConflict.hasConflict && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200">
              <CardContent className="pt-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700">Sala disponível no período selecionado</span>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('startDate') ? format(form.watch('startDate'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('startDate')}
                    onSelect={(date) => date && form.setValue('startDate', date)}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Término (calculada)</Label>
              <div className="h-10 px-3 rounded-md border bg-muted flex items-center text-sm">
                {calculatedEndDate ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(calculatedEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </>
                ) : (
                  <span className="text-muted-foreground">Selecione o curso e data de início</span>
                )}
              </div>
            </div>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Horário Início *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  {...form.register('startTime')}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endTime">Horário Término *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  {...form.register('endTime')}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Capacidade */}
          <div>
            <Label htmlFor="maxStudents">Capacidade Máxima de Alunos *</Label>
            <Input
              id="maxStudents"
              type="number"
              min="1"
              max="100"
              {...form.register('maxStudents', { valueAsNumber: true })}
            />
          </div>

          {/* Resumo */}
          {selectedCourse && calculatedEndDate && (
            <Card className="bg-blue-50 dark:bg-blue-950">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">Resumo da Turma</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Curso:</strong> {selectedCourse.name}</p>
                  <p><strong>Duração:</strong> {selectedCourse.workload}h ({Math.ceil(selectedCourse.workload / selectedCourse.hoursPerDay)} dias úteis)</p>
                  <p><strong>Período:</strong> {format(form.watch('startDate'), 'dd/MM/yyyy')} a {format(calculatedEndDate, 'dd/MM/yyyy')}</p>
                  <p><strong>Horário:</strong> {form.watch('startTime')} às {form.watch('endTime')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating || roomConflict?.hasConflict || !selectedCourse}
              className="flex-1"
            >
              {isCreating ? 'Criando...' : 'Criar Turma'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
