import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FileText, CreditCard, GraduationCap, Link2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { ResendLinkDialog } from './resend-link-dialog';
import { ExtraSaleDialog } from './extra-sale-dialog';

interface StudentCardProps {
  student: {
    id: string;
    code: string;
    name: string;
    photoUrl?: string;
    email: string;
  };
  enrollment: {
    id: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'PRESENT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    documentsStatus: 'PENDING' | 'COMPLETE' | 'REJECTED';
  };
  payment: {
    status: 'PENDING' | 'PAID' | 'OVERDUE';
  } | null;
  exam: {
    examCode?: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'FAILED';
  } | null;
  onPaymentClick: () => void;
  onDocumentClick: () => void;
  onExamClick: () => void;
}

export function StudentCard({
  student,
  enrollment,
  payment,
  exam,
  onPaymentClick,
  onDocumentClick,
  onExamClick,
}: StudentCardProps) {
  const [resendLinkOpen, setResendLinkOpen] = useState(false);
  const [extraSaleOpen, setExtraSaleOpen] = useState(false);
  
  // Calcular cores dos botões
  const paymentColor = payment?.status === 'PAID' ? 'green' : 'red';
  const documentColor = enrollment.documentsStatus === 'COMPLETE' ? 'green' : 'red';
  
  let examColor: 'gray' | 'blue' | 'green' | 'red' = 'gray';
  if (enrollment.documentsStatus !== 'COMPLETE') {
    examColor = 'gray'; // Bloqueado
  } else if (exam?.status === 'APPROVED') {
    examColor = 'green';
  } else if (exam?.status === 'FAILED') {
    examColor = 'red';
  } else if (exam?.status === 'IN_PROGRESS') {
    examColor = 'blue';
  }

  // Calcular progresso (0-100%)
  const progress = [
    payment?.status === 'PAID',
    enrollment.documentsStatus === 'COMPLETE',
    exam?.status === 'APPROVED',
  ].filter(Boolean).length / 3 * 100;

  // Badge de status da matrícula
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-gray-500',
    CONFIRMED: 'bg-blue-500',
    PRESENT: 'bg-green-500',
    COMPLETED: 'bg-green-600',
    CANCELLED: 'bg-red-500',
    NO_SHOW: 'bg-orange-500',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getButtonClass = (color: 'red' | 'green' | 'blue' | 'gray') => {
    const colors = {
      red: 'bg-red-500 hover:bg-red-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      gray: 'bg-gray-400 cursor-not-allowed text-white',
    };
    return colors[color];
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header com foto e nome */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.photoUrl} alt={student.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{student.name}</h3>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </div>
          </div>

          {/* Badge de status */}
          <Badge className={cn('text-xs', statusColors[enrollment.status])}>
            {enrollment.status}
          </Badge>
        </div>

        {/* Botões de ação [PAG][DOC][PROVA] */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            size="sm"
            className={cn('flex items-center justify-center gap-1', getButtonClass(paymentColor))}
            onClick={onPaymentClick}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-bold">PAG</span>
          </Button>

          <Button
            size="sm"
            className={cn('flex items-center justify-center gap-1', getButtonClass(documentColor))}
            onClick={onDocumentClick}
          >
            <FileText className="h-4 w-4" />
            <span className="text-xs font-bold">DOC</span>
          </Button>

          <Button
            size="sm"
            className={cn('flex items-center justify-center gap-1', getButtonClass(examColor))}
            onClick={onExamClick}
            disabled={examColor === 'gray'}
            title={
              examColor === 'gray'
                ? 'Aguardando validação de documentos'
                : 'Agendar ou visualizar prova'
            }
          >
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-bold">PROVA</span>
          </Button>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Código da Prova */}
        {exam?.examCode && (
          <div className="mt-3 flex items-center justify-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-mono">
              {exam.examCode}
            </Badge>
          </div>
        )}

        {/* Indicadores de status */}
        <div className={cn("flex items-center justify-between text-xs", exam?.examCode ? "mt-2" : "mt-3")}>
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block w-2 h-2 rounded-full',
              paymentColor === 'green' ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-muted-foreground">
              {payment?.status === 'PAID' ? 'Pago' : 'Pendente'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block w-2 h-2 rounded-full',
              documentColor === 'green' ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-muted-foreground">
              {enrollment.documentsStatus === 'COMPLETE' ? 'Docs OK' : 'Docs Pendentes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block w-2 h-2 rounded-full',
              examColor === 'green' ? 'bg-green-500' :
              examColor === 'blue' ? 'bg-blue-500' :
              examColor === 'red' ? 'bg-red-500' : 'bg-gray-400'
            )} />
            <span className="text-muted-foreground">
              {exam?.status === 'APPROVED' ? 'Aprovado' :
               exam?.status === 'FAILED' ? 'Reprovado' :
               exam?.status === 'IN_PROGRESS' ? 'Em Prova' :
               exam?.status === 'SCHEDULED' ? 'Agendado' : 'Sem Prova'}
            </span>
          </div>
        </div>

        {/* Botão Reenviar Link */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => setResendLinkOpen(true)}
        >
          <Link2 className="h-4 w-4" />
          Reenviar Link
        </Button>

        {/* Botão Venda Extra */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => setExtraSaleOpen(true)}
        >
          <ShoppingCart className="h-4 w-4" />
          Venda Extra
        </Button>

        {/* Dialog de Reenviar Link */}
        <ResendLinkDialog
          open={resendLinkOpen}
          onClose={() => setResendLinkOpen(false)}
          enrollment={{
            id: enrollment.id,
            status: enrollment.status,
            documentsStatus: enrollment.documentsStatus,
          }}
          student={{
            code: student.code,
            name: student.name,
          }}
          paymentStatus={payment?.status}
        />

        {/* Dialog de Venda Extra */}
        <ExtraSaleDialog
          open={extraSaleOpen}
          onClose={() => setExtraSaleOpen(false)}
          enrollmentId={enrollment.id}
          studentName={student.name}
        />
      </CardContent>
    </Card>
  );
}
