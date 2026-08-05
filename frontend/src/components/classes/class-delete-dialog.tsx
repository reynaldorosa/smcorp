'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useClassesStore, Class } from '@/stores/classes.store';
import { classesService } from '@/services/classes.service';
import { toast } from 'sonner';

interface ClassDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToDelete: Class | null;
}

export function ClassDeleteDialog({
  open,
  onOpenChange,
  classToDelete,
}: ClassDeleteDialogProps) {
  const { deleteClass } = useClassesStore();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (!classToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await classesService.delete(classToDelete.id);
      deleteClass(classToDelete.id);
      onOpenChange(false);
      toast.success('Turma excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      toast.error('Não foi possível excluir a turma (verifique matrículas ativas)');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!classToDelete) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir a turma{' '}
              <strong className="text-red-600">{classToDelete.code}</strong>?
            </p>
            {classToDelete.displayName && (
              <p className="text-sm text-gray-500">
                Nome: {classToDelete.displayName}
              </p>
            )}
            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
              ⚠️ Esta ação não pode ser desfeita. Todos os alunos matriculados 
              nesta turma também serão afetados.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            Sim, Excluir Turma
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
