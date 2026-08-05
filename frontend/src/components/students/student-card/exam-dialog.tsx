'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Student, Instructor, User } from '@/types';
import { useExamsStore } from '@/stores/exams.store';
import { useCostsStore } from '@/stores/costs.store';
import { ExamResultDialog } from '@/components/operational/dialogs';
import { checkDocumentsComplete, createLocalDate } from './utils';
import type { ExamScheduleData } from './types';

interface ExamDialogProps {
  student: Student;
  instructors?: Instructor[];
  currentUser?: User;
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
  provaData: ExamScheduleData;
  setProvaData: (data: ExamScheduleData) => void;
  editProvaData: ExamScheduleData;
  setEditProvaData: (data: ExamScheduleData) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
}

/**
 * Exam scheduling and management dialog
 */
export const ExamDialog: React.FC<ExamDialogProps> = ({
  student,
  instructors = [],
  currentUser,
  onUpdateStudent,
  provaData,
  setProvaData,
  editProvaData,
  setEditProvaData,
  dialogOpen,
  setDialogOpen,
  cancelDialogOpen,
  setCancelDialogOpen,
}) => {
  const { exams, addExam, updateExam, deleteExam, getNextExamNumber } = useExamsStore();
  const { deleteCostEntriesByExamNumber, deleteCostEntriesByStudentExam } = useCostsStore();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  const documentsComplete = checkDocumentsComplete(student);
  const hasExam = student.examStatus?.active;
  const examResult = student.examResult;
  const examNumber = student.examStatus?.examNumber || '';
  const classId = student.classId;

  const usuarioAtual = {
    id: currentUser?.id || 'system-user',
    nome: currentUser?.name || 'Usuário do Sistema',
    nivel: currentUser?.role === 'Master' ? 'Master' : currentUser?.role === 'Admin' ? 'Admin' : 'Vendedor',
  } as const;

  const scheduledExam = useMemo(() => {
    if (!classId || !examNumber) return undefined;
    return exams.find((exam) => exam.classId === classId && exam.examNumber === examNumber);
  }, [exams, classId, examNumber]);

  const handleScheduleExam = () => {
    const nextExamNumber = getNextExamNumber();
    if (classId) {
      addExam({
        classId,
        examNumber: nextExamNumber,
        examName: provaData.examName,
        date: provaData.date,
        time: provaData.time,
        instructorId: provaData.instructorId,
        studentIds: [student.id],
        status: 'Scheduled',
      });
    }

    onUpdateStudent?.(student.id, {
      examStatus: {
        active: true,
        instructorId: provaData.instructorId,
        date: provaData.date,
        time: provaData.time,
        examNumber: nextExamNumber,
        examName: provaData.examName,
      },
    });
    toast.success('Prova agendada com sucesso!');
  };

  const handleCancelExam = () => {
    if (examNumber) {
      if (scheduledExam) {
        const remainingStudentIds = scheduledExam.studentIds.filter(
          (studentId) => studentId !== student.id
        );
        if (remainingStudentIds.length === 0) {
          deleteExam(scheduledExam.id);
          deleteCostEntriesByExamNumber({
            examNumber,
            classId: scheduledExam.classId,
          });
        } else {
          updateExam(scheduledExam.id, { studentIds: remainingStudentIds });
          deleteCostEntriesByStudentExam({
            studentId: student.id,
            examNumber,
            classId: scheduledExam.classId,
          });
        }
      } else if (classId) {
        deleteCostEntriesByStudentExam({ studentId: student.id, examNumber, classId });
      }
    }

    onUpdateStudent?.(student.id, {
      examStatus: {
        active: false,
        instructorId: '',
        date: '',
        time: '',
        examNumber: '',
        examName: '',
      },
    });
  };

  const getButtonStyle = () => {
    if (examResult) {
      if (examResult.status === 'Approved') {
        return 'bg-green-50 border-green-600 text-green-700';
      } else if (examResult.status === 'Failed') {
        return 'bg-red-50 border-red-600 text-red-700';
      }
      return 'bg-gray-50 border-gray-600 text-gray-700';
    }
    if (hasExam) {
      return 'bg-blue-50 border-blue-500 text-blue-700';
    }
    if (documentsComplete) {
      return 'border-gray-300 text-gray-700';
    }
    return 'bg-gray-100 border-gray-300 text-gray-400';
  };

  const getButtonIcon = () => {
    if (examResult) {
      if (examResult.status === 'Approved') return <CheckCircle2 className="w-3.5 h-3.5" />;
      if (examResult.status === 'Failed') return <XCircle className="w-3.5 h-3.5" />;
      return <AlertCircle className="w-3.5 h-3.5" />;
    }
    if (hasExam) return <ClipboardCheck className="w-3.5 h-3.5" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  const getButtonLabel = () => {
    if (examResult) {
      if (examResult.status === 'Approved') return 'APR';
      if (examResult.status === 'Failed') return 'REP';
      return 'N/S';
    }
    return 'PROVA';
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            disabled={!documentsComplete}
            className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${getButtonStyle()}`}
          >
            {getButtonIcon()}
            {getButtonLabel()}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasExam
                ? `Prova ${student.examStatus?.examNumber} - ${student.name}`
                : `Agendar Prova - ${student.name}`}
            </DialogTitle>
            <DialogDescription>
              {hasExam ? 'Detalhes da prova agendada.' : 'Agende uma prova para o aluno.'}
            </DialogDescription>
          </DialogHeader>

          {hasExam ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2 flex items-center justify-between">
                  <span>Prova Agendada</span>
                  <Badge className="bg-purple-600 text-white font-mono">
                    {student.examStatus?.examNumber}
                  </Badge>
                </h4>
                <div className="space-y-2 text-sm">
                  {student.examStatus?.examName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome da Prova:</span>
                      <span className="font-medium">{student.examStatus.examName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instrutor:</span>
                    <span className="font-medium">
                      {instructors.find((i) => i.id === student.examStatus?.instructorId)
                        ?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">
                      {student.examStatus?.date
                        ? createLocalDate(student.examStatus.date).toLocaleDateString('pt-BR')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-medium">{student.examStatus?.time || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 italic mb-2">
                * O código da prova é único e não pode ser alterado
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditProvaData({
                      examName: student.examStatus?.examName || '',
                      instructorId: student.examStatus?.instructorId || '',
                      date: student.examStatus?.date || '',
                      time: student.examStatus?.time || '',
                    });
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResultDialogOpen(true)}
                  className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                >
                  <ClipboardCheck className="w-4 h-4 mr-1" />
                  Resultado
                </Button>

                <Popover open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cancelar Prova
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-white border-red-200" align="end">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            Cancelar Prova?
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            Tem certeza que deseja cancelar a prova{' '}
                            {student.examStatus?.examNumber}? Esta ação não pode ser
                            desfeita.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelDialogOpen(false)}
                          className="flex-1"
                        >
                          Não, manter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleCancelExam();
                            setCancelDialogOpen(false);
                            toast.success('Prova cancelada!');
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          Sim, cancelar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="examName">Nome da Prova</Label>
                <Input
                  id="examName"
                  type="text"
                  placeholder="Ex: Prova Teórica, Prova Prática..."
                  value={provaData.examName}
                  onChange={(e) => setProvaData({ ...provaData, examName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="instructor">Instrutor</Label>
                <Select
                  value={provaData.instructorId}
                  onValueChange={(value) => setProvaData({ ...provaData, instructorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examDate">Data</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={provaData.date}
                    onChange={(e) => setProvaData({ ...provaData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="examTime">Hora</Label>
                  <Input
                    id="examTime"
                    type="time"
                    value={provaData.time}
                    onChange={(e) => setProvaData({ ...provaData, time: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleScheduleExam} className="w-full">
                Agendar Prova
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {hasExam && examNumber && (
        <ExamResultDialog
          open={resultDialogOpen}
          onOpenChange={setResultDialogOpen}
          aluno={{
            id: student.id,
            codigoSistema: student.code,
            nome: student.name,
          }}
          prova={{
            numeroProva: examNumber,
            nomeProva: student.examStatus?.examName || '',
            data: student.examStatus?.date || '',
          }}
          usuarioAtual={usuarioAtual}
          onRegistrarResultado={(_studentId, result, observations) => {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().slice(0, 5);
            const mappedStatus =
              result === 'Aprovado' ? 'Approved' :
              result === 'Reprovado' ? 'Failed' : 'NoShow';

            onUpdateStudent?.(student.id, {
              examResult: {
                score: null,
                status: mappedStatus,
                date,
                time,
                notes: observations,
                recordedBy: usuarioAtual.nome,
                confirmedBy: usuarioAtual.nome,
                confirmationDate: date,
                confirmationTime: time,
              },
            });
          }}
        />
      )}
    </>
  );
};