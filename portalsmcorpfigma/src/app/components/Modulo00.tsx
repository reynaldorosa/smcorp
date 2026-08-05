import React, { useState } from 'react';
import { Plus, Building2, Users, Briefcase, DollarSign, Package, Pencil, Mail, MessageCircle, Truck, UserCog, Shield, Edit, Trash2, AlertTriangle, GraduationCap, FileText, Link as LinkIcon, Download } from 'lucide-react';
import { useSMCorp, ACOES_DISPARO_CUSTO, type AcaoDisparoCusto } from '@/app/contexts/SMCorpContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { DialogPermissoesUsuario } from '@/app/components/DialogPermissoesUsuario';
import { DialogEmpresa } from '@/app/components/DialogEmpresa';
import { DialogPrecificacoesEmpresa } from '@/app/components/DialogPrecificacoesEmpresa';
import { DialogEditarClientePJ } from '@/app/components/DialogEditarClientePJ';
import { DialogRelatorioInstrutor } from '@/app/components/DialogRelatorioInstrutor';
import { DialogCustosInstrutor } from '@/app/components/DialogCustosInstrutor';
import { MigracaoDadosIRATA } from '@/app/components/MigracaoDadosIRATA';
import { LimparDados } from '@/app/components/LimparDados';
import { DiagnosticoPersistencia } from '@/app/components/DiagnosticoPersistencia';
import { BackupDados } from '@/app/components/BackupDados';
import { DownloadProjetoCompleto } from '@/app/components/DownloadProjetoCompleto';
import { criarPermissoesPadrao } from '@/app/utils/permissoes';
import type { Usuario, ClientePJ } from '@/app/contexts/SMCorpContext';

export const Modulo00: React.FC = () => {
  const { 
    dadosInstitucionais,
    configuracoesEmail,
    configuracoesWhatsApp,
    salas, 
    usuarios,
    clientesPJ, 
    custosAuditaveis,
    criteriosCusto,
    lancamentosCusto,
    fornecedores,
    instrutores, // 🆕
    produtosExtras,
    cursos,
    adicionarSala,
    editarSala,
    adicionarUsuario,
    editarUsuario,
    adicionarClientePJ,
    editarClientePJ,
    adicionarCustoAuditavel,
    editarCustoAuditavel,
    removerCustoAuditavel,
    adicionarCriterioCusto,
    editarCriterioCusto,
    excluirCriterioCusto,
    adicionarFornecedor,
    editarFornecedor,
    adicionarInstrutor, // 🆕
    editarInstrutor, // 🆕
    excluirInstrutor, // 🆕
    vincularCustoInstrutor, // 🆕
    desvincularCustoInstrutor, // 🆕
    turmas, // Para o relatório de instrutores
    adicionarProdutoExtra,
    editarProdutoExtra,
    atualizarConfiguracoesEmail,
    atualizarConfiguracoesWhatsApp
  } = useSMCorp();

  const [novaSala, setNovaSala] = useState({
    nome: '',
    localizacao: '',
    capacidadeMaxima: 0,
    custoDiaria: 0
  });

  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    nivel: 'Vendedor' as 'Master' | 'Admin' | 'Vendedor'
  });

  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  const [dialogEditarUsuarioAberto, setDialogEditarUsuarioAberto] = useState(false);

  const [novoCusto, setNovoCusto] = useState({
    nome: '',
    valor: 0,
    fornecedorId: '',
    clientePJId: '', // 🆕 Empresa vinculada
    criterioCustoId: '', // 🆕 Critério vinculado
    tipoVinculo: 'nenhum' as 'nenhum' | 'empresa' | 'instrutor', // 🆕 Tipo de vínculo escolhido
    instrutorId: '' // 🆕 Instrutor vinculado
  });

  // 🆕 Estados para Critérios de Custo
  const [novoCriterio, setNovoCriterio] = useState({
    nome: '',
    frequenciaLancamento: 'Mensalmente' as 'Mensalmente' | 'Diariamente' | 'Única vez',
    vinculo: 'Aluno Matriculado' as 'Aluno Matriculado' | 'Não Vinculado',
    criterioVencimento: 'Data Término do Curso' as 'Data Término do Curso' | '30 dias após término' | 'Fechamento Mensal' | 'Data Específica' | 'Sem Vencimento',
    diasParaVencimento: 0,
    diaFechamentoMensal: 5,
    diasPagamentoAposFechamento: 10, // 🆕 Padrão: 10 dias após fechamento
    quando: [] as AcaoDisparoCusto[], // 🆕 COMANDO QUANDO (opcional)
    ativo: true
  });

  const [criterioEditando, setCriterioEditando] = useState<any>(null);
  const [criterioOriginal, setCriterioOriginal] = useState<any>(null); // 🆕 Para comparação
  const [mostrarConfirmacaoFechar, setMostrarConfirmacaoFechar] = useState(false); // 🆕 Dialog de confirmação

  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: ''
  });

  // 🆕 Estado para novo instrutor
  const [novoInstrutor, setNovoInstrutor] = useState({
    nome: '',
    funcao: '',
    telefone: '' // 🆕 Campo telefone
  });

  // 🆕 Estado para editar instrutor
  const [instrutorEditando, setInstrutorEditando] = useState<{
    id: string;
    nome: string;
    funcao: string;
    telefone?: string; // 🆕 Campo telefone
    custosVinculados?: string[];
  } | null>(null);

  const [dialogEditarInstrutorAberto, setDialogEditarInstrutorAberto] = useState(false);

  // 🆕 Estados para dialogs de relatório e custos de instrutor
  const [dialogRelatorioInstrutorAberto, setDialogRelatorioInstrutorAberto] = useState(false);
  const [dialogCustosInstrutorAberto, setDialogCustosInstrutorAberto] = useState(false);
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<typeof instrutores[0] | null>(null);

  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    cnpj: '',
    razaoSocial: '',
    endereco: '',
    telefone: '',
    email: '',
    cursoId: 'none',
    produtosInclusos: [] as string[],
    formasPagamentoPermitidas: [] as string[],
    login: '',
    senha: '',
    acessoAtivo: false
  });

  const [novoProduto, setNovoProduto] = useState({
    tipo: 'extra' as 'produto' | 'extra',
    nome: '',
    valor: 0,
    custosAssociados: [] as string[]
  });

  const [produtoEditando, setProdutoEditando] = useState<{
    id: string;
    nome: string;
    valor: number;
    custosAssociados: string[];
  } | null>(null);

  const [dialogEditarAberto, setDialogEditarAberto] = useState(false);

  // Estados para editar configurações de Email e WhatsApp
  const [dialogEmailAberto, setDialogEmailAberto] = useState(false);
  const [dialogWhatsAppAberto, setDialogWhatsAppAberto] = useState(false);
  
  const [emailEditando, setEmailEditando] = useState({
    remetente: '',
    host: '',
    porta: 0,
    usuario: '',
    senha: '',
    ativo: false
  });

  const [whatsappEditando, setWhatsappEditando] = useState({
    numero: '',
    apiKey: '',
    webhookUrl: '',
    ativo: false
  });

  // Estado para dialog de dados da empresa
  const [dialogEmpresaAberto, setDialogEmpresaAberto] = useState(false);

  // Estado para dialog de precificações da empresa
  const [dialogPrecificacoesAberto, setDialogPrecificacoesAberto] = useState(false);
  const [empresaSelecionadaPrecificacoes, setEmpresaSelecionadaPrecificacoes] = useState<{id: string, nome: string} | null>(null);

  // Estado para dialog de edição de cliente PJ
  const [dialogEditarClientePJAberto, setDialogEditarClientePJAberto] = useState(false);
  const [clientePJEditando, setClientePJEditando] = useState<ClientePJ | null>(null);

  // Estados para editar Sala, Fornecedor e Custo
  const [salaEditando, setSalaEditando] = useState<{ id: string; nome: string; localizacao: string; capacidadeMaxima: number; custoDiaria: number } | null>(null);
  const [fornecedorEditando, setFornecedorEditando] = useState<{ id: string; nome: string; cnpj: string; telefone: string; email: string } | null>(null);
  const [custoEditando, setCustoEditando] = useState<{ id: string; nome: string; valor: number; fornecedorId: string; criterioCustoId?: string; tipoVinculo?: 'nenhum' | 'empresa' | 'instrutor'; clientePJId?: string; instrutorId?: string } | null>(null);

  // Função para obter produtos vinculados ao curso selecionado
  const getProdutosVinculadosCurso = (cursoId: string) => {
    if (cursoId === 'none') return [];
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return [];

    const produtos = [];
    
    // Produtos principais (obrigatórios)
    if (curso.produtosVinculados) {
      curso.produtosVinculados.forEach(prodId => {
        const produto = produtosExtras.find(p => p.id === prodId);
        if (produto) {
          produtos.push({ ...produto, categoria: 'Principal' });
        }
      });
    }

    // Produtos extras (opcionais)
    if (curso.extrasVinculados) {
      curso.extrasVinculados.forEach(extraId => {
        const extra = produtosExtras.find(p => p.id === extraId);
        if (extra) {
          produtos.push({ ...extra, categoria: 'Extra' });
        }
      });
    }

    return produtos;
  };

  // Limpar produtos inclusos quando trocar de curso
  React.useEffect(() => {
    if (novaEmpresa.cursoId === 'none') {
      setNovaEmpresa(prev => ({ ...prev, produtosInclusos: [] }));
    } else {
      // Filtrar produtos que ainda existem no novo curso
      const produtosVinculados = getProdutosVinculadosCurso(novaEmpresa.cursoId);
      const idsValidos = produtosVinculados.map(p => p.id);
      const produtosFiltrados = novaEmpresa.produtosInclusos.filter(id => idsValidos.includes(id));
      
      if (produtosFiltrados.length !== novaEmpresa.produtosInclusos.length) {
        setNovaEmpresa(prev => ({ ...prev, produtosInclusos: produtosFiltrados }));
      }
    }
  }, [novaEmpresa.cursoId]);

  const handleAdicionarSala = () => {
    adicionarSala(novaSala);
    setNovaSala({ nome: '', localizacao: '', capacidadeMaxima: 0, custoDiaria: 0 });
    toast.success('✅ Sala adicionada com sucesso!');
  };

  const handleEditarSala = () => {
    if (!salaEditando) return;
    editarSala(salaEditando.id, {
      nome: salaEditando.nome,
      localizacao: salaEditando.localizacao,
      capacidadeMaxima: salaEditando.capacidadeMaxima,
      custoDiaria: salaEditando.custoDiaria
    });
    toast.success('✅ Sala atualizada com sucesso!');
    setSalaEditando(null);
  };

  const handleAdicionarUsuario = () => {
    if (!novoUsuario.nome) {
      alert('Por favor, preencha o nome do usuário.');
      return;
    }
    // Adicionar permissões padrão baseadas no nível
    adicionarUsuario({
      ...novoUsuario,
      permissoes: criarPermissoesPadrao(novoUsuario.nivel)
    });
    toast.success(`✅ Usuário ${novoUsuario.nome} cadastrado com nível ${novoUsuario.nivel}!`);
    setNovoUsuario({ nome: '', nivel: 'Vendedor' });
  };

  const abrirDialogEditarUsuario = (usuario: typeof usuarios[0]) => {
    // Se usuário antigo não tem permissões, criar permissões padrão
    const permissoes = usuario.permissoes || criarPermissoesPadrao(usuario.nivel);
    
    setUsuarioEditando({
      ...usuario,
      permissoes
    });
    setDialogEditarUsuarioAberto(true);
  };

  const handleEditarUsuario = () => {
    if (!usuarioEditando) return;
    if (!usuarioEditando.nome) {
      alert('Por favor, preencha o nome do usuário.');
      return;
    }
    // Validar PIN se o usuário for Master
    if (usuarioEditando.nivel === 'Master' && (!usuarioEditando.pin || usuarioEditando.pin.length !== 6)) {
      toast.error('❌ Usuário Master deve ter um PIN de 6 dígitos!');
      return;
    }
    editarUsuario(usuarioEditando.id, {
      nome: usuarioEditando.nome,
      nivel: usuarioEditando.nivel,
      pin: usuarioEditando.pin,
      permissoes: usuarioEditando.permissoes
    });
    toast.success(`✅ Permissões de ${usuarioEditando.nome} atualizadas com sucesso!`);
    setUsuarioEditando(null);
    setDialogEditarUsuarioAberto(false);
  };

  const handleAdicionarCustoAuditavel = () => {
    if (!novoCusto.nome || novoCusto.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    adicionarCustoAuditavel(novoCusto);
    setNovoCusto({ nome: '', valor: 0, fornecedorId: '', clientePJId: '', criterioCustoId: '', tipoVinculo: 'nenhum', instrutorId: '' });
    toast.success('✅ Custo adicionado com sucesso!');
  };

  // 🆕 Funções para Critérios de Custo
  const handleAdicionarCriterio = () => {
    if (!novoCriterio.nome) {
      toast.error('❌ Por favor, preencha o nome do critério!');
      return;
    }
    adicionarCriterioCusto(novoCriterio);
    setNovoCriterio({
      nome: '',
      frequenciaLancamento: 'Mensalmente',
      vinculo: 'Aluno Matriculado' as 'Aluno Matriculado' | 'Não Vinculado',
      criterioVencimento: 'Data Término do Curso',
      diasParaVencimento: 0,
      diaFechamentoMensal: 5,
      diasPagamentoAposFechamento: 10,
      quando: [],
      ativo: true
    });
    toast.success('✅ Critério de custo adicionado com sucesso!');
  };

  // 🆕 Verifica se houve mudanças no critério
  const verificarMudancas = () => {
    if (!criterioOriginal || !criterioEditando) return false;
    return JSON.stringify(criterioOriginal) !== JSON.stringify(criterioEditando);
  };

  // 🆕 Tenta fechar o dialog de edição
  const tentarFecharEdicao = () => {
    if (verificarMudancas()) {
      setMostrarConfirmacaoFechar(true);
    } else {
      setCriterioEditando(null);
      setCriterioOriginal(null);
    }
  };

  // 🆕 Descarta alterações e fecha
  const descartarAlteracoes = () => {
    setCriterioEditando(null);
    setCriterioOriginal(null);
    setMostrarConfirmacaoFechar(false);
    toast.info('❌ Alterações descartadas');
  };

  const handleEditarCriterio = () => {
    if (!criterioEditando) return;
    editarCriterioCusto(criterioEditando.id, {
      nome: criterioEditando.nome,
      frequenciaLancamento: criterioEditando.frequenciaLancamento,
      vinculo: criterioEditando.vinculo,
      criterioVencimento: criterioEditando.criterioVencimento,
      diasParaVencimento: criterioEditando.diasParaVencimento,
      diaFechamentoMensal: criterioEditando.diaFechamentoMensal,
      diasPagamentoAposFechamento: criterioEditando.diasPagamentoAposFechamento,
      quando: criterioEditando.quando, // 🆕 Incluir o campo quando
      ativo: criterioEditando.ativo
    });
    toast.success('✅ Critério editado com sucesso!');
    setCriterioEditando(null);
    setCriterioOriginal(null);
  };

  const handleExcluirCriterio = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este critério?')) {
      excluirCriterioCusto(id);
      toast.success('✅ Critério excluído com sucesso!');
    }
  };

  const handleEditarCustoAuditavel = () => {
    if (!custoEditando) return;
    editarCustoAuditavel(custoEditando.id, {
      nome: custoEditando.nome,
      valor: custoEditando.valor,
      fornecedorId: custoEditando.fornecedorId,
      criterioCustoId: custoEditando.criterioCustoId,
      tipoVinculo: custoEditando.tipoVinculo,
      clientePJId: custoEditando.clientePJId,
      instrutorId: custoEditando.instrutorId
    });
    toast.success('✅ Custo atualizado com sucesso!');
    setCustoEditando(null);
  };

  const handleRemoverCustoAuditavel = (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o custo "${nome}"?\n\nEsta ação também removerá todos os lançamentos relacionados a este custo.`)) {
      removerCustoAuditavel(id);
      toast.success('✅ Custo removido com sucesso!');
    }
  };

  const handleAdicionarFornecedor = () => {
    if (!novoFornecedor.nome || !novoFornecedor.cnpj || !novoFornecedor.telefone || !novoFornecedor.email) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    adicionarFornecedor(novoFornecedor);
    setNovoFornecedor({ nome: '', cnpj: '', telefone: '', email: '' });
    toast.success('✅ Fornecedor adicionado com sucesso!');
  };

  const handleEditarFornecedor = () => {
    if (!fornecedorEditando) return;
    editarFornecedor(fornecedorEditando.id, {
      nome: fornecedorEditando.nome,
      cnpj: fornecedorEditando.cnpj,
      telefone: fornecedorEditando.telefone,
      email: fornecedorEditando.email
    });
    toast.success('✅ Fornecedor atualizado com sucesso!');
    setFornecedorEditando(null);
  };

  // 🆕 Handlers para Instrutores
  const handleAdicionarInstrutor = () => {
    if (!novoInstrutor.nome || !novoInstrutor.funcao) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    adicionarInstrutor(novoInstrutor);
    setNovoInstrutor({ nome: '', funcao: '', telefone: '' }); // 🆕 Resetar com telefone
  };

  const handleEditarInstrutor = () => {
    if (!instrutorEditando) return;
    editarInstrutor(instrutorEditando.id, {
      nome: instrutorEditando.nome,
      funcao: instrutorEditando.funcao,
      telefone: instrutorEditando.telefone, // 🆕 Incluir telefone
      custosVinculados: instrutorEditando.custosVinculados || []
    });
    toast.success('✅ Instrutor atualizado com sucesso!');
    setInstrutorEditando(null);
    setDialogEditarInstrutorAberto(false);
  };

  const handleExcluirInstrutor = (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o instrutor "${nome}"?`)) {
      excluirInstrutor(id);
    }
  };

  const handleAdicionarEmpresa = () => {
    if (!novaEmpresa.nome || !novaEmpresa.cnpj || !novaEmpresa.razaoSocial) {
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }
    
    // Criar precificação se tiver curso vinculado
    const precificacoes = [];
    if (novaEmpresa.cursoId && novaEmpresa.cursoId !== 'none') {
      precificacoes.push({
        id: Date.now().toString(),
        cursoId: novaEmpresa.cursoId,
        produtosInclusos: novaEmpresa.produtosInclusos,
        observacoes: '',
        dataVigencia: '',
        ativo: true
      });
    }

    const empresaParaSalvar = {
      nome: novaEmpresa.nome,
      cnpj: novaEmpresa.cnpj,
      razaoSocial: novaEmpresa.razaoSocial,
      endereco: novaEmpresa.endereco,
      telefone: novaEmpresa.telefone,
      email: novaEmpresa.email,
      cursoId: novaEmpresa.cursoId === 'none' ? undefined : novaEmpresa.cursoId,
      precificacaoNegociada: 0,
      precificacoes: precificacoes,
      formasPagamentoPermitidas: novaEmpresa.formasPagamentoPermitidas,
      login: novaEmpresa.login,
      senha: novaEmpresa.senha,
      acessoAtivo: novaEmpresa.acessoAtivo
    };
    
    adicionarClientePJ(empresaParaSalvar);
    toast.success(`✅ Empresa ${novaEmpresa.nome} cadastrada com sucesso!`);
    setNovaEmpresa({ 
      nome: '', 
      cnpj: '', 
      razaoSocial: '', 
      endereco: '', 
      telefone: '', 
      email: '', 
      cursoId: 'none', 
      produtosInclusos: [],
      formasPagamentoPermitidas: [],
      login: '',
      senha: '',
      acessoAtivo: false
    });
  };

  const handleAdicionarProdutoExtra = () => {
    if (!novoProduto.nome || novoProduto.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    adicionarProdutoExtra(novoProduto);
    setNovoProduto({ tipo: 'extra', nome: '', valor: 0, custosAssociados: [] });
  };

  const handleEditarProdutoExtra = () => {
    if (!produtoEditando) return;
    if (!produtoEditando.nome || produtoEditando.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }
    editarProdutoExtra(produtoEditando.id, {
      nome: produtoEditando.nome,
      valor: produtoEditando.valor,
      custosAssociados: produtoEditando.custosAssociados
    });
    setProdutoEditando(null);
    setDialogEditarAberto(false);
  };

  const abrirDialogEditar = (produto: typeof produtosExtras[0]) => {
    setProdutoEditando({
      id: produto.id,
      nome: produto.nome,
      valor: produto.valor,
      custosAssociados: produto.custosAssociados || []
    });
    setDialogEditarAberto(true);
  };

  const abrirDialogEditarEmail = () => {
    setEmailEditando(configuracoesEmail);
    setDialogEmailAberto(true);
  };

  const abrirDialogEditarWhatsApp = () => {
    setWhatsappEditando(configuracoesWhatsApp);
    setDialogWhatsAppAberto(true);
  };

  const handleSalvarEmail = () => {
    atualizarConfiguracoesEmail(emailEditando);
    setDialogEmailAberto(false);
  };

  const handleSalvarWhatsApp = () => {
    atualizarConfiguracoesWhatsApp(whatsappEditando);
    setDialogWhatsAppAberto(false);
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Módulo 00: Infraestrutura e Configurações</h1>
            <p className="text-gray-600 mt-1 text-xs">Onde o administrador define os limites e recursos da empresa</p>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            {/* Botão de Dados da Empresa */}
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setDialogEmpresaAberto(true)}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Dados da Empresa
            </Button>
          </div>
      </div>

      {/* Ferramenta de Reset de Cache */}
      <div className="mb-4">
        <LimparDados />
      </div>

      {/* Diagnóstico de Persistência */}
      <div className="mb-4">
        <DiagnosticoPersistencia />
      </div>

      {/* Dados Institucionais */}
      <Card className="mb-6 border-red-200">
          <CardHeader style={{ backgroundColor: `${dadosInstitucionais.cor}15` }}>
            <CardTitle style={{ color: dadosInstitucionais.cor }}>Dados Institucionais</CardTitle>
            <CardDescription>Identidade visual e informações da empresa</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Nome da Instituição</Label>
                <div className="mt-2 text-2xl font-bold" style={{ color: dadosInstitucionais.cor }}>
                  {dadosInstitucionais.nome}
                </div>
              </div>
              <div>
                <Label>Cor Principal</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: dadosInstitucionais.cor }}
                  ></div>
                  <span className="text-sm text-gray-600">{dadosInstitucionais.cor}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔧 Componente de Migração - REMOVER APÓS USO */}
        <div className="mb-6 space-y-4">
          <MigracaoDadosIRATA />
        </div>

        {/* Tabs para diferentes seções */}
        <Tabs defaultValue="salas" className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="salas">
              <Building2 className="w-4 h-4 mr-2" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <UserCog className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="empresas">
              <Briefcase className="w-4 h-4 mr-2" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="fornecedores">
              <Truck className="w-4 h-4 mr-2" />
              Fornecedores
            </TabsTrigger>
            <TabsTrigger value="instrutores">
              <GraduationCap className="w-4 h-4 mr-2" />
              Instrutores
            </TabsTrigger>
            <TabsTrigger value="custos">
              <DollarSign className="w-4 h-4 mr-2" />
              Custos
            </TabsTrigger>
            <TabsTrigger value="extras">
              <Package className="w-4 h-4 mr-2" />
              Produtos Extras
            </TabsTrigger>
            <TabsTrigger value="comunicacoes">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comunicações
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Download className="w-4 h-4 mr-2" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Salas */}
          <TabsContent value="salas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestão de Salas e Campos</CardTitle>
                    <CardDescription>Cadastro de espaços físicos para treinamentos</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Sala
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Nova Sala</DialogTitle>
                        <DialogDescription>Insira os detalhes da nova sala</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nome">Nome da Sala</Label>
                          <Input
                            id="nome"
                            value={novaSala.nome}
                            onChange={(e) => setNovaSala({ ...novaSala, nome: e.target.value })}
                            placeholder="Ex: Sala A"
                          />
                        </div>
                        <div>
                          <Label htmlFor="localizacao">Localização</Label>
                          <Input
                            id="localizacao"
                            value={novaSala.localizacao}
                            onChange={(e) => setNovaSala({ ...novaSala, localizacao: e.target.value })}
                            placeholder="Ex: Prédio 1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="capacidade">Capacidade Máxima</Label>
                          <Input
                            id="capacidade"
                            type="number"
                            value={novaSala.capacidadeMaxima || ''}
                            onChange={(e) => setNovaSala({ ...novaSala, capacidadeMaxima: parseInt(e.target.value) })}
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="custo">Custo da Diária (R$)</Label>
                          <Input
                            id="custo"
                            type="number"
                            value={novaSala.custoDiaria || ''}
                            onChange={(e) => setNovaSala({ ...novaSala, custoDiaria: parseFloat(e.target.value) })}
                            placeholder="500"
                          />
                        </div>
                        <Button onClick={handleAdicionarSala} className="w-full">Salvar Sala</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {salas.map((sala) => (
                    <Card key={sala.id} className="border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{sala.nome}</CardTitle>
                            <CardDescription>{sala.localizacao}</CardDescription>
                          </div>
                          <Dialog open={salaEditando?.id === sala.id} onOpenChange={(open) => !open && setSalaEditando(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSalaEditando(sala)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Sala</DialogTitle>
                                <DialogDescription>Atualize as informações da sala</DialogDescription>
                              </DialogHeader>
                              {salaEditando && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="editNomeSala">Nome da Sala</Label>
                                    <Input
                                      id="editNomeSala"
                                      value={salaEditando.nome}
                                      onChange={(e) => setSalaEditando({ ...salaEditando, nome: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editLocalizacaoSala">Localização</Label>
                                    <Input
                                      id="editLocalizacaoSala"
                                      value={salaEditando.localizacao}
                                      onChange={(e) => setSalaEditando({ ...salaEditando, localizacao: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editCapacidadeSala">Capacidade Máxima</Label>
                                    <Input
                                      id="editCapacidadeSala"
                                      type="number"
                                      value={salaEditando.capacidadeMaxima}
                                      onChange={(e) => setSalaEditando({ ...salaEditando, capacidadeMaxima: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editCustoDiariaSala">Custo por Diária (R$)</Label>
                                    <Input
                                      id="editCustoDiariaSala"
                                      type="number"
                                      step="0.01"
                                      value={salaEditando.custoDiaria}
                                      onChange={(e) => setSalaEditando({ ...salaEditando, custoDiaria: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSalaEditando(null)}>Cancelar</Button>
                                    <Button onClick={handleEditarSala}>Salvar Alterações</Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Capacidade:</span>
                            <span className="font-medium">{sala.capacidadeMaxima} pessoas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Custo/Diária:</span>
                            <span className="font-medium">R$ {sala.custoDiaria.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestão de Usuários e Permissões</CardTitle>
                    <CardDescription>Cadastro de usuários do sistema com diferentes níveis de acesso</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                        <DialogDescription>Cadastre um novo usuário e defina seu nível de acesso</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nomeUsuario">Nome Completo</Label>
                          <Input
                            id="nomeUsuario"
                            value={novoUsuario.nome}
                            onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                            placeholder="Ex: Maria Oliveira"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nivelUsuario">Nível de Acesso</Label>
                          <Select
                            value={novoUsuario.nivel}
                            onValueChange={(value: 'Master' | 'Admin' | 'Vendedor') => setNovoUsuario({ ...novoUsuario, nivel: value })}
                          >
                            <SelectTrigger id="nivelUsuario">
                              <SelectValue placeholder="Selecione o nível" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Master">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-red-600" />
                                  <span>Master - Acesso Total</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Admin">
                                <div className="flex items-center gap-2">
                                  <UserCog className="w-4 h-4 text-blue-600" />
                                  <span>Admin - Gerenciamento</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Vendedor">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span>Vendedor - Vendas</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-2">
                            {novoUsuario.nivel === 'Master' && '• Acesso completo ao sistema, incluindo configurações críticas'}
                            {novoUsuario.nivel === 'Admin' && '• Gestão de turmas, alunos e operações do dia a dia'}
                            {novoUsuario.nivel === 'Vendedor' && '• Acesso limitado à central de vendas e matrículas'}
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-blue-800 mb-2">Permissões por Nível:</div>
                          <div className="space-y-2 text-xs text-blue-700">
                            <div>
                              <span className="font-medium">Master:</span> Módulos 00, 01, 02, 03, 04, 05, 06, 07 (Acesso Total + Confirmação de Pagamentos)
                            </div>
                            <div>
                              <span className="font-medium">Admin:</span> Módulos 00, 01, 02, 03, 04, 05, 06
                            </div>
                            <div>
                              <span className="font-medium">Vendedor:</span> Módulos 01, 02, 04
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleAdicionarUsuario} className="w-full">Cadastrar Usuário</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usuarios.map((usuario) => {
                    const getBadgeColor = (nivel: string) => {
                      switch (nivel) {
                        case 'Master':
                          return 'bg-red-100 text-red-700 border-red-300';
                        case 'Admin':
                          return 'bg-blue-100 text-blue-700 border-blue-300';
                        case 'Vendedor':
                          return 'bg-green-100 text-green-700 border-green-300';
                        default:
                          return 'bg-gray-100 text-gray-700 border-gray-300';
                      }
                    };

                    const getIcon = (nivel: string) => {
                      switch (nivel) {
                        case 'Master':
                          return <Shield className="w-4 h-4" />;
                        case 'Admin':
                          return <UserCog className="w-4 h-4" />;
                        case 'Vendedor':
                          return <Users className="w-4 h-4" />;
                        default:
                          return null;
                      }
                    };

                    const getPermissoes = (nivel: string) => {
                      switch (nivel) {
                        case 'Master':
                          return 'Módulos 00-07 • Acesso Total + Confirmação de Pagamentos';
                        case 'Admin':
                          return 'Módulos 00-06 • Gerenciamento Operacional';
                        case 'Vendedor':
                          return 'Módulos 01, 02, 04 • Central de Vendas';
                        default:
                          return 'Sem permissões';
                      }
                    };

                    return (
                      <Card key={usuario.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-gray-500">{usuario.codigo}</span>
                                  <span className="font-medium text-gray-900">{usuario.nome}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{getPermissoes(usuario.nivel)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`${getBadgeColor(usuario.nivel)} flex items-center gap-1.5 px-3 py-1`}>
                                {getIcon(usuario.nivel)}
                                {usuario.nivel}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirDialogEditarUsuario(usuario)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dialog de Edição de Permissões Avançadas */}
            <DialogPermissoesUsuario
              aberto={dialogEditarUsuarioAberto}
              usuarioEditando={usuarioEditando}
              onFechar={() => {
                setDialogEditarUsuarioAberto(false);
                setUsuarioEditando(null);
              }}
              onSalvar={handleEditarUsuario}
              onAlterarUsuario={(dados) => {
                if (usuarioEditando) {
                  // Se mudou o nível, atualizar permissões padrão
                  if (dados.nivel && dados.nivel !== usuarioEditando.nivel) {
                    setUsuarioEditando({
                      ...usuarioEditando,
                      ...dados,
                      permissoes: criarPermissoesPadrao(dados.nivel)
                    });
                  } else {
                    setUsuarioEditando({ ...usuarioEditando, ...dados });
                  }
                }
              }}
            />
          </TabsContent>

          {/* Empresas */}
          <TabsContent value="empresas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cadastro de Clientes PJ</CardTitle>
                    <CardDescription>Empresas com precificação negociada e cursos vinculados</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Empresa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
                      <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
                        <DialogTitle>Adicionar Nova Empresa Cliente</DialogTitle>
                        <DialogDescription>Cadastre uma nova empresa com precificação especial</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nomeEmpresa">Nome Fantasia *</Label>
                            <Input
                              id="nomeEmpresa"
                              value={novaEmpresa.nome}
                              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
                              placeholder="Ex: ABC Transportes"
                            />
                          </div>
                          <div>
                            <Label htmlFor="razaoSocialEmpresa">Razão Social *</Label>
                            <Input
                              id="razaoSocialEmpresa"
                              value={novaEmpresa.razaoSocial}
                              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, razaoSocial: e.target.value })}
                              placeholder="Ex: ABC Transportes Ltda"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cnpjEmpresa">CNPJ *</Label>
                          <Input
                            id="cnpjEmpresa"
                            value={novaEmpresa.cnpj}
                            onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="enderecoEmpresa">Endereço</Label>
                          <Input
                            id="enderecoEmpresa"
                            value={novaEmpresa.endereco}
                            onChange={(e) => setNovaEmpresa({ ...novaEmpresa, endereco: e.target.value })}
                            placeholder="Rua, número, bairro, cidade - UF"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="telefoneEmpresa">Telefone</Label>
                            <Input
                              id="telefoneEmpresa"
                              value={novaEmpresa.telefone}
                              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })}
                              placeholder="(11) 98765-4321"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emailEmpresa">Email</Label>
                            <Input
                              id="emailEmpresa"
                              type="email"
                              value={novaEmpresa.email}
                              onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })}
                              placeholder="contato@empresa.com"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="cursoEmpresa">Curso Vinculado (Módulo 001)</Label>
                          <Select
                            value={novaEmpresa.cursoId}
                            onValueChange={(value) => setNovaEmpresa({ ...novaEmpresa, cursoId: value })}
                          >
                            <SelectTrigger id="cursoEmpresa">
                              <SelectValue placeholder="Selecione um curso (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum curso vinculado</SelectItem>
                              {cursos.filter(c => !c.excluido).map((curso) => (
                                <SelectItem key={curso.id} value={curso.id}>
                                  {curso.codigo} - {curso.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Selecione o curso que esta empresa possui precificação especial
                          </p>
                        </div>

                        {/* Produtos Vinculados ao Curso Selecionado */}
                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Package className="w-4 h-4 text-red-600" />
                            Produtos para Precificação
                          </Label>
                          {novaEmpresa.cursoId === 'none' ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                              <p className="text-xs text-gray-500 text-center italic">
                                Selecione um curso acima para ver os produtos disponíveis
                              </p>
                            </div>
                          ) : getProdutosVinculadosCurso(novaEmpresa.cursoId).length === 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
                              <p className="text-xs text-amber-700 text-center">
                                ⚠️ Este curso não possui produtos vinculados no Módulo 01
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50 mt-2">
                              <p className="text-xs text-blue-700 mb-2">
                                Selecione os produtos que fazem parte da precificação negociada:
                              </p>
                              {getProdutosVinculadosCurso(novaEmpresa.cursoId).map(produto => (
                                <div key={produto.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                                  <Checkbox
                                    id={`produto-${produto.id}`}
                                    checked={novaEmpresa.produtosInclusos.includes(produto.id)}
                                    onCheckedChange={(checked) => {
                                      const novoProdutos = checked
                                        ? [...novaEmpresa.produtosInclusos, produto.id]
                                        : novaEmpresa.produtosInclusos.filter(id => id !== produto.id);
                                      setNovaEmpresa({ ...novaEmpresa, produtosInclusos: novoProdutos });
                                    }}
                                  />
                                  <label htmlFor={`produto-${produto.id}`} className="flex-1 cursor-pointer text-sm">
                                    <span className="font-medium">{produto.codigo} - {produto.nome}</span>
                                    <span className="ml-2 text-xs text-gray-600">R$ {produto.valor.toFixed(2)}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`ml-2 text-xs ${produto.categoria === 'Principal' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-purple-100 text-purple-700 border-purple-300'}`}
                                    >
                                      {produto.categoria}
                                    </Badge>
                                  </label>
                                </div>
                              ))}
                              {novaEmpresa.produtosInclusos.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                  <p className="text-xs text-blue-800 font-semibold">
                                    ✓ {novaEmpresa.produtosInclusos.length} produto(s) selecionado(s)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 💳 NOVO: Formas de Pagamento Permitidas */}
                        <div className="border-t pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-red-600" />
                            <h3 className="font-semibold text-sm">Formas de Pagamento Permitidas</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600">
                            Selecione as formas de pagamento que esta empresa está autorizada a utilizar:
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque', 'Boleto'].map((forma) => (
                              <div key={forma} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50">
                                <Checkbox
                                  id={`forma-${forma}`}
                                  checked={novaEmpresa.formasPagamentoPermitidas?.includes(forma) || false}
                                  onCheckedChange={(checked) => {
                                    const formasAtuais = novaEmpresa.formasPagamentoPermitidas || [];
                                    const novasFormas = checked
                                      ? [...formasAtuais, forma]
                                      : formasAtuais.filter(f => f !== forma);
                                    setNovaEmpresa({ ...novaEmpresa, formasPagamentoPermitidas: novasFormas });
                                  }}
                                />
                                <Label htmlFor={`forma-${forma}`} className="text-sm cursor-pointer flex-1">
                                  {forma}
                                </Label>
                              </div>
                            ))}
                          </div>
                          
                          {(!novaEmpresa.formasPagamentoPermitidas || novaEmpresa.formasPagamentoPermitidas.length === 0) && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2">
                              <p className="text-xs text-amber-700">
                                ⚠️ Se nenhuma forma for selecionada, TODAS as formas de pagamento estarão disponíveis.
                              </p>
                            </div>
                          )}
                          
                          {novaEmpresa.formasPagamentoPermitidas && novaEmpresa.formasPagamentoPermitidas.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <p className="text-xs text-green-700 font-semibold">
                                ✓ {novaEmpresa.formasPagamentoPermitidas.length} forma(s) de pagamento selecionada(s)
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Seção de Acesso ao Módulo 05 - Área do Cliente */}
                        <div className="border-t pt-4 space-y-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-600" />
                            <h3 className="font-semibold text-sm">Acesso à Área do Cliente (Módulo 05)</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="acessoAtivoEmpresa"
                              checked={novaEmpresa.acessoAtivo}
                              onCheckedChange={(checked) => setNovaEmpresa({ ...novaEmpresa, acessoAtivo: checked as boolean })}
                            />
                            <Label htmlFor="acessoAtivoEmpresa" className="text-sm cursor-pointer">
                              Permitir acesso à área do cliente (Módulo 05)
                            </Label>
                          </div>

                          {novaEmpresa.acessoAtivo && (
                            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-red-200">
                              <div>
                                <Label htmlFor="loginEmpresa">Login de Acesso *</Label>
                                <Input
                                  id="loginEmpresa"
                                  value={novaEmpresa.login}
                                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, login: e.target.value })}
                                  placeholder="usuario_empresa"
                                />
                              </div>
                              <div>
                                <Label htmlFor="senhaEmpresa">Senha de Acesso *</Label>
                                <Input
                                  id="senhaEmpresa"
                                  type="password"
                                  value={novaEmpresa.senha}
                                  onChange={(e) => setNovaEmpresa({ ...novaEmpresa, senha: e.target.value })}
                                  placeholder="••••••••"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 mb-2">
                            <strong>💡 Dica:</strong> Empresas com acesso ativo poderão acessar o Módulo 05 para importar alunos e vincular a turmas usando o login e senha criados aqui.
                          </p>
                          <p className="text-xs text-blue-700">
                            <strong>🎯 Precificações:</strong> Após criar a empresa, clique em "Editar Empresa" para gerenciar as precificações negociadas de cursos.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 px-6 py-3 border-t flex-shrink-0 bg-white">
                        <Button variant="outline" onClick={() => setNovaEmpresa({ 
                          nome: '', 
                          cnpj: '', 
                          razaoSocial: '', 
                          endereco: '', 
                          telefone: '', 
                          email: '', 
                          cursoId: 'none', 
                          produtosInclusos: [],
                          formasPagamentoPermitidas: [],
                          login: '',
                          senha: '',
                          acessoAtivo: false
                        })}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAdicionarEmpresa}>
                          Salvar Empresa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {clientesPJ.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhuma empresa cliente cadastrada ainda.</p>
                    <p className="text-gray-400 text-xs mt-1">Clique em "Nova Empresa" para cadastrar seu primeiro cliente PJ.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientesPJ.map((cliente) => {
                      const cursoVinculado = cliente.cursoId ? cursos.find(c => c.id === cliente.cursoId) : null;
                      const precificacaoAtiva = cliente.precificacoes?.find(p => p.ativo);
                      return (
                        <Card key={cliente.id} className="border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-xs font-semibold text-gray-500">{cliente.codigo}</span>
                                  <span className="font-medium text-gray-900">{cliente.nome}</span>
                                  {cliente.razaoSocial && (
                                    <span className="text-xs text-gray-500">({cliente.razaoSocial})</span>
                                  )}
                                  {cliente.acessoAtivo && (
                                    <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Acesso Ativo
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                  <div>
                                    <span className="text-gray-500">CNPJ: </span>
                                    <span className="text-gray-700">{cliente.cnpj}</span>
                                  </div>
                                  {cliente.telefone && (
                                    <div>
                                      <span className="text-gray-500">Telefone: </span>
                                      <span className="text-gray-700">{cliente.telefone}</span>
                                    </div>
                                  )}
                                  {cliente.email && (
                                    <div>
                                      <span className="text-gray-500">Email: </span>
                                      <span className="text-gray-700">{cliente.email}</span>
                                    </div>
                                  )}
                                  {cursoVinculado && (
                                    <div>
                                      <span className="text-gray-500">Curso: </span>
                                      <span className="text-gray-700">{cursoVinculado.codigo} - {cursoVinculado.nome}</span>
                                    </div>
                                  )}
                                </div>
                                {precificacaoAtiva && precificacaoAtiva.produtosInclusos && precificacaoAtiva.produtosInclusos.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-xs">
                                      <span className="text-gray-500 font-semibold">Produtos Inclusos: </span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {precificacaoAtiva.produtosInclusos.map(prodId => {
                                          const produto = produtosExtras.find(p => p.id === prodId);
                                          return produto ? (
                                            <Badge key={prodId} variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                                              {produto.codigo}
                                            </Badge>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                                <Button
                                  onClick={() => {
                                    setClientePJEditando(cliente);
                                    setDialogEditarClientePJAberto(true);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Editar Empresa
                                </Button>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 mb-1">Precificações Ativas</div>
                                  <div className="font-medium text-green-600 text-sm">
                                    {cliente.precificacoes?.filter(p => p.ativo).length || 0} curso(s)
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fornecedores */}
          <TabsContent value="fornecedores">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fornecedores</CardTitle>
                    <CardDescription>Cadastro de fornecedores para aquisição de materiais</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Fornecedor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
                        <DialogDescription>Insira os detalhes do novo fornecedor</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nomeFornecedor">Nome do Fornecedor</Label>
                          <Input
                            id="nomeFornecedor"
                            value={novoFornecedor.nome}
                            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })}
                            placeholder="Ex: Empresa XYZ"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cnpjFornecedor">CNPJ</Label>
                          <Input
                            id="cnpjFornecedor"
                            value={novoFornecedor.cnpj}
                            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefoneFornecedor">Telefone</Label>
                          <Input
                            id="telefoneFornecedor"
                            value={novoFornecedor.telefone}
                            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })}
                            placeholder="(11) 98765-4321"
                          />
                        </div>
                        <div>
                          <Label htmlFor="emailFornecedor">Email</Label>
                          <Input
                            id="emailFornecedor"
                            type="email"
                            value={novoFornecedor.email}
                            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
                            placeholder="contato@empresa.com"
                          />
                        </div>
                        <Button onClick={handleAdicionarFornecedor} className="w-full">Salvar Fornecedor</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fornecedores.map((fornecedor) => (
                    <Card key={fornecedor.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-gray-500">{fornecedor.codigo}</span>
                            <span className="font-medium">{fornecedor.nome}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-gray-600">CNPJ: </span>
                              <span className="font-medium text-blue-600">
                                {fornecedor.cnpj}
                              </span>
                            </div>
                            <Dialog open={fornecedorEditando?.id === fornecedor.id} onOpenChange={(open) => !open && setFornecedorEditando(null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setFornecedorEditando(fornecedor)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Fornecedor</DialogTitle>
                                  <DialogDescription>Atualize as informações do fornecedor</DialogDescription>
                                </DialogHeader>
                                {fornecedorEditando && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="editNomeFornecedor">Nome do Fornecedor</Label>
                                      <Input
                                        id="editNomeFornecedor"
                                        value={fornecedorEditando.nome}
                                        onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, nome: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editCnpjFornecedor">CNPJ</Label>
                                      <Input
                                        id="editCnpjFornecedor"
                                        value={fornecedorEditando.cnpj}
                                        onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, cnpj: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editTelefoneFornecedor">Telefone</Label>
                                      <Input
                                        id="editTelefoneFornecedor"
                                        value={fornecedorEditando.telefone}
                                        onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, telefone: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editEmailFornecedor">Email</Label>
                                      <Input
                                        id="editEmailFornecedor"
                                        type="email"
                                        value={fornecedorEditando.email}
                                        onChange={(e) => setFornecedorEditando({ ...fornecedorEditando, email: e.target.value })}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setFornecedorEditando(null)}>Cancelar</Button>
                                      <Button onClick={handleEditarFornecedor}>Salvar Alterações</Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instrutores */}
          <TabsContent value="instrutores">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Instrutores</CardTitle>
                    <CardDescription>Cadastro de instrutores para treinamentos</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Instrutor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Instrutor</DialogTitle>
                        <DialogDescription>Insira os dados do novo instrutor</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nomeInstrutor">Nome do Instrutor</Label>
                          <Input
                            id="nomeInstrutor"
                            value={novoInstrutor.nome}
                            onChange={(e) => setNovoInstrutor({ ...novoInstrutor, nome: e.target.value })}
                            placeholder="Ex: João Silva"
                          />
                        </div>
                        <div>
                          <Label htmlFor="funcaoInstrutor">Função</Label>
                          <Input
                            id="funcaoInstrutor"
                            value={novoInstrutor.funcao}
                            onChange={(e) => setNovoInstrutor({ ...novoInstrutor, funcao: e.target.value })}
                            placeholder="Ex: Instrutor de NR-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefoneInstrutor">Telefone (WhatsApp)</Label>
                          <Input
                            id="telefoneInstrutor"
                            value={novoInstrutor.telefone}
                            onChange={(e) => setNovoInstrutor({ ...novoInstrutor, telefone: e.target.value })}
                            placeholder="Ex: (11) 98765-4321"
                          />
                        </div>
                        <Button onClick={handleAdicionarInstrutor} className="w-full">Salvar Instrutor</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {instrutores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum instrutor cadastrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instrutores.map((instrutor) => (
                      <Card key={instrutor.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                                <GraduationCap className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-gray-500">{instrutor.codigo}</span>
                                  <span className="font-medium text-gray-900">{instrutor.nome}</span>
                                  {instrutor.custosVinculados && instrutor.custosVinculados.length > 0 && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      {instrutor.custosVinculados.length} custo{instrutor.custosVinculados.length > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {instrutor.funcao}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Botão Relatório */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setInstrutorSelecionado(instrutor);
                                  setDialogRelatorioInstrutorAberto(true);
                                }}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>

                              {/* Botão Custos */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-green-500 text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setInstrutorSelecionado(instrutor);
                                  setDialogCustosInstrutorAberto(true);
                                }}
                              >
                                <LinkIcon className="w-4 h-4" />
                              </Button>

                              <Dialog open={dialogEditarInstrutorAberto && instrutorEditando?.id === instrutor.id} onOpenChange={(open) => {
                                if (!open) {
                                  setDialogEditarInstrutorAberto(false);
                                  setInstrutorEditando(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setInstrutorEditando(instrutor);
                                      setDialogEditarInstrutorAberto(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Instrutor</DialogTitle>
                                    <DialogDescription>Atualize as informações do instrutor</DialogDescription>
                                  </DialogHeader>
                                  {instrutorEditando && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="editNomeInstrutor">Nome do Instrutor</Label>
                                        <Input
                                          id="editNomeInstrutor"
                                          value={instrutorEditando.nome}
                                          onChange={(e) => setInstrutorEditando({ ...instrutorEditando, nome: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editFuncaoInstrutor">Função</Label>
                                        <Input
                                          id="editFuncaoInstrutor"
                                          value={instrutorEditando.funcao}
                                          onChange={(e) => setInstrutorEditando({ ...instrutorEditando, funcao: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editTelefoneInstrutor">Telefone (WhatsApp)</Label>
                                        <Input
                                          id="editTelefoneInstrutor"
                                          value={instrutorEditando.telefone || ''}
                                          onChange={(e) => setInstrutorEditando({ ...instrutorEditando, telefone: e.target.value })}
                                          placeholder="Ex: (11) 98765-4321"
                                        />
                                      </div>
                                      
                                      {/* 🆕 Campo para vincular custos ao instrutor */}
                                      <div>
                                        <Label>💰 Custos Vinculados</Label>
                                        <div className="space-y-2">
                                          {custosAuditaveis
                                            .filter(c => c.tipoVinculo === 'instrutor')
                                            .map((custo) => (
                                              <div key={custo.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`custo-${custo.id}`}
                                                  checked={(instrutorEditando.custosVinculados || []).includes(custo.id)}
                                                  onCheckedChange={(checked) => {
                                                    const custosAtuais = instrutorEditando.custosVinculados || [];
                                                    if (checked) {
                                                      setInstrutorEditando({
                                                        ...instrutorEditando,
                                                        custosVinculados: [...custosAtuais, custo.id]
                                                      });
                                                    } else {
                                                      setInstrutorEditando({
                                                        ...instrutorEditando,
                                                        custosVinculados: custosAtuais.filter(id => id !== custo.id)
                                                      });
                                                    }
                                                  }}
                                                />
                                                <label
                                                  htmlFor={`custo-${custo.id}`}
                                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                  {custo.codigo} - {custo.nome} (R$ {custo.valor.toFixed(2)})
                                                </label>
                                              </div>
                                            ))}
                                          {custosAuditaveis.filter(c => c.tipoVinculo === 'instrutor').length === 0 && (
                                            <p className="text-sm text-gray-500">
                                              Nenhum custo do tipo "Instrutor" cadastrado ainda.
                                            </p>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                          Selecione os custos que serão vinculados a este instrutor
                                        </p>
                                      </div>

                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => {
                                          setDialogEditarInstrutorAberto(false);
                                          setInstrutorEditando(null);
                                        }}>Cancelar</Button>
                                        <Button onClick={handleEditarInstrutor}>Salvar Alterações</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleExcluirInstrutor(instrutor.id, instrutor.nome)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custos Auditáveis */}
          <TabsContent value="custos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Custos Auditáveis</CardTitle>
                    <CardDescription>
                      Custos fixos que compõem a precificação dos cursos
                      <span className="ml-2 text-xs">
                        • {custosAuditaveis.filter(c => c.criterioCustoId).length}/{custosAuditaveis.length} com critério vinculado
                      </span>
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Custo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Custo Auditável</DialogTitle>
                        <DialogDescription>Cadastre um custo que compõe a precificação dos produtos</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nomeCusto">Nome do Custo</Label>
                          <Input
                            id="nomeCusto"
                            value={novoCusto.nome}
                            onChange={(e) => setNovoCusto({ ...novoCusto, nome: e.target.value })}
                            placeholder="Ex: Material Didático, Certificado"
                          />
                        </div>
                        <div>
                          <Label htmlFor="valorCusto">Valor (R$)</Label>
                          <Input
                            id="valorCusto"
                            type="number"
                            value={novoCusto.valor || ''}
                            onChange={(e) => setNovoCusto({ ...novoCusto, valor: parseFloat(e.target.value) })}
                            placeholder="50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="criterioCusto">📋 Critério de Custo</Label>
                          <div className="flex gap-2">
                            <Select
                              value={novoCusto.criterioCustoId || undefined}
                              onValueChange={(value) => setNovoCusto({ ...novoCusto, criterioCustoId: value })}
                            >
                              <SelectTrigger id="criterioCusto">
                                <SelectValue placeholder="Selecione o critério (opcional)" />
                              </SelectTrigger>
                              <SelectContent>
                                {criteriosCusto.filter(c => c.ativo).map((criterio) => (
                                  <SelectItem key={criterio.id} value={criterio.id}>
                                    {criterio.codigo} - {criterio.nome} ({criterio.frequenciaLancamento})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {novoCusto.criterioCustoId && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNovoCusto({ ...novoCusto, criterioCustoId: '' })}
                                className="shrink-0"
                              >
                                Limpar
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Define quando e como este custo será lançado
                          </p>
                        </div>

                        {/* 🆕 Tipo de Vínculo: Instrutor OU Empresa */}
                        <div>
                          <Label>Tipo de Vínculo</Label>
                          <Select
                            value={novoCusto.tipoVinculo}
                            onValueChange={(value: '' | 'empresa' | 'instrutor') => 
                              setNovoCusto({ 
                                ...novoCusto, 
                                tipoVinculo: value,
                                clientePJId: '',
                                instrutorId: '',
                                fornecedorId: ''
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de vínculo (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="empresa">🏢 Vínculo para Empresa</SelectItem>
                              <SelectItem value="instrutor">👨‍🏫 Vínculo para Instrutor</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Defina se este custo é vinculado a empresa ou instrutor específico
                          </p>
                        </div>

                        {/* Campo condicional: Empresa (se escolheu vínculo para empresa) */}
                        {novoCusto.tipoVinculo === 'empresa' && (
                          <div>
                            <Label htmlFor="empresaCusto">🏢 Empresa *</Label>
                            <Select
                              value={novoCusto.clientePJId}
                              onValueChange={(value) => setNovoCusto({ ...novoCusto, clientePJId: value })}
                            >
                              <SelectTrigger id="empresaCusto">
                                <SelectValue placeholder="Selecione a empresa" />
                              </SelectTrigger>
                              <SelectContent>
                                {clientesPJ.map((empresa) => (
                                  <SelectItem key={empresa.id} value={empresa.id}>
                                    {empresa.razaoSocial} - {empresa.cnpj}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Este custo será vinculado especificamente à empresa selecionada
                            </p>
                          </div>
                        )}

                        {/* Campo condicional: Instrutor (se escolheu vínculo para instrutor) */}
                        {novoCusto.tipoVinculo === 'instrutor' && (
                          <div>
                            <Label htmlFor="instrutorCusto">👨‍🏫 Instrutor *</Label>
                            <Select
                              value={novoCusto.instrutorId}
                              onValueChange={(value) => setNovoCusto({ ...novoCusto, instrutorId: value })}
                            >
                              <SelectTrigger id="instrutorCusto">
                                <SelectValue placeholder="Selecione o instrutor" />
                              </SelectTrigger>
                              <SelectContent>
                                {instrutores.map((instrutor) => (
                                  <SelectItem key={instrutor.id} value={instrutor.id}>
                                    {instrutor.codigo} - {instrutor.nome} ({instrutor.funcao})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Este custo será vinculado especificamente ao instrutor selecionado
                            </p>
                          </div>
                        )}



                        {/* Campo de Fornecedor (sempre disponível) */}
                        <div>
                          <Label htmlFor="fornecedorCusto">Fornecedor (opcional)</Label>
                          <Select
                            value={novoCusto.fornecedorId}
                            onValueChange={(value) => setNovoCusto({ ...novoCusto, fornecedorId: value })}
                          >
                            <SelectTrigger id="fornecedorCusto">
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {fornecedores.filter(f => f.id).map((fornecedor) => (
                                <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                  {fornecedor.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Fornecedor responsável por este custo (se aplicável)
                          </p>
                        </div>

                        <Button onClick={handleAdicionarCustoAuditavel} className="w-full">Salvar Custo</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {custosAuditaveis.map((custo) => {
                    const fornecedor = fornecedores.find(f => f.id === custo.fornecedorId);
                    const empresa = clientesPJ.find(e => e.id === custo.clientePJId);
                    const criterio = criteriosCusto.find(c => c.id === custo.criterioCustoId);
                    const instrutor = instrutores.find(i => i.id === custo.instrutorId);
                    return (
                      <Card key={custo.id} className={criterio ? "border-2 border-green-300 bg-green-50" : "border-gray-200"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  {custo.codigo}
                                </Badge>
                                <div className="font-medium">{custo.nome}</div>
                                {custo.tipoVinculo === 'instrutor' && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    👨‍🏫 Instrutor
                                  </Badge>
                                )}
                                {custo.tipoVinculo === 'empresa' && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    🏢 Empresa
                                  </Badge>
                                )}
                              </div>
                              {fornecedor && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Fornecedor: {fornecedor.nome}
                                </div>
                              )}
                              {empresa && (
                                <div className="text-xs text-blue-600 mt-1 font-medium">
                                  🏢 Empresa: {empresa.razaoSocial}
                                </div>
                              )}
                              {instrutor && (
                                <div className="text-xs text-purple-600 mt-1 font-medium">
                                  👨‍🏫 Instrutor: {instrutor.nome} ({instrutor.funcao})
                                </div>
                              )}
                              {criterio ? (
                                <div className="text-xs text-green-700 mt-1 font-medium">
                                  📋 {criterio.nome} • {criterio.frequenciaLancamento} • {criterio.criterioVencimento}
                                </div>
                              ) : (
                                <div className="text-xs text-amber-600 mt-1">
                                  ⚠️ Sem critério vinculado
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="font-medium text-blue-600">
                                R$ {custo.valor.toFixed(2)}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoverCustoAuditavel(custo.id, custo.nome)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Dialog open={custoEditando?.id === custo.id} onOpenChange={(open) => !open && setCustoEditando(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setCustoEditando(custo)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Custo Auditável</DialogTitle>
                                    <DialogDescription>Atualize as informações do custo</DialogDescription>
                                  </DialogHeader>
                                  {custoEditando && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="editNomeCusto">Nome do Custo</Label>
                                        <Input
                                          id="editNomeCusto"
                                          value={custoEditando.nome}
                                          onChange={(e) => setCustoEditando({ ...custoEditando, nome: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editValorCusto">Valor (R$)</Label>
                                        <Input
                                          id="editValorCusto"
                                          type="number"
                                          step="0.01"
                                          value={custoEditando.valor}
                                          onChange={(e) => setCustoEditando({ ...custoEditando, valor: parseFloat(e.target.value) || 0 })}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editCriterioCusto">📋 Critério de Custo</Label>
                                        <div className="flex gap-2">
                                          <Select
                                            value={custoEditando.criterioCustoId || undefined}
                                            onValueChange={(value) => setCustoEditando({ ...custoEditando, criterioCustoId: value })}
                                          >
                                            <SelectTrigger id="editCriterioCusto">
                                              <SelectValue placeholder="Selecione o critério (opcional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {criteriosCusto.filter(c => c.ativo).map((criterio) => (
                                                <SelectItem key={criterio.id} value={criterio.id}>
                                                  {criterio.codigo} - {criterio.nome} ({criterio.frequenciaLancamento})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          {custoEditando.criterioCustoId && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setCustoEditando({ ...custoEditando, criterioCustoId: '' })}
                                              className="shrink-0"
                                            >
                                              Limpar
                                            </Button>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Define quando e como este custo será lançado
                                        </p>
                                      </div>

                                      {/* Tipo de Vínculo */}
                                      <div>
                                        <Label>Tipo de Vínculo</Label>
                                        <Select
                                          value={custoEditando.tipoVinculo || ''}
                                          onValueChange={(value: '' | 'empresa' | 'instrutor') => 
                                            setCustoEditando({ 
                                              ...custoEditando, 
                                              tipoVinculo: value || undefined,
                                              clientePJId: '',
                                              instrutorId: ''
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo de vínculo (opcional)" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="nenhum">Sem vínculo</SelectItem>
                                            <SelectItem value="empresa">🏢 Vínculo para Empresa</SelectItem>
                                            <SelectItem value="instrutor">👨‍🏫 Vínculo para Instrutor</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Campo condicional: Empresa */}
                                      {custoEditando.tipoVinculo === 'empresa' && (
                                        <div>
                                          <Label htmlFor="editEmpresaCusto">🏢 Empresa *</Label>
                                          <Select
                                            value={custoEditando.clientePJId || ''}
                                            onValueChange={(value) => setCustoEditando({ ...custoEditando, clientePJId: value })}
                                          >
                                            <SelectTrigger id="editEmpresaCusto">
                                              <SelectValue placeholder="Selecione a empresa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {clientesPJ.map((empresa) => (
                                                <SelectItem key={empresa.id} value={empresa.id}>
                                                  {empresa.razaoSocial} - {empresa.cnpj}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      {/* Campo condicional: Instrutor */}
                                      {custoEditando.tipoVinculo === 'instrutor' && (
                                        <div>
                                          <Label htmlFor="editInstrutorCusto">👨‍🏫 Instrutor *</Label>
                                          <Select
                                            value={custoEditando.instrutorId || ''}
                                            onValueChange={(value) => setCustoEditando({ ...custoEditando, instrutorId: value })}
                                          >
                                            <SelectTrigger id="editInstrutorCusto">
                                              <SelectValue placeholder="Selecione o instrutor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {instrutores.map((instrutor) => (
                                                <SelectItem key={instrutor.id} value={instrutor.id}>
                                                  {instrutor.codigo} - {instrutor.nome} ({instrutor.funcao})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      {/* Campo de Fornecedor */}
                                      <div>
                                        <Label htmlFor="editFornecedorCusto">Fornecedor</Label>
                                        <Select
                                          value={custoEditando.fornecedorId}
                                          onValueChange={(value) => setCustoEditando({ ...custoEditando, fornecedorId: value })}
                                        >
                                          <SelectTrigger id="editFornecedorCusto">
                                            <SelectValue placeholder="Selecione o fornecedor" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fornecedores.filter(f => f.id).map((fornecedor) => (
                                              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                                {fornecedor.nome}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setCustoEditando(null)}>Cancelar</Button>
                                        <Button onClick={handleEditarCustoAuditavel}>Salvar Alterações</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* 🆕 Seção de Critérios de Custo */}
                <div className="mt-8 pt-8 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">📋 Critérios de Custo</h3>
                      <p className="text-sm text-gray-600">Configure critérios para lançamento e vencimento de custos</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="bg-green-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Critério
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Critério de Custo</DialogTitle>
                          <DialogDescription>Configure critérios para gestão automatizada de custos</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="nomeCriterio">Nome do Critério *</Label>
                            <Input
                              id="nomeCriterio"
                              value={novoCriterio.nome}
                              onChange={(e) => setNovoCriterio({ ...novoCriterio, nome: e.target.value })}
                              placeholder="Ex: Material Didático Mensal, Taxa de Certificação"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="frequencia">Quando deve ser lançado *</Label>
                              <Select
                                value={novoCriterio.frequenciaLancamento}
                                onValueChange={(value: any) => setNovoCriterio({ ...novoCriterio, frequenciaLancamento: value })}
                              >
                                <SelectTrigger id="frequencia">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Mensalmente">📅 Mensalmente</SelectItem>
                                  <SelectItem value="Diariamente">📆 Diariamente</SelectItem>
                                  <SelectItem value="Única vez">🔹 Única vez</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="vinculo">Vínculo *</Label>
                              <Select
                                value={novoCriterio.vinculo}
                                onValueChange={(value: any) => setNovoCriterio({ ...novoCriterio, vinculo: value })}
                              >
                                <SelectTrigger id="vinculo">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Aluno Matriculado">👤 Aluno Matriculado</SelectItem>
                                  <SelectItem value="Instrutor">👨‍🏫 Instrutor</SelectItem>
                                  <SelectItem value="Não Vinculado">🔓 Não Vinculado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="vencimento">Critério de Vencimento *</Label>
                            <Select
                              value={novoCriterio.criterioVencimento}
                              onValueChange={(value: any) => setNovoCriterio({ ...novoCriterio, criterioVencimento: value })}
                            >
                              <SelectTrigger id="vencimento">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Data Término do Curso">🎓 Data de Término do Curso</SelectItem>
                                <SelectItem value="30 dias após término">📅 30 dias após término do curso</SelectItem>
                                <SelectItem value="Fechamento Mensal">📊 Fechamento Mensal</SelectItem>
                                <SelectItem value="Data Específica">📌 Data Específica</SelectItem>
                                <SelectItem value="Sem Vencimento">♾️ Sem Vencimento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {novoCriterio.criterioVencimento === 'Fechamento Mensal' && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="diaFechamento">Dia do Fechamento Mensal *</Label>
                                  <Input
                                    id="diaFechamento"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={novoCriterio.diaFechamentoMensal}
                                    onChange={(e) => setNovoCriterio({ ...novoCriterio, diaFechamentoMensal: parseInt(e.target.value) || 5 })}
                                    placeholder="5"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Dia do mês (1-31) para fechamento</p>
                                </div>
                                <div>
                                  <Label htmlFor="diasPagamento">Dias p/ Pagamento após Fechamento *</Label>
                                  <Input
                                    id="diasPagamento"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={novoCriterio.diasPagamentoAposFechamento || 0}
                                    onChange={(e) => setNovoCriterio({ ...novoCriterio, diasPagamentoAposFechamento: parseInt(e.target.value) || 0 })}
                                    placeholder="10"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Ex: 10 dias após o fechamento</p>
                                </div>
                              </div>
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                <div className="flex items-start gap-2">
                                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                                  <div className="text-xs text-blue-800">
                                    <strong>Como funciona:</strong> O sistema somará todos os custos lançados até o dia <strong>{novoCriterio.diaFechamentoMensal}</strong> de cada mês e gerará um único lançamento com vencimento para <strong>{novoCriterio.diasPagamentoAposFechamento || 0} dias</strong> após a data de fechamento.
                                    <br />
                                    <strong>Exemplo:</strong> Fechamento dia 25 + 10 dias = Vencimento dia 05 do mês seguinte
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* 🆕 COMANDO QUANDO - Ações que disparam o custo */}
                          {novoCriterio.vinculo === 'Aluno Matriculado' && (
                            <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <Label className="text-sm font-semibold text-purple-900">
                                    ⚡ COMANDO QUANDO (Opcional)
                                  </Label>
                                  <p className="text-xs text-purple-700 mt-1">
                                    Define em qual <strong>momento/ação</strong> do card do aluno o custo será gerado.
                                    <br />Se não marcar nenhuma opção, seguirá as configurações padrão do critério.
                                  </p>
                                </div>
                                {novoCriterio.quando && novoCriterio.quando.length > 0 && (
                                  <Badge className="bg-purple-600">
                                    {novoCriterio.quando.length} {novoCriterio.quando.length === 1 ? 'ação' : 'ações'}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 bg-white rounded border">
                                {ACOES_DISPARO_CUSTO.map((acao) => {
                                  const isChecked = Boolean(novoCriterio.quando?.includes(acao));
                                  return (
                                    <div key={acao} className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded">
                                      <Checkbox
                                        id={`acao-${acao}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const quandoAtual = novoCriterio.quando || [];
                                          if (checked) {
                                            setNovoCriterio({
                                              ...novoCriterio,
                                              quando: [...quandoAtual, acao]
                                            });
                                          } else {
                                            setNovoCriterio({
                                              ...novoCriterio,
                                              quando: quandoAtual.filter(a => a !== acao)
                                            });
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`acao-${acao}`}
                                        className="text-xs font-normal cursor-pointer flex-1"
                                      >
                                        {acao}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-3 text-xs text-purple-700 bg-purple-100 p-2 rounded">
                                <strong>💡 Dica:</strong> Marque as ações específicas que devem gerar este custo. 
                                Por exemplo: "Todos Documentos Aprovados" ou "Status → Confirmado".
                              </div>
                            </div>
                          )}

                          {/* 🆕 COMANDO QUANDO para Instrutores */}
                          {novoCriterio.vinculo === 'Instrutor' && (
                            <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <Label className="text-sm font-semibold text-orange-900">
                                    ⚡ COMANDO QUANDO (Opcional)
                                  </Label>
                                  <p className="text-xs text-orange-700 mt-1">
                                    Define em qual <strong>momento/ação</strong> o custo do instrutor será gerado.
                                    <br />Se não marcar nenhuma opção, seguirá as configurações padrão do critério.
                                  </p>
                                </div>
                                {novoCriterio.quando && novoCriterio.quando.length > 0 && (
                                  <Badge className="bg-orange-600">
                                    {novoCriterio.quando.length} {novoCriterio.quando.length === 1 ? 'ação' : 'ações'}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-2 p-2 bg-white rounded border">
                                {/* Filtrar apenas ações relevantes para instrutores */}
                                {ACOES_DISPARO_CUSTO.filter(acao => 
                                  acao === 'Presença Instrutor Confirmada' || 
                                  acao === 'Instrutor Vinculado à Prova'
                                ).map((acao) => {
                                  const isChecked = Boolean(novoCriterio.quando?.includes(acao));
                                  return (
                                    <div key={acao} className="flex items-center space-x-2 p-2 hover:bg-orange-50 rounded">
                                      <Checkbox
                                        id={`acao-instrutor-${acao}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const quandoAtual = novoCriterio.quando || [];
                                          if (checked) {
                                            setNovoCriterio({
                                              ...novoCriterio,
                                              quando: [...quandoAtual, acao]
                                            });
                                          } else {
                                            setNovoCriterio({
                                              ...novoCriterio,
                                              quando: quandoAtual.filter(a => a !== acao)
                                            });
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`acao-instrutor-${acao}`}
                                        className="text-xs font-normal cursor-pointer flex-1"
                                      >
                                        {acao}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                                <strong>💡 Dica:</strong> Escolha quando gerar custos do instrutor:
                                <br />• "Presença Instrutor Confirmada" - ao confirmar presença em uma turma
                                <br />• "Instrutor Vinculado à Prova" - ao selecionar instrutor para uma prova no Módulo 03
                              </div>
                            </div>
                          )}

                          <Button onClick={handleAdicionarCriterio} className="w-full">
                            Salvar Critério
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {criteriosCusto.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhum critério cadastrado</p>
                        <p className="text-sm">Clique em "Novo Critério" para adicionar</p>
                      </div>
                    ) : (
                      criteriosCusto.map((criterio) => (
                        <Card key={criterio.id} className={`border-2 ${criterio.ativo ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="font-mono text-xs bg-purple-50 text-purple-700 border-purple-300">
                                    {criterio.codigo}
                                  </Badge>
                                  <div className="font-semibold text-gray-900">{criterio.nome}</div>
                                  {criterio.ativo ? (
                                    <Badge className="bg-green-600">Ativo</Badge>
                                  ) : (
                                    <Badge variant="outline">Inativo</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Frequência:</span>
                                    <div className="font-medium">{criterio.frequenciaLancamento}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Vínculo:</span>
                                    <div className="font-medium">
                                      {criterio.vinculo === 'Aluno Matriculado' && '👤 '}
                                      {criterio.vinculo === 'Não Vinculado' && '🔓 '}
                                      {criterio.vinculo}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Vencimento:</span>
                                    <div className="font-medium">
                                      {criterio.criterioVencimento}
                                      {criterio.criterioVencimento === 'Fechamento Mensal' && (
                                        <span className="text-xs text-gray-600">
                                          <br />📅 Fecha dia {criterio.diaFechamentoMensal} | Paga +{criterio.diasPagamentoAposFechamento || 0} dias
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 🆕 Exibir Ações QUANDO se houver */}
                                {criterio.quando && criterio.quando.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-purple-600 text-white text-xs">
                                        ⚡ COMANDO QUANDO
                                      </Badge>
                                      <span className="text-xs text-purple-700 font-medium">
                                        {criterio.quando.length} {criterio.quando.length === 1 ? 'ação definida' : 'ações definidas'}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {criterio.quando.map((acao) => (
                                        <Badge key={acao} variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs font-normal">
                                          {acao}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-xs text-purple-600 mt-2 italic">
                                      💡 Este custo será gerado apenas quando uma dessas ações ocorrer
                                    </p>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-500 mt-2">
                                  Criado em: {criterio.dataCriacao}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Dialog open={criterioEditando?.id === criterio.id} onOpenChange={(open) => !open && tentarFecharEdicao()}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setCriterioEditando({...criterio});
                                        setCriterioOriginal({...criterio});
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent key={criterioEditando?.id} className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Editar Critério de Custo</DialogTitle>
                                      <DialogDescription>Atualize as configurações do critério</DialogDescription>
                                    </DialogHeader>
                                    {criterioEditando && (
                                      <div className="space-y-4">
                                        {/* 🔍 DEBUG: Descomente para ver o campo "quando"
                                        <div className="bg-yellow-50 border border-yellow-300 p-2 rounded text-xs">
                                          <strong>🔍 DEBUG - Campo "quando":</strong> {
                                            criterioEditando.quando 
                                              ? criterioEditando.quando.length > 0 
                                                ? `${criterioEditando.quando.length} ações: ${JSON.stringify(criterioEditando.quando)}`
                                                : "Array vazio []"
                                              : "undefined/null"
                                          }
                                        </div>
                                        */}
                                        <div>
                                          <Label htmlFor="editNomeCriterio">Nome do Critério *</Label>
                                          <Input
                                            id="editNomeCriterio"
                                            value={criterioEditando.nome}
                                            onChange={(e) => setCriterioEditando({ ...criterioEditando, nome: e.target.value })}
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="editFrequencia">Frequência de Lançamento</Label>
                                            <Select
                                              value={criterioEditando.frequenciaLancamento}
                                              onValueChange={(value: any) => setCriterioEditando({ ...criterioEditando, frequenciaLancamento: value })}
                                            >
                                              <SelectTrigger id="editFrequencia">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Mensalmente">📅 Mensalmente</SelectItem>
                                                <SelectItem value="Diariamente">📆 Diariamente</SelectItem>
                                                <SelectItem value="Única vez">🔹 Única vez</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div>
                                            <Label htmlFor="editVinculo">Vínculo</Label>
                                            <Select
                                              value={criterioEditando.vinculo}
                                              onValueChange={(value: any) => setCriterioEditando({ ...criterioEditando, vinculo: value })}
                                            >
                                              <SelectTrigger id="editVinculo">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Aluno Matriculado">👤 Aluno Matriculado</SelectItem>
                                                <SelectItem value="Instrutor">👨‍🏫 Instrutor</SelectItem>
                                                <SelectItem value="Não Vinculado">🔓 Não Vinculado</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        <div>
                                          <Label htmlFor="editVencimento">Critério de Vencimento</Label>
                                          <Select
                                            value={criterioEditando.criterioVencimento}
                                            onValueChange={(value: any) => setCriterioEditando({ ...criterioEditando, criterioVencimento: value })}
                                          >
                                            <SelectTrigger id="editVencimento">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Data Término do Curso">🎓 Data de Término do Curso</SelectItem>
                                              <SelectItem value="30 dias após término">📅 30 dias após término do curso</SelectItem>
                                              <SelectItem value="Fechamento Mensal">📊 Fechamento Mensal</SelectItem>
                                              <SelectItem value="Data Específica">📌 Data Específica</SelectItem>
                                              <SelectItem value="Sem Vencimento">♾️ Sem Vencimento</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {criterioEditando.criterioVencimento === 'Fechamento Mensal' && (
                                          <>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label htmlFor="editDiaFechamento">Dia do Fechamento Mensal *</Label>
                                                <Input
                                                  id="editDiaFechamento"
                                                  type="number"
                                                  min="1"
                                                  max="31"
                                                  value={criterioEditando.diaFechamentoMensal}
                                                  onChange={(e) => setCriterioEditando({ ...criterioEditando, diaFechamentoMensal: parseInt(e.target.value) || 5 })}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Dia do mês (1-31) para fechamento</p>
                                              </div>
                                              <div>
                                                <Label htmlFor="editDiasPagamento">Dias p/ Pagamento após Fechamento *</Label>
                                                <Input
                                                  id="editDiasPagamento"
                                                  type="number"
                                                  min="0"
                                                  max="365"
                                                  value={criterioEditando.diasPagamentoAposFechamento || 0}
                                                  onChange={(e) => setCriterioEditando({ ...criterioEditando, diasPagamentoAposFechamento: parseInt(e.target.value) || 0 })}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Ex: 10 dias após o fechamento</p>
                                              </div>
                                            </div>
                                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                              <div className="flex items-start gap-2">
                                                <div className="text-blue-600 mt-0.5">ℹ️</div>
                                                <div className="text-xs text-blue-800">
                                                  <strong>Como funciona:</strong> O sistema somará todos os custos lançados até o dia <strong>{criterioEditando.diaFechamentoMensal}</strong> de cada mês e gerará um único lançamento com vencimento para <strong>{criterioEditando.diasPagamentoAposFechamento || 0} dias</strong> após a data de fechamento.
                                                </div>
                                              </div>
                                            </div>
                                          </>
                                        )}

                                        {/* 🆕 COMANDO QUANDO - Edição */}
                                        {criterioEditando.vinculo === 'Aluno Matriculado' && (
                                          <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                              <div>
                                                <Label className="text-sm font-semibold text-purple-900">
                                                  ⚡ COMANDO QUANDO (Opcional)
                                                </Label>
                                                <p className="text-xs text-purple-700 mt-1">
                                                  Define em qual <strong>momento/ação</strong> do card do aluno o custo será gerado.
                                                </p>
                                              </div>
                                              {criterioEditando.quando && criterioEditando.quando.length > 0 && (
                                                <Badge className="bg-purple-600">
                                                  {criterioEditando.quando.length} {criterioEditando.quando.length === 1 ? 'ação' : 'ações'}
                                                </Badge>
                                              )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 bg-white rounded border">
                                              {ACOES_DISPARO_CUSTO.map((acao) => {
                                                const isChecked = Boolean(criterioEditando.quando?.includes(acao));
                                                return (
                                                  <div key={acao} className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded">
                                                    <Checkbox
                                                      id={`edit-acao-${acao}`}
                                                      checked={isChecked}
                                                      onCheckedChange={(checked) => {
                                                        const quandoAtual = criterioEditando.quando || [];
                                                        if (checked) {
                                                          setCriterioEditando({
                                                            ...criterioEditando,
                                                            quando: [...quandoAtual, acao]
                                                          });
                                                        } else {
                                                          setCriterioEditando({
                                                            ...criterioEditando,
                                                            quando: quandoAtual.filter((a: AcaoDisparoCusto) => a !== acao)
                                                          });
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`edit-acao-${acao}`}
                                                      className="text-xs font-normal cursor-pointer flex-1"
                                                    >
                                                      {acao}
                                                    </Label>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {/* 🆕 COMANDO QUANDO para Instrutores - Edição */}
                                        {criterioEditando.vinculo === 'Instrutor' && (
                                          <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                              <div>
                                                <Label className="text-sm font-semibold text-orange-900">
                                                  ⚡ COMANDO QUANDO (Opcional)
                                                </Label>
                                                <p className="text-xs text-orange-700 mt-1">
                                                  Define em qual <strong>momento/ação</strong> o custo do instrutor será gerado.
                                                </p>
                                              </div>
                                              {criterioEditando.quando && criterioEditando.quando.length > 0 && (
                                                <Badge className="bg-orange-600">
                                                  {criterioEditando.quando.length} {criterioEditando.quando.length === 1 ? 'ação' : 'ações'}
                                                </Badge>
                                              )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 p-2 bg-white rounded border">
                                              {/* Filtrar apenas ações relevantes para instrutores */}
                                              {ACOES_DISPARO_CUSTO.filter(acao => 
                                                acao === 'Presença Instrutor Confirmada' || 
                                                acao === 'Instrutor Vinculado à Prova'
                                              ).map((acao) => {
                                                const isChecked = Boolean(criterioEditando.quando?.includes(acao));
                                                return (
                                                  <div key={acao} className="flex items-center space-x-2 p-2 hover:bg-orange-50 rounded">
                                                    <Checkbox
                                                      id={`edit-acao-instrutor-${acao}`}
                                                      checked={isChecked}
                                                      onCheckedChange={(checked) => {
                                                        const quandoAtual = criterioEditando.quando || [];
                                                        if (checked) {
                                                          setCriterioEditando({
                                                            ...criterioEditando,
                                                            quando: [...quandoAtual, acao]
                                                          });
                                                        } else {
                                                          setCriterioEditando({
                                                            ...criterioEditando,
                                                            quando: quandoAtual.filter((a: AcaoDisparoCusto) => a !== acao)
                                                          });
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`edit-acao-instrutor-${acao}`}
                                                      className="text-xs font-normal cursor-pointer flex-1"
                                                    >
                                                      {acao}
                                                    </Label>
                                                  </div>
                                                );
                                              })}
                                            </div>

                                            <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                                              <strong>💡 Dica:</strong> Escolha quando gerar custos do instrutor:
                                              <br />• "Presença Instrutor Confirmada" - ao confirmar presença em uma turma
                                              <br />• "Instrutor Vinculado à Prova" - ao selecionar instrutor para uma prova no Módulo 03
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id="editAtivo"
                                            checked={criterioEditando.ativo}
                                            onChange={(e) => setCriterioEditando({ ...criterioEditando, ativo: e.target.checked })}
                                            className="w-4 h-4"
                                          />
                                          <Label htmlFor="editAtivo" className="cursor-pointer">
                                            Critério ativo
                                          </Label>
                                        </div>

                                        <div className="flex gap-3">
                                          <Button 
                                            variant="outline" 
                                            onClick={tentarFecharEdicao}
                                            className="flex-1"
                                          >
                                            Cancelar
                                          </Button>
                                          <Button 
                                            onClick={handleEditarCriterio} 
                                            className="flex-1"
                                          >
                                            Salvar Alterações
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>

                                {/* 🆕 Dialog de Confirmação ao Fechar */}
                                <Dialog open={mostrarConfirmacaoFechar} onOpenChange={setMostrarConfirmacaoFechar}>
                                  <DialogContent className="max-w-md">
                                    <div className="flex items-start gap-4">
                                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                      </div>
                                      <div className="flex-1">
                                        <DialogHeader>
                                          <DialogTitle className="text-xl mb-2">Descartar Alterações?</DialogTitle>
                                          <DialogDescription className="text-base">
                                            Você fez alterações que não foram salvas. Deseja realmente descartar essas mudanças?
                                          </DialogDescription>
                                        </DialogHeader>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mt-4">
                                      <p className="text-sm text-yellow-800">
                                        <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as modificações serão perdidas.
                                      </p>
                                    </div>

                                    <div className="flex gap-3 justify-end mt-6">
                                      <Button
                                        variant="outline"
                                        onClick={() => setMostrarConfirmacaoFechar(false)}
                                      >
                                        Continuar Editando
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={descartarAlteracoes}
                                      >
                                        Sim, Descartar Tudo
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleExcluirCriterio(criterio.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produtos Extras */}
          <TabsContent value="extras">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Produtos Extras</CardTitle>
                    <CardDescription>Itens adicionais disponíveis para matrícula</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Produto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Produto Extra</DialogTitle>
                        <DialogDescription>Cadastre um item adicional que pode ser oferecido aos alunos</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tipoProduto">Tipo de Produto</Label>
                          <Select
                            value={novoProduto.tipo}
                            onValueChange={(value: 'produto' | 'extra') => setNovoProduto({ ...novoProduto, tipo: value })}
                          >
                            <SelectTrigger id="tipoProduto">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="produto">Produto/Valor de Curso (PV)</SelectItem>
                              <SelectItem value="extra">Produto Extra (EX)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {novoProduto.tipo === 'produto' ? 'Código: PVxxxx (Valor de Curso)' : 'Código: EXxxxx (Produto Extra)'}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="nomeProduto">Nome do Produto</Label>
                          <Input
                            id="nomeProduto"
                            value={novoProduto.nome}
                            onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                            placeholder="Ex: Apostila Premium, Kit Ferramentas"
                          />
                        </div>
                        <div>
                          <Label htmlFor="valorProduto">Valor (R$)</Label>
                          <Input
                            id="valorProduto"
                            type="number"
                            value={novoProduto.valor || ''}
                            onChange={(e) => setNovoProduto({ ...novoProduto, valor: parseFloat(e.target.value) })}
                            placeholder="80"
                          />
                        </div>
                        <div>
                          <Label>Custos Associados</Label>
                          <div className="space-y-2 mt-2">
                            {custosAuditaveis.map((custo) => (
                              <div key={custo.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`custo-${custo.id}`}
                                  checked={novoProduto.custosAssociados.includes(custo.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setNovoProduto({ ...novoProduto, custosAssociados: [...novoProduto.custosAssociados, custo.id] });
                                    } else {
                                      setNovoProduto({ ...novoProduto, custosAssociados: novoProduto.custosAssociados.filter(id => id !== custo.id) });
                                    }
                                  }}
                                />
                                <Label htmlFor={`custo-${custo.id}`} className="text-sm font-normal cursor-pointer">
                                  <span className="font-mono text-xs text-blue-600">{custo.codigo}</span> - {custo.nome} - R$ {custo.valor.toFixed(2)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button onClick={handleAdicionarProdutoExtra} className="w-full">Salvar Produto</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {produtosExtras.map((produto) => {
                    const custosDosProduto = custosAuditaveis.filter(custo => 
                      produto.custosAssociados?.includes(custo.id)
                    );
                    return (
                      <Card key={produto.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={produto.tipo === 'produto' ? 'default' : 'secondary'} className="text-xs">
                                    {produto.codigo}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {produto.tipo === 'produto' ? 'Valor Curso' : 'Extra'}
                                  </span>
                                </div>
                                <div className="font-medium mt-1">{produto.nome}</div>
                                <div className="font-medium text-green-600 mt-1">
                                  R$ {produto.valor.toFixed(2)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirDialogEditar(produto)}
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <Pencil className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                            {custosDosProduto.length > 0 && (
                              <div className="pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Custos Associados:</div>
                                <div className="space-y-1">
                                  {custosDosProduto.map(custo => (
                                    <div key={custo.id} className="text-xs text-gray-600 flex justify-between">
                                      <span>• {custo.nome}</span>
                                      <span className="text-blue-600">R$ {custo.valor.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dialog de Edição */}
            <Dialog open={dialogEditarAberto} onOpenChange={setDialogEditarAberto}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Produto Extra</DialogTitle>
                  <DialogDescription>Altere as informações do produto</DialogDescription>
                </DialogHeader>
                {produtoEditando && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editNomeProduto">Nome do Produto</Label>
                      <Input
                        id="editNomeProduto"
                        value={produtoEditando.nome}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                        placeholder="Ex: Apostila Premium, Kit Ferramentas"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editValorProduto">Valor (R$)</Label>
                      <Input
                        id="editValorProduto"
                        type="number"
                        value={produtoEditando.valor || ''}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, valor: parseFloat(e.target.value) })}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <Label>Custos Associados</Label>
                      <div className="space-y-2 mt-2">
                        {custosAuditaveis.map((custo) => (
                          <div key={custo.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-custo-${custo.id}`}
                              checked={produtoEditando.custosAssociados.includes(custo.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProdutoEditando({ 
                                    ...produtoEditando, 
                                    custosAssociados: [...produtoEditando.custosAssociados, custo.id] 
                                  });
                                } else {
                                  setProdutoEditando({ 
                                    ...produtoEditando, 
                                    custosAssociados: produtoEditando.custosAssociados.filter(id => id !== custo.id) 
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`edit-custo-${custo.id}`} className="text-sm font-normal cursor-pointer">
                              <span className="font-mono text-xs text-blue-600">{custo.codigo}</span> - {custo.nome} - R$ {custo.valor.toFixed(2)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleEditarProdutoExtra} className="w-full">Salvar Alterações</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Comunicações - Email e WhatsApp */}
          <TabsContent value="comunicacoes">
            <div className="grid grid-cols-2 gap-6">
              {/* Configurações de Email */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <CardTitle>Configurações de Email</CardTitle>
                  </div>
                  <CardDescription>
                    Configure o servidor SMTP para envio de tokens de matrícula e notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${configuracoesEmail.ativo ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {configuracoesEmail.ativo ? 'Ativo e configurado' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Remetente</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-mono">{configuracoesEmail.remetente}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Servidor SMTP</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-mono">{configuracoesEmail.host}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600">Porta</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-sm font-mono">{configuracoesEmail.porta}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Usuário</Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 truncate">
                          <span className="text-sm font-mono">{configuracoesEmail.usuario}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-blue-800 mb-1">Funcionalidades</div>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Envio de tokens de matrícula</li>
                          <li>• Confirmação de inscrição</li>
                          <li>• Lembretes de pagamento</li>
                          <li>• Avisos de início de curso</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={abrirDialogEditarEmail}
                    className="w-full mt-4"
                  >
                    Editar Configurações
                  </Button>
                </CardContent>
              </Card>

              {/* Configurações de WhatsApp */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <CardTitle>Configurações do WhatsApp Web</CardTitle>
                  </div>
                  <CardDescription>
                    Configure a integração com WhatsApp para o Módulo 04 - Central de Vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${configuracoesWhatsApp.ativo ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {configuracoesWhatsApp.ativo ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Número WhatsApp</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-mono">+{configuracoesWhatsApp.numero}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">API Key</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-mono">{'•'.repeat(20)}{configuracoesWhatsApp.apiKey.slice(-4)}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Webhook URL</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 truncate">
                        <span className="text-xs font-mono">{configuracoesWhatsApp.webhookUrl}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-green-800 mb-1">Funcionalidades</div>
                        <ul className="text-xs text-green-700 space-y-1">
                          <li>• Central de Vendas (Módulo 04)</li>
                          <li>• Atendimento a leads</li>
                          <li>• Envio de informações de cursos</li>
                          <li>• Follow-up automatizado</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={abrirDialogEditarWhatsApp}
                    className="w-full mt-4"
                  >
                    Editar Configurações
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Card informativo */}
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="text-yellow-600 text-2xl">💡</div>
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Nota Importante</h4>
                    <p className="text-sm text-yellow-700">
                      Estas configurações são apenas para visualização nesta versão de demonstração. 
                      Em produção, você poderá editar e testar as conexões de Email e WhatsApp. 
                      As credenciais reais devem ser configuradas com segurança através de variáveis de ambiente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup de Dados */}
          <TabsContent value="backup">
            <BackupDados />
            
            {/* 🆕 Download do Projeto Completo */}
            <div className="mt-6">
              <DownloadProjetoCompleto />
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Edição de Email */}
        <Dialog open={dialogEmailAberto} onOpenChange={setDialogEmailAberto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Configurações de Email</DialogTitle>
              <DialogDescription>Configure o servidor SMTP para envio de emails</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailRemetente">Email Remetente</Label>
                <Input
                  id="emailRemetente"
                  type="email"
                  value={emailEditando.remetente}
                  onChange={(e) => setEmailEditando({ ...emailEditando, remetente: e.target.value })}
                  placeholder="noreply@smcorp.com"
                />
              </div>
              <div>
                <Label htmlFor="emailHost">Servidor SMTP</Label>
                <Input
                  id="emailHost"
                  value={emailEditando.host}
                  onChange={(e) => setEmailEditando({ ...emailEditando, host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="emailPorta">Porta</Label>
                  <Input
                    id="emailPorta"
                    type="number"
                    value={emailEditando.porta || ''}
                    onChange={(e) => setEmailEditando({ ...emailEditando, porta: parseInt(e.target.value) })}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="emailAtivo">Status</Label>
                  <Select
                    value={emailEditando.ativo ? 'ativo' : 'inativo'}
                    onValueChange={(value) => setEmailEditando({ ...emailEditando, ativo: value === 'ativo' })}
                  >
                    <SelectTrigger id="emailAtivo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="emailUsuario">Usuário</Label>
                <Input
                  id="emailUsuario"
                  value={emailEditando.usuario}
                  onChange={(e) => setEmailEditando({ ...emailEditando, usuario: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="emailSenha">Senha</Label>
                <Input
                  id="emailSenha"
                  type="password"
                  value={emailEditando.senha}
                  onChange={(e) => setEmailEditando({ ...emailEditando, senha: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button onClick={handleSalvarEmail} className="w-full">
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de WhatsApp */}
        <Dialog open={dialogWhatsAppAberto} onOpenChange={setDialogWhatsAppAberto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Configurações do WhatsApp</DialogTitle>
              <DialogDescription>Configure a integração com WhatsApp Web</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="whatsappNumero">Número WhatsApp</Label>
                <Input
                  id="whatsappNumero"
                  value={whatsappEditando.numero}
                  onChange={(e) => setWhatsappEditando({ ...whatsappEditando, numero: e.target.value })}
                  placeholder="5511987654321"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: código do país + DDD + número (sem espaços ou caracteres especiais)</p>
              </div>
              <div>
                <Label htmlFor="whatsappApiKey">API Key</Label>
                <Input
                  id="whatsappApiKey"
                  type="password"
                  value={whatsappEditando.apiKey}
                  onChange={(e) => setWhatsappEditando({ ...whatsappEditando, apiKey: e.target.value })}
                  placeholder="sua_api_key_aqui"
                />
              </div>
              <div>
                <Label htmlFor="whatsappWebhook">Webhook URL</Label>
                <Input
                  id="whatsappWebhook"
                  value={whatsappEditando.webhookUrl}
                  onChange={(e) => setWhatsappEditando({ ...whatsappEditando, webhookUrl: e.target.value })}
                  placeholder="https://seu-dominio.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="whatsappAtivo">Status da Conexão</Label>
                <Select
                  value={whatsappEditando.ativo ? 'conectado' : 'desconectado'}
                  onValueChange={(value) => setWhatsappEditando({ ...whatsappEditando, ativo: value === 'conectado' })}
                >
                  <SelectTrigger id="whatsappAtivo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conectado">Conectado</SelectItem>
                    <SelectItem value="desconectado">Desconectado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Button onClick={handleSalvarWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Dados da Empresa */}
        <DialogEmpresa
          open={dialogEmpresaAberto}
          onOpenChange={setDialogEmpresaAberto}
          dadosAtuais={dadosInstitucionais}
        />

        {/* Dialog de Precificações da Empresa */}
        {empresaSelecionadaPrecificacoes && (
          <DialogPrecificacoesEmpresa
            open={dialogPrecificacoesAberto}
            onOpenChange={setDialogPrecificacoesAberto}
            empresaId={empresaSelecionadaPrecificacoes.id}
            empresaNome={empresaSelecionadaPrecificacoes.nome}
          />
        )}

        {/* Dialog de Edição de Cliente PJ */}
        <DialogEditarClientePJ
          open={dialogEditarClientePJAberto}
          onOpenChange={setDialogEditarClientePJAberto}
          cliente={clientePJEditando}
          cursos={cursos}
          produtosExtras={produtosExtras}
          onSalvar={editarClientePJ}
        />

        {/* 🆕 Dialog de Relatório de Instrutor */}
        {instrutorSelecionado && (
          <DialogRelatorioInstrutor
            open={dialogRelatorioInstrutorAberto}
            onOpenChange={setDialogRelatorioInstrutorAberto}
            instrutor={instrutorSelecionado}
            turmas={turmas}
            cursos={cursos}
          />
        )}

        {/* 🆕 Dialog de Custos do Instrutor */}
        {instrutorSelecionado && (
          <DialogCustosInstrutor
            open={dialogCustosInstrutorAberto}
            onOpenChange={setDialogCustosInstrutorAberto}
            instrutor={instrutorSelecionado}
            custosDisponiveis={custosAuditaveis}
            onVincularCusto={(custoId) => vincularCustoInstrutor(instrutorSelecionado.id, custoId)}
            onDesvincularCusto={(custoId) => desvincularCustoInstrutor(instrutorSelecionado.id, custoId)}
          />
        )}
      </div>
    </div>
  );
};