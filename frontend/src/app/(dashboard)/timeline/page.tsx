'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { classesService } from '@/services/classes.service';

interface Class {
  id: string;
  code: string;
  displayName: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  maxStudents: number;
  course: {
    id: string;
    name: string;
    code: string;
  };
  room: {
    id: string;
    name: string;
  } | null;
  instructor: {
    id: string;
    name: string;
  } | null;
  _count?: {
    enrollments: number;
  };
}

function formatTimeLabel(time?: string | null): string {
  if (!time || typeof time !== 'string') return '—';
  return time.slice(0, 5);
}

export default function TimelinePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['timeline-classes', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async (): Promise<Class[]> => {
      const data = await classesService.getByDateRange(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
      // Ensure we return an array, handling possible paginated response structure
      if (Array.isArray(data)) return data as unknown as Class[];
      return ((data as any).data || []) as Class[];
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getClassesForDay = (day: Date) => {
    if (!classes || !Array.isArray(classes)) return [];
    return classes.filter((cls) => {
      const classStart = parseISO(cls.startDate);
      // Default to same day if end date is missing (safety check)
      const classEnd = cls.endDate ? parseISO(cls.endDate) : classStart;
      
      // Check overlap
      const checkDay = new Date(day);
      checkDay.setHours(12, 0, 0, 0);
      
      const startDay = new Date(classStart);
      startDay.setHours(0, 0, 0, 0);
      
      const endDay = new Date(classEnd);
      endDay.setHours(23, 59, 59, 999);
      
      return checkDay >= startDay && checkDay <= endDay;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendada': 
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EmAndamento': 
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluida': 
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelada': 
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Agendada': 
      case 'SCHEDULED': return 'Planejada';
      case 'EmAndamento': 
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'Concluida': 
      case 'COMPLETED': return 'Concluída';
      case 'Cancelada': 
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const weekLabel = `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="week" className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
             <div className="max-w-7xl mx-auto">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-600 rounded-none shadow-md">
                   <Calendar className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Turmas e Agendamentos</h1>
                   <p className="text-slate-600 text-sm">
                      Planejamento e execução de turmas - Cronograma, alocação e faturamento
                   </p>
                 </div>
             </div>
             </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
            <div className="max-w-7xl mx-auto">
            <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
               <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                 
                 <TabsContent value="week" className="mt-0 h-full flex flex-col space-y-6">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-red-600" />
                        {weekLabel}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                          Hoje
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                          Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day) => {
                         const isToday = isSameDay(day, new Date());
                         const dayClasses = getClassesForDay(day);
                         
                         return (
                           <div key={day.toISOString()} className={`flex flex-col gap-2 rounded-lg border min-h-[200px] transition-colors ${
                             isToday 
                               ? 'border-red-200 bg-red-50/10' 
                               : day.getDay() === 0 || day.getDay() === 6 
                                 ? 'border-slate-100 bg-slate-50/50' // Weekend
                                 : 'border-slate-200 bg-white' // Normal day
                           } p-2`}>
                              {/* Day Header */}
                              <div className={`text-center mb-2 pb-2 border-b ${isToday ? 'border-red-100' : 'border-slate-100'}`}>
                                <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isToday ? 'text-red-600' : 'text-slate-400'}`}>
                                  {format(day, 'EEE', { locale: ptBR })}
                                </div>
                                <div className={`text-xl font-bold ${isToday ? 'text-red-700' : 'text-slate-700'}`}>
                                  {format(day, 'dd', { locale: ptBR })}
                                </div>
                              </div>

                              {/* Classes List */}
                              <div className="flex-1 space-y-2">
                                {isLoading ? (
                                  <Skeleton className="h-20 w-full" />
                                ) : dayClasses.length > 0 ? (
                                  dayClasses.map((cls) => (
                                    <div 
                                      key={`${cls.id}-${day.toISOString()}`} 
                                      className={`rounded-md p-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ring-1 ring-black/5 ${
                                        cls.status === 'SCHEDULED' || cls.status === 'Agendada' ? 'bg-blue-500 text-white border-blue-600' :
                                        cls.status === 'IN_PROGRESS' || cls.status === 'EmAndamento' ? 'bg-yellow-500 text-white border-yellow-600' :
                                        cls.status === 'COMPLETED' || cls.status === 'Concluida' ? 'bg-green-500 text-white border-green-600' :
                                        cls.status === 'CANCELLED' || cls.status === 'Cancelada' ? 'bg-red-500 text-white border-red-600' :
                                        'bg-slate-500 text-white border-slate-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                          {formatTimeLabel(cls.startTime)}
                                        </Badge>
                                      </div>
                                      
                                      <div className="font-bold text-[10px] leading-tight mb-2 opacity-95 line-clamp-2" title={cls.course?.name}>
                                        {cls.displayName || cls.course?.code || 'Sem Nome'}
                                      </div>
                                      
                                      <div className="space-y-1 pt-1 border-t border-white/20">
                                        {cls.room && (
                                          <div className="flex items-center gap-1.5 text-[9px] opacity-90">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                                            <span className="truncate">{cls.room.name}</span>
                                          </div>
                                        )}
                                        {cls.instructor && (
                                          <div className="flex items-center gap-1.5 text-[9px] opacity-90">
                                            <Users className="w-3 h-3" />
                                            <span className="truncate">{cls.instructor.name.split(' ')[0]}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="h-full flex items-center justify-center p-4">
                                    <span className="text-[10px] text-slate-400 font-medium">Sem aulas</span>
                                  </div>
                                )}
                              </div>
                           </div>
                         );
                      })}
                    </div>
                 </TabsContent>
               </div>
            </Card>
            </div>
          </main>
        </Tabs>
      </div>
    </div>
  );
}
