'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Clock, Users, Edit2, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Class, Instructor, Student, ScheduledExam } from '@/types';

interface InstructorExamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  classId: string;
  instructor: Instructor;
  classItem: Class;
  scheduledExams: ScheduledExam[];
  students: Student[];
  onNewExam: () => void;
  onEditExam: (exam: ScheduledExam) => void;
  onDeleteExam: (examId: string) => void;
}

export const InstructorExamsDialog: React.FC<InstructorExamsDialogProps> = ({
  open,
  onOpenChange,
  instructorId,
  classId,
  instructor,
  classItem,
  scheduledExams,
  students,
  onNewExam,
  onEditExam,
  onDeleteExam
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  const examsForInstructor = scheduledExams.filter(
    (exam) => exam.instructorId === instructorId && exam.classId === classId
  );

  const handleNewExam = () => {
    onNewExam();
  };

  const handleEditExam = (exam: ScheduledExam) => {
    onEditExam(exam);
  };

  const handleDeleteExam = (examId: string) => {
    setExamToDelete(examId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletion = () => {
    if (examToDelete) {
      onDeleteExam(examToDelete);
      toast.success('Prova excluída com sucesso!');
      setExamToDelete(null);
      setDeleteDialogOpen(false);
      
      const remainingExams = scheduledExams.filter(
        (exam) =>
          exam.id !== examToDelete &&
          exam.instructorId === instructorId &&
          exam.classId === classId
      );
      if (remainingExams.length === 0) {
        onOpenChange(false);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Provas do Instrutor
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {instructor && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {instructor.code || `INS-${instructor.id.slice(0, 4).toUpperCase()}`}
                    </Badge>
                    <span className="font-medium">{instructor.name}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      Turma: {classItem?.displayName || classItem?.code}
                    </span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* New Exam Button */}
            <Button
              onClick={handleNewExam}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agendar Nova Prova
            </Button>

            {/* Exam List */}
            {examsForInstructor.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhuma prova agendada ainda</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Clique em &quot;Agendar Nova Prova&quot; para começar
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {examsForInstructor.map((exam) => {
                    const examStudents = students.filter((student) =>
                      exam.studentIds.includes(student.id)
                    );
                    const formattedDate = new Date(
                      `${exam.date}T00:00:00`
                    ).toLocaleDateString('pt-BR');

                    return (
                      <Card key={exam.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Exam Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 font-mono">
                                  {exam.examNumber}
                                </Badge>
                                <h4 className="font-semibold text-gray-900">
                                  {exam.examName}
                                </h4>
                              </div>

                              {/* Exam Info */}
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  {formattedDate}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {exam.time}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="w-4 h-4" />
                                  {examStudents.length} aluno{examStudents.length !== 1 ? 's' : ''}
                                </div>
                              </div>

                              {/* Student List */}
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  Alunos cadastrados:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {examStudents.map((student) => (
                                    <Badge key={student.id} variant="secondary" className="text-xs">
                                      {student.code} - {student.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditExam(exam)}
                                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteExam(exam.id)}
                                className="border-red-500 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Excluir Prova
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta prova?
              <br />
              <span className="text-red-600 font-semibold">
                Esta ação não pode ser desfeita e removerá o agendamento de todos os alunos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletion}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
