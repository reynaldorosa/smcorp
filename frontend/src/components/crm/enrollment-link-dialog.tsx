'use client';

import { useEffect, useState } from 'react';
import { Loader2, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { studentsService } from '@/services/students.service';
import { ResendLinkDialog } from '@/components/dashboard/resend-link-dialog';

// ============================================
// Link de matrícula do aluno (QR + envio)
// Reutiliza o ResendLinkDialog do dashboard:
// resolve a matrícula ativa do aluno e abre o
// dialog que gera o token, mostra o QR Code do
// link público e envia por WhatsApp/e-mail.
// ============================================

interface EnrollmentLinkDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function EnrollmentLinkDialog({ open, onClose, studentId, studentName }: EnrollmentLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{
    id: string;
    status: string;
    documentsStatus: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setEnrollment(null);

    (async () => {
      try {
        const student = await studentsService.getById(studentId);
        const active = (student.enrollments || []).find(
          (e: { status?: string; deletedAt?: string | null }) =>
            e.status !== 'CANCELLED' && e.status !== 'ABSENT' && !e.deletedAt,
        );

        if (!active?.id) {
          setError('Este aluno não possui matrícula ativa.');
          return;
        }

        setEnrollment({
          id: active.id,
          status: active.status || 'SCHEDULED',
          documentsStatus: active.documentsStatus || 'PENDING',
        });
      } catch {
        setError('Não foi possível carregar a matrícula do aluno.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, studentId]);

  return (
    <>
      <Dialog open={open && !enrollment} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link de Matrícula
            </DialogTitle>
            <DialogDescription>
              {loading
                ? `Buscando matrícula ativa de ${studentName}...`
                : error || 'Nenhuma matrícula ativa encontrada para este contato.'}
            </DialogDescription>
          </DialogHeader>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {enrollment && (
        <ResendLinkDialog
          open={open}
          onClose={onClose}
          enrollment={enrollment}
          student={{ code: '', name: studentName }}
        />
      )}
    </>
  );
}
