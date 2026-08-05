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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UserCheck,
  Search,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface WaitingStudent {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  registrationDate: string;
  position: number;
  paymentStatus: boolean;
  documentStatus: boolean;
}

interface SubstituteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  courseName: string;
  availableSpots: number;
  waitingList: WaitingStudent[];
  onSelect: (studentIds: string[]) => void;
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

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// ============================================
// COMPONENT
// ============================================

export function SubstituteDialog({
  open,
  onOpenChange,
  className,
  courseName,
  availableSpots,
  waitingList,
  onSelect,
}: SubstituteDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return waitingList;
    const term = searchTerm.toLowerCase();
    return waitingList.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.code.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
    );
  }, [waitingList, searchTerm]);

  // Eligible students (payment and docs OK)
  const eligibleCount = waitingList.filter(
    (s) => s.paymentStatus && s.documentStatus
  ).length;

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        // Check if we've reached the limit
        if (newSet.size >= availableSpots) {
          toast.warning(`Você pode selecionar no máximo ${availableSpots} aluno(s).`);
          return prev;
        }
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (selectedStudents.size === 0) {
      toast.error('Selecione pelo menos um aluno.');
      return;
    }

    onSelect(Array.from(selectedStudents));
    setSelectedStudents(new Set());
    setSearchTerm('');
    onOpenChange(false);
    toast.success(`${selectedStudents.size} aluno(s) adicionado(s) à turma!`);
  };

  const selectAllEligible = () => {
    const eligible = waitingList
      .filter((s) => s.paymentStatus && s.documentStatus)
      .slice(0, availableSpots)
      .map((s) => s.id);
    setSelectedStudents(new Set(eligible));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            Selecionar Alunos Substitutos
          </DialogTitle>
          <DialogDescription>
            Adicionar alunos da lista de espera à turma <strong>{className}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {/* Class Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-700">{className}</p>
                <p className="text-sm text-blue-600">{courseName}</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <Users className="w-3 h-3 mr-1" />
                {availableSpots} vaga(s) disponível(is)
              </Badge>
            </div>
          </div>

          {/* Selection Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{selectedStudents.size}</span> de{' '}
              <span className="font-medium">{availableSpots}</span> selecionado(s)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllEligible}>
                Selecionar Elegíveis ({eligibleCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
              >
                Limpar
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Waiting List */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-2 space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum aluno na lista de espera</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudents.has(student.id);
                  const isEligible = student.paymentStatus && student.documentStatus;
                  return (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        !isEligible
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : isSelected
                          ? 'bg-green-50 border-green-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => isEligible && toggleStudent(student.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Position Badge */}
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                          #{student.position}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.code}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatPhone(student.phone)}</span>
                            <span>{student.email}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Cadastro: {formatDate(student.registrationDate)}
                          </p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col gap-1">
                          {student.paymentStatus ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pago
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                          {student.documentStatus ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Docs OK
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Faltando
                            </Badge>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        {isEligible && (
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Info Message */}
          <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Somente alunos com pagamento e documentos aprovados podem ser selecionados.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedStudents.size === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Adicionar {selectedStudents.size} Aluno(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
