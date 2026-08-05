import React, { useState, useMemo } from 'react';
import { Building2, LogOut, Upload, Users, BookOpen, Calendar, Lock, Eye, EyeOff, CheckCircle, AlertCircle, FileSpreadsheet, UserPlus, Download, Send } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { usePersistedState } from '@/app/hooks/usePersistedState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { DialogUploadPlanilha } from '@/app/components/DialogUploadPlanilha';
import { DialogAdicionarAlunoIndividual } from '@/app/components/DialogAdicionarAlunoIndividual';
import { DialogAprovarAlunosImportados } from '@/app/components/DialogAprovarAlunosImportados';
import type { ClientePJ } from '@/app/contexts/SMCorpContext';

// Função helper para converter data YYYY-MM-DD para DD/MM/YYYY
const formatarDataBR = (data: string): string => {
  if (!data) return '';
  const partes = data.split('-');
  if (partes.length !== 3) return data;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

export const Modulo05: React.FC = () => {
  const { clientesPJ, turmas, cursos, alunos, adicionarAluno, produtosExtras } = useSMCorp();
  
  // Estados de autenticação
  const [empresaLogada, setEmpresaLogada] = useState<ClientePJ | null>(null);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativaLogin, setTentativaLogin] = useState(false);

  // Estados para importação de alunos
  const [dialogUploadAberto, setDialogUploadAberto] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  
  // 💾 Estado persistido - mantém aba ativa ao trocar de módulo
  const [abaAtiva, setAbaAtiva] = usePersistedState<string>('modulo05-abaAtiva', 'importar');

  // Estados para os novos diálogos
  const [dialogAdicionarAberto, setDialogAdicionarAberto] = useState(false);
  const [dialogImportarTurmaAberto, setDialogImportarTurmaAberto] = useState(false);
  const [turmaAcaoAtual, setTurmaAcaoAtual] = useState<string>('');

  // Estados para aprovação de alunos importados
  const [dialogAprovarAberto, setDialogAprovarAberto] = useState(false);
  const [alunosParaAprovar, setAlunosParaAprovar] = useState<any[]>([]);
  const [nomeTurmaAprovacao, setNomeTurmaAprovacao] = useState('');

  // Função de login
  const handleLogin = () => {
    setTentativaLogin(true);
    
    const empresa = clientesPJ.find(
      (c) => c.login === login && c.senha === senha && c.acessoAtivo
    );

    if (empresa) {
      setEmpresaLogada(empresa);
      toast.success(`✅ Bem-vindo(a), ${empresa.nome}!`);
      setLogin('');
      setSenha('');
    } else {
      toast.error('❌ Login ou senha incorretos, ou acesso não ativo.');
    }
    
    setTentativaLogin(false);
  };

  // Função de logout
  const handleLogout = () => {
    setEmpresaLogada(null);
    setLogin('');
    setSenha('');
    toast.info('Você saiu da área do cliente.');
  };

  // Processar dados da planilha
  const handleProcessarPlanilha = (dados: any[], turmaIdEspecifica?: string) => {
    // Usar turmaIdEspecifica se fornecida, caso contrário usar turmaSelecionada
    const turmaId = turmaIdEspecifica || turmaSelecionada;
    
    if (!turmaId) {
      toast.error('Por favor, selecione uma turma antes de importar os alunos.');
      return;
    }

    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) {
      toast.error('Turma não encontrada.');
      return;
    }

    const curso = cursos.find(c => c.id === turma.cursoId);
    if (!curso) {
      toast.error('Curso não encontrado.');
      return;
    }

    const alunosValidados: any[] = [];
    let erros = 0;

    dados.forEach((linha) => {
      try {
        // Validar campos obrigatórios
        if (!linha.nome || !linha.cpf || !linha.telefone || !linha.email) {
          erros++;
          return;
        }

        // Verificar se já existe aluno com mesmo CPF na turma
        const alunoExistente = alunos.find(
          a => a.cpf === linha.cpf && a.turmaId === turmaId
        );

        if (alunoExistente) {
          erros++;
          return;
        }

        // Buscar precificação da empresa para o curso
        let precificacao = null;
        
        if (empresaLogada) {
          precificacao = empresaLogada.precificacoes.find(
            p => p.cursoId === curso.id && p.ativo
          );
        }

        // USAR PRODUTOS DA PRECIFICAÇÃO DA EMPRESA, NÃO DO CURSO
        const produtosInclusosEmpresa = precificacao?.produtosInclusos || [];
        
        // LÓGICA DE PRODUTOS AUTOMÁTICOS:
        // - Se houver EXATAMENTE 1 produto obrigatório → adicionar automaticamente
        // - Caso contrário (0 ou mais de 1) → todos serão selecionados na aprovação
        const produtosExtrasIds: string[] = [];
        let valorTotal = 0;
        
        if (produtosInclusosEmpresa.length === 1) {
          // APENAS 1 produto obrigatório → adicionar automaticamente
          produtosExtrasIds.push(...produtosInclusosEmpresa);
          
          // Calcular valor do produto (soma de todos produtos inclusos = só 1 neste caso)
          const produtoAutomatico = produtosExtras.find(p => p.id === produtosInclusosEmpresa[0]);
          if (produtoAutomatico) {
            valorTotal = produtoAutomatico.valor;
          }
        }
        // Se 0 ou mais de 1 produto obrigatório → nada é adicionado automaticamente, valor será calculado na aprovação

        // Preparar dados do aluno para aprovação
        const dadosAluno = {
          turmaId: turmaId,
          nome: linha.nome,
          cpf: linha.cpf,
          rg: linha.rg || '',
          dataNascimento: linha.dataNascimento || '',
          telefone: linha.telefone,
          email: linha.email,
          endereco: linha.endereco || '',
          valorTotal: valorTotal,
          desconto: 0,
          statusLink: 'Confirmado' as const,
          foto: linha.foto || undefined,
          statusPagamento: false,
          statusDocumentos: false,
          tipoPessoa: 'PJ' as const, // Aluno vinculado à empresa
          clientePJId: empresaLogada?.id, // ID da empresa logada
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
          produtosExtras: produtosExtrasIds, // Apenas produtos obrigatórios - extras serão adicionados na aprovação
          observacoes: `📤 Importado via planilha pela empresa ${empresaLogada?.nome || 'N/A'} (Link será enviado após aprovação)`
        };

        alunosValidados.push(dadosAluno);
        
        console.log(`✅ [VÍNCULO PJ] Aluno ${linha.nome} vinculado à empresa ${empresaLogada?.nome} (ID: ${empresaLogada?.id})`);
      } catch (error) {
        console.error('Erro ao processar linha:', error);
        erros++;
      }
    });

    if (erros > 0) {
      toast.error(`❌ ${erros} linha(s) com erro ou aluno(s) duplicado(s) foram ignoradas.`);
    }

    if (alunosValidados.length === 0) {
      toast.error('Nenhum aluno válido para importar.');
      setDialogUploadAberto(false);
      setDialogImportarTurmaAberto(false);
      return;
    }

    // Preparar nome da turma para aprovação
    const nomeTurma = `${turma.codigo} - ${turma.nomePersonalizado || curso.nome}`;

    console.log('🚀 [PROCESSAMENTO PLANILHA] Abrindo dialog de aprovação...');
    console.log('Alunos validados:', alunosValidados.length);
    console.log('Nome da turma:', nomeTurma);
    console.log('Primeiros 2 alunos:', alunosValidados.slice(0, 2));

    // Configurar fila de aprovação e abrir dialog
    setAlunosParaAprovar(alunosValidados);
    setNomeTurmaAprovacao(nomeTurma);
    setDialogUploadAberto(false);
    setDialogImportarTurmaAberto(false);
    
    console.log('Estados definidos. Abrindo dialog...');
    setDialogAprovarAberto(true);
    console.log('Dialog aberto:', true);

    toast.info(`📋 ${alunosValidados.length} aluno(s) aguardando aprovação. Revise cada um individualmente.`);
  };

  // Handler para aprovar aluno individual (callback do dialog)
  const handleAprovarAlunoIndividual = (dadosAluno: any) => {
    adicionarAluno(dadosAluno);
  };

  // Handler para finalizar processo de aprovação
  const handleFinalizarAprovacao = (aprovados: number, rejeitados: number) => {
    if (aprovados > 0) {
      toast.success(`✅ ${aprovados} aluno(s) aprovado(s) e matriculado(s) com sucesso! Links enviados.`);
    }
    if (rejeitados > 0) {
      toast.info(`ℹ️ ${rejeitados} aluno(s) rejeitado(s).`);
    }

    // Limpar estados
    setAlunosParaAprovar([]);
    setNomeTurmaAprovacao('');
    setTurmaSelecionada('');
    setTurmaAcaoAtual('');
  };

  // Dados filtrados por empresa logada
  const dadosEmpresa = useMemo(() => {
    if (!empresaLogada) return { turmas: [], alunosVinculados: [], totalAlunos: 0 };

    // Buscar turmas que usam cursos com precificação da empresa
    const cursosComPrecificacao = empresaLogada.precificacoes
      .filter(p => p.ativo)
      .map(p => p.cursoId);

    console.log('🔍 [MÓDULO 05 - FILTRO DEBUG]');
    console.log('Empresa logada:', empresaLogada.nome, `(${empresaLogada.codigo})`);
    console.log('Precificações ativas:', empresaLogada.precificacoes.filter(p => p.ativo));
    console.log('IDs dos cursos com precificação:', cursosComPrecificacao);
    console.log('Total de turmas no sistema:', turmas.length);

    const turmasFiltradas = turmas.filter(t => {
      // Garantir comparação correta de IDs (string vs string)
      const cursoIdTurma = String(t.cursoId);
      const incluido = cursosComPrecificacao.some(cursoId => String(cursoId) === cursoIdTurma);
      
      if (!incluido) {
        console.log(`❌ Turma ${t.codigo} (curso ${t.cursoId}) foi FILTRADA - não tem precificação`);
      } else {
        console.log(`✅ Turma ${t.codigo} (curso ${t.cursoId}) INCLUÍDA - tem precificação`);
      }
      
      return incluido;
    });

    console.log('Turmas disponíveis após filtro:', turmasFiltradas.length);
    console.log('---');

    // Buscar alunos vinculados a essas turmas que pertencem à empresa logada
    // FILTRO CORRETO: apenas alunos PJ com clientePJId da empresa
    const alunosVinculados = alunos.filter(a => {
      // 1. Não pode estar substituído
      if (a.substituido) return false;
      
      // 2. Precisa ser aluno PJ
      if (a.tipoPessoa !== 'PJ') return false;
      
      // 3. Precisa ter clientePJId igual ao ID da empresa logada
      if (a.clientePJId !== empresaLogada.id) return false;
      
      // 4. Precisa estar em uma das turmas filtradas
      const estaNaTurma = turmasFiltradas.some(t => t.id === a.turmaId);
      if (!estaNaTurma) return false;
      
      return true;
    });

    console.log(`🎯 [FILTRO ALUNOS] Total de alunos: ${alunos.length}`);
    console.log(`🎯 [FILTRO ALUNOS] Alunos da empresa ${empresaLogada.nome} (ID: ${empresaLogada.id}): ${alunosVinculados.length}`);
    console.log(`🎯 [FILTRO ALUNOS] Códigos dos alunos filtrados:`, alunosVinculados.map(a => a.codigoSistema).join(', '));

    return {
      turmas: turmasFiltradas,
      alunosVinculados,
      totalAlunos: alunosVinculados.length
    };
  }, [empresaLogada, turmas, alunos]);

  // Template de planilha para download
  const gerarTemplatePlanilha = () => {
    if (!turmaSelecionada) {
      toast.error('⚠️ Selecione uma turma antes de baixar o template.');
      return;
    }

    const turma = turmas.find(t => t.id === turmaSelecionada);
    if (!turma) {
      toast.error('Turma não encontrada.');
      return;
    }

    const curso = cursos.find(c => c.id === turma.cursoId);
    if (!curso) {
      toast.error('Curso não encontrado.');
      return;
    }

    // Campos básicos obrigatórios (SEM PRODUTOS - serão selecionados na aprovação)
    const cabecalho = ['nome', 'cpf', 'rg', 'dataNascimento', 'telefone', 'email', 'endereco'];

    // Linha informativa do curso/turma
    const infoTurma = [
      `PLANILHA DE IMPORTACAO - ${turma.codigo} - ${curso.nome}`,
      `Empresa: ${empresaLogada?.nome || 'N/A'}`,
      `Periodo: ${formatarDataBR(turma.dataInicio)} a ${formatarDataBR(turma.dataFim)}`,
      `Horario: ${turma.horario}`,
      'APAGUE ESTA LINHA',
      'ANTES DE IMPORTAR',
      'ANTES DE IMPORTAR'
    ];

    // Linha de instruções de formato
    const instrucoes = [
      '>>> FORMATO DOS DADOS <<<',
      '000.000.000-00',
      '00.000.000-0',
      'DD/MM/AAAA',
      '(00) 00000-0000',
      'exemplo@empresa.com.br',
      'Rua Nome 000 - Cidade UF'
    ];

    // Exemplos de dados
    const exemplo1 = [
      'EXEMPLO COLABORADOR 1',
      '000.000.000-00',
      '00.000.000-0',
      '01/01/1990',
      '(11) 00000-0000',
      'colaborador1@empresa.com.br',
      'Rua Exemplo 100 - Cidade SP'
    ];

    const exemplo2 = [
      'EXEMPLO COLABORADOR 2',
      '111.111.111-11',
      '11.111.111-1',
      '15/03/1985',
      '(11) 11111-1111',
      'colaborador2@empresa.com.br',
      'Avenida Teste 200 - Cidade SP'
    ];

    const template = [
      infoTurma,
      cabecalho,
      instrucoes,
      exemplo1,
      exemplo2
    ];

    // Gerar CSV
    const csv = template.map(row => row.join(';')).join('\n');
    const bom = '\uFEFF'; // BOM para UTF-8
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_alunos_${turma.codigo}_${curso.nome.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    
    toast.success(`📥 Template baixado! Os produtos extras serão selecionados durante a aprovação dos alunos.`);
  };

  // Handler para adicionar aluno individual
  const handleAdicionarAlunoIndividual = (dadosAluno: any) => {
    if (!turmaAcaoAtual || !empresaLogada) return;

    const turma = turmas.find(t => t.id === turmaAcaoAtual);
    if (!turma) {
      toast.error('Turma não encontrada.');
      return;
    }

    const curso = cursos.find(c => c.id === turma.cursoId);
    if (!curso) {
      toast.error('Curso não encontrado.');
      return;
    }

    // Buscar precificação da empresa
    const precificacao = empresaLogada.precificacoes.find(
      p => p.cursoId === curso.id && p.ativo
    );

    // USAR PRODUTOS DA PRECIFICAÇÃO DA EMPRESA
    const produtosInclusosEmpresa = precificacao?.produtosInclusos || [];
    
    // LÓGICA DE PRODUTOS AUTOMÁTICOS:
    // - Se houver EXATAMENTE 1 produto obrigatório → adicionar automaticamente
    // - Caso contrário (0 ou mais de 1) → será selecionado na aprovação
    const produtosExtrasIds: string[] = [];
    let valorTotal = 0;
    
    if (produtosInclusosEmpresa.length === 1) {
      produtosExtrasIds.push(produtosInclusosEmpresa[0]);
      
      // Calcular valor do produto automático
      const produtoAutomatico = produtosExtras.find(p => p.id === produtosInclusosEmpresa[0]);
      if (produtoAutomatico) {
        valorTotal = produtoAutomatico.valor;
      }
    }

    // Preparar dados do aluno para aprovação (mesmo formato da planilha)
    const alunoParaAprovar = {
      turmaId: turmaAcaoAtual,
      nome: dadosAluno.nome,
      cpf: dadosAluno.cpf,
      rg: dadosAluno.rg || '',
      dataNascimento: dadosAluno.dataNascimento || '',
      telefone: dadosAluno.telefone,
      email: dadosAluno.email,
      endereco: dadosAluno.endereco || '',
      valorTotal: valorTotal,
      desconto: 0,
      statusLink: 'Confirmado' as const,
      foto: undefined,
      statusPagamento: false,
      statusDocumentos: false,
      tipoPessoa: 'PJ' as const,
      clientePJId: empresaLogada.id,
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
      produtosExtras: produtosExtrasIds,
      observacoes: `📝 Adicionado individualmente pela empresa ${empresaLogada.nome} (Aguardando aprovação)`
    };

    // Preparar nome da turma para aprovação
    const nomeTurma = `${turma.codigo} - ${turma.nomePersonalizado || curso.nome}`;

    // Enviar para fila de aprovação (mesmo fluxo da planilha)
    setAlunosParaAprovar([alunoParaAprovar]);
    setNomeTurmaAprovacao(nomeTurma);
    setDialogAdicionarAberto(false);
    setDialogAprovarAberto(true);
    
    toast.info(`📋 Aluno ${dadosAluno.nome} aguardando aprovação. Selecione os produtos e confirme.`);
  };

  // Handler para processar planilha de importação (turma específica)
  const handleProcessarPlanilhaTurma = (dados: any[]) => {
    // Passar o turmaAcaoAtual como parâmetro para garantir que a turma correta seja usada
    handleProcessarPlanilha(dados, turmaAcaoAtual);
    setDialogImportarTurmaAberto(false);
  };

  // Tela de Login
  if (!empresaLogada) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-600 rounded-full mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Área do Cliente</CardTitle>
            <CardDescription>
              Acesse com suas credenciais corporativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                type="text"
                placeholder="usuario_empresa"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              disabled={tentativaLogin || !login || !senha}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              {tentativaLogin ? 'Verificando...' : 'Entrar'}
            </Button>

            {/* Credenciais Disponíveis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-2">🔑 Credenciais de Teste:</p>
                  
                  {/* Listar empresas com acesso ativo */}
                  {clientesPJ
                    .filter(emp => emp.acessoAtivo && emp.login && emp.senha)
                    .map((emp, idx) => (
                      <div key={emp.id} className="mb-3 pb-3 border-b border-blue-200 last:border-0 last:mb-0 last:pb-0">
                        <p className="font-semibold text-blue-800 mb-1">{idx + 1}. {emp.nome}</p>
                        <div className="space-y-1 text-xs">
                          <p className="flex items-center gap-2">
                            <span className="text-blue-700">Login:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold text-blue-900">
                              {emp.login}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-blue-700">Senha:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold text-blue-900">
                              {emp.senha}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {clientesPJ.filter(emp => emp.acessoAtivo && emp.login && emp.senha).length === 0 && (
                    <p className="text-xs text-red-600">
                      ⚠️ Nenhuma empresa com credenciais configuradas. Vá ao Módulo 00 para configurar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard da Empresa Logada
  return (
    <div className="p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{empresaLogada.nome}</h1>
              <p className="text-sm text-gray-600">
                {empresaLogada.razaoSocial || 'Área do Cliente'} - CNPJ: {empresaLogada.cnpj}
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Alerta Informativo sobre Filtro de Cursos */}
        {empresaLogada.precificacoes.filter(p => p.ativo).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">ℹ️ Visualização Filtrada por Precificação</p>
                <p className="text-xs text-blue-800">
                  <strong>IMPORTANTE:</strong> Você visualiza apenas turmas dos cursos com precificação ativa cadastrada para sua empresa.
                  {' '}Atualmente: <strong>{empresaLogada.precificacoes.filter(p => p.ativo).length} curso(s) contratado(s)</strong>
                  {' '}= <strong>{dadosEmpresa.turmas.length} turma(s) disponível(is)</strong>.
                  {dadosEmpresa.turmas.length === 0 && ' Não há turmas abertas para seus cursos no momento.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta quando não há precificações */}
        {empresaLogada.precificacoes.filter(p => p.ativo).length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">⚠️ Nenhum Curso Contratado</p>
                <p className="text-xs text-yellow-800">
                  Sua empresa ainda não possui cursos com precificação ativa. Entre em contato com nossa equipe comercial para contratar cursos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-600" />
              Cursos Contratados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {empresaLogada.precificacoes.filter(p => p.ativo).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Com precificação ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              Turmas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dadosEmpresa.turmas.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dos seus cursos contratados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              Alunos Matriculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dadosEmpresa.totalAlunos}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total de colaboradores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="importar">Importar Alunos</TabsTrigger>
          <TabsTrigger value="cursos">Cursos Contratados</TabsTrigger>
          <TabsTrigger value="turmas">Turmas Disponíveis</TabsTrigger>
          <TabsTrigger value="alunos">Meus Alunos</TabsTrigger>
        </TabsList>

        {/* Aba: Importar Alunos */}
        <TabsContent value="importar">
          <Card>
            <CardHeader>
              <CardTitle>Importar Alunos via Planilha</CardTitle>
              <CardDescription>
                Faça upload de uma planilha CSV ou Excel com os dados dos colaboradores para matricular em uma turma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Como importar seus colaboradores</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li><strong>Selecione a turma</strong> primeiro (logo abaixo)</li>
                  <li><strong>Baixe o template</strong> com apenas os dados básicos</li>
                  <li><strong>Preencha os dados</strong> dos colaboradores seguindo o exemplo</li>
                  <li><strong>Faça upload</strong> da planilha preenchida</li>
                  <li><strong>Selecione produtos extras</strong> individualmente para cada aluno durante a aprovação</li>
                </ol>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mt-2">
                  <p className="text-xs text-purple-800">
                    <strong>✨ PROCESSO SIMPLIFICADO:</strong> A planilha foi simplificada para conter apenas dados básicos. 
                    Os produtos extras poderão ser selecionados visualmente durante a aprovação de cada aluno, oferecendo mais flexibilidade!
                  </p>
                </div>
              </div>

              {/* Seleção de Turma */}
              <div>
                <Label>Selecione a Turma * (Primeiro Passo)</Label>
                <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma turma disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    {dadosEmpresa.turmas.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma turma disponível
                      </SelectItem>
                    ) : (
                      dadosEmpresa.turmas.map((turma) => {
                        const curso = cursos.find(c => c.id === turma.cursoId);
                        const precificacao = empresaLogada.precificacoes.find(
                          p => p.cursoId === curso?.id && p.ativo
                        );
                        return (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.codigo} - {curso?.nome || 'N/A'} - {formatarDataBR(turma.dataInicio)} 
                            {precificacao && ` - R$ ${(precificacao.valorNegociado || 0).toFixed(2)}`}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione a turma para liberar o download do template personalizado
                </p>
              </div>

              {/* Botão Download Template */}
              <div>
                <Button 
                  onClick={gerarTemplatePlanilha} 
                  variant="outline"
                  className="w-full border-2 border-dashed"
                  disabled={!turmaSelecionada}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {turmaSelecionada ? 'Baixar Template Personalizado' : 'Selecione uma Turma Primeiro'}
                </Button>
                {turmaSelecionada && (() => {
                  const turma = turmas.find(t => t.id === turmaSelecionada);
                  const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
                  const produtosVinculados = curso?.produtosVinculados || [];
                  const qtdProdutos = produtosVinculados.length;
                  
                  return (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {qtdProdutos > 0 
                        ? `Template incluirá ${qtdProdutos} produto(s) vinculado(s) a este curso` 
                        : 'Este curso não possui produtos vinculados'}
                    </p>
                  );
                })()}
              </div>

              {/* Status das precificações */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">Suas Precificações Ativas</h3>
                <div className="space-y-2">
                  {empresaLogada.precificacoes.filter(p => p.ativo).map((prec) => {
                    const curso = cursos.find(c => c.id === prec.cursoId);
                    return (
                      <div key={prec.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{curso?.nome || 'Curso N/A'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Produtos vinculados aos cursos contratados */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">📦 Produtos Vinculados aos Cursos</h3>
                <p className="text-xs text-gray-600 mb-3">
                  <strong>Regra:</strong> Se houver apenas 1 produto, ele é incluído automaticamente. Com 2 ou mais produtos, todos devem ser selecionados na aprovação.
                </p>
                <div className="space-y-3">
                  {empresaLogada.precificacoes.filter(p => p.ativo).map((prec) => {
                    const curso = cursos.find(c => c.id === prec.cursoId);
                    if (!curso) return null;
                    
                    // Buscar produtos inclusos na precificação da empresa (NÃO todos os produtos do curso)
                    const produtosInclusos = prec.produtosInclusos || [];
                    
                    // Se não há produtos inclusos para esta empresa, não mostrar nada
                    if (produtosInclusos.length === 0) return null;
                    
                    return (
                      <div key={`produtos-${prec.id}`} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-900">{curso.nome}</span>
                        </div>
                        <div className="space-y-1">
                          {produtosInclusos.map((produtoId) => {
                            const produto = produtosExtras.find(p => p.id === produtoId);
                            if (!produto) return null;
                            return (
                              <div key={produto.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5">
                                <span className="text-gray-700">{produto.nome}</span>
                                <span className="text-purple-600 font-semibold">
                                  R$ {(produto.valor || 0).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                          {produtosInclusos.length > 0 && (
                            <div className="text-xs text-purple-700 italic mt-1">
                              {produtosInclusos.length === 1 ? (
                                <>💡 <strong>1 produto único</strong> - será incluído automaticamente sem precisar selecionar</>
                              ) : (
                                <>💡 <strong>{produtosInclusos.length} produtos obrigatórios</strong> - devem ser selecionados durante a aprovação de cada aluno</>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Mensagem se nenhum curso tem produtos */}
                  {empresaLogada.precificacoes
                    .filter(p => p.ativo)
                    .every(prec => {
                      return !prec.produtosInclusos || prec.produtosInclusos.length === 0;
                    }) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum produto vinculado aos cursos contratados no momento.
                    </div>
                  )}
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Cursos Contratados */}
        <TabsContent value="cursos">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Contratados</CardTitle>
              <CardDescription>
                Cursos com precificação negociada para sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {empresaLogada.precificacoes.filter(p => p.ativo).map((prec) => {
                  const curso = cursos.find(c => c.id === prec.cursoId);
                  if (!curso) return null;
                  
                  return (
                    <Card key={prec.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700">
                                {curso.codigo}
                              </Badge>
                              <span className="font-semibold text-gray-900">{curso.nome}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                              <div>
                                <span className="text-gray-500">Categoria: </span>
                                <span className="text-gray-700">{curso.categoria}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Carga Horária: </span>
                                <span className="text-gray-700">{curso.cargaHoraria}h</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Horário: </span>
                                <span className="text-gray-700">{curso.horarioInicio} - {curso.horarioFim}</span>
                              </div>
                              {prec.observacoes && (
                                <div className="col-span-2">
                                  <span className="text-gray-500">Observações: </span>
                                  <span className="text-gray-700">{prec.observacoes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-xs text-gray-500 mb-1">Valor Negociado</div>
                            <div className="text-xl font-bold text-green-600">
                              R$ {(prec.valorNegociado || 0).toFixed(2)}
                            </div>
                            {prec.dataVigencia && (
                              <div className="text-xs text-gray-500 mt-1">
                                Válido até {formatarDataBR(prec.dataVigencia)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Turmas Disponíveis */}
        <TabsContent value="turmas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Turmas Disponíveis
                <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                  {dadosEmpresa.turmas.length} turma(s) filtrada(s)
                </Badge>
              </CardTitle>
              <CardDescription>
                Exibindo apenas turmas dos cursos com precificação ativa para sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dadosEmpresa.turmas.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhuma turma disponível no momento.</p>
                    <p className="text-gray-400 text-xs mt-2">Apenas turmas de cursos com precificação ativa são exibidas aqui.</p>
                  </div>
                ) : (
                  dadosEmpresa.turmas.map((turma) => {
                    const curso = cursos.find(c => c.id === turma.cursoId);
                    const precificacao = empresaLogada.precificacoes.find(
                      p => p.cursoId === curso?.id && p.ativo
                    );
                    const alunosNaTurma = alunos.filter(a => a.turmaId === turma.id).length;
                    
                    return (
                      <Card key={turma.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-semibold text-gray-500">{turma.codigo}</span>
                                <span className="font-semibold text-gray-900">
                                  {turma.nomePersonalizado || curso?.nome || 'N/A'}
                                </span>
                                <Badge 
                                  variant="outline"
                                  className={
                                    turma.statusTurma === 'Confirmada' ? 'bg-green-50 border-green-300 text-green-700' :
                                    turma.statusTurma === 'Em Andamento' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                                    turma.statusTurma === 'Planejada' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                                    'bg-gray-50 border-gray-300 text-gray-700'
                                  }
                                >
                                  {turma.statusTurma}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                <div>
                                  <span className="text-gray-500">Período: </span>
                                  <span className="text-gray-700">{formatarDataBR(turma.dataInicio)} a {formatarDataBR(turma.dataFim)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Horário: </span>
                                  <span className="text-gray-700">{turma.horario}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Vagas: </span>
                                  <span className="text-gray-700">{turma.vagasDisponiveis} disponíveis</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Matriculados: </span>
                                  <span className="text-gray-700">{alunosNaTurma} alunos</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <div className="text-xs text-gray-500 mb-1">Valor por Aluno</div>
                              <div className="text-xl font-bold text-green-600">
                                R$ {precificacao ? (precificacao.valorNegociado || 0).toFixed(2) : (turma.preco || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setTurmaAcaoAtual(turma.id);
                                setDialogAdicionarAberto(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Adicionar Aluno
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTurmaSelecionada(turma.id);
                                gerarTemplatePlanilha();
                              }}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Baixar Template
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTurmaAcaoAtual(turma.id);
                                setTurmaSelecionada(turma.id);
                                setDialogImportarTurmaAberto(true);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Importar Planilha
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Meus Alunos */}
        <TabsContent value="alunos">
          <Card>
            <CardHeader>
              <CardTitle>Colaboradores Matriculados</CardTitle>
              <CardDescription>
                Todos os colaboradores da sua empresa matriculados em nossos cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dadosEmpresa.alunosVinculados.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhum colaborador matriculado ainda.</p>
                    <p className="text-gray-400 text-xs mt-1">Use a aba "Importar Alunos" para cadastrar seus colaboradores.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dadosEmpresa.alunosVinculados.map((aluno) => {
                      const turma = turmas.find(t => t.id === aluno.turmaId);
                      const curso = cursos.find(c => c.id === turma?.cursoId);
                      const valorPago = aluno.pagamentos?.valorPago || 0;
                      const statusPagamento = valorPago >= aluno.valorTotal;
                      
                      return (
                        <Card key={aluno.id} className="border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {aluno.foto ? (
                                  <img src={aluno.foto} alt={aluno.nome} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{aluno.nome}</span>
                                    {/* Exibir informação de substituição */}
                                    {aluno.substitutoDe ? (
                                      <span className="text-xs font-mono">
                                        <span className="text-red-600 font-semibold">{aluno.substitutoDe}</span>
                                        <span className="text-gray-500 mx-1">SUBSTITUÍDO</span>
                                        <span className="text-green-600 font-semibold">{aluno.codigoSistema}</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500">({aluno.codigoSistema})</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {curso?.nome || 'N/A'} - Turma {turma?.codigo || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className={statusPagamento ? 'bg-green-50 border-green-300 text-green-700' : 'bg-orange-50 border-orange-300 text-orange-700'}
                                >
                                  {statusPagamento ? 'Pago' : 'Pendente'}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={(() => {
                                    const temDocumentosOk = aluno.statusDocumentos || 
                                      (aluno.documentos && aluno.documentos.length > 0 && aluno.documentos.every(doc => doc.status === 'Aprovado'));
                                    return temDocumentosOk ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700';
                                  })()}
                                >
                                  {(() => {
                                    const temDocumentosOk = aluno.statusDocumentos || 
                                      (aluno.documentos && aluno.documentos.length > 0 && aluno.documentos.every(doc => doc.status === 'Aprovado'));
                                    return temDocumentosOk ? 'Docs OK' : 'Docs Pendente';
                                  })()}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Upload de Planilha */}
      <DialogUploadPlanilha
        open={dialogUploadAberto}
        onOpenChange={setDialogUploadAberto}
        turmaId={turmaSelecionada}
        turmaNome={(() => {
          const turma = turmas.find(t => t.id === turmaSelecionada);
          const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
          return turma ? `${turma.codigo} - ${turma.nomePersonalizado || curso?.nome || 'N/A'}` : '';
        })()}
        onProcessar={handleProcessarPlanilha}
      />

      {/* Dialog de Adicionar Aluno Individual */}
      {turmaAcaoAtual && (() => {
        const turma = turmas.find(t => t.id === turmaAcaoAtual);
        const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
        const nomeTurma = turma?.nomePersonalizado || curso?.nome || 'N/A';
        
        return (
          <DialogAdicionarAlunoIndividual
            open={dialogAdicionarAberto}
            onOpenChange={setDialogAdicionarAberto}
            onAdicionar={handleAdicionarAlunoIndividual}
            nomeTurma={`${turma?.codigo || ''} - ${nomeTurma}`}
            valorCurso={0}
            produtosDisponiveis={[]}
          />
        );
      })()}

      {/* Dialog de Importar Planilha (turma específica) */}
      <DialogUploadPlanilha
        open={dialogImportarTurmaAberto}
        onOpenChange={setDialogImportarTurmaAberto}
        turmaId={turmaAcaoAtual}
        turmaNome={(() => {
          const turma = turmas.find(t => t.id === turmaAcaoAtual);
          const curso = turma ? cursos.find(c => c.id === turma.cursoId) : null;
          return turma ? `${turma.codigo} - ${turma.nomePersonalizado || curso?.nome || 'N/A'}` : '';
        })()}
        onProcessar={handleProcessarPlanilhaTurma}
      />

      {/* Dialog de Aprovar Alunos Importados */}
      <DialogAprovarAlunosImportados
        open={dialogAprovarAberto}
        onOpenChange={setDialogAprovarAberto}
        alunos={alunosParaAprovar}
        nomeTurma={nomeTurmaAprovacao}
        produtosExtrasDisponiveis={(() => {
          // Pegar a turma atual para saber quais produtos são obrigatórios
          const turmaSelecionadaObj = turmas.find(t => 
            alunosParaAprovar.length > 0 ? t.id === alunosParaAprovar[0].turmaId : false
          );
          const cursoTurma = turmaSelecionadaObj ? cursos.find(c => c.id === turmaSelecionadaObj.cursoId) : null;
          
          // 🔥 FILTRO POR PRECIFICAÇÃO DA EMPRESA LOGADA
          // Mostrar APENAS os produtos vinculados na precificação da empresa no Módulo 00
          if (!empresaLogada || !cursoTurma) {
            return [];
          }
          
          // Buscar a precificação da empresa para este curso
          const precificacaoEmpresa = empresaLogada.precificacoes?.find(
            p => p.cursoId === cursoTurma.id && p.ativo
          );
          
          if (!precificacaoEmpresa) {
            console.warn('⚠️ Nenhuma precificação ativa encontrada para esta empresa e curso');
            return [];
          }
          
          // USAR PRODUTOS INCLUSOS DA PRECIFICAÇÃO DA EMPRESA (NÃO do curso!)
          const produtosInclusosEmpresa = precificacaoEmpresa.produtosInclusos || [];
          
          // Filtrar produtos que estão na precificação da empresa (produtosInclusos)
          const produtosVinculadosEmpresa = produtosExtras.filter(p => 
            produtosInclusosEmpresa.includes(p.id)
          );
          
          // NOVA LÓGICA:
          // - Se houver EXATAMENTE 1 produto obrigatório → ele foi adicionado automaticamente, mas deve estar disponível para cálculo
          // - Se houver 0 produtos obrigatórios → mostrar todos os extras vinculados à empresa
          // - Se houver MAIS DE 1 produto obrigatório → mostrar TODOS (obrigatórios + extras) vinculados à empresa
          
          if (produtosInclusosEmpresa.length === 1) {
            // Caso 1: APENAS 1 produto obrigatório → já foi adicionado automaticamente
            // ✅ CORREÇÃO: Retornar TODOS os produtos vinculados para que o cálculo funcione
            return produtosVinculadosEmpresa;
          } else {
            // Caso 2: 0 ou MAIS DE 1 produto obrigatório → mostrar TODOS os produtos vinculados à empresa
            return produtosVinculadosEmpresa.filter(p => {
              // Se é produto incluso na precificação da empresa, incluir
              if (produtosInclusosEmpresa.includes(p.id)) return true;
              // Caso contrário, não incluir
              return false;
            });
          }
        })()}
        onAprovarAluno={handleAprovarAlunoIndividual}
        onFinalizarAprovacao={handleFinalizarAprovacao}
      />
    </div>
  );
};