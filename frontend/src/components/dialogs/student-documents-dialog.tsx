'use client';

import { useState, useEffect } from 'react';
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
  Upload,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected';

interface StudentDocument {
  id: string;
  name: string;
  fileName: string;
  uploadDate: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileBase64?: string;
  rejectionReason?: string;
}

interface Student {
  id: string;
  code: string;
  name: string;
}

interface StudentDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  documents: StudentDocument[];
  onUpdateDocuments: (
    studentId: string,
    documents: StudentDocument[],
    allApproved: boolean
  ) => void;
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// COMPONENT
// ============================================

export function StudentDocumentsDialog({
  open,
  onOpenChange,
  student,
  documents,
  onUpdateDocuments,
}: StudentDocumentsDialogProps) {
  const [editedDocuments, setEditedDocuments] = useState<StudentDocument[]>([]);
  const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (open) {
      setEditedDocuments(documents);
    }
  }, [open, documents]);

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

  const updateDocumentStatus = (index: number, newStatus: DocumentStatus) => {
    const newDocs = [...editedDocuments];
    newDocs[index] = { ...newDocs[index], status: newStatus };
    setEditedDocuments(newDocs);
  };

  const approveAll = () => {
    const newDocs = editedDocuments.map((doc) => ({ ...doc, status: 'Approved' as const }));
    setEditedDocuments(newDocs);
    toast.success('Todos os documentos foram aprovados!');
  };

  const saveChanges = () => {
    const allApproved = editedDocuments.every((doc) => doc.status === 'Approved');
    onUpdateDocuments(student.id, editedDocuments, allApproved);
    toast.success('Status dos documentos atualizado!');
    onOpenChange(false);
  };

  const downloadDocument = (doc: StudentDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileUrl || doc.fileBase64 || '';
      link.download = `${student.code}_${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Baixando ${doc.name}...`);
    } catch (error) {
      toast.error('Falha ao baixar o documento');
    }
  };

  const viewDocument = (doc: StudentDocument) => {
    setViewingDoc({
      name: doc.name,
      url: doc.fileUrl || doc.fileBase64 || '',
    });
  };

  // Statistics
  const stats = {
    total: editedDocuments.length,
    approved: editedDocuments.filter((d) => d.status === 'Approved').length,
    pending: editedDocuments.filter((d) => d.status === 'Pending').length,
    rejected: editedDocuments.filter((d) => d.status === 'Rejected').length,
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
          {editedDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum documento enviado</p>
              <p className="text-sm">O aluno ainda não enviou documentos</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {editedDocuments.map((doc, index) => (
                  <Card key={doc.id || index} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{doc.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-3">
                            Enviado: {formatDate(doc.uploadDate)}
                          </div>

                          {/* Current Status */}
                          <div className="mb-3">{getStatusBadge(doc.status)}</div>

                          {/* Rejection Reason */}
                          {doc.status === 'Rejected' && doc.rejectionReason && (
                            <div className="p-2 bg-red-50 rounded text-xs text-red-700 mb-3">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {doc.rejectionReason}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewDocument(doc)}
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

                        {/* Approval Buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => updateDocumentStatus(index, 'Approved')}
                            className={`${
                              doc.status === 'Approved'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateDocumentStatus(index, 'Rejected')}
                            className={`${
                              doc.status === 'Rejected'
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
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={approveAll} disabled={editedDocuments.length === 0}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aprovar Todos
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={saveChanges} className="bg-red-600 hover:bg-red-700">
                Salvar Alterações
              </Button>
            </div>
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
