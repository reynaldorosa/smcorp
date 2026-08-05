'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, FileText, CreditCard, GraduationCap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

type EnrollmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';
type DocumentsStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type ExamStatus = 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'FAILED';

interface Student {
  id: string;
  name: string;
  code: string;
  photoUrl: string | null;
}

interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  dueDate: string;
}

interface Exam {
  id: string;
  status: ExamStatus;
  scheduledDate: string | null;
  scheduledTime: string | null;
  instructorName: string | null;
}

interface Document {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  fileUrl?: string;
}

interface Enrollment {
  id: string;
  status: EnrollmentStatus;
  documentsStatus: DocumentsStatus;
  discount?: number;
  student: Student;
  payment?: Payment;
  exam?: Exam;
  documents?: Document[];
}

interface StudentStatusCardProps {
  enrollment: Enrollment;
  onScheduleExam?: (enrollmentId: string, instructor: string, date: string, time: string) => void;
  onUpdatePayment?: (enrollmentId: string) => void;
  onViewDocuments?: (documents: Document[]) => void;
}

export function StudentStatusCard({ 
  enrollment, 
  onScheduleExam,
  onUpdatePayment,
  onViewDocuments
}: StudentStatusCardProps) {
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    instructor: '',
    date: '',
    time: '',
    examNumber: '',
  });

  // Lógica de cores dos botões
  const getPaymentButtonColor = (): string => {
    if (!enrollment.payment) return 'bg-gray-400';
    switch (enrollment.payment.status) {
      case 'PAID': return 'bg-green-500 hover:bg-green-600';
      case 'PENDING': return 'bg-red-500 hover:bg-red-600';
      case 'OVERDUE': return 'bg-red-700 hover:bg-red-800';
      default: return 'bg-gray-500';
    }
  };

  const getDocumentButtonColor = (): string => {
    return enrollment.documentsStatus === 'APPROVED' 
      ? 'bg-green-500 hover:bg-green-600' 
      : 'bg-red-500 hover:bg-red-600';
  };

  const getExamButtonColor = (): string => {
    if (enrollment.documentsStatus !== 'APPROVED') {
      return 'bg-gray-400 cursor-not-allowed';
    }
    
    if (!enrollment.exam) return 'bg-red-500 hover:bg-red-600';
    
    switch (enrollment.exam.status) {
      case 'APPROVED': return 'bg-green-500 hover:bg-green-600';
      case 'SCHEDULED': return 'bg-blue-500 hover:bg-blue-600';
      case 'FAILED': return 'bg-orange-500 hover:bg-orange-600';
      case 'PENDING': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-red-500 hover:bg-red-600';
    }
  };

  // Status link colors
  const getStatusLinkConfig = (): { color: string; text: string; icon: React.ReactNode } => {
    switch (enrollment.status) {
      case 'SCHEDULED':
        return { color: 'bg-yellow-500', text: 'Agendado', icon: <Clock className="h-3 w-3" /> };
      case 'CONFIRMED':
        return { color: 'bg-blue-500', text: 'Confirmado', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'PRESENT':
        return { color: 'bg-green-500', text: 'Presente', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'ABSENT':
        return { color: 'bg-red-500', text: 'Ausente', icon: <AlertCircle className="h-3 w-3" /> };
      default:
        return { color: 'bg-gray-500', text: 'Cancelado', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  // Calcular progresso
  const calculateProgress = (): number => {
    let progress = 0;
    
    if (enrollment.payment?.status === 'PAID') progress += 30;
    if (enrollment.documentsStatus === 'APPROVED') progress += 30;
    if (enrollment.exam?.status === 'APPROVED') progress += 40;
    else if (enrollment.exam?.status === 'SCHEDULED') progress += 20;
    
    return progress;
  };

  // Handlers
  const handlePaymentClick = () => {
    if (onUpdatePayment) {
      onUpdatePayment(enrollment.id);
    }
  };

  const handleDocumentClick = () => {
    if (enrollment.documents && enrollment.documents.length > 0) {
      setShowDocumentsModal(true);
      if (onViewDocuments) {
        onViewDocuments(enrollment.documents);
      }
    }
  };

  const handleExamClick = () => {
    if (enrollment.documentsStatus !== 'APPROVED') return;
    
    if (enrollment.exam?.status === 'SCHEDULED' || enrollment.exam?.status === 'APPROVED') {
      // Mostrar detalhes
      alert(`Prova: ${enrollment.exam.status}\nInstrutor: ${enrollment.exam.instructorName || 'N/A'}\nData: ${enrollment.exam.scheduledDate || 'N/A'}`);
    } else {
      setShowExamModal(true);
    }
  };

  const handleScheduleExam = () => {
    if (onScheduleExam && scheduleData.instructor && scheduleData.date && scheduleData.time) {
      onScheduleExam(enrollment.id, scheduleData.instructor, scheduleData.date, scheduleData.time);
      setShowExamModal(false);
      setScheduleData({ instructor: '', date: '', time: '', examNumber: '' });
    }
  };

  const statusConfig = getStatusLinkConfig();
  const progress = calculateProgress();

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          {/* Header com Foto e Status */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {enrollment.student.photoUrl ? (
                <img 
                  src={enrollment.student.photoUrl} 
                  alt={enrollment.student.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-white shadow">
                  <span className="text-white text-2xl font-bold">
                    {enrollment.student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Status Link (círculo colorido) */}
              <div 
                className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${statusConfig.color} flex items-center justify-center shadow-sm`}
                title={statusConfig.text}
              >
                <span className="text-white">{statusConfig.icon}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{enrollment.student.name}</h3>
              <p className="text-sm text-muted-foreground">{enrollment.student.code}</p>
              {enrollment.discount && enrollment.discount > 0 && (
                <Badge variant="outline" className="mt-1">
                  Desconto {enrollment.discount}%
                </Badge>
              )}
            </div>

            <Badge className={statusConfig.color}>
              {statusConfig.text}
            </Badge>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso da Matrícula</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Matrícula Concluída
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handlePaymentClick}
              className={`${getPaymentButtonColor()} text-white flex flex-col items-center py-3 h-auto`}
              size="sm"
            >
              <CreditCard className="h-4 w-4 mb-1" />
              <span className="text-xs font-bold">PAG</span>
              <span className="text-[10px] opacity-90">
                {enrollment.payment?.status === 'PAID' ? 'OK' : 
                 enrollment.payment?.status === 'OVERDUE' ? 'ATRASO' : 'PEND'}
              </span>
            </Button>

            <Button
              onClick={handleDocumentClick}
              className={`${getDocumentButtonColor()} text-white flex flex-col items-center py-3 h-auto`}
              size="sm"
            >
              <FileText className="h-4 w-4 mb-1" />
              <span className="text-xs font-bold">DOC</span>
              <span className="text-[10px] opacity-90">
                {enrollment.documentsStatus === 'APPROVED' ? 'OK' : 'PEND'}
              </span>
            </Button>

            <Button
              onClick={handleExamClick}
              disabled={enrollment.documentsStatus !== 'APPROVED'}
              className={`${getExamButtonColor()} text-white flex flex-col items-center py-3 h-auto`}
              size="sm"
            >
              <GraduationCap className="h-4 w-4 mb-1" />
              <span className="text-xs font-bold">PROVA</span>
              <span className="text-[10px] opacity-90">
                {enrollment.documentsStatus !== 'APPROVED' ? 'BLOQ' :
                 enrollment.exam?.status === 'APPROVED' ? 'OK' :
                 enrollment.exam?.status === 'SCHEDULED' ? 'AGEN' : 'PEND'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Documentos */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Documentos - {enrollment.student.name}</DialogTitle>
            <DialogDescription>
              Lista de documentos enviados pelo aluno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {enrollment.documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado em {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant={doc.status === 'APPROVED' ? 'default' : 'destructive'}>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendar Prova */}
      <Dialog open={showExamModal} onOpenChange={setShowExamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Prova</DialogTitle>
            <DialogDescription>
              Selecione instrutor, data e horário para a prova de {enrollment.student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instrutor</Label>
              <Input
                id="instructor"
                value={scheduleData.instructor}
                onChange={(e) => setScheduleData({ ...scheduleData, instructor: e.target.value })}
                placeholder="Nome do instrutor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examNumber">Número da Prova</Label>
              <Input
                id="examNumber"
                value={scheduleData.examNumber}
                onChange={(e) => setScheduleData({ ...scheduleData, examNumber: e.target.value })}
                placeholder="Ex: 001/2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExamModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleScheduleExam}>
              Agendar Prova
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
