'use client';

import React, { useState, useCallback } from 'react';
import {
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  Upload,
  Edit2,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@/stores/students.store';

// ============================================
// Types
// ============================================

export interface DocumentData {
  name: string;
  type: 'upload' | 'text';
  fileUrl?: string;
  textValue?: string;
  submittedAt: string;
  status: DocumentStatus;
}

export interface AdministrativeDocumentProps {
  /** Document name/title */
  documentName: string;
  /** Document type: file upload or text input */
  documentType: 'upload' | 'text';
  /** Existing document data from student */
  studentDocument?: DocumentData;
  /** Callback when text document is saved (optional) */
  onSaveText?: (data: { textValue: string }) => Promise<void> | void;
  /** Callback when file document is uploaded */
  onUploadFile?: (data: { file: File }) => Promise<void> | void;
  /** Callback when document is approved */
  onApprove: () => void;
  /** Callback when document is rejected */
  onReject: () => void;
  /** Callback for file download */
  onDownload?: () => void;
  /** Custom class name */
  className?: string;
}

interface StatusInfo {
  status: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
}

// ============================================
// Helper Functions
// ============================================

function getStatusInfo(document?: DocumentData): StatusInfo {
  if (!document) {
    return { status: 'Pendente', variant: 'destructive' };
  }
  
  switch (document.status) {
    case 'Approved':
      return { status: 'Aprovado', variant: 'default' };
    case 'Rejected':
      return { status: 'Reprovado', variant: 'secondary' };
    default:
      return { status: 'Aguardando Validação', variant: 'outline' };
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } catch {
    return dateString;
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// Component
// ============================================

export function AdministrativeDocument({
  documentName,
  documentType,
  studentDocument,
  onSaveText,
  onUploadFile,
  onApprove,
  onReject,
  onDownload,
  className,
}: AdministrativeDocumentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(studentDocument?.textValue || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const statusInfo = getStatusInfo(studentDocument);

  // File selection handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // Save text document
  const handleSaveText = useCallback(async () => {
    if (!textValue.trim()) {
      toast.error('Por favor, preencha o campo de texto');
      return;
    }

    try {
      await onSaveText?.({ textValue: textValue.trim() });
      toast.success(`✅ Texto salvo para "${documentName}"!`);
      setIsEditing(false);
    } catch {
      toast.error('Erro ao salvar o texto');
    }
  }, [documentName, textValue, onSaveText]);

  // Save file document
  const handleSaveFile = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    try {
      if (!onUploadFile) {
        toast.error('Upload não disponível');
        return;
      }

      await onUploadFile({ file: selectedFile });
      toast.success(`✅ Arquivo enviado para "${documentName}"!`);
      setIsEditing(false);
      setSelectedFile(null);
      setFilePreview(null);
    } catch {
      toast.error('Erro ao enviar o arquivo');
    }
  }, [documentName, selectedFile, onUploadFile]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTextValue(studentDocument?.textValue || '');
    setSelectedFile(null);
    setFilePreview(null);
  }, [studentDocument?.textValue]);

  const isApproved = studentDocument?.status === 'Approved';
  const hasFile = studentDocument?.fileUrl;

  return (
    <Card className={cn('border-2', className)}>
      <CardContent className="pt-6">
        {/* Document Header */}
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-5 h-5 text-muted-foreground" />
          <h4 className="font-semibold flex-1">{documentName}</h4>
          <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
        </div>

        {/* Document Info */}
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <strong>Tipo:</strong>{' '}
            {documentType === 'upload' ? '📤 Upload de Arquivo' : '✏️ Preenchimento de Texto'}
          </p>

          {/* Existing Document Display */}
          {studentDocument && !isEditing && (
            <>
              <p className="text-muted-foreground">
                <strong>Data de Envio:</strong> {formatDate(studentDocument.submittedAt)}
              </p>

              {/* File Preview */}
              {documentType === 'upload' && studentDocument.fileUrl && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Arquivo:</strong> ✓ Enviado
                  </p>
                  {studentDocument.fileUrl.startsWith('data:image') && (
                    <div className="flex justify-center p-2 bg-muted rounded border">
                      <img
                        src={studentDocument.fileUrl}
                        alt={documentName}
                        className="max-w-full h-32 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text Display */}
              {documentType === 'text' && studentDocument.textValue && (
                <div className="mt-2 p-3 bg-muted rounded border">
                  <p className="text-xs text-muted-foreground mb-1">
                    <strong>Texto Preenchido:</strong>
                  </p>
                  <p className="text-sm">{studentDocument.textValue}</p>
                </div>
              )}
            </>
          )}

          {/* Text Edit Mode */}
          {isEditing && documentType === 'text' && (
            <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Edit2 className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                <Label className="font-semibold text-blue-900 dark:text-blue-100">
                  Preencher Administrativamente
                </Label>
              </div>
              <Textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={`Digite o ${documentName.toLowerCase()} do aluno...`}
                rows={4}
                className="bg-background"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveText}
                  disabled={!onSaveText}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Texto
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Mode */}
          {isEditing && documentType === 'upload' && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                <Label className="font-semibold text-blue-900 dark:text-blue-100">
                  Enviar Arquivo Administrativamente
                </Label>
              </div>

              <Input
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
                className="bg-background"
              />

              {filePreview && (
                <div className="flex justify-center p-2 bg-background rounded border">
                  <img
                    src={filePreview}
                    alt="Pré-visualização"
                    className="max-w-full h-32 object-contain rounded"
                  />
                </div>
              )}

              {selectedFile && !filePreview && (
                <div className="p-3 bg-background rounded border text-center">
                  <p className="text-sm">📄 {selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveFile}
                  disabled={!selectedFile || !onUploadFile}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Arquivo
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!studentDocument && !isEditing && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
              <p className="text-red-600 dark:text-red-400 font-medium text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Aluno ainda não enviou este documento
              </p>
              <p className="text-red-700 dark:text-red-300 text-xs">
                💡 Você pode preencher/enviar em nome do aluno clicando abaixo
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {/* Download Button */}
          {hasFile && !isEditing && onDownload && (
            <Button onClick={onDownload} variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          )}

          {/* Edit/Fill Button */}
          {!isEditing && !isApproved && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="flex-1 border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {studentDocument ? 'Editar' : 'Preencher Admin'}
            </Button>
          )}

          {/* Approve Button */}
          {studentDocument && !isApproved && !isEditing && (
            <Button
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validar
            </Button>
          )}

          {/* Reject Button */}
          {studentDocument && isApproved && !isEditing && (
            <Button onClick={onReject} variant="destructive" size="sm" className="flex-1">
              <XCircle className="w-4 h-4 mr-2" />
              Invalidar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdministrativeDocument;
