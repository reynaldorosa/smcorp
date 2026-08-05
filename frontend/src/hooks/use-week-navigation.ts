import { useState, useCallback, useMemo } from 'react';
import { 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
  format, 
  eachDayOfInterval, 
  isToday,
  isSameDay,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WeekDay {
  date: Date;
  dayName: string; // "Segunda"
  formatted: string; // "13/01"
  fullFormatted: string; // "Segunda 13/01"
  isToday: boolean;
}

interface ClassItem {
  id: string;
  startDate?: string;
  endDate?: string;
}

interface Enrollment {
  id: string;
  classId?: string;
}

interface ExamMapEntry {
  scheduledDate?: string;
}

export const useWeekNavigation = (initialDate?: Date) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(initialDate || new Date(), { weekStartsOn: 1 })
  );

  const weekDays: WeekDay[] = useMemo(() => {
    const start = currentWeekStart;
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start, end }).map(date => ({
      date,
      dayName: format(date, 'EEEE', { locale: ptBR }),
      formatted: format(date, 'dd/MM'),
      fullFormatted: `${format(date, 'EEEE dd/MM', { locale: ptBR })}`,
      isToday: isToday(date)
    }));
  }, [currentWeekStart]);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  const isClassActiveOnDate = useCallback((classItem: ClassItem, targetDate: Date) => {
    if (!classItem.startDate) return false;
    
    const classStart = new Date(classItem.startDate);
    const classEnd = classItem.endDate ? new Date(classItem.endDate) : new Date(classStart);
    
    // Verifica se a data está no intervalo da turma
    return targetDate >= classStart && targetDate <= classEnd;
  }, []);

  // Nova função: verifica se há provas de uma turma em uma data específica
  const hasExamOnDate = useCallback((
    classItem: ClassItem,
    targetDate: Date,
    enrollments: Enrollment[],
    examsMap: Record<string, ExamMapEntry>
  ) => {
    if (!enrollments || !examsMap) return false;
    
    // Filtra matrículas da turma
    const classEnrollments = enrollments.filter((e) => e.classId === classItem.id);
    
    // Verifica se alguma matrícula tem prova na data
    return classEnrollments.some((enrollment) => {
      const exam = examsMap[enrollment.id];
      if (!exam || !exam.scheduledDate) return false;
      
      const examDate = new Date(exam.scheduledDate);
      return isSameDay(examDate, targetDate);
    });
  }, []);

  // Nova função: retorna se a turma deve aparecer (ativa OU com prova)
  const shouldShowClassOnDate = useCallback((
    classItem: ClassItem, 
    targetDate: Date, 
    enrollments?: Enrollment[], 
    examsMap?: Record<string, ExamMapEntry>
  ) => {
    const isActive = isClassActiveOnDate(classItem, targetDate);
    const hasExam = enrollments && examsMap ? hasExamOnDate(classItem, targetDate, enrollments, examsMap) : false;
    
    return isActive || hasExam;
  }, [isClassActiveOnDate, hasExamOnDate]);

  // Nova função: retorna info se é dia de prova
  const getExamDayInfo = useCallback((
    classItem: ClassItem, 
    targetDate: Date, 
    enrollments: Enrollment[], 
    examsMap: Record<string, ExamMapEntry>
  ) => {
    const hasExam = hasExamOnDate(classItem, targetDate, enrollments, examsMap);
    
    if (!hasExam) return { isExamDay: false, studentsCount: 0 };
    
    // Contar alunos com prova nesse dia
    const classEnrollments = enrollments.filter((e) => e.classId === classItem.id);
    const studentsWithExam = classEnrollments.filter((enrollment) => {
      const exam = examsMap[enrollment.id];
      if (!exam || !exam.scheduledDate) return false;
      
      const examDate = new Date(exam.scheduledDate);
      return isSameDay(examDate, targetDate);
    });
    
    return {
      isExamDay: true,
      studentsCount: studentsWithExam.length
    };
  }, [hasExamOnDate]);

  return {
    currentWeekStart,
    weekDays,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    isClassActiveOnDate,
    hasExamOnDate,
    shouldShowClassOnDate,
    getExamDayInfo
  };
};
