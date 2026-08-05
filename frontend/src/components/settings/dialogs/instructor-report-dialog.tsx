'use client';

import React, { useMemo } from 'react';
import { UserCheck, Calendar, TrendingUp, Award, FileText, Printer, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ============================================
// Types
// ============================================

export interface InstructorPresence {
  id: string;
  date: string;
  confirmed: boolean;
}

export interface ClassInstructor {
  instructorId: string;
  presences: InstructorPresence[];
}

export interface ClassData {
  id: string;
  name: string;
  courseId: string;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  instructors?: ClassInstructor[];
}

export interface CourseData {
  id: string;
  name: string;
}

export interface InstructorData {
  id: string;
  code: string;
  name: string;
  role: string;
  phone?: string;
  linkedCostIds?: string[];
}

interface InstructorReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  classes?: ClassData[];
  courses?: CourseData[];
}

// ============================================
// Component
// ============================================

export function InstructorReportDialog({
  open,
  onOpenChange,
  instructor,
  classes = [],
  courses = [],
}: InstructorReportDialogProps) {
  const statistics = useMemo(() => {
    if (!instructor) {
      return {
        totalClasses: 0,
        totalPresences: 0,
        presencesByClass: [],
        activeClasses: 0,
        completedClasses: 0,
      };
    }

    const linkedClasses = classes.filter((cls) =>
      cls.instructors?.some((inst) => inst.instructorId === instructor.id)
    );

    let totalPresences = 0;
    const presencesByClass: {
      classData: ClassData;
      course: CourseData | undefined;
      presences: number;
      lastPresence?: string;
    }[] = [];

    linkedClasses.forEach((cls) => {
      const instructorInClass = cls.instructors?.find(
        (inst) => inst.instructorId === instructor.id
      );
      if (instructorInClass) {
        const numPresences = instructorInClass.presences.length;
        totalPresences += numPresences;

        const course = courses.find((c) => c.id === cls.courseId);

        const sortedPresences = [...instructorInClass.presences]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        presencesByClass.push({
          classData: cls,
          course,
          presences: numPresences,
          lastPresence: sortedPresences[0]?.date,
        });
      }
    });

    presencesByClass.sort((a, b) => b.presences - a.presences);

    return {
      totalClasses: linkedClasses.length,
      totalPresences,
      presencesByClass,
      activeClasses: linkedClasses.filter((c) => c.status === 'Em Andamento').length,
      completedClasses: linkedClasses.filter((c) => c.status === 'Concluída').length,
    };
  }, [instructor, classes, courses]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCheck className="w-6 h-6 text-purple-600" />
            Relatório do Instrutor
          </DialogTitle>
          <DialogDescription>
            Histórico completo de presenças e turmas ministradas
          </DialogDescription>
        </DialogHeader>

        {/* Instructor Info */}
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-600 text-xs">{instructor.code}</Badge>
                  <CardTitle className="text-xl">{instructor.name}</CardTitle>
                </div>
                <p className="text-sm text-gray-600">{instructor.role}</p>
                {instructor.phone && (
                  <p className="text-sm text-gray-500 mt-1">📱 {instructor.phone}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {statistics.totalClasses}
              </div>
              <div className="text-xs text-gray-600 mt-1">Turmas Vinculadas</div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {statistics.totalPresences}
              </div>
              <div className="text-xs text-gray-600 mt-1">Presenças Confirmadas</div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {statistics.activeClasses}
              </div>
              <div className="text-xs text-gray-600 mt-1">Turmas Ativas</div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {statistics.completedClasses}
              </div>
              <div className="text-xs text-gray-600 mt-1">Turmas Concluídas</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Presences by Class */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Detalhamento por Turma
          </h3>

          {statistics.presencesByClass.length === 0 ? (
            <Card className="bg-gray-50 border-dashed border-2">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Nenhuma turma vinculada a este instrutor
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {statistics.presencesByClass.map(({ classData, course, presences, lastPresence }) => (
                <Card
                  key={classData.id}
                  className={`hover:shadow-md transition-shadow ${
                    classData.status === 'Em Andamento'
                      ? 'border-l-4 border-l-orange-500'
                      : classData.status === 'Concluída'
                      ? 'border-l-4 border-l-green-500'
                      : 'border-l-4 border-l-gray-300'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{classData.name}</span>
                          <Badge
                            variant={
                              classData.status === 'Em Andamento'
                                ? 'default'
                                : classData.status === 'Concluída'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {classData.status}
                          </Badge>
                        </div>
                        {course && (
                          <p className="text-sm text-gray-600">Curso: {course.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {presences}
                          </span>
                          <span className="text-xs text-gray-500">presenças</span>
                        </div>
                        {lastPresence && (
                          <p className="text-xs text-gray-500 mt-1">
                            Última: {formatDate(lastPresence)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Linked Costs */}
        {instructor.linkedCostIds && instructor.linkedCostIds.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Custos Vinculados
              </h3>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <Badge className="bg-red-600">
                    {instructor.linkedCostIds.length}{' '}
                    {instructor.linkedCostIds.length === 1 ? 'custo vinculado' : 'custos vinculados'}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-2">
                    Os custos vinculados são gerenciados no Módulo 00 - Infraestrutura
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Performance Summary */}
        {statistics.totalClasses > 0 && (
          <>
            <Separator />
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-purple-900">Resumo de Desempenho</h4>
                    <p className="text-sm text-purple-700">
                      Média de{' '}
                      <strong>
                        {(statistics.totalClasses > 0 ? (statistics.totalPresences / statistics.totalClasses) : 0).toFixed(1)}
                      </strong>{' '}
                      presenças por turma •{' '}
                      <strong>
                        {Math.round(
                          (statistics.completedClasses / statistics.totalClasses) * 100
                        )}
                        %
                      </strong>{' '}
                      das turmas concluídas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
