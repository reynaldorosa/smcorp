'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { WeekDay } from '@/hooks/use-week-navigation';
import { cn } from '@/lib/utils';

interface WeeklyViewProps {
  weekDays: WeekDay[];
  classes: ClassItem[];
  enrollments: Enrollment[];
  examsMap: Record<string, ExamMapEntry>;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  shouldShowClassOnDate: (
    classItem: ClassItem,
    date: Date,
    enrollments: Enrollment[],
    examsMap: Record<string, ExamMapEntry>
  ) => boolean;
  getExamDayInfo: (
    classItem: ClassItem,
    date: Date,
    enrollments: Enrollment[],
    examsMap: Record<string, ExamMapEntry>
  ) => ExamDayInfo;
  onClassClick: (classId: string, examDate?: Date) => void;
}

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
  displayName?: string;
  course?: CourseInfo;
  instructor?: InstructorInfo;
  room?: RoomInfo;
  isExamDay?: boolean;
  examDate?: string;
  examCount?: number;
  status?: string;
}

interface Enrollment {
  id: string;
  classId?: string;
  studentId?: string;
  status?: string;
}

interface ExamMapEntry {
  classId?: string;
  studentId?: string;
  date?: string;
}

interface ExamDayInfo {
  isExamDay: boolean;
  studentsCount: number;
}

export function WeeklyView({
  weekDays,
  classes,
  enrollments,
  examsMap,
  onPreviousWeek,
  onNextWeek,
  onToday,
  shouldShowClassOnDate,
  getExamDayInfo,
  onClassClick
}: WeeklyViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Visualização Semanal
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
              Semana Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
            >
              Hoje
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextWeek}
            >
              Próxima Semana
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayClasses = classes?.filter((classItem) => 
              shouldShowClassOnDate(classItem, day.date, enrollments, examsMap)
            ) || [];
            
            return (
              <div
                key={day.formatted}
                className={cn(
                  "rounded-lg border p-3 min-h-[200px]",
                  day.isToday && "bg-red-900/20 border-red-500"
                )}
              >
                {/* Cabeçalho do dia */}
                <div className="mb-3 pb-2 border-b">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {day.dayName}
                  </div>
                  <div className={cn(
                    "text-sm font-semibold",
                    day.isToday && "text-red-400"
                  )}>
                    {day.formatted}
                  </div>
                </div>
                
                {/* Turmas do dia */}
                <div className="space-y-2">
                  {dayClasses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhuma turma
                    </p>
                  ) : (
                    dayClasses.map((classItem) => {
                      const examInfo = getExamDayInfo(classItem, day.date, enrollments, examsMap);
                      
                      // Verificar se é dia de prova da turma (card azul)
                      const isClassExamDay = classItem.isExamDay && classItem.examDate && 
                        new Date(classItem.examDate).toDateString() === day.date.toDateString();
                      
                      return (
                        <div
                          key={`${classItem.id}-${isClassExamDay ? 'exam' : 'normal'}`}
                          onClick={() => onClassClick(classItem.id, examInfo.isExamDay ? day.date : undefined)}
                          className={cn(
                            "rounded p-2 text-xs space-y-1 cursor-pointer transition-all hover:scale-105",
                            isClassExamDay
                              ? "bg-blue-900/40 border border-blue-500" // Card azul para prova da turma
                              : examInfo.isExamDay 
                                ? "bg-orange-900/40 border border-orange-500" // Card laranja para exames individuais
                                : "bg-secondary/50" // Card normal
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-medium truncate flex-1" title={classItem.displayName || classItem.course?.name}>
                              {isClassExamDay 
                                ? `Prova da turma #${classItem.code}` 
                                : (classItem.displayName || classItem.course?.name)}
                            </div>
                            
                            {isClassExamDay ? (
                              <Badge 
                                variant="outline"
                                className="text-[10px] h-4 bg-blue-500 text-white border-blue-600"
                              >
                                PROVA
                              </Badge>
                            ) : examInfo.isExamDay && (
                              <Badge 
                                variant="outline"
                                className="text-[10px] h-4 bg-orange-500 text-white border-orange-600"
                              >
                                PROVA
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-muted-foreground truncate" title={classItem.instructor?.name}>
                            👨‍🏫 {classItem.instructor?.name}
                          </div>
                          
                          <div className="text-muted-foreground truncate" title={classItem.room?.name}>
                            🏫 {classItem.room?.name}
                          </div>
                          
                          {isClassExamDay ? (
                            <div className="text-blue-400 font-medium">
                              📝 {classItem.examCount} aluno{classItem.examCount !== 1 ? 's' : ''} em prova
                            </div>
                          ) : examInfo.isExamDay ? (
                            <div className="text-orange-400 font-medium">
                              📝 {examInfo.studentsCount} aluno{examInfo.studentsCount !== 1 ? 's' : ''} em prova
                            </div>
                          ) : (
                            <Badge 
                              variant={
                                classItem.status === 'IN_PROGRESS' ? 'default' : 
                                classItem.status === 'SCHEDULED' ? 'secondary' : 
                                'outline'
                              }
                              className="text-[10px] h-4"
                            >
                              {classItem.status === 'IN_PROGRESS' ? 'Em Andamento' : 
                               classItem.status === 'SCHEDULED' ? 'Agendada' : 
                               classItem.status}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
