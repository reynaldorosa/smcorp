import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Building2, DollarSign, Pencil, Filter, Upload, FileSpreadsheet, Clock, UserCheck, X, Trash2 } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { usePersistedState } from '@/app/hooks/usePersistedState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { DialogUploadPlanilha } from '@/app/components/DialogUploadPlanilha';
import { DialogAdicionarFilaEspera } from '@/app/components/DialogAdicionarFilaEspera';
import { Checkbox } from '@/app/components/ui/checkbox';
import * as XLSX from 'xlsx';

export const Modulo02: React.FC = () => {
  const { cursos, turmas, salas, clientesPJ, produtosExtras, adicionarTurma, atualizarTurma, excluirTurma, alunos, adicionarAluno } = useSMCorp();

  // 💾 Estado persistido - mantém filtro mesmo ao trocar de módulo
  const [filtroStatus, setFiltroStatus] = usePersistedState<'ativos' | 'excluidos' | 'todos'>('modulo02-filtroStatus', 'ativos');
  const [dialogFilaEsperaAberto, setDialogFilaEsperaAberto] = useState(false);
  const [turmaParaFila, setTurmaParaFila] = useState<{ id: string; nome: string } | null>(null);

  const [novaTurma, setNovaTurma] = useState({
    cursoId: '',
    dataInicio: '',
    dataFim: '',
    salaId: ''
  });

  const [turmaEditando, setTurmaEditando] = useState<string | null>(null);
  const [nomePersonalizado, setNomePersonalizado] = useState('');
  const [dialogEdicaoAberto, setDialogEdicaoAberto] = useState(false);
  const [dialogUploadAberto, setDialogUploadAberto] = useState(false);
  const [turmaParaUpload, setTurmaParaUpload] = useState<{ id: string; nome: string } | null>(null);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState(false);
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [turmaParaEditar, setTurmaParaEditar] = useState({
    cursoId: '',
    dataInicio: '',
    dataFim: '',
    salaId: '',
    clientePJId: '',
    nomePersonalizado: ''
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
      salaId: ''
    });
    toast.success('Turma adicionada com sucesso!');
  };

  const handleAtualizarTurma = () => {
    if (turmaEditando) {
      atualizarTurma(turmaEditando, { nomePersonalizado });
      setTurmaEditando(null);
      setNomePersonalizado('');
      toast.success('Nome da turma atualizado com sucesso!');
    }
  };

  const abrirEdicaoCompleta = (turma: any) => {
    const curso = cursos.find(c => c.id === turma.cursoId);
    setTurmaEditando(turma.id);
    setTurmaParaEditar({
      cursoId: turma.cursoId,
      dataInicio: turma.dataInicio,
      dataFim: turma.dataFim,
      salaId: turma.salaId,
      clientePJId: turma.clientePJId || '',
      nomePersonalizado: turma.nomePersonalizado || ''
    });
    setDialogEdicaoAberto(true);
  };

  const handleDataInicioEdicaoChange = (data: string) => {
    const dataFim = calcularDataFim(data, turmaParaEditar.cursoId);
    setTurmaParaEditar({ ...turmaParaEditar, dataInicio: data, dataFim });
  };

  const handleCursoEdicaoChange = (cursoId: string) => {
    const dataFim = calcularDataFim(turmaParaEditar.dataInicio, cursoId);
    setTurmaParaEditar({ ...turmaParaEditar, cursoId, dataFim });
  };

  const salvarEdicaoCompleta = () => {
    if (turmaEditando) {
      atualizarTurma(turmaEditando, {
        cursoId: turmaParaEditar.cursoId,
        dataInicio: turmaParaEditar.dataInicio,
        dataFim: turmaParaEditar.dataFim,
        salaId: turmaParaEditar.salaId,
        clientePJId: turmaParaEditar.clientePJId,
        nomePersonalizado: turmaParaEditar.nomePersonalizado
      });
      setDialogEdicaoAberto(false);
      setTurmaEditando(null);
      setTurmaParaEditar({
        cursoId: '',
        dataInicio: '',
        dataFim: '',
        salaId: '',
        clientePJId: '',
        nomePersonalizado: ''
      });
      toast.success('Turma atualizada com sucesso!');
    }
  };

  const baixarModeloPlanilha = () => {
    const modelo = [
      {
        'Nome': 'João da Silva',
        'CPF': '123.456.789-00',
        'RG': '12.345.678-9',
        'Data de Nascimento': '01/01/1990',
        'Email': 'joao@example.com',
        'Telefone': '(11) 98765-4321',
        'Endereço': 'Rua Exemplo, 123',
        'Observações': 'Aluno exemplo'
      },
      {
        'Nome': 'Maria Santos',
        'CPF': '987.654.321-00',
        'RG': '98.765.432-1',
        'Data de Nascimento': '15/05/1995',
        'Email': 'maria@example.com',
        'Telefone': '(11) 91234-5678',
        'Endereço': 'Av. Teste, 456',
        'Observações': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
    XLSX.writeFile(wb, 'modelo_planilha_alunos.xlsx');
    toast.success('Modelo de planilha baixado com sucesso!');
  };

  const handleConfirmarExclusao = () => {
    if (turmaParaExcluir) {
      excluirTurma(turmaParaExcluir.id);
      setDialogExclusaoAberto(false);
      setTurmaParaExcluir(null);
    }
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-900">Módulo 02: Abertura e Instância de Turmas</h1>
          <p className="text-gray-600 mt-1 text-xs">Onde o curso planejado se torna um evento real</p>
        </div>

        <div className="flex justify-end mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abrir Nova Turma</DialogTitle>
                <DialogDescription>Insira os detalhes para abrir uma nova turma.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="curso">Curso</Label>
                  <Select value={novaTurma.cursoId} onValueChange={handleCursoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.filter(c => !c.excluido).map((curso) => (
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

                <Button onClick={handleAdicionarTurma} className="w-full">Abrir Turma</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filtroStatus === 'ativos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('ativos')}
              className={filtroStatus === 'ativos' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              ✓ Cursos Ativos
            </Button>
            <Button
              variant={filtroStatus === 'excluidos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('excluidos')}
              className={filtroStatus === 'excluidos' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              📦 Histórico (Excluídos)
            </Button>
            <Button
              variant={filtroStatus === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus('todos')}
              className={filtroStatus === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              📋 Todos
            </Button>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {turmas.filter(t => {
              const curso = cursos.find(c => c.id === t.cursoId);
              const cursoExcluido = !curso;
              if (filtroStatus === 'ativos' && cursoExcluido) return false;
              if (filtroStatus === 'excluidos' && !cursoExcluido) return false;
              return true;
            }).length} {turmas.filter(t => {
              const curso = cursos.find(c => c.id === t.cursoId);
              const cursoExcluido = !curso;
              if (filtroStatus === 'ativos' && cursoExcluido) return false;
              if (filtroStatus === 'excluidos' && !cursoExcluido) return false;
              return true;
            }).length === 1 ? 'turma' : 'turmas'}
          </Badge>
        </div>

        {/* Lista de Turmas */}
        <div className="grid grid-cols-1 gap-6">
          {turmas.map((turma) => {
            const curso = cursos.find(c => c.id === turma.cursoId);
            const sala = salas.find(s => s.id === turma.salaId);
            const clientePJ = turma.clientePJId ? clientesPJ.find(c => c.id === turma.clientePJId) : null;

            // Se sala não existir, não exibe a turma
            if (!sala) return null;
            
            // Se curso foi excluído, mostra como "Curso Excluído"
            const nomeCurso = curso ? curso.nome : 'Curso Excluído';
            const cursoExcluido = !curso;

            // Filtrar turmas
            if (filtroStatus === 'ativos' && cursoExcluido) return null;
            if (filtroStatus === 'excluidos' && !cursoExcluido) return null;

            // Calcular faturamento da turma (excluir alunos substituídos e fila de espera)
            const alunosDaTurma = alunos.filter(a => a.turmaId === turma.id && !a.substituido && !a.filaEspera);
            const alunosFilaEspera = alunos.filter(a => a.turmaId === turma.id && a.filaEspera === true);
            const alunosSubstituidos = alunos.filter(a => a.turmaId === turma.id && a.substituido === true);
            const faturamentoTotal = alunosDaTurma.reduce((acc, aluno) => acc + aluno.valorTotal, 0);
            const faturamentoRecebido = alunosDaTurma.filter(a => a.statusPagamento).reduce((acc, aluno) => acc + aluno.valorTotal, 0);
            const faturamentoPendente = faturamentoTotal - faturamentoRecebido;
            const totalAlunos = alunosDaTurma.length;
            const totalFilaEspera = alunosFilaEspera.length;
            const totalSubstituidos = alunosSubstituidos.length;
            const alunosPagos = alunosDaTurma.filter(a => a.statusPagamento).length;
            const percentualRecebido = faturamentoTotal > 0 ? (faturamentoRecebido / faturamentoTotal) * 100 : 0;

            return (
              <Card key={turma.id} className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="bg-blue-600 text-white font-mono">
                          {turma.codigo}
                        </Badge>
                        <CardTitle className="text-xl text-blue-600">
                          {turma.nomePersonalizado || nomeCurso}
                        </CardTitle>
                        {turma.nomePersonalizado && (
                          <Badge variant="outline" className="text-xs">
                            {nomeCurso}
                          </Badge>
                        )}
                        {cursoExcluido && (
                          <Badge variant="destructive" className="text-xs">
                            Histórico
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {turma.dataInicio.split('-').reverse().join('/')} - {turma.dataFim.split('-').reverse().join('/')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => abrirEdicaoCompleta(turma)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar Turma
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setTurmaEditando(turma.id);
                              setNomePersonalizado(turma.nomePersonalizado || '');
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar Nome
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Nome da Turma</DialogTitle>
                            <DialogDescription>
                              Adicione um nome personalizado para identificar esta turma.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cursoOriginal">Curso Base</Label>
                              <Input
                                id="cursoOriginal"
                                value={curso ? curso.nome : 'Curso Excluído'}
                                disabled
                                className="bg-gray-100"
                              />
                            </div>
                            <div>
                              <Label htmlFor="nomePersonalizado">Nome Personalizado da Turma</Label>
                              <Input
                                id="nomePersonalizado"
                                value={nomePersonalizado}
                                onChange={(e) => setNomePersonalizado(e.target.value)}
                                placeholder="Ex: Turma Manhã, Turma A, Turma Janeiro..."
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Deixe em branco para usar o nome do curso
                              </p>
                            </div>
                            <Button 
                              onClick={handleAtualizarTurma} 
                              className="w-full"
                            >
                              Salvar Alterações
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setTurmaParaExcluir({ 
                            id: turma.id, 
                            nome: turma.nomePersonalizado || nomeCurso 
                          });
                          setDialogExclusaoAberto(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                      {clientePJ && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                          Turma PJ: {clientePJ.nome}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Cronograma
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Carga Horária:</span>
                          <span className="font-medium">{curso ? curso.cargaHorariaTotal : 'N/A'}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Horas/Dia:</span>
                          <span className="font-medium">{curso ? curso.horasAulaPorDia : 'N/A'}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Horário:</span>
                          <span className="font-medium">{curso ? `${curso.horarioInicio} - ${curso.horarioFim}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Alocação de Recurso
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sala:</span>
                          <span className="font-medium">{sala.nome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Localização:</span>
                          <span className="font-medium">{sala.localizacao}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacidade:</span>
                          <span className="font-medium">{sala.capacidadeMaxima} alunos</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-600" />
                        Precificação
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">{clientePJ ? 'PJ Negociado' : 'Turma Aberta'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor Base:</span>
                          <span className="font-medium text-blue-600">R$ {(turma.preco || 0).toFixed(2)}</span>
                        </div>
                        
                        {/* Produtos Vinculados */}
                        {curso && curso.produtosVinculados && curso.produtosVinculados.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Produtos Inclusos:</div>
                            {curso.produtosVinculados.map((produtoId) => {
                              const produto = produtosExtras.find(p => p.id === produtoId);
                              if (!produto) return null;
                              return (
                                <div key={produto.id} className="flex justify-between text-xs">
                                  <span className="text-gray-600">• {produto.nome}</span>
                                  <span className="text-gray-500">+R$ {produto.valor.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Extras Vinculados */}
                        {curso && curso.extrasVinculados && curso.extrasVinculados.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Extras Disponíveis:</div>
                            {curso.extrasVinculados.map((extraId) => {
                              const extra = produtosExtras.find(p => p.id === extraId);
                              if (!extra) return null;
                              return (
                                <div key={extra.id} className="flex justify-between text-xs">
                                  <span className="text-gray-600">• {extra.nome}</span>
                                  <span className="text-gray-500">R$ {extra.valor.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seção de Faturamento - Nova */}
                  {totalAlunos > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-4">
                          <Building2 className="w-4 h-4 text-green-600" />
                          Faturamento da Turma
                        </h4>
                        
                        <div className="grid grid-cols-4 gap-4">
                          {/* Previsão Total */}
                          <div className="bg-white rounded p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">💰 Previsão Total</div>
                            <div className="text-lg font-bold text-blue-600">
                              R$ {faturamentoTotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'}
                            </div>
                          </div>

                          {/* Já Recebido */}
                          <div className="bg-white rounded p-3 border border-green-300">
                            <div className="text-xs text-green-700 mb-1">✅ Já Recebido</div>
                            <div className="text-lg font-bold text-green-600">
                              R$ {faturamentoRecebido.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {alunosPagos} {alunosPagos === 1 ? 'aluno' : 'alunos'} pagos
                            </div>
                          </div>

                          {/* Falta Receber */}
                          <div className="bg-white rounded p-3 border border-orange-300">
                            <div className="text-xs text-orange-700 mb-1">⏳ Falta Receber</div>
                            <div className="text-lg font-bold text-orange-600">
                              R$ {faturamentoPendente.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {totalAlunos - alunosPagos} {totalAlunos - alunosPagos === 1 ? 'aluno' : 'alunos'} pendentes
                            </div>
                          </div>

                          {/* Percentual */}
                          <div className="bg-white rounded p-3 border border-purple-300">
                            <div className="text-xs text-purple-700 mb-1">📊 Taxa de Recebimento</div>
                            <div className="text-lg font-bold text-purple-600">
                              {percentualRecebido.toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" 
                                style={{ width: `${percentualRecebido}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Seção de Fila de Espera e Substituídos */}
                  {(totalFilaEspera > 0 || totalSubstituidos > 0) && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {/* Fila de Espera */}
                      {totalFilaEspera > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-semibold text-orange-900">Fila de Espera</span>
                            </div>
                            <Badge className="bg-orange-600">
                              {totalFilaEspera} {totalFilaEspera === 1 ? 'aluno' : 'alunos'}
                            </Badge>
                          </div>
                          <p className="text-xs text-orange-700 mt-1">
                            Aguardando vaga para substituição
                          </p>
                        </div>
                      )}
                      
                      {/* Substituídos */}
                      {totalSubstituidos > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-semibold text-gray-900">Alunos Substituídos</span>
                            </div>
                            <Badge variant="outline" className="bg-gray-100">
                              {totalSubstituidos} {totalSubstituidos === 1 ? 'aluno' : 'alunos'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-700 mt-1">
                            Histórico de substituições
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dialog de Edição Completa */}
        <Dialog open={dialogEdicaoAberto} onOpenChange={setDialogEdicaoAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Turma Completa</DialogTitle>
              <DialogDescription>
                Altere os dados da turma, incluindo data de início, sala e preço.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cursoEdicao">Curso</Label>
                <Select value={turmaParaEditar.cursoId} onValueChange={handleCursoEdicaoChange}>
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
                <Label htmlFor="nomePersonalizadoEdicao">Nome Personalizado da Turma</Label>
                <Input
                  id="nomePersonalizadoEdicao"
                  value={turmaParaEditar.nomePersonalizado}
                  onChange={(e) => setTurmaParaEditar({ ...turmaParaEditar, nomePersonalizado: e.target.value })}
                  placeholder="Ex: Turma Manhã, Turma A, Turma Janeiro..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para usar o nome do curso
                </p>
              </div>

              <div>
                <Label htmlFor="dataInicioEdicao">Data de Início</Label>
                <Input
                  id="dataInicioEdicao"
                  type="date"
                  value={turmaParaEditar.dataInicio}
                  onChange={(e) => handleDataInicioEdicaoChange(e.target.value)}
                />
                {turmaParaEditar.dataFim && (
                  <p className="text-sm text-gray-600 mt-1">
                    Término automático: {turmaParaEditar.dataFim.split('-').reverse().join('/')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="salaEdicao">Sala/Campo</Label>
                <Select value={turmaParaEditar.salaId} onValueChange={(value) => setTurmaParaEditar({ ...turmaParaEditar, salaId: value })}>
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
                <Label htmlFor="clientePJEdicao">Cliente PJ (Opcional)</Label>
                <Select 
                  value={turmaParaEditar.clientePJId || 'sem-vinculo'} 
                  onValueChange={(value) => setTurmaParaEditar({ ...turmaParaEditar, clientePJId: value === 'sem-vinculo' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Turma aberta (sem vínculo PJ)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-vinculo">Turma aberta</SelectItem>
                    {clientesPJ.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Upload de Planilha - Aparece quando empresa está selecionada */}
              {turmaParaEditar.clientePJId && turmaParaEditar.clientePJId !== 'sem-vinculo' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-green-900 mb-1">📊 Cadastro em Lote de Alunos</h4>
                      <p className="text-xs text-green-700 mb-3">
                        Esta turma está vinculada à empresa <strong>{clientesPJ.find(c => c.id === turmaParaEditar.clientePJId)?.nome}</strong>. 
                        Baixe o modelo da planilha, preencha os dados dos alunos e faça o upload.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={baixarModeloPlanilha}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Baixar Modelo
                        </Button>
                        <Button
                          onClick={() => {
                            // Salvar a turma antes de abrir o upload
                            const turmaId = turmaEditando!;
                            const curso = cursos.find(c => c.id === turmaParaEditar.cursoId);
                            const nomeTurma = turmaParaEditar.nomePersonalizado || curso?.nome || 'Turma';
                            
                            setTurmaParaUpload({ id: turmaId, nome: nomeTurma });
                            salvarEdicaoCompleta();
                            setTimeout(() => setDialogUploadAberto(true), 300);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-green-300 hover:bg-green-100"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload de Planilha
                        </Button>
                        <Button
                          onClick={() => {
                            const turmaId = turmaEditando!;
                            const curso = cursos.find(c => c.id === turmaParaEditar.cursoId);
                            const nomeTurma = turmaParaEditar.nomePersonalizado || curso?.nome || 'Turma';
                            
                            setTurmaParaFila({ id: turmaId, nome: nomeTurma });
                            salvarEdicaoCompleta();
                            setTimeout(() => setDialogFilaEsperaAberto(true), 300);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-orange-300 hover:bg-orange-50"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Adicionar à Fila
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={salvarEdicaoCompleta} className="w-full">
                Salvar Todas Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Upload de Planilha */}
        {turmaParaUpload && (
          <DialogUploadPlanilha 
            open={dialogUploadAberto} 
            onOpenChange={setDialogUploadAberto}
            turmaId={turmaParaUpload.id}
            turmaNome={turmaParaUpload.nome}
          />
        )}
        
        {/* Dialog de Adicionar à Fila de Espera */}
        {turmaParaFila && (
          <DialogAdicionarFilaEspera
            open={dialogFilaEsperaAberto}
            onOpenChange={setDialogFilaEsperaAberto}
            onAdicionar={(dadosAluno) => {
              const turma = turmas.find(t => t.id === turmaParaFila.id);
              if (!turma) return;
              
              const curso = cursos.find(c => c.id === turma.cursoId);
              if (!curso) return;
              
              // 🔧 Produtos vinculados ao curso (obrigatórios)
              const produtosVinculados: string[] = [];
              if (curso.produtosVinculados) {
                produtosVinculados.push(...curso.produtosVinculados);
              }
              
              // Adicionar aluno com flag de fila de espera
              const novoAluno = {
                turmaId: turmaParaFila.id,
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
            nomeTurma={turmaParaFila.nome}
          />
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={dialogExclusaoAberto} onOpenChange={setDialogExclusaoAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão de Turma</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a turma <strong>{turmaParaExcluir?.nome}</strong>?
                <br /><br />
                ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os alunos vinculados a esta turma também serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTurmaParaExcluir(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmarExclusao}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, Excluir Turma
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};