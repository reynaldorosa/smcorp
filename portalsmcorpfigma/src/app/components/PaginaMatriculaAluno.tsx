import React, { useState } from 'react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { CheckCircle, XCircle, Upload, CreditCard, FileText, User, Mail, Phone, Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';

interface PaginaMatriculaAlunoProps {
  codigoMatricula: string;
  onVoltar: () => void;
}

export const PaginaMatriculaAluno: React.FC<PaginaMatriculaAlunoProps> = ({ codigoMatricula, onVoltar }) => {
  const { alunos, turmas, cursos, salas, atualizarAluno } = useSMCorp();
  
  // Extrair código do sistema e ID do aluno do código de matrícula
  const [codigoSistema, alunoId] = codigoMatricula.split('-');
  const aluno = alunos.find(a => a.id === alunoId && a.codigoSistema === codigoSistema);
  
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [statusUpload, setStatusUpload] = useState<{ tipo: 'success' | 'error' | null; mensagem: string }>({ tipo: null, mensagem: '' });
  const [fotoSelecionada, setFotoSelecionada] = useState<File | null>(null);
  const [statusUploadFoto, setStatusUploadFoto] = useState<{ tipo: 'success' | 'error' | null; mensagem: string }>({ tipo: null, mensagem: '' });
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  if (!aluno) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Link Inválido</h2>
              <p className="text-gray-600">
                O código de matrícula <strong>{codigoMatricula}</strong> não foi encontrado.
              </p>
              <Button onClick={onVoltar} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const turma = turmas.find(t => t.id === aluno.turmaId);
  const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
  const sala = turma ? salas.find(s => s.id === turma.salaId) : null;

  const progressoMatricula = () => {
    let progresso = 0;
    // Status Link: Agendado = 0%, Confirmar/Confirmado/Presente = +33%
    if (aluno.statusLink !== 'Agendado') progresso += 33;
    if (aluno.statusPagamento) progresso += 33;
    if (aluno.statusDocumentos) progresso += 34;
    return progresso;
  };

  const handleAvancarStatus = () => {
    // Fluxo: Agendado → Confirmar → Confirmado → Presente
    if (aluno.statusLink === 'Agendado') {
      atualizarAluno(aluno.id, { statusLink: 'Confirmar' });
    } else if (aluno.statusLink === 'Confirmar') {
      atualizarAluno(aluno.id, { statusLink: 'Confirmado' });
    } else if (aluno.statusLink === 'Confirmado') {
      atualizarAluno(aluno.id, { statusLink: 'Presente' });
    }
  };

  const handleUploadDocumento = () => {
    if (arquivoSelecionado) {
      // Simular upload
      setStatusUpload({ tipo: 'success', mensagem: 'Documento enviado com sucesso!' });
      setTimeout(() => {
        atualizarAluno(aluno.id, { statusDocumentos: true });
        setArquivoSelecionado(null);
        setStatusUpload({ tipo: null, mensagem: '' });
      }, 1500);
    }
  };

  const handleUploadFoto = () => {
    if (fotoSelecionada) {
      // Criar preview da foto
      const reader = new FileReader();
      reader.onloadend = () => {
        const fotoUrl = reader.result as string;
        setPreviewFoto(fotoUrl);
        
        // Simular upload e salvar
        setStatusUploadFoto({ tipo: 'success', mensagem: 'Foto enviada com sucesso!' });
        setTimeout(() => {
          atualizarAluno(aluno.id, { foto: fotoUrl });
          setFotoSelecionada(null);
          setStatusUploadFoto({ tipo: null, mensagem: '' });
        }, 1500);
      };
      reader.readAsDataURL(fotoSelecionada);
    }
  };

  const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      // Validar tipo de arquivo (apenas imagens)
      if (!arquivo.type.startsWith('image/')) {
        setStatusUploadFoto({ tipo: 'error', mensagem: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)' });
        return;
      }
      // Validar tamanho (máx 5MB)
      if (arquivo.size > 5 * 1024 * 1024) {
        setStatusUploadFoto({ tipo: 'error', mensagem: 'A foto deve ter no máximo 5MB' });
        return;
      }
      setFotoSelecionada(arquivo);
      // Criar preview imediato
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result as string);
      };
      reader.readAsDataURL(arquivo);
    }
  };

  const handleSimularPagamento = () => {
    atualizarAluno(aluno.id, { statusPagamento: true });
  };

  const criarDataLocal = (dataString: string): Date => {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onVoltar} variant="ghost" className="text-white hover:bg-red-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Sistema Administrativo
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              {aluno.foto ? (
                <img src={aluno.foto} alt={aluno.nome} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Olá, {aluno.nome.split(' ')[0]}! 👋</h1>
              <p className="text-red-100">Matrícula: {aluno.codigoSistema}</p>
            </div>
            <Badge className="bg-white text-red-700 font-semibold text-sm px-4 py-2">
              {aluno.statusLink}
            </Badge>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Progresso da Matrícula
            </CardTitle>
            <CardDescription>Acompanhe o andamento da sua matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Completo</span>
                <span className="text-sm font-bold text-red-600">{progressoMatricula()}%</span>
              </div>
              <Progress value={progressoMatricula()} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg border-2 ${
                aluno.statusLink === 'Presente' || aluno.statusLink === 'Confirmado' || aluno.statusLink === 'Confirmar' 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {aluno.statusLink !== 'Agendado' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-semibold text-xs">
                    {aluno.statusLink === 'Agendado' ? 'Agendado' :
                     aluno.statusLink === 'Confirmar' ? 'Confirmar' :
                     aluno.statusLink === 'Confirmado' ? 'Confirmado' : 'Presente'}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border-2 ${aluno.statusDocumentos ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {aluno.statusDocumentos ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-semibold text-xs">Documentos</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border-2 ${aluno.statusPagamento ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {aluno.statusPagamento ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-semibold text-xs">Pagamento</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Curso */}
        {curso && turma && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Informações do Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Curso</Label>
                  <p className="font-semibold">{curso.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Turma</Label>
                  <p className="font-semibold">{turma.codigo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-xs text-gray-600">Início</Label>
                    <p className="font-medium text-sm">
                      {aluno.dataInicioAluno ? criarDataLocal(aluno.dataInicioAluno).toLocaleDateString('pt-BR') : 
                       turma.dataInicio ? criarDataLocal(turma.dataInicio).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-xs text-gray-600">Término</Label>
                    <p className="font-medium text-sm">
                      {aluno.dataFimAluno ? criarDataLocal(aluno.dataFimAluno).toLocaleDateString('pt-BR') : 
                       turma.dataFim ? criarDataLocal(turma.dataFim).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <Label className="text-xs text-gray-600">Horário</Label>
                    <p className="font-medium text-sm">{turma.horario}</p>
                  </div>
                </div>
                {sala && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <Label className="text-xs text-gray-600">Local</Label>
                      <p className="font-medium text-sm">{sala.nome}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Confirmação de Presença - Status: Agendado */}
          {aluno.statusLink === 'Agendado' && (
            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <CheckCircle className="w-5 h-5" />
                  🟡 Confirmar Matrícula
                </CardTitle>
                <CardDescription>Clique para avançar para a próxima etapa</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAvancarStatus} className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Avançar para Confirmar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status: Confirmar */}
          {aluno.statusLink === 'Confirmar' && (
            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <CheckCircle className="w-5 h-5" />
                  🟠 Confirmar Participação
                </CardTitle>
                <CardDescription>Confirme que você irá participar do curso</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAvancarStatus} className="w-full bg-orange-600 hover:bg-orange-700">
                  Confirmar Participação
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status: Confirmado */}
          {aluno.statusLink === 'Confirmado' && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="w-5 h-5" />
                  🔵 Marcar como Presente
                </CardTitle>
                <CardDescription>Confirme que você está presente no curso</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAvancarStatus} className="w-full bg-blue-600 hover:bg-blue-700">
                  Estou Presente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status: Presente - Mensagem de confirmação */}
          {aluno.statusLink === 'Presente' && (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  🟢 Presença Confirmada!
                </CardTitle>
                <CardDescription>Você está marcado como presente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Sua presença foi registrada com sucesso!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload de Foto - OBRIGATÓRIO */}
          <Card className={aluno.foto ? 'border-2 border-green-300 bg-green-50' : 'border-2 border-red-300 bg-red-50'}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${aluno.foto ? 'text-green-800' : 'text-red-800'}`}>
                <User className="w-5 h-5" />
                {aluno.foto ? 'Foto Enviada ✓' : '📸 Enviar Foto (Obrigatório)'}
              </CardTitle>
              <CardDescription>
                {aluno.foto ? 'Sua foto foi recebida com sucesso' : 'Envie uma foto ou selfie para completar seu cadastro'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!aluno.foto ? (
                <>
                  {/* Preview da foto selecionada */}
                  {previewFoto && (
                    <div className="flex justify-center">
                      <img 
                        src={previewFoto} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-red-500 shadow-lg"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="foto">Selecione sua foto ou tire uma selfie</Label>
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelecionarFoto}
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      💡 Formatos aceitos: JPG, PNG, HEIC. Tamanho máximo: 5MB
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleUploadFoto}
                    disabled={!fotoSelecionada}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Foto
                  </Button>
                  
                  {statusUploadFoto.tipo && (
                    <div className={`p-3 rounded text-sm ${
                      statusUploadFoto.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {statusUploadFoto.mensagem}
                    </div>
                  )}
                  
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    ⚠️ <strong>Atenção:</strong> O envio da foto é obrigatório para completar sua matrícula!
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <img 
                      src={aluno.foto} 
                      alt={aluno.nome} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
                    />
                  </div>
                  <div className="p-4 bg-green-100 rounded-lg">
                    <p className="text-green-800 font-medium flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Foto enviada e salva com sucesso!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload de Documentos */}
          <Card className={aluno.statusDocumentos ? 'border-2 border-green-300 bg-green-50' : 'border-2 border-orange-300 bg-orange-50'}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${aluno.statusDocumentos ? 'text-green-800' : 'text-orange-800'}`}>
                <Upload className="w-5 h-5" />
                {aluno.statusDocumentos ? 'Documentos Validados ✓' : 'Enviar Documentos'}
              </CardTitle>
              <CardDescription>
                {aluno.statusDocumentos ? 'Seus documentos foram aprovados' : 'Faça upload dos documentos necessários'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!aluno.statusDocumentos ? (
                <>
                  <div>
                    <Label htmlFor="documento">Selecione o arquivo</Label>
                    <Input
                      id="documento"
                      type="file"
                      onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                      className="bg-white"
                    />
                  </div>
                  <Button
                    onClick={handleUploadDocumento}
                    disabled={!arquivoSelecionado}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Documento
                  </Button>
                  {statusUpload.tipo && (
                    <div className={`p-3 rounded text-sm ${
                      statusUpload.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {statusUpload.mensagem}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Documentos aprovados e validados!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card className={aluno.statusPagamento ? 'border-2 border-green-300 bg-green-50' : 'border-2 border-red-300 bg-red-50'}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${aluno.statusPagamento ? 'text-green-800' : 'text-red-800'}`}>
                <CreditCard className="w-5 h-5" />
                {aluno.statusPagamento ? 'Pagamento Confirmado ✓' : 'Realizar Pagamento'}
              </CardTitle>
              <CardDescription>
                {aluno.statusPagamento ? 'Seu pagamento foi processado' : 'Complete o pagamento da matrícula'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!aluno.statusPagamento ? (
                <>
                  <div className="p-4 bg-white rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor do Curso:</span>
                      <span className="font-bold">R$ {aluno.valorTotal.toFixed(2)}</span>
                    </div>
                    {aluno.desconto > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Desconto:</span>
                        <span className="text-green-600 font-bold">- R$ {aluno.desconto.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total a Pagar:</span>
                      <span className="font-bold text-lg text-red-600">
                        R$ {(aluno.valorTotal - aluno.desconto).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button onClick={handleSimularPagamento} className="w-full bg-red-600 hover:bg-red-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Simular Pagamento (DEMO)
                  </Button>
                  <p className="text-xs text-gray-600 text-center">
                    * Esta é uma simulação para demonstração
                  </p>
                </>
              ) : (
                <div className="p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Pagamento confirmado e processado!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Seus Dados Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-xs text-gray-600">Email</Label>
                  <p className="font-medium text-sm">{aluno.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <Label className="text-xs text-gray-600">Telefone</Label>
                  <p className="font-medium text-sm">{aluno.telefone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prova Agendada */}
        {aluno.statusProva.ativo && (
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FileText className="w-5 h-5" />
                Prova Agendada
              </CardTitle>
              <CardDescription>Detalhes da sua prova</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Código da Prova</Label>
                  <Badge className="bg-purple-600 text-white font-mono text-sm mt-1">
                    {aluno.statusProva.numeroProva}
                  </Badge>
                </div>
                {aluno.statusProva.nomeProva && (
                  <div>
                    <Label className="text-xs text-gray-600">Nome da Prova</Label>
                    <p className="font-semibold">{aluno.statusProva.nomeProva}</p>
                  </div>
                )}
                {aluno.statusProva.data && (
                  <div>
                    <Label className="text-xs text-gray-600">Data</Label>
                    <p className="font-semibold">
                      {criarDataLocal(aluno.statusProva.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {aluno.statusProva.hora && (
                  <div>
                    <Label className="text-xs text-gray-600">Horário</Label>
                    <p className="font-semibold">{aluno.statusProva.hora}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-800">
                💡 Chegue 15 minutos antes do horário agendado!
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white text-center py-6 mt-12">
        <p className="text-sm">© 2026 SMCORP - Sistema de Gestão de Treinamentos</p>
        <p className="text-xs text-gray-400 mt-1">Dúvidas? Entre em contato com nossa equipe</p>
      </div>
    </div>
  );
};