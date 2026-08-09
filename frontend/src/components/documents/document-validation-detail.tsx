'use client';

import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  Mail,
  MessageCircle,
  AlertTriangle,
  Check,
  X,
  Eye,
  Upload,
  Edit,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EditorFoto } from '@/components/shared/editor-foto';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface Documento {
  nome: string;
  tipo: 'upload' | 'texto';
  arquivo?: string;
  valorTexto?: string;
  dataEnvio: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
}

interface DocumentoObrigatorio {
  nome: string;
  tipo: 'upload' | 'texto';
  obrigatorio: boolean;
  descricao?: string;
}

interface AlunoDocumentos {
  id: string;
  nome: string;
  codigoSistema: string;
  email: string;
  telefone: string;
  foto?: string;
  documentos?: Documento[];
  statusDocumentos?: boolean;
}

interface CursoInfo {
  id: string;
  nome: string;
  documentosObrigatorios?: DocumentoObrigatorio[];
}

interface TurmaInfo {
  id: string;
  codigo: string;
  nomePersonalizado?: string;
}

interface SalaInfo {
  id: string;
  nome: string;
}

interface DocumentValidationDetailProps {
  aluno: AlunoDocumentos;
  curso: CursoInfo;
  turma: TurmaInfo;
  sala?: SalaInfo;
  onAtualizarAluno: (alunoId: string, dados: Partial<AlunoDocumentos>) => void;
  onVoltar: () => void;
}

// ============================================
// DocumentoAdministrativo Component
// ============================================

interface DocumentoAdministrativoProps {
  nome: string;
  tipo: 'upload' | 'texto';
  documento?: Documento;
  onSalvar: (dados: Documento) => void;
  onValidar: () => void;
  onInvalidar: () => void;
  onDownload: () => void;
}

function DocumentoAdministrativo({
  nome,
  tipo,
  documento,
  onSalvar,
  onValidar,
  onInvalidar,
  onDownload,
}: DocumentoAdministrativoProps) {
  const [modo, setModo] = useState<'visualizar' | 'editar'>('visualizar');
  const [arquivo, setArquivo] = useState<string | undefined>(documento?.arquivo);
  const [valorTexto, setValorTexto] = useState(documento?.valorTexto || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setArquivo(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSalvar = () => {
    const dados: Documento = {
      nome,
      tipo,
      arquivo: tipo === 'upload' ? arquivo : undefined,
      valorTexto: tipo === 'texto' ? valorTexto : undefined,
      dataEnvio: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
    };
    onSalvar(dados);
    setModo('visualizar');
    toast.success(`Documento "${nome}" salvo com sucesso!`);
  };

  const getStatusColor = () => {
    if (!documento) return 'bg-gray-100 text-gray-600';
    switch (documento.status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Reprovado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{nome}</span>
              <Badge className={getStatusColor()}>
                {documento?.status || 'Não enviado'}
              </Badge>
            </div>

            {modo === 'visualizar' ? (
              <div className="space-y-2">
                {documento ? (
                  <div className="text-sm text-gray-600">
                    <p>Enviado em: {documento.dataEnvio}</p>
                    {tipo === 'texto' && documento.valorTexto && (
                      <p className="mt-1 p-2 bg-gray-50 rounded">{documento.valorTexto}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Documento não enviado</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {tipo === 'upload' ? (
                  <div>
                    <input
                      ref={inputRef}
                      type="file"
                      onChange={handleUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                    {arquivo && (
                      <p className="text-sm text-green-600 mt-1">Arquivo selecionado</p>
                    )}
                  </div>
                ) : (
                  <Input
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    placeholder="Digite o valor..."
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSalvar}>
                    <Check className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModo('visualizar')}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1 ml-4">
            {modo === 'visualizar' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setModo('editar')}>
                  <Edit className="w-4 h-4" />
                </Button>
                {documento?.arquivo && (
                  <Button size="sm" variant="ghost" onClick={onDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                {documento && documento.status !== 'Aprovado' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600"
                      onClick={onValidar}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={onInvalidar}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function DocumentValidationDetail({
  aluno,
  curso,
  turma,
  sala,
  onAtualizarAluno,
  onVoltar,
}: DocumentValidationDetailProps) {
  const [dialogNotificacao, setDialogNotificacao] = useState(false);
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('');
  const [tipoNotificacao, setTipoNotificacao] = useState<'whatsapp' | 'email' | 'ambos'>('ambos');
  const [editorFotoAberto, setEditorFotoAberto] = useState(false);
  const [fotoParaEditar, setFotoParaEditar] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const documentosObrigatorios = curso.documentosObrigatorios || [];
  const documentosAluno = aluno.documentos || [];

  const handleSalvarDocumento = (nomeDocumento: string, dadosDocumento: Documento) => {
    const documentoExiste = documentosAluno.some((d) => d.nome === nomeDocumento);

    let novosDocumentos;
    if (documentoExiste) {
      novosDocumentos = documentosAluno.map((d) =>
        d.nome === nomeDocumento ? dadosDocumento : d
      );
    } else {
      novosDocumentos = [...documentosAluno, dadosDocumento];
    }

    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
  };

  const handleValidarDocumento = (nomeDocumento: string) => {
    const novosDocumentos = documentosAluno.map((doc) =>
      doc.nome === nomeDocumento ? { ...doc, status: 'Aprovado' as const } : doc
    );
    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
    toast.success(`✅ Documento "${nomeDocumento}" validado!`);
  };

  const handleInvalidarDocumento = (nomeDocumento: string) => {
    const novosDocumentos = documentosAluno.map((doc) =>
      doc.nome === nomeDocumento ? { ...doc, status: 'Reprovado' as const } : doc
    );
    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
    toast.warning(`⚠️ Documento "${nomeDocumento}" invalidado!`);
  };

  const handleDownloadDocumento = (nomeDocumento: string) => {
    const doc = documentosAluno.find((d) => d.nome === nomeDocumento);
    if (doc?.arquivo) {
      toast.success(`📥 Download do documento "${nomeDocumento}" iniciado!`);
      // Em produção: window.open(doc.arquivo)
    } else {
      toast.error('Arquivo não encontrado');
    }
  };

  const handleEnviarNotificacao = () => {
    const docsPendentes = documentosObrigatorios.filter((docObg) => {
      const docAluno = documentosAluno.find((d) => d.nome === docObg.nome);
      return !docAluno || docAluno.status === 'Pendente' || docAluno.status === 'Reprovado';
    });

    if (docsPendentes.length === 0) {
      toast.info('Não há documentos pendentes para este aluno');
      return;
    }

    const mensagemPadrao = `Olá ${aluno.nome}!\n\nIdentificamos pendências nos seus documentos para o curso "${curso.nome}".\n\n📄 Documentos Pendentes:\n${docsPendentes.map((d) => `• ${d.nome}`).join('\n')}\n\nPor favor, acesse o link de matrícula e envie os documentos faltantes.\n\nAtenciosamente,\nEquipe Caiso`;

    const mensagemFinal = mensagemPersonalizada.trim() || mensagemPadrao;

    if (tipoNotificacao === 'whatsapp' || tipoNotificacao === 'ambos') {
      toast.success(`📱 WhatsApp enviado para ${aluno.telefone}`);
    }
    if (tipoNotificacao === 'email' || tipoNotificacao === 'ambos') {
      toast.success(`📧 Email enviado para ${aluno.email}`);
    }

    setDialogNotificacao(false);
    setMensagemPersonalizada('');
  };

  const totalDocumentos = documentosObrigatorios.length;
  const documentosAprovados = documentosObrigatorios.filter((doc) => {
    const docAluno = documentosAluno.find((d) => d.nome === doc.nome);
    return docAluno?.status === 'Aprovado';
  }).length;
  const documentosPendentes = totalDocumentos - documentosAprovados;

  const handleAbrirEditorFoto = () => {
    if (aluno.foto) {
      setFotoParaEditar(aluno.foto);
      setEditorFotoAberto(true);
    } else {
      inputFotoRef.current?.click();
    }
  };

  const handleSelecionarArquivoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoParaEditar(reader.result as string);
      setEditorFotoAberto(true);
    };
    reader.readAsDataURL(arquivo);
  };

  const handleSalvarFoto = (fotoBase64: string) => {
    onAtualizarAluno(aluno.id, { foto: fotoBase64 });
    setEditorFotoAberto(false);
    setFotoParaEditar(null);
    toast.success('✅ Foto salva com sucesso!');
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto space-y-6 pr-2">
      {/* Header com Ações */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Validação de Documentos</h3>
          <p className="text-sm text-gray-600">
            {aluno.nome} - {aluno.codigoSistema}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDialogNotificacao(true)}
            variant="outline"
            className="border-blue-500 text-blue-700 hover:bg-blue-50"
          >
            <Mail className="w-4 h-4 mr-2" />
            Notificar Aluno
          </Button>
          <Button onClick={onVoltar} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalDocumentos}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{documentosAprovados}</p>
            <p className="text-sm text-gray-600">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{documentosPendentes}</p>
            <p className="text-sm text-gray-600">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Foto do Aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Foto do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-red-600">
              {aluno.foto ? (
                <img
                  src={aluno.foto}
                  alt={aluno.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={inputFotoRef}
                type="file"
                onChange={handleSelecionarArquivoFoto}
                className="hidden"
                accept="image/*"
              />
              <Button onClick={handleAbrirEditorFoto}>
                <Edit className="w-4 h-4 mr-2" />
                {aluno.foto ? 'Editar Foto' : 'Adicionar Foto'}
              </Button>
              <p className="text-xs text-gray-500">
                A foto será recortada em formato circular
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Documentos Obrigatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentosObrigatorios.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum documento obrigatório definido para este curso
            </p>
          ) : (
            documentosObrigatorios.map((docObg) => {
              const documento = documentosAluno.find((d) => d.nome === docObg.nome);
              return (
                <DocumentoAdministrativo
                  key={docObg.nome}
                  nome={docObg.nome}
                  tipo={docObg.tipo}
                  documento={documento}
                  onSalvar={(dados) => handleSalvarDocumento(docObg.nome, dados)}
                  onValidar={() => handleValidarDocumento(docObg.nome)}
                  onInvalidar={() => handleInvalidarDocumento(docObg.nome)}
                  onDownload={() => handleDownloadDocumento(docObg.nome)}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Dialog de Notificação */}
      <Dialog open={dialogNotificacao} onOpenChange={setDialogNotificacao}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Notificar Aluno sobre Pendências
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Notificação</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={tipoNotificacao === 'whatsapp'}
                    onChange={() => setTipoNotificacao('whatsapp')}
                    className="text-green-600"
                  />
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={tipoNotificacao === 'email'}
                    onChange={() => setTipoNotificacao('email')}
                    className="text-blue-600"
                  />
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={tipoNotificacao === 'ambos'}
                    onChange={() => setTipoNotificacao('ambos')}
                    className="text-purple-600"
                  />
                  Ambos
                </label>
              </div>
            </div>
            <div>
              <Label>Mensagem Personalizada (opcional)</Label>
              <Textarea
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                placeholder="Deixe em branco para usar a mensagem padrão..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogNotificacao(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEnviarNotificacao}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Notificação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editor de Foto */}
      <Dialog open={editorFotoAberto} onOpenChange={setEditorFotoAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajustar Foto do Aluno</DialogTitle>
          </DialogHeader>
          {fotoParaEditar && (
            <EditorFoto
              imagemOriginal={fotoParaEditar}
              onSalvar={handleSalvarFoto}
              onCancelar={() => {
                setEditorFotoAberto(false);
                setFotoParaEditar(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
