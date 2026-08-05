'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Users, User, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Student {
  id: string;
  code: string;
  name: string;
  paymentStatus: boolean;
  documentStatus: boolean;
}

interface Instructor {
  id: string;
  code?: string;
  name: string;
}

interface ExistingExam {
  id: string;
  examNumber: string;
  examName: string;
  date: string;
  time: string;
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
  className: string;
  students: Student[];
  instructors: Instructor[];
  existingExam?: ExistingExam;
  onSchedule: (data: {
    examNumber: string;
    examName: string;
    date: string;
    time: string;
    instructorId: string;
    studentIds: string[];
  }) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ScheduleExamDialog({
  open,
  onOpenChange,
  mode,
  instructorId,
  studentId,
  classId,
  className,
  students,
  instructors,
  existingExam,
  onSchedule,
}: ScheduleExamDialogProps) {
  const [examNumber, setExamNumber] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (existingExam) {
        // Edit mode - load existing exam data
        setExamNumber(existingExam.examNumber);
        setExamName(existingExam.examName);
        setExamDate(existingExam.date);
        setExamTime(existingExam.time);
        setSelectedInstructor(existingExam.instructorId);
        setSelectedStudents(existingExam.studentIds);
      } else {
        // Create mode
        setExamNumber('');
        setExamName('');
        setExamDate('');
        setExamTime('');
        setSelectedInstructor(instructorId || '');
        setSelectedStudents(studentId ? [studentId] : []);
      }
    }
  }, [open, instructorId, studentId, existingExam]);

  // Filter eligible students (payment and documents OK)
  const eligibleStudents = students.filter(
    (student) => student.paymentStatus && student.documentStatus
  );

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(eligibleStudents.map((s) => s.id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleSubmit = () => {
    if (!examNumber || !examName || !examDate || !examTime) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!selectedInstructor) {
      toast.error('Selecione um instrutor.');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Selecione pelo menos um aluno.');
      return;
    }

    onSchedule({
      examNumber,
      examName,
      date: examDate,
      time: examTime,
      instructorId: selectedInstructor,
      studentIds: selectedStudents,
    });

    onOpenChange(false);
    toast.success(existingExam ? 'Prova atualizada com sucesso!' : 'Prova agendada com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {existingExam ? 'Editar Prova' : 'Agendar Prova'}
          </DialogTitle>
          <DialogDescription>
            Agendar prova para a turma <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="examNumber">
                <FileText className="w-4 h-4 inline mr-1" />
                Nº da Prova *
              </Label>
              <Input
                id="examNumber"
                value={examNumber}
                onChange={(e) => setExamNumber(e.target.value)}
                placeholder="Ex: EX001"
              />
            </div>

            <div>
              <Label htmlFor="examName">Nome da Prova *</Label>
              <Input
                id="examName"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Ex: Prova Prática NR-35"
              />
            </div>

            <div>
              <Label htmlFor="examDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="examTime">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário *
              </Label>
              <Input
                id="examTime"
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
              />
            </div>
          </div>

          {/* Instructor Selection */}
          {mode === 'select-instructor' && (
            <div>
              <Label>
                <User className="w-4 h-4 inline mr-1" />
                Instrutor *
              </Label>
              <Select value={selectedInstructor || ''} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um instrutor..." />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.code ? `${instructor.code} - ` : ''}
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Student Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                <Users className="w-4 h-4 inline mr-1" />
                Alunos ({selectedStudents.length} selecionados)
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Limpar
                </Button>
              </div>
            </div>

            {eligibleStudents.length === 0 ? (
              <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                  Nenhum aluno elegível encontrado. Os alunos devem ter pagamento e documentos aprovados.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {eligibleStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedStudents.includes(student.id)
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.code}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-100 text-green-700 border-green-300"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Pagamento OK
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-100 text-green-700 border-green-300"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Docs OK
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Ineligible students warning */}
            {students.length > eligibleStudents.length && (
              <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-700">
                  <XCircle className="w-3 h-3 inline mr-1" />
                  {students.length - eligibleStudents.length} aluno(s) não elegível(is) (pagamento ou documentos pendentes)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4 mr-2" />
            {existingExam ? 'Atualizar Prova' : 'Agendar Prova'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
