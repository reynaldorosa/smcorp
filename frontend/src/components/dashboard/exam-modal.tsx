'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enrollmentOperations, examOperations } from '@/services/operations.service';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentName: string;
  documentsStatus: 'PENDING' | 'COMPLETE' | 'REJECTED';
}

interface EnrollmentClassInfo {
  courseId?: string;
}

interface EnrollmentInfo {
  class?: EnrollmentClassInfo;
}

interface ExamInfo {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  examCode?: string;
  examNumber?: string;
  examType?: string;
  duration?: number;
  notes?: string;
  instructorId?: string;
  status?: string;
  score?: number | null;
}

interface ExamUpdatePayload {
  scheduledDate?: string;
  scheduledTime?: string;
  examNumber?: string;
  examType?: string;
  duration?: number;
  notes?: string;
  instructorId?: string;
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

export function ExamModal({
  open,
  onClose,
  enrollmentId,
  studentName,
  documentsStatus,
}: ExamModalProps) {
  const [scheduling, setScheduling] = useState(false);
  const [recording, setRecording] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [examTime, setExamTime] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [examNumber, setExamNumber] = useState('');
  const [examType, setExamType] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(true);
  const queryClient = useQueryClient();

  // Verificar se pode agendar prova
  const { data: canSchedule, isLoading: checkingEligibility } = useQuery({
    queryKey: ['canSchedule', enrollmentId],
    queryFn: () => examOperations.canSchedule(enrollmentId),
    enabled: open && documentsStatus === 'COMPLETE',
  });

  // Buscar enrollment completo para pegar courseId e classId
  const { data: enrollment } = useQuery<EnrollmentInfo>({
    queryKey: ['enrollment', enrollmentId],
    queryFn: async () => {
      return enrollmentOperations.getById(enrollmentId);
    },
    enabled: open,
  });

  // Buscar provas do aluno
  const { data: exams, isLoading: loadingExams } = useQuery<ExamInfo[]>({
    queryKey: ['exams', enrollmentId],
    queryFn: () => examOperations.getByEnrollment(enrollmentId),
    enabled: open,
  });

  const currentExam = exams?.[0]; // Última prova agendada

  const handleSchedule = async () => {
    if (!examDate || !examTime || !instructorId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha data, horário e instrutor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setScheduling(true);

      // Combinar data + horário
      const scheduledDateTime = new Date(examDate);
      const [hours, minutes] = examTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      if (!enrollment?.class?.courseId) {
        throw new Error('Dados do enrollment incompletos');
      }

      await examOperations.schedule({
        enrollmentId,
        courseId: enrollment.class.courseId,
        instructorId,
        examNumber: `EX-${Date.now()}`,
        scheduledDate: scheduledDateTime,
        scheduledTime: examTime,
      });

      toast({
        title: 'Prova agendada!',
        description: `Prova marcada para ${format(examDate, 'dd/MM/yyyy', { locale: ptBR })} às ${examTime}.`,
      });

      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setExamDate(undefined);
      setExamTime('');
      setInstructorId('');
    } catch (error: unknown) {
      toast({
        title: 'Erro ao agendar prova',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setScheduling(false);
    }
  };

  const handleRecordResult = async (examId: string) => {
    if (score < 0 || score > 100) {
      toast({
        title: 'Nota inválida',
        description: 'A nota deve estar entre 0 e 100.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRecording(true);

      await examOperations.recordResult({
        examId,
        score,
        passed,
      });

      toast({
        title: 'Resultado registrado!',
        description: passed ? 'Aluno aprovado!' : 'Aluno reprovado.',
      });

      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao registrar resultado',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setRecording(false);
    }
  };

  const handleCancel = async (examId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta prova?')) return;

    try {
      await examOperations.delete(examId);

      toast({
        title: 'Prova cancelada',
        description: 'O agendamento foi removido.',
      });

      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['activeClassesWithExams'] });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao cancelar prova',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDate = async (examId: string) => {
    if (!examDate || !examTime) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha data e horário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);

      await examOperations.update(examId, {
        scheduledDate: examDate,
        scheduledTime: examTime,
        examNumber: examNumber || undefined,
        examType: examType || undefined,
        duration: duration || undefined,
        notes: notes || undefined,
        instructorId: instructorId || undefined,
      });

      toast({
        title: 'Prova atualizada!',
        description: 'Todas as alterações foram salvas.',
      });

      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['activeClassesWithExams'] });
      setEditing(false);
      resetEditFields();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar prova',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const resetEditFields = () => {
    setExamDate(undefined);
    setExamTime('');
    setExamNumber('');
    setExamType('');
    setDuration(60);
    setNotes('');
    setInstructorId('');
  };

  const loadExamDataForEditing = (exam: ExamInfo) => {
    setExamDate(new Date(exam.scheduledDate));
    setExamTime(exam.scheduledTime);
    setExamNumber(exam.examNumber || '');
    setExamType(exam.examType || '');
    setDuration(exam.duration || 60);
    setNotes(exam.notes || '');
    setInstructorId(exam.instructorId || '');
    setEditing(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-purple-500',
      APPROVED: 'bg-green-500',
      FAILED: 'bg-red-500',
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  // Bloquear se documentos não estão completos
  if (documentsStatus !== 'COMPLETE') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Prova Bloqueada
            </DialogTitle>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <XCircle className="h-16 w-16 mx-auto text-red-500" />
                <div>
                  <p className="font-semibold text-lg">Documentos Pendentes</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    O aluno precisa ter todos os documentos validados antes de agendar a prova.
                  </p>
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Gerenciar Prova - {studentName}
          </DialogTitle>
          <DialogDescription>
            Agende provas e registre resultados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status de Elegibilidade */}
          {checkingEligibility ? (
            <Skeleton className="h-20" />
          ) : canSchedule?.canSchedule ? (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Elegível para Prova</p>
                  <p className="text-sm text-green-600">Todos os documentos foram validados.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-red-50 dark:bg-red-950 border-red-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-700">Não Elegível</p>
                  <p className="text-sm text-red-600">{canSchedule?.reason || 'Documentos pendentes'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agendar Nova Prova */}
          {(!currentExam || currentExam.status === 'FAILED') && canSchedule?.canSchedule && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Agendar Prova
                </h3>

                {/* Nome da Prova - OPCIONAL */}
                <div>
                  <Label>
                    Nome da Prova <span className="text-muted-foreground text-xs">(opcional)</span>
                  </Label>
                  <Input
                    placeholder="Ex: Prova Teórica NR35, Avaliação Prática"
                    value={examNumber}
                    onChange={(e) => setExamNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dê um nome descritivo para facilitar a identificação
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Prova</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {examDate ? format(examDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={examDate}
                          onSelect={setExamDate}
                          locale={ptBR}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Horário (HH:MM)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={examTime}
                        onChange={(e) => setExamTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Instrutor (ID)</Label>
                  <Input
                    placeholder="Cole o ID do instrutor..."
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                  />
                </div>

                <Button onClick={handleSchedule} disabled={scheduling} className="w-full">
                  {scheduling ? 'Agendando...' : 'Agendar Prova'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Prova Atual */}
          {loadingExams ? (
            <Skeleton className="h-40" />
          ) : currentExam ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Prova Agendada</h3>
                      {currentExam.examCode && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          {currentExam.examCode}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      {currentExam.examNumber && (
                        <p>
                          <strong>Nome:</strong> {currentExam.examNumber}
                        </p>
                      )}
                      <p>
                        <strong>Data:</strong> {new Date(currentExam.scheduledDate).toLocaleDateString('pt-BR')} às {currentExam.scheduledTime}
                      </p>
                      <p>
                        <strong>Status:</strong> {getStatusBadge(currentExam.status || 'SCHEDULED')}
                      </p>
                      {currentExam.score !== null && (
                        <p>
                          <strong>Nota:</strong> {currentExam.score}/100
                        </p>
                      )}
                    </div>
                  </div>

                  {currentExam.status === 'SCHEDULED' && !editing && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadExamDataForEditing(currentExam)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(currentExam.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Modo Edição: Alterar Todos os Campos */}
                {editing && currentExam.status === 'SCHEDULED' && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold">Editar Prova</h4>
                    
                    <div className="space-y-3">
                      {/* Código P0001 - NÃO EDITÁVEL */}
                      <div>
                        <Label>Código da Prova (não editável)</Label>
                        <Input
                          value={currentExam.examCode}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>

{/* Nome da Prova - EDITÁVEL */}
                    <div>
                      <Label>Nome da Prova</Label>
                      <Input
                        value={examNumber}
                        onChange={(e) => setExamNumber(e.target.value)}
                        placeholder="Ex: Prova Teórica NR35, Avaliação Final"
                        />
                      </div>

                      {/* Tipo */}
                      <div>
                        <Label>Tipo da Prova</Label>
                        <Input
                          value={examType}
                          onChange={(e) => setExamType(e.target.value)}
                          placeholder="Ex: Teórica, Prática"
                        />
                      </div>

                      {/* Data e Hora */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Data</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {examDate ? format(examDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={examDate}
                                onSelect={setExamDate}
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label>Horário (HH:MM)</Label>
                          <Input
                            type="time"
                            value={examTime}
                            onChange={(e) => setExamTime(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Duração */}
                      <div>
                        <Label>Duração (minutos)</Label>
                        <Input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          min="1"
                          max="480"
                        />
                      </div>

                      {/* Instrutor */}
                      <div>
                        <Label>Instrutor (ID)</Label>
                        <Input
                          value={instructorId}
                          onChange={(e) => setInstructorId(e.target.value)}
                          placeholder="ID do instrutor"
                        />
                      </div>

                      {/* Observações */}
                      <div>
                        <Label>Observações</Label>
                        <Input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Observações sobre a prova"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateDate(currentExam.id)}
                        disabled={updating}
                        className="flex-1"
                      >
                        {updating ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          resetEditFields();
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Registrar Resultado */}
                {currentExam.status === 'SCHEDULED' && !editing && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold">Registrar Resultado</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nota (0-100)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={score}
                          onChange={(e) => setScore(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label>Resultado</Label>
                        <Select value={passed ? 'true' : 'false'} onValueChange={(v) => setPassed(v === 'true')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Aprovado</SelectItem>
                            <SelectItem value="false">Reprovado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={() => handleRecordResult(currentExam.id)} disabled={recording} className="w-full">
                      {recording ? 'Salvando...' : 'Salvar Resultado'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Nenhuma prova agendada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
