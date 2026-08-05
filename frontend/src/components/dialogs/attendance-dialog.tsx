'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type AttendanceStatus = 'Present' | 'Absent' | 'Justified';

interface Student {
  id: string;
  code: string;
  name: string;
  photo?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  justification?: string;
}

interface ClassSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
}

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession;
  className: string;
  students: Student[];
  existingAttendance?: AttendanceRecord[];
  onSave: (attendance: AttendanceRecord[]) => void;
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export function AttendanceDialog({
  open,
  onOpenChange,
  session,
  className,
  students,
  existingAttendance = [],
  onSave,
}: AttendanceDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());

  // Initialize attendance from existing records
  useEffect(() => {
    if (open) {
      const initialAttendance = new Map<string, AttendanceStatus>();
      
      // Load existing attendance
      existingAttendance.forEach((record) => {
        initialAttendance.set(record.studentId, record.status);
      });
      
      // Set default to Present for students without record
      students.forEach((student) => {
        if (!initialAttendance.has(student.id)) {
          initialAttendance.set(student.id, 'Present');
        }
      });
      
      setAttendance(initialAttendance);
      setSearchTerm('');
    }
  }, [open, students, existingAttendance]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.code.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const presentCount = Array.from(attendance.values()).filter((s) => s === 'Present').length;
    const absentCount = Array.from(attendance.values()).filter((s) => s === 'Absent').length;
    const justifiedCount = Array.from(attendance.values()).filter((s) => s === 'Justified').length;
    return { presentCount, absentCount, justifiedCount };
  }, [attendance]);

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(studentId) || 'Present';
      
      // Cycle: Present -> Absent -> Justified -> Present
      const nextStatus: AttendanceStatus =
        currentStatus === 'Present'
          ? 'Absent'
          : currentStatus === 'Absent'
          ? 'Justified'
          : 'Present';
      
      newMap.set(studentId, nextStatus);
      return newMap;
    });
  };

  const markAllPresent = () => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      students.forEach((student) => newMap.set(student.id, 'Present'));
      return newMap;
    });
  };

  const markAllAbsent = () => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      students.forEach((student) => newMap.set(student.id, 'Absent'));
      return newMap;
    });
  };

  const handleSave = () => {
    const records: AttendanceRecord[] = [];
    attendance.forEach((status, studentId) => {
      records.push({ studentId, status });
    });
    
    onSave(records);
    onOpenChange(false);
    toast.success('Presença salva com sucesso!');
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Presente
          </Badge>
        );
      case 'Absent':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      case 'Justified':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Justificado
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Chamada da Turma
          </DialogTitle>
          <DialogDescription>
            Registrar presença para <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Session Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-blue-700">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700">
              <Clock className="w-4 h-4" />
              <span>{session.startTime} - {session.endTime}</span>
            </div>
            {session.topic && (
              <div className="text-blue-600">
                Tópico: <strong>{session.topic}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.presentCount}</p>
            <p className="text-xs text-green-600">Presentes</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.absentCount}</p>
            <p className="text-xs text-red-600">Ausentes</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.justifiedCount}</p>
            <p className="text-xs text-yellow-600">Justificados</p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            Todos Presentes
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAbsent}>
            Todos Ausentes
          </Button>
        </div>

        {/* Student List */}
        <ScrollArea className="flex-1 border rounded-lg">
          <div className="p-2 space-y-2">
            {filteredStudents.map((student) => {
              const status = attendance.get(student.id) || 'Present';
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    status === 'Present'
                      ? 'bg-green-50 hover:bg-green-100'
                      : status === 'Absent'
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'bg-yellow-50 hover:bg-yellow-100'
                  }`}
                  onClick={() => toggleAttendance(student.id)}
                >
                  <Checkbox
                    checked={status === 'Present'}
                    className="pointer-events-none"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.code}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}
            
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum aluno encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            Clique em um aluno para alternar: Presente → Ausente → Justificado
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <ClipboardList className="w-4 h-4 mr-2" />
              Salvar Presença
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
