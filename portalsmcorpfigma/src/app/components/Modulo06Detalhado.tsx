import React, { useState, useRef } from 'react';
import { FileCheck, Download, CheckCircle, XCircle, Mail, MessageCircle, AlertTriangle, Check, X, Eye, Upload, Edit2, Save, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { DocumentoAdministrativo } from '@/app/components/DocumentoAdministrativo';
import { EditorFoto } from '@/app/components/EditorFoto';
import { toast } from 'sonner';
import type { Aluno, Curso, Turma, Sala } from '@/app/contexts/SMCorpContext';

interface Modulo06DetalhadoProps {
  aluno: Aluno;
  curso: Curso;
  turma: Turma;
  sala: Sala | undefined;
  onAtualizarAluno: (alunoId: string, dados: Partial<Aluno>) => void;
  onVoltar: () => void;
}

export const Modulo06Detalhado: React.FC<Modulo06DetalhadoProps> = ({
  aluno,
  curso,
  turma,
  sala,
  onAtualizarAluno,
  onVoltar
}) => {
  const [dialogNotificacao, setDialogNotificacao] = useState(false);
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('');
  const [tipoNotificacao, setTipoNotificacao] = useState<'whatsapp' | 'email' | 'ambos'>('ambos');
  const [editorFotoAberto, setEditorFotoAberto] = useState(false);
  const [fotoParaEditar, setFotoParaEditar] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const criarDataLocal = (dataString: string): Date => {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  // Obter documentos obrigatórios do curso
  const documentosObrigatorios = curso.documentosObrigatorios || [];

  // Criar mapa de status dos documentos do aluno
  const documentosAluno = aluno.documentos || [];

  const handleSalvarDocumento = (nomeDocumento: string, dadosDocumento: {
    nome: string;
    tipo: 'upload' | 'texto';
    arquivo?: string;
    valorTexto?: string;
    dataEnvio: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado';
  }) => {
    // Verificar se o documento já existe
    const documentoExiste = documentosAluno.some(d => d.nome === nomeDocumento);
    
    let novosDocumentos;
    if (documentoExiste) {
      // Atualizar documento existente
      novosDocumentos = documentosAluno.map(d =>
        d.nome === nomeDocumento ? dadosDocumento : d
      );
    } else {
      // Adicionar novo documento
      novosDocumentos = [...documentosAluno, dadosDocumento];
    }
    
    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
  };

  const handleValidarDocumento = (nomeDocumento: string) => {
    const novosDocumentos = documentosAluno.map(doc =>
      doc.nome === nomeDocumento ? { ...doc, status: 'Aprovado' as const } : doc
    );
    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
    toast.success(`✅ Documento "${nomeDocumento}" validado!`);
  };

  const handleInvalidarDocumento = (nomeDocumento: string) => {
    const novosDocumentos = documentosAluno.map(doc =>
      doc.nome === nomeDocumento ? { ...doc, status: 'Reprovado' as const } : doc
    );
    onAtualizarAluno(aluno.id, { documentos: novosDocumentos });
    toast.warning(`⚠️ Documento "${nomeDocumento}" invalidado!`);
  };

  const handleDownloadDocumento = (nomeDocumento: string) => {
    const doc = documentosAluno.find(d => d.nome === nomeDocumento);
    if (doc?.arquivo) {
      // Simular download
      toast.success(`📥 Download do documento "${nomeDocumento}" iniciado!`);
    } else {
      toast.error('Arquivo não encontrado');
    }
  };

  const handleEnviarNotificacao = () => {
    // Identificar documentos pendentes
    const docsPendentes = documentosObrigatorios.filter(docObg => {
      const docAluno = documentosAluno.find(d => d.nome === docObg.nome);
      return !docAluno || docAluno.status === 'Pendente' || docAluno.status === 'Reprovado';
    });

    if (docsPendentes.length === 0) {
      toast.info('Não há documentos pendentes para este aluno');
      return;
    }

    const mensagemPadrao = `Olá ${aluno.nome}!\n\nIdentificamos pendências nos seus documentos para o curso "${curso.nome}".\n\n📄 Documentos Pendentes:\n${docsPendentes.map(d => `• ${d.nome}`).join('\n')}\n\nPor favor, acesse o link de matrícula e envie os documentos faltantes.\n\nAtenciosamente,\nEquipe SMCORP`;

    const mensagemFinal = mensagemPersonalizada.trim() || mensagemPadrao;

    // Simular envio
    if (tipoNotificacao === 'whatsapp' || tipoNotificacao === 'ambos') {
      toast.success(`📱 WhatsApp enviado para ${aluno.telefone}`);
    }
    if (tipoNotificacao === 'email' || tipoNotificacao === 'ambos') {
      toast.success(`📧 Email enviado para ${aluno.email}`);
    }

    setDialogNotificacao(false);
    setMensagemPersonalizada('');
  };

  const getStatusDocumento = (nomeDoc: string) => {
    const doc = documentosAluno.find(d => d.nome === nomeDoc);
    if (!doc) return { status: 'Pendente', cor: 'bg-red-100 text-red-800' };
    if (doc.status === 'Aprovado') return { status: 'Aprovado', cor: 'bg-green-100 text-green-800' };
    if (doc.status === 'Reprovado') return { status: 'Reprovado', cor: 'bg-orange-100 text-orange-800' };
    return { status: 'Aguardando Validação', cor: 'bg-yellow-100 text-yellow-800' };
  };

  const totalDocumentos = documentosObrigatorios.length;
  const documentosAprovados = documentosObrigatorios.filter(doc => {
    const docAluno = documentosAluno.find(d => d.nome === doc.nome);
    return docAluno?.status === 'Aprovado';
  }).length;
  const documentosPendentes = totalDocumentos - documentosAprovados;

  const handleAbrirEditorFoto = () => {
    // Se já tem foto, abre direto o editor com a foto atual
    if (aluno.foto) {
      setFotoParaEditar(aluno.foto);
      setEditorFotoAberto(true);
    } else {
      // Se não tem foto, abre o seletor de arquivo
      inputFotoRef.current?.click();
    }
  };

  const handleSelecionarArquivoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    // Validar se é imagem
    if (!arquivo.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (max 10MB)
    if (arquivo.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    // Converter para Base64 e abrir editor
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
          <p className="text-sm text-gray-600">{aluno.nome} - {aluno.codigoSistema}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDialogNotificacao(true)}
            variant="outline"
            className="border-blue-500 text-blue-700 hover:bg-blue-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Notificar Aluno
          </Button>
          <Button onClick={onVoltar} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Resumo de Documentos */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{totalDocumentos}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{documentosAprovados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-red-600">{documentosPendentes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário do Aluno */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-lg">📋 Formulário Preenchido pelo Aluno</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-xs text-gray-600">Nome Completo</Label>
              <p className="font-semibold text-gray-900">{aluno.nome}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">CPF</Label>
              <p className="font-semibold text-gray-900">{aluno.cpf}</p>
            </div>
            {aluno.rg && (
              <div>
                <Label className="text-xs text-gray-600">RG</Label>
                <p className="font-semibold text-gray-900">{aluno.rg}</p>
              </div>
            )}
            {aluno.dataNascimento && (
              <div>
                <Label className="text-xs text-gray-600">Data de Nascimento</Label>
                <p className="font-semibold text-gray-900">
                  {criarDataLocal(aluno.dataNascimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-600">Telefone</Label>
              <p className="font-semibold text-gray-900">{aluno.telefone}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Email</Label>
              <p className="font-semibold text-gray-900">{aluno.email}</p>
            </div>
            {aluno.endereco && (
              <div className="col-span-2">
                <Label className="text-xs text-gray-600">Endereço Completo</Label>
                <p className="font-semibold text-gray-900">{aluno.endereco}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-600">Curso</Label>
              <p className="font-semibold text-gray-900">{curso.nome}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Turma</Label>
              <p className="font-semibold text-gray-900">{turma.codigo}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Data Início</Label>
              <p className="font-semibold text-gray-900">
                {aluno.dataInicioAluno ? criarDataLocal(aluno.dataInicioAluno).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Data Término</Label>
              <p className="font-semibold text-gray-900">
                {aluno.dataFimAluno ? criarDataLocal(aluno.dataFimAluno).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foto do Aluno */}
      <Card className={aluno.foto ? 'border-2 border-green-200' : 'border-2 border-red-200'}>
        <CardHeader className={aluno.foto ? 'bg-green-50' : 'bg-red-50'}>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>📸 Foto do Aluno</span>
            <div className="flex items-center gap-2">
              {aluno.foto ? (
                <Badge className="bg-green-600">✓ Enviada</Badge>
              ) : (
                <>
                  <Badge variant="destructive">✗ Pendente</Badge>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    💡 Envie em nome do aluno
                  </span>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {aluno.foto ? (
            <div className="flex justify-center">
              <img 
                src={aluno.foto} 
                alt={aluno.nome} 
                className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
              />
            </div>
          ) : (
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg text-center">
              <div className="text-red-600 mb-2">
                <p className="font-semibold text-lg">⚠️ Aluno ainda não enviou a foto</p>
                <p className="text-sm mt-2">💡 Você pode enviar a foto em nome do aluno clicando no botão abaixo</p>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <Button
              onClick={handleAbrirEditorFoto}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {aluno.foto ? 'Editar Foto Admin' : 'Enviar Foto Admin'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentos do Curso */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>📄 Documentos Obrigatórios do Curso</span>
            <div className="text-sm font-normal text-purple-700 bg-purple-100 px-3 py-1 rounded">
              💡 Você pode preencher/enviar documentos em nome do aluno
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {documentosObrigatorios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento obrigatório cadastrado para este curso
            </div>
          ) : (
            <div className="space-y-4">
              {documentosObrigatorios.map((docObrigatorio, index) => {
                const docAluno = documentosAluno.find(d => d.nome === docObrigatorio.nome);
                
                return (
                  <DocumentoAdministrativo
                    key={index}
                    nomeDocumento={docObrigatorio.nome}
                    tipoDocumento={docObrigatorio.requerUpload ? 'upload' : 'texto'}
                    documentoAluno={docAluno}
                    onSalvarDocumento={(dados) => handleSalvarDocumento(docObrigatorio.nome, dados)}
                    onValidar={() => handleValidarDocumento(docObrigatorio.nome)}
                    onInvalidar={() => handleInvalidarDocumento(docObrigatorio.nome)}
                    onDownload={() => handleDownloadDocumento(docObrigatorio.nome)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Notificação */}
      <Dialog open={dialogNotificacao} onOpenChange={setDialogNotificacao}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Notificar Aluno sobre Pendências
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Informações do Aluno */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Aluno:</strong> {aluno.nome}
                  </div>
                  <div>
                    <strong>Telefone:</strong> {aluno.telefone}
                  </div>
                  <div className="col-span-2">
                    <strong>Email:</strong> {aluno.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Notificação */}
            <div>
              <Label>Canal de Envio</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={tipoNotificacao === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setTipoNotificacao('whatsapp')}
                  className={tipoNotificacao === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant={tipoNotificacao === 'email' ? 'default' : 'outline'}
                  onClick={() => setTipoNotificacao('email')}
                  className={tipoNotificacao === 'email' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={tipoNotificacao === 'ambos' ? 'default' : 'outline'}
                  onClick={() => setTipoNotificacao('ambos')}
                  className={tipoNotificacao === 'ambos' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Ambos
                </Button>
              </div>
            </div>

            {/* Mensagem Personalizada */}
            <div>
              <Label>Mensagem (opcional - deixe em branco para usar mensagem padrão)</Label>
              <Textarea
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                placeholder="Digite uma mensagem personalizada..."
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Preview da Mensagem */}
            {!mensagemPersonalizada.trim() && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-600 mb-2"><strong>Preview da mensagem padrão:</strong></p>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    Olá {aluno.nome}!
                    
                    Identificamos pendências nos seus documentos para o curso "{curso.nome}".
                    
                    📄 Documentos Pendentes:
                    {documentosObrigatorios.filter(docObg => {
                      const docAluno = documentosAluno.find(d => d.nome === docObg.nome);
                      return !docAluno || docAluno.status === 'Pendente' || docAluno.status === 'Reprovado';
                    }).map(d => `\n• ${d.nome}`)}
                    
                    Por favor, acesse o link de matrícula e envie os documentos faltantes.
                    
                    Atenciosamente,
                    Equipe SMCORP
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <Button onClick={() => setDialogNotificacao(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleEnviarNotificacao} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Notificação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor de Foto */}
      <Dialog open={editorFotoAberto} onOpenChange={setEditorFotoAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-blue-600" />
              Editar Foto do Aluno
            </DialogTitle>
          </DialogHeader>
          
          {fotoParaEditar && (
            <div className="space-y-4">
              <EditorFoto
                imagemOriginal={fotoParaEditar}
                onSalvar={handleSalvarFoto}
                onCancelar={() => setEditorFotoAberto(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Input Oculto para Selecionar Arquivo */}
      <input
        type="file"
        ref={inputFotoRef}
        accept="image/*"
        className="hidden"
        onChange={handleSelecionarArquivoFoto}
      />
    </div>
  );
};