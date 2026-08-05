'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Student } from '@/types';

interface AttendanceControlProps {
  student: Student;
  currentDate?: string;
  compact?: boolean;
  onMarkDayAttendance?: (studentId: string, date: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

/**
 * Attendance control for weekly view
 * Shows attendance status or button to mark present
 */
export const AttendanceControl: React.FC<AttendanceControlProps> = ({
  student,
  currentDate,
  onMarkDayAttendance,
  dialogOpen,
  setDialogOpen,
}) => {
  if (!currentDate) return null;

  const isPresent = student.attendanceByDay && student.attendanceByDay[currentDate];

  if (isPresent) {
    return (
      <>
        <span className="text-[10px] text-gray-600 font-medium block mb-1">
          Presença Hoje
        </span>
        <Badge className="w-full justify-center h-7 text-xs bg-green-100 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          🟢 Presente
        </Badge>
      </>
    );
  }

  return (
    <>
      <span className="text-[10px] text-gray-600 font-medium block mb-1">
        Presença Hoje
      </span>
      <Popover open={dialogOpen} onOpenChange={setDialogOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
            onClick={(e) => e.stopPropagation()}
          >
            <Clock className="w-3 h-3 mr-1" />
            Marcar Presença
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0"
          onClick={(e) => e.stopPropagation()}
          align="center"
          side="top"
          sideOffset={5}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Confirmar Presença
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Confirma a presença de{' '}
                  <span className="font-bold text-gray-900">{student.name}</span> em{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  ?
                </p>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>O aluno será incluído na lista de presença deste dia.</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentDate) {
                    onMarkDayAttendance?.(student.id, currentDate);
                    toast.success('✅ Presença confirmada!', {
                      description: `${student.name} - ${new Date(
                        currentDate + 'T12:00:00'
                      ).toLocaleDateString('pt-BR')}`,
                    });
                  }
                  setDialogOpen(false);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
