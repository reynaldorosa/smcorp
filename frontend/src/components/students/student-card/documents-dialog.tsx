'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Student, User } from '@/types';
import { checkDocumentsComplete } from './utils';

interface DocumentsDialogProps {
  student: Student;
  currentUser?: User;
  onUpdateStudent?: (studentId: string, data: Partial<Student>) => void;
  onOpenPinDialog: () => void;
}

/**
 * Documents review dialog
 * Shows all documents with approve/reject controls
 */
export const DocumentsDialog: React.FC<DocumentsDialogProps> = ({
  student,
  onUpdateStudent,
  onOpenPinDialog,
}) => {
  const documentsComplete = checkDocumentsComplete(student);

  const handleApproveDocument = (docName: string) => {
    const updatedDocs = student.documents?.map((doc) =>
      doc.name === docName ? { ...doc, status: 'Approved' as const } : doc
    ) || [];
    onUpdateStudent?.(student.id, { documents: updatedDocs });
    toast.success(`Documento "${docName}" aprovado!`, { icon: '✅' });
  };

  const handleRejectDocument = (docName: string) => {
    const updatedDocs = student.documents?.map((doc) =>
      doc.name === docName ? { ...doc, status: 'Rejected' as const } : doc
    ) || [];
    onUpdateStudent?.(student.id, { documents: updatedDocs });
    toast.error(`Documento "${docName}" reprovado!`, { icon: '❌' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight ${
            documentsComplete
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          {documentsComplete ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          DOC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos - {student.name}</DialogTitle>
          <DialogDescription>
            Aprove ou reprove cada documento individualmente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {student.documents && student.documents.length > 0 ? (
            <div className="space-y-3">
              {student.documents.map((doc, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    doc.status === 'Approved'
                      ? 'bg-green-50 border-green-300'
                      : doc.status === 'Rejected'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <h4 className="font-semibold text-sm">{doc.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            doc.status === 'Approved'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : doc.status === 'Rejected'
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          }`}
                        >
                          {doc.status === 'Approved'
                            ? 'Aprovado'
                            : doc.status === 'Rejected'
                            ? 'Reprovado'
                            : 'Pendente'}
                        </Badge>
                      </div>

                      {doc.type === 'upload' && doc.fileUrl && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">Arquivo enviado:</p>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visualizar arquivo
                          </a>
                        </div>
                      )}

                      {doc.type === 'text' && doc.textValue && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Informação preenchida:
                          </p>
                          <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                            {doc.textValue}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Enviado em: {new Date(doc.submittedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {doc.status !== 'Approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveDocument(doc.name)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      )}
                      {doc.status !== 'Rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectDocument(doc.name)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reprovar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-lg text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Nenhum documento foi enviado pelo aluno ainda.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Os documentos aparecerão aqui quando o aluno preencher o link de
                matrícula.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Status Geral dos Documentos:</span>
              <Badge className={documentsComplete ? 'bg-green-500' : 'bg-red-500'}>
                {documentsComplete ? '✓ Aprovado' : '✗ Pendente'}
              </Badge>
            </div>
            <Button onClick={onOpenPinDialog} variant="outline" className="w-full">
              {documentsComplete
                ? 'Marcar Todos como Pendente'
                : 'Aprovar Todos em Lote'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
