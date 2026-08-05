'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Link2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enrollmentOperations } from '@/services/operations.service';

interface ResendLinkDialogProps {
  open: boolean;
  onClose: () => void;
  enrollment: {
    id: string;
    status: string;
    documentsStatus: string;
  };
  student: {
    code: string;
    name: string;
  };
  paymentStatus?: string;
}

export function ResendLinkDialog({ open, onClose, enrollment, student, paymentStatus }: ResendLinkDialogProps) {
  const { toast } = useToast();
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const publicBaseUrl =
    (process.env.NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL || '').replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  // Mutation para gerar token
  const generateTokenMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return enrollmentOperations.generateToken({ enrollmentId, expiresInHours: 168 });
    },
    onSuccess: (data) => {
      // Montar link de matrícula
      const link = `${publicBaseUrl}/enrollment/${data.enrollmentToken}`;
      setGeneratedLink(link);
      
      toast({
        title: 'Link gerado com sucesso!',
        description: 'O link de matrícula foi gerado e está pronto para ser compartilhado.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao gerar link',
        description: 'Não foi possível gerar o link de matrícula. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Copiar link para clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Gerar link ao abrir o dialog
  const handleGenerateLink = () => {
    generateTokenMutation.mutate(enrollment.id);
  };

  // Status badges
  const getStatusBadge = (status: string, label: string) => {
    const colors: Record<string, string> = {
      COMPLETE: 'bg-green-500 text-white',
      PAID: 'bg-green-500 text-white',
      PENDING: 'bg-yellow-500 text-white',
      REJECTED: 'bg-red-500 text-white',
      OVERDUE: 'bg-red-500 text-white',
    };

    return (
      <Badge className={cn('text-xs', colors[status] || 'bg-gray-500 text-white')}>
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Reenviar Link de Matrícula
          </DialogTitle>
          <DialogDescription>
            Gere um link único para o aluno {student.name} completar a matrícula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status do Aluno */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Status Atual da Matrícula
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-blue-700 mb-1">Pagamento</p>
                {getStatusBadge(paymentStatus || 'PENDING', paymentStatus === 'PAID' ? 'Pago' : 'Pendente')}
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-700 mb-1">Documentos</p>
                {getStatusBadge(enrollment.documentsStatus, enrollment.documentsStatus === 'COMPLETE' ? 'OK' : 'Pendente')}
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-700 mb-1">Matrícula</p>
                {getStatusBadge(enrollment.status, enrollment.status)}
              </div>
            </div>
          </div>

          {/* Botão para gerar link */}
          {!generatedLink && (
            <Button
              onClick={handleGenerateLink}
              disabled={generateTokenMutation.isPending}
              className="w-full"
            >
              {generateTokenMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Gerando link...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Gerar Link de Matrícula
                </>
              )}
            </Button>
          )}

          {/* QR Code e Link */}
          {generatedLink && (
            <>
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG value={generatedLink} size={200} level="H" />
              </div>

              {/* Campo com Link */}
              <div className="space-y-2">
                <Label htmlFor="enrollment-link">Link de Matrícula</Label>
                <div className="flex gap-2">
                  <Input
                    id="enrollment-link"
                    value={generatedLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button onClick={handleCopyLink} size="icon" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Informações */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                <p className="text-xs text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Link é único e permanente para esta matrícula
                </p>
                <p className="text-xs text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Aluno pode enviar documentos e realizar pagamento
                </p>
                <p className="text-xs text-blue-900 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Token válido por 7 dias (renove se necessário)
                </p>
              </div>

              {/* Botão para gerar novo link */}
              <Button
                onClick={handleGenerateLink}
                variant="outline"
                className="w-full"
                disabled={generateTokenMutation.isPending}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Gerar Novo Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
