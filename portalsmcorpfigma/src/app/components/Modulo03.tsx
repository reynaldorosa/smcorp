import React, { useState, useEffect } from 'react';
import { Plus, QrCode, Users, ChevronDown, Search, ChevronLeft, ChevronRight, X, Edit, ChevronUp, Eye, EyeOff, Clock, UserSearch, Printer, FileText } from 'lucide-react';
import { useSMCorp, Aluno } from '@/app/contexts/SMCorpContext';
import { usePersistedState } from '@/app/hooks/usePersistedState';
import { CardAluno } from '@/app/components/CardAluno';
import { FormularioMatricula } from '@/app/components/FormularioMatricula';
import { LimparDados } from '@/app/components/LimparDados';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { DialogAdicionarFilaEspera } from '@/app/components/DialogAdicionarFilaEspera';
import { DialogListaPresenca } from '@/app/components/DialogListaPresenca';
import { DialogRelatorioTurma } from '@/app/components/DialogRelatorioTurma';
import { DialogAdicionarInstrutor } from '@/app/components/DialogAdicionarInstrutor';
import { CardInstrutorTurma } from '@/app/components/CardInstrutorTurma';
import { DialogAgendarProva } from '@/app/components/DialogAgendarProva';
import { DialogProvasInstrutor } from '@/app/components/DialogProvasInstrutor';
import { toast } from 'sonner';

// Função helper para criar data local a partir de string YYYY-MM-DD
const criarDataLocal = (dataString: string): Date => {
  const [ano, mes, dia] = dataString.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

// Módulo 03 - Dashboard Operacional v2.1.1
export const Modulo03: React.FC = () => {
  const { 
    turmas, 
    cursos, 
    salas, 
    alunos, 
    adicionarAluno, 
    clientesPJ, 
    adicionarTurma, 
    atualizarTurma, 
    produtosExtras,
    instrutores,
    vincularInstrutorTurma,
    desvincularInstrutorTurma,
    confirmarPresencaInstrutor,
    provasAgendadas,
    usuarioAtual
  } = useSMCorp();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [buscaCurso, setBuscaCurso] = useState('');
  const [buscaAlunoGlobal, setBuscaAlunoGlobal] = useState('');
  
  // 💾 Estados persistidos - mantém visualização ao trocar de módulo
  const [semanaAtual, setSemanaAtual] = usePersistedState<number>('modulo03-semanaAtual', 0);
  const [cursosVisiveis, setCursosVisiveis] = usePersistedState<Set<string>>('modulo03-cursosVisiveis', new Set());
  const [cursosExpandidos, setCursosExpandidos] = usePersistedState<Set<string>>('modulo03-cursosExpandidos', new Set());
  const [visualizacaoSemanal, setVisualizacaoSemanal] = usePersistedState<boolean>('modulo03-visualizacaoSemanal', false);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null); // Para scroll até o aluno
  const [novoAluno, setNovoAluno] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    tipoPessoa: 'PF' as 'PF' | 'PJ',
    clientePJId: '',
    desconto: 0,
    dataInicioAluno: '',
    dataFimAluno: '',
    produtosVinculados: [] as string[],
    extrasVinculados: [] as string[]
  });

  const [buscaAluno, setBuscaAluno] = useState('');
  const [alunoEncontrado, setAlunoEncontrado] = useState<any>(null);
  const [mostrarQRCode, setMostrarQRCode] = useState(false);
  const [tokenMatricula, setTokenMatricula] = useState('');
  const [dialogFilaEsperaAberto, setDialogFilaEsperaAberto] = useState(false);
  const [dialogListaPresencaAberto, setDialogListaPresencaAberto] = useState(false);
  const [dialogRelatorioAberto, setDialogRelatorioAberto] = useState(false);
  const [dialogAdicionarInstrutorAberto, setDialogAdicionarInstrutorAberto] = useState(false);
  const [dialogProvaAberto, setDialogProvaAberto] = useState(false);
  const [instrutorProva, setInstrutorProva] = useState<{ instrutorId: string; turmaId: string } | null>(null);

  const [novaTurma, setNovaTurma] = useState({
    cursoId: '',
    dataInicio: '',
    dataFim: '',
    salaId: '',
    clientePJId: ''
  });

  const [editarTurmaDialog, setEditarTurmaDialog] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<string | null>(null);
  const [dadosEdicaoTurma, setDadosEdicaoTurma] = useState({
    nomePersonalizado: '',
    dataInicio: '',
    dataFim: '',
    salaId: '',
    statusTurma: 'Planejada' as 'Planejada' | 'Confirmada' | 'Em Andamento' | 'Concluída'
  });

  // Calcular data de fim automaticamente
  const calcularDataFim = (dataInicio: string, cursoId: string) => {
    if (!dataInicio || !cursoId) return '';
    
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return '';

    // Calcular quantos dias de aula são necessários
    const diasDeAulaNecessarios = Math.ceil(curso.cargaHorariaTotal / curso.horasAulaPorDia);
    
    // Criar data local para evitar problemas de timezone
    const [ano, mes, dia] = dataInicio.split('-').map(Number);
    let dataAtual = new Date(ano, mes - 1, dia);
    
    let diasDeAulaContados = 0;

    // Contar os dias necessários, incluindo o primeiro
    while (diasDeAulaContados < diasDeAulaNecessarios) {
      const diaSemana = dataAtual.getDay();
      const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
      
      // Só conta o dia se não for fim de semana, OU se o curso usa fim de semana
      if (!ehFimDeSemana || curso.usaFimDeSemana) {
        diasDeAulaContados++;
      }
      
      // Se ainda não completou os dias necessários, avança para o próximo dia
      if (diasDeAulaContados < diasDeAulaNecessarios) {
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }

    // Formatar data no padrão YYYY-MM-DD
    const anoFim = dataAtual.getFullYear();
    const mesFim = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const diaFim = String(dataAtual.getDate()).padStart(2, '0');
    return `${anoFim}-${mesFim}-${diaFim}`;
  };

  const handleDataInicioChange = (data: string) => {
    const dataFim = calcularDataFim(data, novaTurma.cursoId);
    setNovaTurma({ ...novaTurma, dataInicio: data, dataFim });
  };

  const handleCursoChange = (cursoId: string) => {
    const dataFim = calcularDataFim(novaTurma.dataInicio, cursoId);
    setNovaTurma({ ...novaTurma, cursoId, dataFim });
  };

  const handleAdicionarTurma = () => {
    adicionarTurma(novaTurma);
    setNovaTurma({
      cursoId: '',
      dataInicio: '',
      dataFim: '',
      salaId: '',
      clientePJId: '',
      preco: 0
    });
  };

  const getDiaSemana = (diaSemana: number) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[diaSemana];
  };

  const getTurmasPorDia = (diaSemana: number) => {
    return turmas.filter(turma => {
      const inicio = new Date(turma.dataInicio);
      const fim = new Date(turma.dataFim);
      
      // Verificar se o dia da semana está dentro do período da turma
      const hoje = new Date();
      const diferencaDias = diaSemana - hoje.getDay();
      const dataVerificar = new Date(hoje);
      dataVerificar.setDate(hoje.getDate() + diferencaDias);
      
      return dataVerificar >= inicio && dataVerificar <= fim;
    });
  };

  const handleAdicionarAluno = () => {
    if (!turmaSelecionada) return;
    
    const token = `TOKEN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTokenMatricula(token);
    
    const turma = turmas.find(t => t.id === turmaSelecionada);
    const curso = cursos.find(c => c.id === turma?.cursoId);
    
    // ✅ Calcular valor total baseado APENAS nos produtos/extras SELECIONADOS
    // 🔧 REGRA: Valor total = APENAS produtos + extras - desconto (SEM valor da turma)
    
    // Somar valores dos produtos selecionados
    const valorProdutosSelecionados = novoAluno.produtosVinculados.reduce((total, produtoId) => {
      const produto = produtosExtras.find(p => p.id === produtoId);
      return total + (produto?.valor || 0);
    }, 0);
    
    // Somar valores dos extras selecionados
    const valorExtrasSelecionados = novoAluno.extrasVinculados.reduce((total, extraId) => {
      const extra = produtosExtras.find(e => e.id === extraId);
      return total + (extra?.valor || 0);
    }, 0);
    
    // Calcular valor total final (SEM somar valor da turma)
    const valorTotalCalculado = valorProdutosSelecionados + valorExtrasSelecionados - (novoAluno.desconto || 0);
    
    // Combinar produtos e extras selecionados
    const todosProdutosSelecionados = [...novoAluno.produtosVinculados, ...novoAluno.extrasVinculados];
    
    const alunoCompleto: Omit<Aluno, 'id' | 'codigoSistema'> = {
      ...novoAluno,
      turmaId: turmaSelecionada,
      email: novoAluno.email || `${novoAluno.cpf.replace(/\D/g, '')}@smcorp.com`,
      valorTotal: valorTotalCalculado,
      statusLink: 'Agendado',
      statusPagamento: false,
      statusDocumentos: false,
      documentos: [],
      statusProva: { ativo: false },
      produtosExtras: todosProdutosSelecionados // ✅ Apenas produtos selecionados!
    };
    
    adicionarAluno(alunoCompleto);
    setMostrarQRCode(true);
    setNovoAluno({
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      tipoPessoa: 'PF',
      clientePJId: '',
      desconto: 0,
      dataInicioAluno: '',
      dataFimAluno: '',
      produtosVinculados: [],
      extrasVinculados: []
    });
  };

  // Função para toggle de visibilidade do curso no calendário
  const toggleCursoVisibilidade = (turmaId: string) => {
    setCursosVisiveis(prevCursosVisiveis => {
      const novoSet = new Set(prevCursosVisiveis);
      if (novoSet.has(turmaId)) {
        novoSet.delete(turmaId);
      } else {
        novoSet.add(turmaId);
      }
      return novoSet;
    });
  };

  // Função para toggle de expansão do card de turma
  const toggleCursoExpansao = (turmaId: string) => {
    setCursosExpandidos(prevCursosExpandidos => {
      const novoSet = new Set(prevCursosExpandidos);
      if (novoSet.has(turmaId)) {
        novoSet.delete(turmaId);
      } else {
        novoSet.add(turmaId);
      }
      return novoSet;
    });
  };

  // Função para buscar aluno existente por CPF ou código
  const buscarAlunoExistente = (termoBusca: string) => {
    if (!termoBusca) {
      setAlunoEncontrado(null);
      return;
    }

    const alunoEncontrado = alunos.find(a => 
      String(a.cpf || '').replace(/\D/g, '') === termoBusca.replace(/\D/g, '') ||
      a.codigoSistema.toUpperCase() === termoBusca.toUpperCase()
    );

    if (alunoEncontrado) {
      setAlunoEncontrado(alunoEncontrado);
      setNovoAluno({
        nome: alunoEncontrado.nome,
        cpf: alunoEncontrado.cpf,
        telefone: alunoEncontrado.telefone,
        email: alunoEncontrado.email,
        tipoPessoa: 'PF',
        clientePJId: '',
        desconto: 0,
        dataInicioAluno: '',
        dataFimAluno: '',
        produtosVinculados: [],
        extrasVinculados: []
      });
    } else {
      setAlunoEncontrado(null);
    }
  };

  // Função para toggle de produtos vinculados
  const toggleProdutoVinculado = (produtoId: string) => {
    const produtos = novoAluno.produtosVinculados.includes(produtoId)
      ? novoAluno.produtosVinculados.filter(id => id !== produtoId)
      : [...novoAluno.produtosVinculados, produtoId];
    
    setNovoAluno({ ...novoAluno, produtosVinculados: produtos });
  };

  // Função para toggle de extras vinculados
  const toggleExtraVinculado = (extraId: string) => {
    const extras = novoAluno.extrasVinculados.includes(extraId)
      ? novoAluno.extrasVinculados.filter(id => id !== extraId)
      : [...novoAluno.extrasVinculados, extraId];
    
    setNovoAluno({ ...novoAluno, extrasVinculados: extras });
  };

  // Efeito para remover turmas deletadas da lista de visíveis (mas NÃO adiciona automaticamente novas turmas)
  useEffect(() => {
    const turmasIds = new Set(turmas.map(t => t.id));
    setCursosVisiveis(prevCursosVisiveis => {
      const novoSet = new Set(prevCursosVisiveis);
      // Remover apenas turmas que não existem mais
      Array.from(novoSet).forEach(id => {
        if (!turmasIds.has(id)) {
          novoSet.delete(id);
        }
      });
      return novoSet;
    });
  }, [turmas]);

  // Função para obter a segunda-feira da semana
  const getSegundaDaSemana = (offsetSemanas: number = 0) => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diferencaParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana; // Se domingo, volta 6 dias
    
    const segundaFeira = new Date(hoje);
    segundaFeira.setDate(hoje.getDate() + diferencaParaSegunda + (offsetSemanas * 7));
    segundaFeira.setHours(0, 0, 0, 0);
    
    return segundaFeira;
  };

  // Função para obter a data de um dia específico da semana
  const getDataDoDia = (offsetDia: number) => {
    const segundaFeira = getSegundaDaSemana(semanaAtual);
    const dataDia = new Date(segundaFeira);
    dataDia.setDate(segundaFeira.getDate() + offsetDia);
    return dataDia;
  };

  // Função para salvar edição de turma
  const handleSalvarEdicaoTurma = () => {
    if (turmaEditando) {
      atualizarTurma(turmaEditando, dadosEdicaoTurma);
      setEditarTurmaDialog(false);
      setTurmaEditando(null);
    }
  };

  // Scroll automático para o aluno selecionado
  useEffect(() => {
    if (alunoSelecionadoId) {
      const elemento = document.getElementById(`aluno-card-${alunoSelecionadoId}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Limpar seleção após 3 segundos
        setTimeout(() => setAlunoSelecionadoId(null), 3000);
      }
    }
  }, [alunoSelecionadoId]);

  // Função para buscar aluno globalmente
  const buscarAluno = () => {
    if (!buscaAlunoGlobal.trim()) {
      toast.error('Digite o nome, CPF ou código do aluno');
      return;
    }

    const termoBusca = buscaAlunoGlobal.toLowerCase().trim();
    
    // Buscar aluno em todas as turmas
    const alunoEncontrado = alunos.find(aluno => {
      const nome = aluno.nome.toLowerCase();
      const cpf = String(aluno.cpf || '').toLowerCase();
      const codigo = aluno.codigoSistema.toLowerCase();
      
      return nome.includes(termoBusca) || 
             cpf.includes(termoBusca) || 
             codigo.includes(termoBusca);
    });

    if (!alunoEncontrado) {
      toast.error('Aluno não encontrado');
      return;
    }

    // Verificar se aluno está em fila de espera ou substituído
    if (alunoEncontrado.filaEspera) {
      toast.warning(`${alunoEncontrado.nome} está na fila de espera`);
    } else if (alunoEncontrado.substituido) {
      toast.warning(`${alunoEncontrado.nome} foi substituído`);
    }

    // Abrir a turma do aluno
    const turma = turmas.find(t => t.id === alunoEncontrado.turmaId);
    if (!turma) {
      toast.error('Turma do aluno não encontrada');
      return;
    }

    // Adicionar turma aos cursos visíveis
    setCursosVisiveis(prev => new Set(prev).add(turma.id));
    
    // Selecionar a turma
    setTurmaSelecionada(turma.id);
    setDiaSelecionado(null);
    
    // Marcar aluno para scroll
    setTimeout(() => {
      setAlunoSelecionadoId(alunoEncontrado.id);
    }, 500);

    const curso = cursos.find(c => c.id === turma.cursoId);
    toast.success(`✅ ${alunoEncontrado.nome} encontrado na turma ${turma.codigo} - ${curso?.nome}`);
    
    // Limpar busca
    setBuscaAlunoGlobal('');
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-900">Módulo 03: Dashboard Operacional</h1>
          <p className="text-gray-600 mt-1 text-xs">Gestão de Alunos - O coração do sistema</p>
        </div>

        {/* Ferramenta de Desenvolvimento - REMOVER EM PRODUÇÃO */}
        <div className="mb-4">
          <LimparDados />
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Coluna de Busca de Cursos Ativos (Lado Esquerdo) - OCULTA quando turma selecionada */}
          {!turmaSelecionada && (
            <div className="col-span-2">
              <Card className="sticky top-8">
                <CardHeader className="bg-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Cursos Ativos</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Abrir Turma
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Abrir Nova Turma</DialogTitle>
                          <DialogDescription>
                            Crie uma nova turma selecionando o curso e configurando os detalhes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="curso">Curso</Label>
                            <Select value={novaTurma.cursoId} onValueChange={handleCursoChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o curso" />
                              </SelectTrigger>
                              <SelectContent>
                                {cursos.map((curso) => (
                                  <SelectItem key={curso.id} value={curso.id}>
                                    {curso.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="dataInicio">Data de Início</Label>
                            <Input
                              id="dataInicio"
                              type="date"
                              value={novaTurma.dataInicio}
                              onChange={(e) => handleDataInicioChange(e.target.value)}
                            />
                            {novaTurma.dataFim && (
                              <p className="text-sm text-gray-600 mt-1">
                                Término automático: {novaTurma.dataFim.split('-').reverse().join('/')}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="sala">Sala/Campo</Label>
                            <Select value={novaTurma.salaId} onValueChange={(value) => setNovaTurma({ ...novaTurma, salaId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a sala" />
                              </SelectTrigger>
                              <SelectContent>
                                {salas.map((sala) => (
                                  <SelectItem key={sala.id} value={sala.id}>
                                    {sala.nome} - {sala.localizacao} (Cap: {sala.capacidadeMaxima})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="clientePJ">Cliente PJ (Opcional)</Label>
                            <Select value={novaTurma.clientePJId || 'sem-vinculo'} onValueChange={(value) => setNovaTurma({ ...novaTurma, clientePJId: value === 'sem-vinculo' ? '' : value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Turma aberta (sem vínculo PJ)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sem-vinculo">Turma aberta (sem vínculo PJ)</SelectItem>
                                {clientesPJ.map((cliente) => (
                                  <SelectItem key={cliente.id} value={cliente.id}>
                                    {cliente.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button onClick={handleAdicionarTurma} className="w-full">Abrir Turma</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Campo de Busca */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Buscar curso, sala ou período..."
                        value={buscaCurso}
                        onChange={(e) => setBuscaCurso(e.target.value)}
                        className="pl-10 pr-4 py-2 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      👆 Clique em um curso para exibi-lo no calendário
                    </p>
                  </div>

                  {/* Campo de Busca de Aluno */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                      🔍 Buscar Aluno
                    </Label>
                    <div className="relative">
                      <UserSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Nome, CPF ou código..."
                        value={buscaAlunoGlobal}
                        onChange={(e) => setBuscaAlunoGlobal(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            buscarAluno();
                          }
                        }}
                        className="pl-10 pr-4 py-2 text-sm border-blue-300 focus:border-blue-500"
                      />
                    </div>
                    <Button
                      onClick={buscarAluno}
                      size="sm"
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Buscar e Abrir Card
                    </Button>
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      ⚡ Encontra o aluno e abre o card automaticamente
                    </p>
                  </div>

                  <div className="space-y-3">
                    {turmas
                      .filter(turma => {
                        const curso = cursos.find(c => c.id === turma.cursoId);
                        const sala = salas.find(s => s.id === turma.salaId);
                        
                        // Remove turmas com cursos excluídos da coluna "Cursos Ativos"
                        if (!curso || !sala) return false;
                        
                        // Aplicar filtro de busca
                        if (buscaCurso) {
                          const termoBusca = buscaCurso.toLowerCase();
                          const nomeCurso = curso.nome.toLowerCase();
                          const nomeSala = sala.nome.toLowerCase();
                          const periodo = `${turma.dataInicio.split('-').reverse().join('/')} - ${turma.dataFim.split('-').reverse().join('/')}`.toLowerCase();
                          
                          return nomeCurso.includes(termoBusca) || 
                                 nomeSala.includes(termoBusca) || 
                                 periodo.includes(termoBusca);
                        }
                        
                        return true;
                      })
                      .map(turma => {
                        const curso = cursos.find(c => c.id === turma.cursoId);
                        const sala = salas.find(s => s.id === turma.salaId);
                        const alunosDaTurma = alunos.filter(a => a.turmaId === turma.id && !a.substituido);
                        
                        // Debug: log alunos da turma
                        if (turma.codigo === '#0001') {
                          console.log(`🔍 [M03 DEBUG] Turma ${turma.codigo}:`, alunosDaTurma.length, 'alunos');
                          console.log(`🔍 [M03 DEBUG] Alunos:`, alunosDaTurma.map(a => `${a.codigoSistema} - ${a.nome}`));
                        }
                        
                        // Sala é obrigatória, curso também (já filtrado acima)
                        if (!sala || !curso) return null;
                        
                        const nomeCurso = curso.nome;

                        const isExpandido = cursosExpandidos.has(turma.id);

                        return (
                          <Card 
                            key={turma.id}
                            className={`transition-all ${
                              cursosVisiveis.has(turma.id)
                                ? 'border-green-500 shadow-md bg-green-50' 
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                {/* Header do Card - Sempre Visível */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="default" className="bg-blue-600 text-white font-mono text-xs">
                                        {turma.codigo}
                                      </Badge>
                                      <span className="font-semibold text-sm line-clamp-1">{turma.nomePersonalizado || nomeCurso}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Botão de Visibilidade */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`h-6 w-6 p-0 ${
                                        cursosVisiveis.has(turma.id) 
                                          ? 'hover:bg-green-200 text-green-600' 
                                          : 'hover:bg-gray-200 text-gray-400'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCursoVisibilidade(turma.id);
                                      }}
                                      title={cursosVisiveis.has(turma.id) ? 'Ocultar no calendário' : 'Mostrar no calendário'}
                                    >
                                      {cursosVisiveis.has(turma.id) ? (
                                        <Eye className="w-4 h-4" />
                                      ) : (
                                        <EyeOff className="w-4 h-4" />
                                      )}
                                    </Button>
                                    {/* Botão Expandir/Minimizar */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-gray-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCursoExpansao(turma.id);
                                      }}
                                    >
                                      {isExpandido ? (
                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Período - Sempre Visível */}
                                <div className="text-xs text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Período:</span>
                                    <span className="font-medium">
                                      {turma.dataInicio.split('-').reverse().join('/').substring(0, 5)} - {turma.dataFim.split('-').reverse().join('/').substring(0, 5)}
                                    </span>
                                  </div>
                                </div>

                                {/* Informações Expandidas - Condicional */}
                                {isExpandido && (
                                  <>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      <div className="flex justify-between">
                                        <span>Sala:</span>
                                        <span className="font-medium">{sala.nome}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Horário:</span>
                                        <span className="font-medium">{curso?.horarioInicio} - {curso?.horarioFim}</span>
                                      </div>
                                    </div>

                                    {/* Badges e Botões */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Botão Editar Turma */}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 hover:bg-blue-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTurmaEditando(turma.id);
                                          setDadosEdicaoTurma({
                                            nomePersonalizado: turma.nomePersonalizado || '',
                                            dataInicio: turma.dataInicio,
                                            dataFim: turma.dataFim,
                                            salaId: turma.salaId,
                                            statusTurma: turma.statusTurma,
                                            preco: turma.preco
                                          });
                                          setEditarTurmaDialog(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3 text-blue-600" />
                                      </Button>
                                      
                                      {cursosVisiveis.has(turma.id) && (
                                        <Badge variant="default" className="text-xs bg-green-600">
                                          Visível
                                        </Badge>
                                      )}
                                      <Badge variant="secondary" className="text-xs">
                                        {alunosDaTurma.length}/{sala.capacidadeMaxima}
                                      </Badge>
                                    </div>

                                    {/* Mini indicador de status dos alunos */}
                                    {alunosDaTurma.length > 0 && (
                                      <div className="flex gap-1 mt-2">
                                        {alunosDaTurma.map((aluno, index) => {
                                          const corStatus = 
                                            aluno.statusLink === 'Agendado' ? 'bg-yellow-400' :
                                            aluno.statusLink === 'Confirmado' ? 'bg-blue-400' :
                                            'bg-green-400';
                                      
                                          return (
                                            <div key={index} className={`w-2 h-2 rounded-full ${corStatus}`} title={aluno.nome}></div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline Semanal (Lado Direito) */}
          <div className={turmaSelecionada ? "col-span-12" : "col-span-10"}>
            {/* Botões de navegação de semana - OCULTAR quando turma selecionada */}
            {!turmaSelecionada && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Button size="sm" variant="outline" onClick={() => setSemanaAtual(semanaAtual - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                    Semana Anterior
                  </Button>
                  <div className="text-sm text-gray-600">
                    👉 Role horizontalmente para ver Sábado e Domingo
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSemanaAtual(semanaAtual + 1)}>
                    Próxima Semana
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="overflow-x-auto pb-4">
                  <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4">
                    {[0, 1, 2, 3, 4, 5, 6].map((offsetDia) => {
                      const dataDia = getDataDoDia(offsetDia);
                      const diaSemana = dataDia.getDay();
                      
                      // Filtrar turmas que acontecem neste dia específico OU que têm prova marcada
                      const turmasDoDia = turmas.filter(turma => {
                        // Primeiro verificar se a turma está marcada como visível
                        if (!cursosVisiveis.has(turma.id)) {
                          return false;
                        }
                        
                        const inicio = criarDataLocal(turma.dataInicio);
                        const fim = criarDataLocal(turma.dataFim);
                        inicio.setHours(0, 0, 0, 0);
                        fim.setHours(23, 59, 59, 999);
                        
                        // Verificar se dataDia está dentro do período da turma
                        const dentroDoPerio = dataDia >= inicio && dataDia <= fim;
                        
                        return dentroDoPerio;
                      });

                      // Verificar se há provas agendadas para este dia
                      const provasDoDia = turmas.filter(turma => {
                        if (!cursosVisiveis.has(turma.id)) {
                          return false;
                        }
                        
                        const alunosDaTurma = alunos.filter(a => a.turmaId === turma.id && !a.substituido);
                        return alunosDaTurma.some(aluno => {
                          if (aluno.statusProva.ativo && aluno.statusProva.data) {
                            const dataProva = criarDataLocal(aluno.statusProva.data);
                            const diaComp = new Date(dataDia);
                            dataProva.setHours(0, 0, 0, 0);
                            diaComp.setHours(0, 0, 0, 0);
                            return dataProva.getTime() === diaComp.getTime();
                          }
                          return false;
                        });
                      });
                      
                      const nomeDia = getDiaSemana(diaSemana);
                      const dataFormatada = dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      const ehHoje = dataDia.toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={offsetDia} className="space-y-3">
                          {/* Header do Dia com Data */}
                          <div className={`p-3 rounded-lg text-center ${ehHoje ? 'bg-red-700' : 'bg-red-600'} text-white`}>
                            <div className="font-semibold text-sm">{nomeDia}</div>
                            <div className={`text-xs mt-1 ${ehHoje ? 'font-bold' : 'opacity-90'}`}>{dataFormatada}</div>
                          </div>

                          {/* Turmas do Dia */}
                          <div className="space-y-3 min-h-[100px]">
                            {/* Cards de Turmas Regulares */}
                            {turmasDoDia.length > 0 && turmasDoDia.map(turma => {
                              const curso = cursos.find(c => c.id === turma.cursoId);
                              const sala = salas.find(s => s.id === turma.salaId);
                              const alunosDaTurma = alunos.filter(a => a.turmaId === turma.id && !a.substituido);
                              
                              // Debug cards da agenda
                              if (turma.codigo === '#0001') {
                                console.log(`📅 [M03 AGENDA] Card Turma ${turma.codigo}:`, alunosDaTurma.length, 'alunos');
                              }

                              if (!curso || !sala) return null;

                              return (
                                <div
                                  key={`turma-${turma.id}`}
                                  className={`p-2 rounded-lg cursor-pointer transition-all border-2 ${
                                    turmaSelecionada === turma.id 
                                      ? 'border-red-500 bg-red-50 shadow-md' 
                                      : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:shadow-sm'
                                  }`}
                                  onClick={() => {
                                    setTurmaSelecionada(turma.id);
                                    setDiaSelecionado(dataDia);
                                  }}
                                >
                                  {/* Linha 1: Código + Nome */}
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <Badge variant="default" className="bg-blue-600 text-white font-mono text-[10px] px-1 py-0 h-4 leading-tight shrink-0">
                                      {turma.codigo}
                                    </Badge>
                                    <span className="text-xs font-semibold text-blue-900 leading-tight line-clamp-1 flex-1">
                                      {turma.nomePersonalizado || curso.nome}
                                    </span>
                                  </div>
                                  
                                  {/* Linha 2: Horário + Sala */}
                                  <div className="text-[10px] text-gray-700 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">🕐</span>
                                      <span className="font-medium">{curso.horarioInicio}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">📍</span>
                                      <span className="font-medium truncate">{sala.nome}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Linha 3: Indicador de Alunos */}
                                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-200">
                                    <div className="flex gap-0.5">
                                      {alunosDaTurma.slice(0, 8).map((aluno, index) => {
                                        const corStatus = 
                                          aluno.statusLink === 'Agendado' ? 'bg-yellow-400' :
                                          aluno.statusLink === 'Confirmado' ? 'bg-blue-400' :
                                          'bg-green-400';
                                        return (
                                          <div key={index} className={`w-1.5 h-1.5 rounded-full ${corStatus}`} title={aluno.nome}></div>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-700">
                                      {alunosDaTurma.length}/{sala.capacidadeMaxima}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Cards de Provas */}
                            {provasDoDia.length > 0 && provasDoDia.map(turma => {
                              const curso = cursos.find(c => c.id === turma.cursoId);
                              const alunosDaTurma = alunos.filter(a => a.turmaId === turma.id && !a.substituido);
                              const alunosComProva = alunosDaTurma.filter(aluno => {
                                if (aluno.statusProva.ativo && aluno.statusProva.data) {
                                  const dataProva = criarDataLocal(aluno.statusProva.data);
                                  dataProva.setHours(0, 0, 0, 0);
                                  const diaComp = new Date(dataDia);
                                  diaComp.setHours(0, 0, 0, 0);
                                  return dataProva.getTime() === diaComp.getTime();
                                }
                                return false;
                              });

                              if (!curso || alunosComProva.length === 0) return null;

                              const primeiraProva = alunosComProva[0];
                              const horarioProva = primeiraProva.statusProva.hora || '09:00';

                              return (
                                <Card 
                                  key={`prova-${turma.id}`} 
                                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                                    turmaSelecionada === turma.id 
                                      ? 'border-cyan-600 border-2 bg-cyan-50' 
                                      : 'border-cyan-400 hover:border-cyan-600 bg-cyan-50'
                                  }`}
                                  onClick={() => {
                                    setTurmaSelecionada(turma.id);
                                    setDiaSelecionado(dataDia);
                                  }}
                                >
                                  <CardHeader className="p-3 bg-cyan-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col gap-1">
                                        <Badge variant="default" className="bg-cyan-600 text-white font-mono text-xs w-fit">
                                          {turma.codigo}
                                        </Badge>
                                        <CardTitle className="text-sm font-semibold text-cyan-700">
                                          Prova {turma.nomePersonalizado || curso.nome}
                                        </CardTitle>
                                      </div>
                                      <Badge className="bg-cyan-600 text-white text-xs">
                                        PROVA
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                                      <Users className="w-3 h-3" />
                                      <span>{alunosComProva.length} {alunosComProva.length === 1 ? 'aluno' : 'alunos'}</span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-2">
                                    <div className="text-xs text-gray-700 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span>Horário:</span>
                                        <span className="font-medium">{horarioProva}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}

                            {turmasDoDia.length === 0 && provasDoDia.length === 0 && (
                              <div className="text-center text-sm text-gray-400 py-8">
                                Nenhuma turma
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Lista de Alunos da Turma Selecionada */}
            {turmaSelecionada && (() => {
              const alunosDaTurma = alunos.filter(a => a.turmaId === turmaSelecionada && !a.substituido && !a.filaEspera);
              const alunosFilaEspera = alunos.filter(a => a.turmaId === turmaSelecionada && a.filaEspera === true);
              const alunosSubstituidos = alunos.filter(a => a.turmaId === turmaSelecionada && a.substituido === true);
              
              // Debug painel de alunos
              const turmaInfo = turmas.find(t => t.id === turmaSelecionada);
              if (turmaInfo?.codigo === '#0001') {
                console.log(`👥 [M03 PAINEL] Turma ${turmaInfo.codigo}:`, alunosDaTurma.length, 'alunos');
                console.log(`👥 [M03 PAINEL] Alunos:`, alunosDaTurma.map(a => `${a.codigoSistema} - ${a.nome}`));
              }
              
              // Verificar se diaSelecionado tem provas
              let alunosParaExibir = alunosDaTurma;
              let ehVisualizacaoDeProva = false;
              
              if (diaSelecionado) {
                const alunosComProva = alunosDaTurma.filter(aluno => {
                  if (aluno.statusProva.ativo && aluno.statusProva.data) {
                    const dataProva = criarDataLocal(aluno.statusProva.data);
                    dataProva.setHours(0, 0, 0, 0);
                    const diaComp = new Date(diaSelecionado);
                    diaComp.setHours(0, 0, 0, 0);
                    return dataProva.getTime() === diaComp.getTime();
                  }
                  return false;
                });
                
                if (alunosComProva.length > 0) {
                  alunosParaExibir = alunosComProva;
                  ehVisualizacaoDeProva = true;
                }
              }
              
              const turmaAtual = turmas.find(t => t.id === turmaSelecionada);
              const cursoAtual = cursos.find(c => c.id === turmaAtual?.cursoId);
              
              return (
              <div className="mt-8">
                <Card>
                  <CardHeader className={`bg-gradient-to-r ${ehVisualizacaoDeProva ? 'from-orange-600 to-orange-700' : 'from-red-600 to-red-700'} text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle>
                            {turmaAtual?.nomePersonalizado || cursoAtual?.nome}
                          </CardTitle>
                          {turmaAtual?.nomePersonalizado && (
                            <Badge className="bg-white text-red-600">
                              {cursoAtual?.nome}
                            </Badge>
                          )}
                          {ehVisualizacaoDeProva && (
                            <Badge className="bg-white text-orange-700">
                              DIA DE PROVA - {diaSelecionado?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm opacity-90 mt-1 space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              {ehVisualizacaoDeProva 
                                ? `${alunosParaExibir.length} ${alunosParaExibir.length === 1 ? 'aluno' : 'alunos'} com prova agendada`
                                : `Alunos matriculados: ${alunosDaTurma.length}`
                              }
                            </div>
                            
                            {/* Contagem PJ e PF - Apenas na vista normal */}
                            {!ehVisualizacaoDeProva && (
                              <>
                                <div className="h-4 w-px bg-white/30"></div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-white/20 border-white/40 text-white text-xs font-semibold">
                                    🏢 PJ: {alunosDaTurma.filter(a => a.tipoPessoa === 'PJ').length}
                                  </Badge>
                                  <Badge variant="outline" className="bg-white/20 border-white/40 text-white text-xs font-semibold">
                                    👤 PF: {alunosDaTurma.filter(a => a.tipoPessoa !== 'PJ').length}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white text-xs"
                                    onClick={() => setDialogRelatorioAberto(true)}
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Relatório
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Resumo de Status - Apenas na vista normal (não em visualização de prova) */}
                          {!ehVisualizacaoDeProva && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* Total */}
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-semibold">
                                Total: {alunosDaTurma.length}
                              </Badge>
                              
                              {/* Agendados */}
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs font-semibold">
                                🟡 Agendado: {alunosDaTurma.filter(a => a.statusLink === 'Agendado').length}
                              </Badge>
                              
                              {/* Confirmar */}
                              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs font-semibold">
                                🟠 Confirmar: {alunosDaTurma.filter(a => a.statusLink === 'Confirmar').length}
                              </Badge>
                              
                              {/* Confirmados */}
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs font-semibold">
                                🔵 Confirmado: {alunosDaTurma.filter(a => a.statusLink === 'Confirmado').length}
                              </Badge>
                              
                              {/* Presente */}
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs font-semibold">
                                🟢 Presente: {alunosDaTurma.filter(a => a.statusLink === 'Presente').length}
                              </Badge>
                            </div>
                          )}
                          
                          {!ehVisualizacaoDeProva && alunosFilaEspera.length > 0 && (
                            <div className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Fila de espera: {alunosFilaEspera.length} {alunosFilaEspera.length === 1 ? 'aluno' : 'alunos'}
                            </div>
                          )}
                          {!ehVisualizacaoDeProva && alunosSubstituidos.length > 0 && (
                            <div className="text-xs opacity-70">
                              Substituídos: {alunosSubstituidos.length} {alunosSubstituidos.length === 1 ? 'aluno' : 'alunos'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle Visualização Semanal */}
                        <Button 
                          variant={visualizacaoSemanal ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setVisualizacaoSemanal(!visualizacaoSemanal)}
                        >
                          {visualizacaoSemanal ? '📅 Vista Semanal' : '📋 Vista Lista'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setTurmaSelecionada(null);
                            setDiaSelecionado(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Fechar
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary">
                              <Plus className="w-4 h-4 mr-2" />
                              Nova Matrícula
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nova Matrícula</DialogTitle>
                              <DialogDescription>
                                {mostrarQRCode ? 'Compartilhe o QR Code com o aluno para completar a matrícula.' : 'Preencha os dados básicos do aluno para gerar o token de matrícula.'}
                              </DialogDescription>
                            </DialogHeader>
                            {mostrarQRCode ? (
                              <div className="space-y-4 text-center">
                                <div className="p-6 bg-gray-50 rounded-lg">
                                  <QRCodeSVG
                                    value={`https://smcorp.com/matricula/${tokenMatricula}`}
                                    size={200}
                                    className="mx-auto"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <p className="font-semibold">Token de Matrícula Gerado!</p>
                                  <p className="text-sm text-gray-600">
                                    Compartilhe este QR Code ou link com o aluno para que ele complete seu cadastro e envie os documentos.
                                  </p>
                                  <div className="p-3 bg-gray-100 rounded text-xs break-all">
                                    {`https://smcorp.com/matricula/${tokenMatricula}`}
                                  </div>
                                </div>
                                <Button onClick={() => setMostrarQRCode(false)} className="w-full">
                                  Fechar
                                </Button>
                              </div>
                            ) : (
                              <FormularioMatricula
                                mostrarQRCode={mostrarQRCode}
                                tokenMatricula={tokenMatricula}
                                novoAluno={novoAluno}
                                buscaAluno={buscaAluno}
                                alunoEncontrado={alunoEncontrado}
                                clientesPJ={clientesPJ}
                                produtosExtras={produtosExtras}
                                cursoAtual={cursoAtual}
                                turmaAtual={turmaAtual}
                                setNovoAluno={setNovoAluno}
                                setBuscaAluno={setBuscaAluno}
                                buscarAlunoExistente={buscarAlunoExistente}
                                toggleProdutoVinculado={toggleProdutoVinculado}
                                toggleExtraVinculado={toggleExtraVinculado}
                                handleAdicionarAluno={handleAdicionarAluno}
                                setMostrarQRCode={setMostrarQRCode}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline"
                          onClick={() => setDialogFilaEsperaAberto(true)}
                          className="border-orange-300 hover:bg-orange-50"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Adicionar à Fila de Espera
                        </Button>

                        <Button 
                          variant="outline"
                          onClick={() => setDialogListaPresencaAberto(true)}
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Lista de Presença
                        </Button>

                        {/* 🆕 Botão para Adicionar Instrutor */}
                        <Button 
                          variant="outline"
                          onClick={() => setDialogAdicionarInstrutorAberto(true)}
                          className="border-purple-300 hover:bg-purple-50"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Adicionar Instrutor
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Painel Lateral de Alunos */}
                      {visualizacaoSemanal && !ehVisualizacaoDeProva && alunosDaTurma.length > 0 && (
                        <div className="w-64 flex-shrink-0">
                          <Card className="sticky top-4">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Alunos da Turma</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                                {alunosDaTurma.map(aluno => (
                                  <button
                                    key={aluno.id}
                                    onClick={() => setAlunoSelecionadoId(aluno.id)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                      alunoSelecionadoId === aluno.id 
                                        ? 'bg-red-600 text-white' 
                                        : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="font-medium truncate">{aluno.nome}</div>
                                    <div className="text-xs opacity-75">{aluno.codigoSistema}</div>
                                  </button>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Conteúdo Principal */}
                      <div className="flex-1 min-w-0">
                        {/* Visualização Semanal de Alunos */}
                        {visualizacaoSemanal && !ehVisualizacaoDeProva && turmaAtual && cursoAtual && (
                          <div className="mb-6">
                            <div className="mb-3 text-sm text-gray-600 text-center">
                              👉 Role horizontalmente para ver todos os dias da semana
                            </div>
                            <div className="overflow-x-auto pb-4">
                          <div className="grid grid-flow-col auto-cols-[minmax(340px,1fr)] gap-4">
                            {[0, 1, 2, 3, 4, 5, 6].map((offsetDia) => {
                              const dataDia = getDataDoDia(offsetDia);
                              const diaSemana = dataDia.getDay();
                              const nomeDia = getDiaSemana(diaSemana); // Nome completo
                              const dataFormatada = dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                              const ehHoje = dataDia.toDateString() === new Date().toDateString();

                              // Verificar se este dia tem aula (dentro do período e respeitando fim de semana)
                              const inicio = criarDataLocal(turmaAtual.dataInicio);
                              const fim = criarDataLocal(turmaAtual.dataFim);
                              inicio.setHours(0, 0, 0, 0);
                              fim.setHours(23, 59, 59, 999);
                              const dentroDoPerio = dataDia >= inicio && dataDia <= fim;
                              const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
                              const temAula = dentroDoPerio && (!ehFimDeSemana || cursoAtual.usaFimDeSemana);

                              // Calcular número de alunos neste dia
                              const alunosNesteDiaCount = temAula ? alunosDaTurma.filter(aluno => {
                                if (aluno.dataInicioAluno && aluno.dataFimAluno) {
                                  const inicioAluno = criarDataLocal(aluno.dataInicioAluno);
                                  const fimAluno = criarDataLocal(aluno.dataFimAluno);
                                  inicioAluno.setHours(0, 0, 0, 0);
                                  fimAluno.setHours(23, 59, 59, 999);
                                  return dataDia >= inicioAluno && dataDia <= fimAluno;
                                }
                                return true;
                              }).length : 0;

                              return (
                                <div key={offsetDia} className="space-y-2">
                                  {/* Header do Dia */}
                                  <div className={`p-3 rounded-lg text-center ${
                                    !temAula ? 'bg-gray-200 text-gray-500' :
                                    ehHoje ? 'bg-red-700 text-white font-bold' : 
                                    'bg-red-600 text-white'
                                  }`}>
                                    <div className="text-sm font-bold">{nomeDia}</div>
                                    <div className="text-base font-semibold mt-1">{dataFormatada}</div>
                                    {temAula && (
                                      <div className="text-xs mt-1 opacity-90">
                                        {alunosNesteDiaCount} {alunosNesteDiaCount === 1 ? 'aluno' : 'alunos'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Alunos do Dia */}
                                  <div className="space-y-2 min-h-[50px]">
                                    {temAula ? (() => {
                                      // Filtrar alunos que estão ativos neste dia específico
                                      const alunosNesteDia = alunosDaTurma.filter(aluno => {
                                        // Se o aluno tem data personalizada, usar ela
                                        if (aluno.dataInicioAluno && aluno.dataFimAluno) {
                                          const inicioAluno = criarDataLocal(aluno.dataInicioAluno);
                                          const fimAluno = criarDataLocal(aluno.dataFimAluno);
                                          inicioAluno.setHours(0, 0, 0, 0);
                                          fimAluno.setHours(23, 59, 59, 999);
                                          return dataDia >= inicioAluno && dataDia <= fimAluno;
                                        }
                                        // Senão, usar as datas da turma
                                        return true;
                                      });

                                      // Formatar data para YYYY-MM-DD
                                      const dataFormatadaISO = `${dataDia.getFullYear()}-${String(dataDia.getMonth() + 1).padStart(2, '0')}-${String(dataDia.getDate()).padStart(2, '0')}`;

                                      return (
                                        <>
                                          {/* Cards dos Alunos */}
                                          {alunosNesteDia.length > 0 ? (
                                            alunosNesteDia.map(aluno => {
                                              const turmaDoAluno = turmas.find(t => t.id === aluno.turmaId);
                                              const cursoDoAluno = turmaDoAluno ? cursos.find(c => c.id === turmaDoAluno.cursoId) : undefined;
                                              return (
                                                <CardAluno 
                                                  key={aluno.id} 
                                                  aluno={aluno}
                                                  turma={turmaDoAluno}
                                                  curso={cursoDoAluno}
                                                  compacto={true}
                                                  destacado={alunoSelecionadoId === aluno.id}
                                                  dataAtual={dataFormatadaISO}
                                                />
                                              );
                                            })
                                          ) : (
                                            <div className="text-center text-xs text-gray-400 py-4">
                                              Sem alunos
                                            </div>
                                          )}

                                          {/* 🆕 Cards dos Instrutores */}
                                          {turmaAtual.instrutores && turmaAtual.instrutores.length > 0 && (
                                            <>
                                              <div className="border-t border-gray-200 my-3"></div>
                                              <div className="space-y-2">
                                                {turmaAtual.instrutores.map(instrutorTurma => {
                                                  const instrutor = instrutores.find(i => i.id === instrutorTurma.instrutorId);
                                                  if (!instrutor) return null;
                                                  return (
                                                    <CardInstrutorTurma
                                                      key={instrutor.id}
                                                      instrutor={instrutor}
                                                      presencas={instrutorTurma.presencas}
                                                      dataAtual={dataFormatadaISO}
                                                      temProvasAgendadas={provasAgendadas.some(p => p.instrutorId === instrutor.id && p.turmaId === turmaAtual.id)}
                                                      onConfirmarPresenca={() => confirmarPresencaInstrutor(turmaAtual.id, instrutor.id, dataFormatadaISO, usuarioAtual.id)}
                                                      onExcluir={() => desvincularInstrutorTurma(turmaAtual.id, instrutor.id)}
                                                      onAbrirProvas={() => {
                                                        setInstrutorProva({ instrutorId: instrutor.id, turmaId: turmaAtual.id });
                                                        setDialogProvaAberto(true);
                                                      }}
                                                    />
                                                  );
                                                })}
                                              </div>
                                            </>
                                          )}
                                        </>
                                      );
                                    })() : (
                                      <div className="text-center text-xs text-gray-400 py-4">
                                        Sem aula
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                        {/* Visualização em Lista (Original) */}
                        {!visualizacaoSemanal && (() => {
                          return (
                            <div className="space-y-4">
                              {/* Seção de Alunos */}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                  Alunos da Turma
                                </h3>
                                <div className="grid grid-cols-5 gap-3">
                                  {alunosParaExibir.map(aluno => {
                                    const turmaDoAluno = turmas.find(t => t.id === aluno.turmaId);
                                    const cursoDoAluno = turmaDoAluno ? cursos.find(c => c.id === turmaDoAluno.cursoId) : undefined;
                                    return (
                                      <CardAluno 
                                        key={aluno.id} 
                                        aluno={aluno}
                                        turma={turmaDoAluno}
                                        curso={cursoDoAluno}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 🆕 Seção de Instrutores */}
                              {turmaAtual && turmaAtual.instrutores && turmaAtual.instrutores.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                    Instrutores da Turma
                                  </h3>
                                  <div className="grid grid-cols-3 gap-3">
                                    {turmaAtual.instrutores.map(instrutorTurma => {
                                      const instrutor = instrutores.find(i => i.id === instrutorTurma.instrutorId);
                                      if (!instrutor) return null;
                                      return (
                                        <CardInstrutorTurma
                                          key={instrutor.id}
                                          instrutor={instrutor}
                                          presencas={instrutorTurma.presencas}
                                          temProvasAgendadas={provasAgendadas.some(p => p.instrutorId === instrutor.id && p.turmaId === turmaAtual.id)}
                                          onConfirmarPresenca={() => confirmarPresencaInstrutor(turmaAtual.id, instrutor.id, new Date().toISOString().split('T')[0], usuarioAtual.id)}
                                          onExcluir={() => desvincularInstrutorTurma(turmaAtual.id, instrutor.id)}
                                          onAbrirProvas={() => {
                                            setInstrutorProva({ instrutorId: instrutor.id, turmaId: turmaAtual.id });
                                            setDialogProvaAberto(true);
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Dialog de Editar Turma */}
      <Dialog open={editarTurmaDialog} onOpenChange={setEditarTurmaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Turma</DialogTitle>
              <DialogDescription>
                Atualize as informações da turma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomePersonalizado">Nome Personalizado (Opcional)</Label>
                <Input
                  id="nomePersonalizado"
                  value={dadosEdicaoTurma.nomePersonalizado}
                  onChange={(e) => setDadosEdicaoTurma({ ...dadosEdicaoTurma, nomePersonalizado: e.target.value })}
                  placeholder="Ex: Turma Premium"
                />
              </div>

              <div>
                <Label htmlFor="editDataInicio">Data de Início</Label>
                <Input
                  id="editDataInicio"
                  type="date"
                  value={dadosEdicaoTurma.dataInicio}
                  onChange={(e) => setDadosEdicaoTurma({ ...dadosEdicaoTurma, dataInicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editDataFim">Data de Término</Label>
                <Input
                  id="editDataFim"
                  type="date"
                  value={dadosEdicaoTurma.dataFim}
                  onChange={(e) => setDadosEdicaoTurma({ ...dadosEdicaoTurma, dataFim: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editSala">Sala</Label>
                <Select 
                  value={dadosEdicaoTurma.salaId} 
                  onValueChange={(value) => setDadosEdicaoTurma({ ...dadosEdicaoTurma, salaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salas.map((sala) => (
                      <SelectItem key={sala.id} value={sala.id}>
                        {sala.nome} - {sala.localizacao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editStatus">Status da Turma</Label>
                <Select 
                  value={dadosEdicaoTurma.statusTurma} 
                  onValueChange={(value) => setDadosEdicaoTurma({ ...dadosEdicaoTurma, statusTurma: value as 'Planejada' | 'Confirmada' | 'Em Andamento' | 'Concluída' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejada">Planejada</SelectItem>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSalvarEdicaoTurma} className="w-full">Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Dialog de Adicionar à Fila de Espera */}
        {turmaSelecionada && (() => {
          const turma = turmas.find(t => t.id === turmaSelecionada);
          const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
          const nomeTurma = turma ? (turma.nomePersonalizado || curso?.nome || 'Turma') : 'Turma';
          
          return (
            <DialogAdicionarFilaEspera
              open={dialogFilaEsperaAberto}
              onOpenChange={setDialogFilaEsperaAberto}
              onAdicionar={(dadosAluno) => {
                if (!turma || !curso) return;
                
                // 🔧 Produtos vinculados ao curso (obrigatórios)
                const produtosVinculados: string[] = [];
                if (curso.produtosVinculados) {
                  produtosVinculados.push(...curso.produtosVinculados);
                }
                
                // Adicionar aluno com flag de fila de espera
                const novoAluno = {
                  turmaId: turmaSelecionada,
                  ...dadosAluno,
                  valorTotal: turma.preco,
                  desconto: 0,
                  statusLink: 'Agendado' as const,
                  statusPagamento: false,
                  statusDocumentos: false,
                  pagamentos: {
                    historico: [],
                    valorPago: 0,
                    pendente: false
                  },
                  documentos: [],
                  dataInicioAluno: turma.dataInicio,
                  dataFimAluno: turma.dataFim,
                  statusProva: {
                    ativo: false
                  },
                  produtosExtras: produtosVinculados, // ✅ Produtos do curso!
                  filaEspera: true, // Marca como fila de espera
                  observacoes: `⏳ Adicionado à fila de espera em ${new Date().toLocaleDateString('pt-BR')}`
                };
                
                adicionarAluno(novoAluno);
                toast.success(`✅ ${dadosAluno.nome} adicionado à fila de espera!`);
              }}
              nomeTurma={nomeTurma}
            />
          );
        })()}

        {/* Dialog de Lista de Presença */}
        {turmaSelecionada && (() => {
          const turma = turmas.find(t => t.id === turmaSelecionada);
          const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
          const sala = turma ? salas.find(s => s.id === turma.salaId) : null;
          const alunosDaTurma = alunos.filter(a => a.turmaId === turmaSelecionada);
          
          if (!turma || !curso || !sala) return null;
          
          return (
            <DialogListaPresenca
              open={dialogListaPresencaAberto}
              onOpenChange={setDialogListaPresencaAberto}
              turma={turma}
              curso={curso}
              sala={sala}
              alunos={alunosDaTurma}
              instrutor={null}
            />
          );
        })()}

        {/* Dialog de Relatório da Turma */}
        {turmaSelecionada && (() => {
          const turma = turmas.find(t => t.id === turmaSelecionada);
          const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
          const sala = turma ? salas.find(s => s.id === turma.salaId) : null;
          const clientePJ = turma?.clientePJId ? clientesPJ.find(c => c.id === turma.clientePJId) : null;
          const alunosDaTurma = alunos.filter(a => a.turmaId === turmaSelecionada && !a.filaEspera && !a.substituido);
          
          if (!turma || !curso || !sala) return null;
          
          return (
            <DialogRelatorioTurma
              open={dialogRelatorioAberto}
              onOpenChange={setDialogRelatorioAberto}
              turma={turma}
              curso={curso}
              sala={sala}
              instrutor={null}
              alunos={alunosDaTurma}
              clientePJ={clientePJ}
            />
          );
        })()}

        {/* 🆕 Dialog de Adicionar Instrutor */}
        {turmaSelecionada && (() => {
          const turma = turmas.find(t => t.id === turmaSelecionada);
          const instrutoresJaVinculados = turma?.instrutores?.map(i => i.instrutorId) || [];

          return (
            <DialogAdicionarInstrutor
              open={dialogAdicionarInstrutorAberto}
              onOpenChange={setDialogAdicionarInstrutorAberto}
              instrutores={instrutores}
              instrutoresJaVinculados={instrutoresJaVinculados}
              onConfirmar={(instrutorId) => vincularInstrutorTurma(turmaSelecionada, instrutorId)}
            />
          );
        })()}

      {/* Dialog Ver Provas do Instrutor */}
      {instrutorProva && (() => {
        const temProvas = provasAgendadas.some(
          p => p.instrutorId === instrutorProva.instrutorId && p.turmaId === instrutorProva.turmaId
        );
        
        // Se tem provas, mostra o dialog de listagem
        if (temProvas) {
          return (
            <DialogProvasInstrutor
              open={dialogProvaAberto}
              onOpenChange={setDialogProvaAberto}
              instrutorId={instrutorProva.instrutorId}
              turmaId={instrutorProva.turmaId}
            />
          );
        }
        
        // Se não tem provas, abre direto o dialog de agendar
        return (
          <DialogAgendarProva
            open={dialogProvaAberto}
            onOpenChange={setDialogProvaAberto}
            modo="selecionar-alunos"
            instrutorId={instrutorProva.instrutorId}
            turmaId={instrutorProva.turmaId}
          />
        );
      })()}
    </div>
  );
};