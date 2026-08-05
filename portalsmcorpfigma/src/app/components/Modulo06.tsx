import React, { useState, useMemo } from 'react';
import { FileCheck, Upload, Download, User, CheckCircle, XCircle, Eye, Calendar, Filter, Search, Image, Edit } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { EditorFoto } from '@/app/components/EditorFoto';
import { Modulo06Detalhado } from '@/app/components/Modulo06Detalhado';
import { toast } from 'sonner';

export const Modulo06: React.FC = () => {
  const { alunos, turmas, cursos, salas, atualizarAluno } = useSMCorp();
  
  // Estados
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('todas');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [buscaAluno, setBuscaAluno] = useState<string>('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);
  const [dialogVisualizarAberto, setDialogVisualizarAberto] = useState(false);
  
  // Estados para upload de documentos
  const [arquivoDocumento, setArquivoDocumento] = useState<File | null>(null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  
  // Estados para edição de foto
  const [modoEditor, setModoEditor] = useState(false);
  const [fotoParaEditar, setFotoParaEditar] = useState<string | null>(null);
  
  // Estado para modo detalhado - removido estado intermediário
  // Agora abre direto o modo detalhado

  // Filtrar alunos
  const alunosFiltrados = useMemo(() => {
    let filtrados = alunos;

    // Filtrar por turma
    if (turmaSelecionada !== 'todas') {
      filtrados = filtrados.filter(a => a.turmaId === turmaSelecionada);
    }

    // Filtrar por status de documentos
    if (statusFiltro === 'pendente-foto') {
      filtrados = filtrados.filter(a => !a.foto);
    } else if (statusFiltro === 'pendente-docs') {
      filtrados = filtrados.filter(a => !a.statusDocumentos);
    } else if (statusFiltro === 'completo') {
      filtrados = filtrados.filter(a => a.foto && a.statusDocumentos);
    }

    // Filtrar por busca
    if (buscaAluno.trim()) {
      const termo = buscaAluno.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.nome.toLowerCase().includes(termo) ||
        a.codigoSistema.toLowerCase().includes(termo) ||
        a.cpf.includes(termo)
      );
    }

    return filtrados;
  }, [alunos, turmaSelecionada, statusFiltro, buscaAluno]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const total = alunosFiltrados.length;
    const comFoto = alunosFiltrados.filter(a => a.foto).length;
    
    // 🔧 CORREÇÃO: Verificar se o aluno tem TODOS os documentos aprovados
    const comDocs = alunosFiltrados.filter(a => {
      // Se tiver statusDocumentos = true, conta
      if (a.statusDocumentos) return true;
      
      // Senão, verifica se tem documentos e todos estão aprovados
      if (a.documentos && a.documentos.length > 0) {
        return a.documentos.every(doc => doc.status === 'Aprovado');
      }
      
      return false;
    }).length;
    
    const completos = alunosFiltrados.filter(a => {
      const temFoto = !!a.foto;
      const temDocumentosOk = a.statusDocumentos || 
        (a.documentos && a.documentos.length > 0 && a.documentos.every(doc => doc.status === 'Aprovado'));
      return temFoto && temDocumentosOk;
    }).length;
    
    return { total, comFoto, comDocs, completos };
  }, [alunosFiltrados]);

  const aluno = alunoSelecionado ? alunos.find(a => a.id === alunoSelecionado) : null;
  const turma = aluno ? turmas.find(t => t.id === aluno.turmaId) : null;
  const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
  const sala = turma ? salas.find(s => s.id === turma.salaId) : null;

  const handleVisualizarAluno = (alunoId: string) => {
    setAlunoSelecionado(alunoId);
    setDialogVisualizarAberto(true);
    setPreviewFoto(null);
    setArquivoFoto(null);
    setArquivoDocumento(null);
  };

  const handleUploadFoto = () => {
    if (!aluno || !arquivoFoto) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fotoUrl = reader.result as string;
      atualizarAluno(aluno.id, { foto: fotoUrl });
      toast.success('✅ Foto enviada com sucesso!');
      setArquivoFoto(null);
      setPreviewFoto(null);
    };
    reader.readAsDataURL(arquivoFoto);
  };

  const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      if (!arquivo.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      if (arquivo.size > 5 * 1024 * 1024) {
        toast.error('A foto deve ter no máximo 5MB');
        return;
      }
      setArquivoFoto(arquivo);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result as string);
      };
      reader.readAsDataURL(arquivo);
    }
  };

  const handleUploadDocumento = () => {
    if (!aluno || !arquivoDocumento) return;

    // Simular upload
    toast.success('✅ Documento enviado com sucesso!');
    atualizarAluno(aluno.id, { statusDocumentos: true });
    setArquivoDocumento(null);
  };

  const handleValidarDocumentos = () => {
    if (!aluno) return;
    atualizarAluno(aluno.id, { statusDocumentos: true });
    toast.success('✅ Documentos validados!');
  };

  const handleDownloadDocumento = () => {
    toast.info('📥 Download iniciado (simulação)');
  };

  const criarDataLocal = (dataString: string): Date => {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-red-600" />
          Módulo 06 - Validação de Documentos
        </h2>
        <p className="text-gray-600 mt-1">
          Gerencie documentos e fotos dos alunos, faça upload em nome deles e valide informações
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Foto</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.comFoto}</p>
              </div>
              <Image className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Documentos</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.comDocs}</p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completos</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.completos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Turma</Label>
              <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">📚 Todas as Turmas</SelectItem>
                  {turmas.map(turma => {
                    const curso = cursos.find(c => c.id === turma.cursoId);
                    return (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.codigo} - {turma.nomePersonalizado || curso?.nome}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente-foto">⚠️ Pendente Foto</SelectItem>
                  <SelectItem value="pendente-docs">⚠️ Pendente Documentos</SelectItem>
                  <SelectItem value="completo">✅ Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar Aluno</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nome, código ou CPF..."
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos ({alunosFiltrados.length})</CardTitle>
          <CardDescription>Clique em um aluno para visualizar e gerenciar seus documentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alunosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Nenhum aluno encontrado com os filtros selecionados</p>
              </div>
            ) : (
              alunosFiltrados.map(aluno => {
                const turma = turmas.find(t => t.id === aluno.turmaId);
                const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
                
                // 🔧 CORREÇÃO: Verificar status real dos documentos
                const temDocumentosOk = aluno.statusDocumentos || 
                  (aluno.documentos && aluno.documentos.length > 0 && aluno.documentos.every(doc => doc.status === 'Aprovado'));
                
                return (
                  <div
                    key={aluno.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Foto */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {aluno.foto ? (
                          <img src={aluno.foto} alt={aluno.nome} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{aluno.nome}</p>
                          <Badge variant="outline">{aluno.codigoSistema}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {turma?.codigo} - {turma?.nomePersonalizado || curso?.nome}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex gap-2">
                        <Badge variant={aluno.foto ? "default" : "destructive"} className={aluno.foto ? "bg-green-600" : ""}>
                          {aluno.foto ? '✓ Foto' : '✗ Foto'}
                        </Badge>
                        <Badge variant={temDocumentosOk ? "default" : "destructive"} className={temDocumentosOk ? "bg-green-600" : ""}>
                          {temDocumentosOk ? '✓ Docs' : '✗ Docs'}
                        </Badge>
                      </div>
                    </div>

                    {/* Botão Visualizar */}
                    <Button
                      onClick={() => handleVisualizarAluno(aluno.id)}
                      variant="outline"
                      className="ml-4"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Visualização do Aluno - Abre DIRETO no modo detalhado */}
      <Dialog open={dialogVisualizarAberto} onOpenChange={setDialogVisualizarAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {aluno && curso && turma && (
            <Modulo06Detalhado
              aluno={aluno}
              curso={curso}
              turma={turma}
              sala={sala}
              onAtualizarAluno={atualizarAluno}
              onVoltar={() => setDialogVisualizarAberto(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};