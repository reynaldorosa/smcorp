'use client';

import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Class, ClassStatus } from '@/stores/classes.store';
import type { Course } from '@/stores/courses.store';
import type { Room } from '@/stores/settings.store';
import type { Student } from '@/stores/students.store';

// ============================================
// TYPES
// ============================================

interface ClassCalendarProps {
  classes: Class[];
  courses: Course[];
  rooms: Room[];
  students: Student[];
  visibleClasses: Set<string>;
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
  onSelectClass: (classId: string, date: Date) => void;
  onOpenReportDialog: () => void;
  className?: string;
}

interface DayInfo {
  date: Date;
  dayOfWeek: number;
  dayNumber: number;
  isToday: boolean;
  classes: ClassForCalendar[];
}

interface ClassForCalendar {
  classItem: Class;
  course: Course | undefined;
  room: Room | undefined;
  studentCount: number;
  isDayInRange: boolean;
  position: { start: number; width: number };
}

// ============================================
// HELPERS
// ============================================

function getStatusColor(status: ClassStatus): string {
  const colors: Record<ClassStatus, string> = {
    Planned: 'bg-blue-500',
    Confirmed: 'bg-green-500',
    InProgress: 'bg-yellow-500',
    Completed: 'bg-gray-500',
    Cancelled: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);
  const start = days[0];
  const end = days[6];

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };

  return `${start.toLocaleDateString('pt-BR', options)} - ${end.toLocaleDateString('pt-BR', options)}`;
}

function isDateInRange(date: Date, start: string, end: string): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ============================================
// COMPONENT
// ============================================

export function ClassCalendar({
  classes,
  courses,
  rooms,
  students,
  visibleClasses,
  currentWeek,
  onWeekChange,
  onSelectClass,
  onOpenReportDialog,
  className,
}: ClassCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);

  // Filter visible classes
  const visibleClassItems = useMemo(() => {
    return classes.filter(
      (c) => visibleClasses.has(c.id) && c.status !== 'Cancelled'
    );
  }, [classes, visibleClasses]);

  // Build calendar data
  const calendarData = useMemo<DayInfo[]>(() => {
    return weekDays.map((date) => {
      const dayClasses: ClassForCalendar[] = [];

      visibleClassItems.forEach((classItem) => {
        const isDayInRange = isDateInRange(
          date,
          classItem.startDate,
          classItem.endDate
        );

        if (isDayInRange) {
          const course = courses.find((c) => c.id === classItem.courseId);
          const room = rooms.find((r) => r.id === classItem.roomId);
          const studentCount = students.filter(
            (s) => s.classId === classItem.id && s.status !== 'Replaced'
          ).length;

          // Calculate position in timeline (simplified: 8h-18h)
          const startHour = course?.hoursPerDay === 4 ? 8 : 8;
          const endHour = startHour + (course?.hoursPerDay || 8);
          const start = ((startHour - 6) / 12) * 100;
          const width = ((endHour - startHour) / 12) * 100;

          dayClasses.push({
            classItem,
            course,
            room,
            studentCount,
            isDayInRange,
            position: { start, width },
          });
        }
      });

      return {
        date,
        dayOfWeek: date.getDay(),
        dayNumber: date.getDate(),
        isToday: isSameDay(date, today),
        classes: dayClasses,
      };
    });
  }, [weekDays, visibleClassItems, courses, rooms, students, today]);

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    onWeekChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    onWeekChange(newDate);
  };

  const handleToday = () => {
    onWeekChange(new Date());
  };

  return (
    <div className={className || 'col-span-12 lg:col-span-7 space-y-4'}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Agenda Semanal
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoje
              </Button>
              <span className="text-xs font-medium min-w-[120px] text-center">
                {formatWeekRange(currentWeek)}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onOpenReportDialog}>
                Relatório
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Header: Days */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {calendarData.map((day, idx) => (
              <div
                key={idx}
                className={`text-center p-2 rounded-lg text-xs font-medium border ${
                  day.isToday
                    ? 'bg-primary text-primary-foreground border-primary'
                    : day.dayOfWeek === 0 || day.dayOfWeek === 6
                    ? 'bg-muted/50 text-muted-foreground border-transparent'
                    : 'bg-background border-border'
                }`}
              >
                <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-1">{dayNames[day.dayOfWeek]}</div>
                <div className="text-xl font-bold">{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-2 min-h-[200px] flex flex-col gap-2 transition-colors ${
                  day.isToday
                    ? 'border-primary/20 bg-primary/5'
                    : day.dayOfWeek === 0 || day.dayOfWeek === 6
                    ? 'bg-muted/30 border-dashed'
                    : 'bg-card'
                }`}
              >
                {day.classes.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-center text-muted-foreground text-[10px]">
                      {day.dayOfWeek === 0 || day.dayOfWeek === 6
                        ? 'Fim de semana'
                        : 'Sem aulas'}
                    </p>
                  </div>
                ) : (
                  <>
                    {day.classes.map(({ classItem, course, room, studentCount }) => (
                      <div
                        key={classItem.id}
                        onClick={() => onSelectClass(classItem.id, day.date)}
                        className={`${getStatusColor(classItem.status)} text-white rounded-md p-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm ring-1 ring-black/5`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold truncate tracking-tight">{classItem.code}</span>
                          {studentCount >= classItem.maxStudents && (
                             <AlertCircle className="w-3 h-3 text-white/90" />
                          )}
                        </div>
                        
                        <div className="text-[10px] font-medium leading-tight mb-2 opacity-95 line-clamp-2">
                          {classItem.displayName || course?.name}
                        </div>
                        
                        <div className="space-y-1 pt-1 border-t border-white/20">
                          <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                            <Clock className="w-3 h-3" />
                            <span>{course?.hoursPerDay || 8}h</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                            <Users className="w-3 h-3" />
                            <span>{studentCount}/{classItem.maxStudents}</span>
                          </div>
                          {room && (
                            <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{room.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-2 border-t">
            <div className="flex items-center gap-1 text-[10px]">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Planejada</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="w-3 h-3 rounded bg-gray-500" />
              <span>Concluída</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
