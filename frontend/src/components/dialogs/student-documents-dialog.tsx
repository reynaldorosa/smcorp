'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { documentOperations } from '@/services/operations.service';

// ============================================
// TYPES
// ============================================

export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected';

type ApiStudentDocument = {
  id: string;
  documentType: string;
  fileUrl: string;
  status: 'PENDING' | 'COMPLETE' | 'REJECTED';
  uploadedAt?: string;
  rejectedReason?: string | null;
};

interface Student {
  id: string;
  code: string;
  name: string;
}

interface CurrentUser {
  id: string;
}

interface StudentDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  currentUser?: CurrentUser;
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toUiStatus(status: ApiStudentDocument['status']): DocumentStatus {
  if (status === 'COMPLETE') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

// ============================================
// COMPONENT
// ============================================

export function StudentDocumentsDialog({
  open,
  onOpenChange,
  student,
  currentUser,
}: StudentDocumentsDialogProps) {
  const [documents, setDocuments] = useState<ApiStudentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string } | null>(null);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = (await documentOperations.getByStudent(student.id)) as ApiStudentDocument[];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch {
      toast.error('Falha ao carregar documentos do servidor');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    if (open) {
      refreshDocuments();
    }
  }, [open, refreshDocuments]);

  const approveDocument = async (doc: ApiStudentDocument) => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setActioningId(doc.id);
    try {
      await documentOperations.validate({ documentId: doc.id, validatorId: currentUser.id });
      toast.success(`Documento "${doc.documentType}" aprovado!`);
      await refreshDocuments();
    } catch {
      toast.error('Erro ao aprovar documento no servidor');
    } finally {
      setActioningId(null);
    }
  };

  const rejectDocument = async (doc: ApiStudentDocument) => {
    if (!currentUser?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    const reason = window.prompt(
      `Informe o motivo para rejeitar "${doc.documentType}" (mínimo 10 caracteres):`,
      'Documento inválido. Reenviar com melhor qualidade ou documento correto.'
    );
    if (reason === null) return;

    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10) {
      toast.error('Informe um motivo com pelo menos 10 caracteres.');
      return;
    }

    setActioningId(doc.id);
    try {
      await documentOperations.reject({
        documentId: doc.id,
        validatorId: currentUser.id,
        rejectedReason: normalizedReason,
      });
      toast.warning(`Documento "${doc.documentType}" rejeitado.`);
      await refreshDocuments();
    } catch {
      toast.error('Erro ao rejeitar documento no servidor');
    } finally {
      setActioningId(null);
    }
  };

  const downloadDocument = (doc: ApiStudentDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = `${student.code}_${doc.documentType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('Falha ao baixar o documento');
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === 'COMPLETE').length,
    pending: documents.filter((d) => d.status === 'PENDING').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Documentos do Aluno - {student.name}
            </DialogTitle>
            <DialogDescription>
              Código: {student.code} • {stats.total} documento{stats.total !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 font-medium">Aprovados</div>
                <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-3">
                <div className="text-xs text-yellow-600 font-medium">Pendentes</div>
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="text-xs text-red-600 font-medium">Rejeitados</div>
                <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-300" />
              <p className="font-medium">Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum documento enviado</p>
              <p className="text-sm">O aluno ainda não enviou documentos</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {documents.map((doc) => {
                  const status = toUiStatus(doc.status);
                  const isActioning = actioningId === doc.id;

                  return (
                    <Card key={doc.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <span className="font-medium text-gray-900">{doc.documentType}</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-3">
                              Enviado: {formatDate(doc.uploadedAt)}
                            </div>

                            <div className="mb-3">{getStatusBadge(status)}</div>

                            {status === 'Rejected' && doc.rejectedReason && (
                              <div className="p-2 bg-red-50 rounded text-xs text-red-700 mb-3">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                {doc.rejectedReason}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingDoc({ name: doc.documentType, url: doc.fileUrl })}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Visualizar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDocument(doc)}
                                className="flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Baixar
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              disabled={isActioning || status === 'Approved'}
                              onClick={() => approveDocument(doc)}
                              className={`${
                                status === 'Approved'
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-green-600 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              disabled={isActioning || status === 'Rejected'}
                              onClick={() => rejectDocument(doc)}
                              className={`${
                                status === 'Rejected'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-red-600 hover:text-white'
                              }`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end items-center pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{viewingDoc.name}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[70vh]">
              <iframe
                src={viewingDoc.url}
                className="w-full h-full border rounded-lg"
                title={viewingDoc.name}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
