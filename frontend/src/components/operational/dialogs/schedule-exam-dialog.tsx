'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, User, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Class, Instructor, Student } from '@/types';

interface ExistingExam {
  id: string;
  examNumber: string;
  examName: string;
  data: string;
  hora: string;
  instructorId: string;
  studentIds: string[];
}

interface ScheduleExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'select-students' | 'select-instructor';
  instructorId?: string;
  studentId?: string;
  classId: string;
  classes: Class[];
  students: Student[];
  instructors: Instructor[];
  existingExam?: ExistingExam;
  autoExamNumber?: string;
  onScheduleExam: (data: {
    classId: string;
    examNumber: string;
    examName: string;
    data: string;
    hora: string;
    instructorId: string;
    studentIds: string[];
  }) => void;
  onEditExam?: (examId: string, data: {
    examNumber: string;
    examName: string;
    data: string;
    hora: string;
    instructorId: string;
    studentIds: string[];
  }) => void;
}

export const ScheduleExamDialog: React.FC<ScheduleExamDialogProps> = ({
  open,
  onOpenChange,
  mode,
  instructorId,
  studentId,
  classId,
  classes,
  autoExamNumber,
  students,
  instructors,
  existingExam,
  onScheduleExam,
  onEditExam
}) => {
  const [examNumber, setExamNumber] = useState('');
  const [examName, setExamName] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [horaProva, setHoraProva] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const classItem = classes.find((item) => item.id === classId);

  // Resetar form quando abre/fecha
  useEffect(() => {
    if (!open) return;

    if (existingExam) {
      // Modo edição - carregar dados da prova existente
      setExamNumber(existingExam.examNumber);
      setExamName(existingExam.examName);
      setDataProva(existingExam.data);
      setHoraProva(existingExam.hora);
      setSelectedInstructorId(existingExam.instructorId);
      setSelectedStudentIds(existingExam.studentIds);
    } else {
      // Modo criação
      setExamNumber(autoExamNumber || '');
      setExamName('');
      setDataProva('');
      setHoraProva('');
      setSelectedInstructorId(instructorId || '');
      setSelectedStudentIds(studentId ? [studentId] : []);
    }
  }, [open, instructorId, studentId, existingExam, autoExamNumber]);

  // Filtrar alunos da turma que estão aptos para fazer prova (pagamento e documentos OK)
  const studentsInClass = students.filter((student) => {
    if (!classItem) return false;

    if (student.classId !== classId) return false;

    const paymentOk =
      student.paymentComplete ||
      (student.payments?.history &&
        student.payments.history.some((payment) => payment.confirmedBy));

    const documentsOk =
      student.documentsComplete ||
      (student.documents &&
        student.documents.some((doc) => doc.status === 'Approved'));

    return paymentOk && documentsOk;
  });

  const toggleStudent = (studentIdToToggle: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentIdToToggle)
        ? prev.filter((id) => id !== studentIdToToggle)
        : [...prev, studentIdToToggle]
    );
  };

  const handleConfirmar = () => {
    // Validações
    if (!examNumber.trim()) {
      toast.error('Digite o número da prova');
      return;
    }
    if (!examName.trim()) {
      toast.error('Digite o nome da prova');
      return;
    }
    if (!dataProva) {
      toast.error('Selecione a data da prova');
      return;
    }
    if (!horaProva) {
      toast.error('Digite o horário da prova');
      return;
    }
    if (!selectedInstructorId) {
      toast.error('Selecione o instrutor');
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error('Selecione pelo menos um aluno');
      return;
    }

    if (existingExam && onEditExam) {
      // Modo edição
      onEditExam(existingExam.id, {
        examNumber,
        examName,
        data: dataProva,
        hora: horaProva,
        instructorId: selectedInstructorId,
        studentIds: selectedStudentIds
      });
      toast.success('Prova atualizada com sucesso!');
    } else {
      // Modo criação
      onScheduleExam({
        classId,
        examNumber,
        examName,
        data: dataProva,
        hora: horaProva,
        instructorId: selectedInstructorId,
        studentIds: selectedStudentIds
      });
      toast.success(
        `Prova agendada com sucesso! ${selectedStudentIds.length} aluno(s) cadastrado(s).`
      );
    }

    onOpenChange(false);
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(studentsInClass.map((student) => student.id));
  };

  const clearAllStudents = () => {
    setSelectedStudentIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            {existingExam ? 'Editar Prova Agendada' : 'Agendar Prova'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'select-students' 
              ? 'Selecione os alunos que farão a prova com este instrutor'
              : 'Selecione o instrutor e configure os dados da prova'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Informações da Turma */}
          {classItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900">
                Turma: {classItem.displayName || classItem.code}
              </div>
            </div>
          )}

          {/* Dados da Prova */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número da Prova *</Label>
              <Input
                placeholder="Ex: P001"
                value={examNumber}
                onChange={(e) => setExamNumber(e.target.value)}
                className="font-mono"
                readOnly
              />
            </div>
            <div>
              <Label>Nome da Prova *</Label>
              <Input
                placeholder="Ex: Prova Teórica"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>
            <div>
              <Label>Data da Prova *</Label>
              <Input
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
              />
            </div>
            <div>
              <Label>Horário *</Label>
              <Input
                type="time"
                value={horaProva}
                onChange={(e) => setHoraProva(e.target.value)}
              />
            </div>
          </div>

          {/* Seleção de Instrutor */}
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Instrutor Aplicador *
            </Label>
            <Select 
              value={selectedInstructorId || ''} 
              onValueChange={setSelectedInstructorId}
              disabled={!!instructorId}
            >
              <SelectTrigger className={instructorId ? 'bg-gray-100 cursor-not-allowed' : ''}>
                <SelectValue placeholder="Selecione o instrutor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instrutor) => (
                  <SelectItem key={instrutor.id} value={instrutor.id}>
                    {instrutor.code || instrutor.id.slice(0, 6)} - {instrutor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instructorId && (
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Instrutor pré-selecionado pelo card
              </p>
            )}
          </div>

          {/* Seleção de Alunos */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Alunos Participantes * ({selectedStudentIds.length} selecionado{selectedStudentIds.length !== 1 ? 's' : ''})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selectAllStudents}
                  disabled={studentsInClass.length === 0}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearAllStudents}
                  disabled={selectedStudentIds.length === 0}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Desmarcar Todos
                </Button>
              </div>
            </div>

            {studentsInClass.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Nenhum aluno apto para prova nesta turma.
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Os alunos precisam ter pagamento e documentos aprovados.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                  {studentsInClass.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {student.code}
                            </Badge>
                            <span className="font-medium text-gray-900">
                              {student.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            CPF: {student.taxId || 'Nao informado'}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              {existingExam ? 'Atualizar Prova' : 'Agendar Prova'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
