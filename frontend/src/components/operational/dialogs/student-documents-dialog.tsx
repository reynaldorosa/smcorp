'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Legacy PT type — component uses Portuguese property names
// TODO: migrate to Student from @/types
interface Aluno {
  id: string;
  nome: string;
  codigoSistema: string;
  documentos: Array<{
    nome: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado';
    dataEnvio: string;
    arquivo?: string;
  }>;
}

interface StudentDocumentsDialogProps {
  aberto: boolean;
  aluno: Aluno | null;
  onFechar: () => void;
  onAtualizarDocumentos: (alunoId: string, documentos: Aluno['documentos'], statusGeral: boolean) => void;
}

export const StudentDocumentsDialog: React.FC<StudentDocumentsDialogProps> = ({
  aberto,
  aluno,
  onFechar,
  onAtualizarDocumentos
}) => {
  const [documentosEditados, setDocumentosEditados] = useState<Aluno['documentos']>([]);
  const [visualizandoDoc, setVisualizandoDoc] = useState<{nome: string; arquivo: string} | null>(null);

  useEffect(() => {
    if (aluno) {
      setDocumentosEditados(aluno.documentos);
    }
  }, [aluno]);

  if (!aluno) return null;

  const getStatusBadge = (status: 'Pendente' | 'Aprovado' | 'Reprovado') => {
    switch (status) {
      case 'Aprovado':
        return <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Aprovado
        </Badge>;
      case 'Reprovado':
        return <Badge className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Reprovado
        </Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pendente
        </Badge>;
    }
  };

  const alterarStatusDocumento = (index: number, novoStatus: 'Pendente' | 'Aprovado' | 'Reprovado') => {
    const novosDocumentos = [...documentosEditados];
    novosDocumentos[index] = { ...novosDocumentos[index], status: novoStatus };
    setDocumentosEditados(novosDocumentos);
  };

  const aprovarTodos = () => {
    const novosDocumentos = documentosEditados.map(doc => ({ ...doc, status: 'Aprovado' as const }));
    setDocumentosEditados(novosDocumentos);
    toast.success('✅ Todos os documentos foram aprovados!');
  };

  const salvarAlteracoes = () => {
    // Verificar se todos os documentos foram aprovados
    const todosAprovados = documentosEditados.every(doc => doc.status === 'Aprovado');
    onAtualizarDocumentos(aluno.id, documentosEditados, todosAprovados);
    toast.success('✅ Status dos documentos atualizado!');
    onFechar();
  };

  const baixarDocumento = (nomeDoc: string, arquivoBase64?: string) => {
    if (!arquivoBase64) {
      toast.error('❌ Documento não disponível para download');
      return;
    }
    try {
      // Criar link de download
      const link = document.createElement('a');
      link.href = arquivoBase64;
      link.download = `${aluno.codigoSistema}_${nomeDoc}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`📥 Download de ${nomeDoc} iniciado!`);
    } catch (error) {
      toast.error('❌ Erro ao baixar documento');
    }
  };

  const visualizarDocumento = (nomeDoc: string, arquivoBase64?: string) => {
    if (!arquivoBase64) {
      toast.error('❌ Documento não disponível para visualização');
      return;
    }
    setVisualizandoDoc({ nome: nomeDoc, arquivo: arquivoBase64 });
  };

  const totalDocumentos = documentosEditados.length;
  const aprovados = documentosEditados.filter(d => d.status === 'Aprovado').length;
  const pendentes = documentosEditados.filter(d => d.status === 'Pendente').length;
  const reprovados = documentosEditados.filter(d => d.status === 'Reprovado').length;

  return (
    <>
      <Dialog open={aberto} onOpenChange={onFechar}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Documentos do Aluno - {aluno.nome}
            </DialogTitle>
            <DialogDescription>
              Código: {aluno.codigoSistema} • {totalDocumentos} documento{totalDocumentos !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Resumo de Status */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 font-medium">Aprovados</div>
                <div className="text-2xl font-bold text-green-700">{aprovados}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-3">
                <div className="text-xs text-yellow-600 font-medium">Pendentes</div>
                <div className="text-2xl font-bold text-yellow-700">{pendentes}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="text-xs text-red-600 font-medium">Reprovados</div>
                <div className="text-2xl font-bold text-red-700">{reprovados}</div>
              </CardContent>
            </Card>
          </div>

          {documentosEditados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum documento enviado</p>
              <p className="text-sm">O aluno ainda não enviou documentos</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-350px)] pr-4">
              <div className="space-y-3">
                {documentosEditados.map((doc, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{doc.nome}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-3">
                            Enviado em: {new Date(doc.dataEnvio).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          
                          {/* Status Atual */}
                          <div className="mb-3">
                            {getStatusBadge(doc.status)}
                          </div>

                          {/* Ações */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => visualizarDocumento(doc.nome, doc.arquivo)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Visualizar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => baixarDocumento(doc.nome, doc.arquivo)}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Baixar
                            </Button>
                          </div>
                        </div>

                        {/* Botões de Aprovação */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => alterarStatusDocumento(index, 'Aprovado')}
                            className={`${
                              doc.status === 'Aprovado'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => alterarStatusDocumento(index, 'Reprovado')}
                            className={`${
                              doc.status === 'Reprovado'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reprovar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {documentosEditados.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={aprovarTodos}
                  className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar Todos
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onFechar}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarAlteracoes} className="bg-red-600 hover:bg-red-700">
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Documento */}
      {visualizandoDoc && (
        <Dialog open={!!visualizandoDoc} onOpenChange={() => setVisualizandoDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[95vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-600" />
                {visualizandoDoc.nome}
              </DialogTitle>
              <DialogDescription>
                Visualização do documento enviado pelo aluno
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 rounded-lg p-4 min-h-[500px] flex items-center justify-center">
              {visualizandoDoc.arquivo.startsWith('data:image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={visualizandoDoc.arquivo} 
                  alt={visualizandoDoc.nome}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">Prévia do documento</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Este tipo de arquivo não pode ser visualizado diretamente.
                  </p>
                  <Button 
                    onClick={() => baixarDocumento(visualizandoDoc.nome, visualizandoDoc.arquivo)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Documento
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
