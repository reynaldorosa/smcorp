'use client';

import React, { useMemo } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp, Edit, Calendar, MapPin, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Class, ClassStatus } from '@/stores/classes.store';
import type { Course } from '@/stores/courses.store';
import type { Room } from '@/stores/settings.store';
import type { Company } from '@/stores/companies.store';
import type { Student } from '@/stores/students.store';

interface ClassSidebarProps {
  classes: Class[];
  courses: Course[];
  rooms: Room[];
  companies: Company[];
  students: Student[];
  visibleClasses: Set<string>;
  expandedClasses: Set<string>;
  onToggleVisibility: (classId: string) => void;
  onToggleExpansion: (classId: string) => void;
  onEditClass: (classItem: Class) => void;
  onSelectClass: (classId: string, date: Date) => void;
  courseSearch: string;
  className?: string;
}

function getStatusBadgeClass(status: ClassStatus): string {
  const variants: Record<ClassStatus, string> = {
    Planned: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-green-100 text-green-700',
    InProgress: 'bg-yellow-100 text-yellow-700',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return variants[status] || 'bg-gray-100 text-gray-700';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function ClassSidebar({
  classes,
  courses,
  rooms,
  companies,
  students,
  visibleClasses,
  expandedClasses,
  onToggleVisibility,
  onToggleExpansion,
  onEditClass,
  onSelectClass,
  courseSearch,
  className,
}: ClassSidebarProps) {
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (!courseSearch) return true;
      const course = courses.find((cr) => cr.id === c.courseId);
      const search = courseSearch.toLowerCase();
      return (
        c.code?.toLowerCase().includes(search) ||
        (c.displayName && c.displayName.toLowerCase().includes(search)) ||
        (course && course.name.toLowerCase().includes(search))
      );
    });
  }, [classes, courses, courseSearch]);

  return (
    <div className={className || 'col-span-12 lg:col-span-2'}>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="text-sm">Turmas Ativas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-2 space-y-2">
          {filteredClasses.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Nenhuma turma encontrada</p>
          ) : (
            filteredClasses.map((classItem) => {
              const course = courses.find((c) => c.id === classItem.courseId);
              const room = rooms.find((r) => r.id === classItem.roomId);
              const company = companies.find((c) => c.id === classItem.companyId);
              const studentCount = students.filter(
                (s) => s.classId === classItem.id && s.status !== 'Replaced'
              ).length;
              const isVisible = visibleClasses.has(classItem.id);
              const isExpanded = expandedClasses.has(classItem.id);

              return (
                <div
                  key={classItem.id}
                  className={`border rounded-lg hover:shadow-sm transition-all cursor-pointer bg-white ${
                    isVisible ? 'border-green-500 bg-green-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1"
                        onClick={() => onToggleExpansion(classItem.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${getStatusBadgeClass(classItem.status as ClassStatus)} border-0 font-medium px-2 py-0.5 h-auto text-[10px] uppercase tracking-wider`}>
                             {classItem.status === 'InProgress' ? 'Em Andamento' : 
                              classItem.status === 'Planned' ? 'Planejada' :
                              classItem.status === 'Confirmed' ? 'Confirmada' :
                              classItem.status === 'Completed' ? 'Concluída' : 'Cancelada'}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-700">
                            {classItem.code}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-tight line-clamp-2">
                          {classItem.displayName || course?.name}
                        </p>

                        {!isExpanded && (
                          <div className="mt-2 space-y-1 text-[11px] text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">
                                {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {studentCount}/{classItem.maxStudents} alunos
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(classItem.id);
                          }}
                        >
                          {isVisible ? (
                            <Eye className="w-3 h-3 text-green-600" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClass(classItem);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t text-[11px] space-y-1.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
                        </div>
                        {room && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {room.name}
                          </div>
                        )}
                        {company && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Building2 className="w-3 h-3" />
                            {company.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="w-3 h-3" />
                          {studentCount}/{classItem.maxStudents} alunos
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-[11px] mt-2"
                          onClick={() => onSelectClass(classItem.id, new Date())}
                        >
                          Ver Alunos
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
