'use client';

import React from 'react';
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
import { useCoursesStore, type Course } from '@/stores/courses.store';
import { coursesService } from '@/services/courses.service';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface CourseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

// ============================================
// COMPONENT
// ============================================

export function CourseDeleteDialog({ open, onOpenChange, course }: CourseDeleteDialogProps) {
  const { deleteCourse } = useCoursesStore();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!course) return;

    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await coursesService.delete(course.id);
      deleteCourse(course.id);
      onOpenChange(false);
      toast.success('Curso excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      toast.error('Erro ao excluir curso no servidor');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o curso &quot;{course?.name}&quot;?
            <br /><br />
            ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
