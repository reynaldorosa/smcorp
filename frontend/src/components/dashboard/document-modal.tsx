'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { documentOperations } from '@/services/operations.service';
import { studentsService } from '@/services/students.service';
import { toast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  requiredDocuments: string[];
}

type DocumentStatus = 'PENDING' | 'COMPLETE' | 'REJECTED';

interface StudentDocument {
  id: string;
  documentType: string;
  status: DocumentStatus;
  uploadedAt: string;
  validatedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  fileUrl: string;
}

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as ErrorWithResponse).response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export function DocumentModal({
  open,
  onClose,
  enrollmentId,
  studentId,
  studentName,
  requiredDocuments,
}: DocumentModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const queryClient = useQueryClient();
  const validatorId = useAuthStore((state) => state.user?.id ?? null);

  // Buscar documentos do aluno
  const { data: documents, isLoading } = useQuery<StudentDocument[]>({
    queryKey: ['documents', studentId],
    queryFn: () => documentOperations.getByStudent(studentId),
    enabled: open,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas JPEG, PNG e PDF são permitidos.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um arquivo e o tipo de documento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      await studentsService.uploadDocument(studentId, selectedType, selectedFile);

      toast({
        title: 'Documento enviado!',
        description: 'O documento foi enviado e está aguardando validação.',
      });

      queryClient.invalidateQueries({ queryKey: ['documents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setSelectedFile(null);
      setSelectedType('');
    } catch (error: unknown) {
      toast({
        title: 'Erro ao enviar documento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (documentId: string) => {
    if (!validatorId) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para validar documentos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await documentOperations.validate({ documentId, validatorId });

      toast({
        title: 'Documento validado!',
        description: 'O status do aluno foi atualizado automaticamente.',
      });

      queryClient.invalidateQueries({ queryKey: ['documents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao validar documento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatorId) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para rejeitar documentos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await documentOperations.reject({ documentId, validatorId, rejectedReason: reason } as any);

      toast({
        title: 'Documento rejeitado',
        description: 'O aluno será notificado para reenviar.',
      });

      queryClient.invalidateQueries({ queryKey: ['documents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao rejeitar documento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await documentOperations.delete(documentId);

      toast({
        title: 'Documento excluído',
        description: 'O documento foi removido.',
      });

      queryClient.invalidateQueries({ queryKey: ['documents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao excluir documento',
        description: getErrorMessage(error, 'Tente novamente.'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const colors: Record<DocumentStatus, string> = {
      PENDING: 'bg-yellow-500',
      COMPLETE: 'bg-green-500',
      REJECTED: 'bg-red-500',
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos - {studentName}
          </DialogTitle>
          <DialogDescription>
            Gerencie os documentos do aluno: upload, validação e rejeição
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload de Novo Documento */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Enviar Novo Documento
              </h3>

              <div>
                <Label>Tipo de Documento</Label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Selecione o tipo...</option>
                  {requiredDocuments.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Arquivo (JPEG, PNG ou PDF - máx 10MB)</Label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="w-full border rounded-md p-2 mt-1"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !selectedType} className="w-full">
                {uploading ? 'Enviando...' : 'Enviar Documento'}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Documentos */}
          <div>
            <h3 className="font-semibold mb-4">Documentos Enviados</h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{doc.documentType}</span>
                            {getStatusBadge(doc.status)}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Enviado em: {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
                          </p>

                          {doc.validatedAt && (
                            <p className="text-sm text-green-600">
                              Validado em: {new Date(doc.validatedAt).toLocaleString('pt-BR')}
                            </p>
                          )}

                          {doc.rejectedAt && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                              <p className="text-sm text-red-600 font-medium">Rejeitado:</p>
                              <p className="text-sm text-red-600">{doc.rejectionReason}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {doc.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleValidate(doc.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Validar
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const reason = prompt('Motivo da rejeição:');
                                  if (reason) handleReject(doc.id, reason);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}

                          <Button size="sm" variant="ghost" onClick={() => window.open(doc.fileUrl, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Nenhum documento enviado ainda</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Checklist de Documentos Obrigatórios */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Documentos Obrigatórios</h3>
              <div className="space-y-2">
                {requiredDocuments.map((docType) => {
                  const uploaded = documents?.find((d) => d.documentType === docType);
                  const isComplete = uploaded?.status === 'COMPLETE';

                  return (
                    <div key={docType} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{docType}</span>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : uploaded ? (
                        <Badge className="bg-yellow-500">Pendente</Badge>
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
