'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRightLeft,
  User,
  Users,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Student {
  id: string;
  code: string;
  name: string;
  enrollmentDate: string;
  paymentStatus: boolean;
  documentStatus: boolean;
}

interface TargetClass {
  id: string;
  code: string;
  name: string;
  courseName: string;
  startDate: string;
  endDate: string;
  availableSpots: number;
  totalSpots: number;
  schedule: string;
}

interface TransferStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  sourceClassName: string;
  availableClasses: TargetClass[];
  onTransfer: (data: {
    studentId: string;
    targetClassId: string;
    reason: string;
  }) => void;
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export function TransferStudentDialog({
  open,
  onOpenChange,
  student,
  sourceClassName,
  availableClasses,
  onTransfer,
}: TransferStudentDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reason, setReason] = useState('');

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    if (!searchTerm) return availableClasses;
    const term = searchTerm.toLowerCase();
    return availableClasses.filter(
      (cls) =>
        cls.name.toLowerCase().includes(term) ||
        cls.code.toLowerCase().includes(term) ||
        cls.courseName.toLowerCase().includes(term)
    );
  }, [availableClasses, searchTerm]);

  const selectedClass = availableClasses.find((c) => c.id === selectedClassId);

  const handleSubmit = () => {
    if (!selectedClassId) {
      toast.error('Selecione uma turma de destino.');
      return;
    }

    if (!reason.trim()) {
      toast.error('Informe o motivo da transferência.');
      return;
    }

    onTransfer({
      studentId: student.id,
      targetClassId: selectedClassId,
      reason: reason.trim(),
    });

    // Reset form
    setSelectedClassId('');
    setReason('');
    setSearchTerm('');
    onOpenChange(false);
    toast.success('Aluno transferido com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-orange-600" />
            Transferir Aluno
          </DialogTitle>
          <DialogDescription>
            Transferir aluno de <strong>{sourceClassName}</strong> para outra turma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-hidden flex flex-col">
          {/* Student Information */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">{student.code}</p>
              </div>
              <div className="flex gap-2">
                {student.paymentStatus ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Pagamento OK
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pagamento Pendente
                  </Badge>
                )}
                {student.documentStatus ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Documentos OK
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Documentos Pendentes
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Arrow */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="p-2 bg-orange-100 rounded-full">
              <ArrowRightLeft className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Destination Class Selection */}
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <Label>Selecionar Turma de Destino *</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Class List */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma turma disponível encontrada</p>
                  </div>
                ) : (
                  filteredClasses.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    const isFull = cls.availableSpots <= 0;
                    return (
                      <div
                        key={cls.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isFull
                            ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-orange-50 border-orange-400'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => !isFull && setSelectedClassId(cls.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-sm text-gray-500">{cls.code}</p>
                            <p className="text-sm text-blue-600">{cls.courseName}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              isFull
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-green-100 text-green-700 border-green-300'
                            }
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {cls.availableSpots}/{cls.totalSpots} vagas
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cls.startDate)} - {formatDate(cls.endDate)}
                          </span>
                          <span>{cls.schedule}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Class Summary */}
          {selectedClass && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700">
                <strong>Destino:</strong> {selectedClass.name} ({selectedClass.code})
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Transferência *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Schedule conflict">Conflito de horário</SelectItem>
                <SelectItem value="Student request">Solicitação do aluno</SelectItem>
                <SelectItem value="Class cancellation">Cancelamento da turma</SelectItem>
                <SelectItem value="Instructor change">Troca de instrutor</SelectItem>
                <SelectItem value="Administrative">Administrativo</SelectItem>
                <SelectItem value="Other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedClassId || !reason}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transferir Aluno
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
