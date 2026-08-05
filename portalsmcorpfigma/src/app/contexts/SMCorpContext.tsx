import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

// Context para gerenciar todo o estado da Plataforma SMCORP - v2.1
// Tipos
export interface DadosInstitucionais {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  site: string;
  cor: string;
  // 💰 Dados Financeiros - Caixa
  contaCorrente?: string;
  agencia?: string;
  banco?: string;
  chavePix?: string;
  caixaFisico?: number; // Valor em caixa físico
  observacoesCaixa?: string;
}

export interface ConfiguracoesEmail {
  remetente: string;
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  ativo: boolean;
}

export interface ConfiguracoesWhatsApp {
  numero: string;
  apiKey: string;
  webhookUrl: string;
  ativo: boolean;
  mensagemPadrao?: string;
}

export interface Sala {
  id: string;
  nome: string;
  localizacao: string;
  capacidadeMaxima: number;
  custoDiaria: number;
}

export interface Usuario {
  id: string;
  codigo: string;
  nome: string;
  nivel: 'Master' | 'Admin' | 'Vendedor';
  pin?: string; // PIN de 6 dígitos para ações sensíveis (apenas para Master)
  permissoes: {
    modulos: {
      modulo00: boolean;
      modulo01: boolean;
      modulo02: boolean;
      modulo03: boolean;
      modulo04: boolean;
      modulo05: boolean;
      modulo06: boolean;
      modulo07: boolean;
      modulo08: boolean;
    };
    acoes: {
      // Gestão de Alunos
      cadastrarAluno: boolean;
      editarAluno: boolean;
      excluirAluno: boolean;
      alterarStatusPagamento: boolean;
      alterarStatusDocumentos: boolean;
      alterarStatusProva: boolean;
      // Gestão de Cursos
      cadastrarCurso: boolean;
      editarCurso: boolean;
      excluirCurso: boolean;
      // Gestão de Turmas
      cadastrarTurma: boolean;
      editarTurma: boolean;
      excluirTurma: boolean;
      // Gestão de Infraestrutura
      gerenciarSalas: boolean;
      gerenciarUsuarios: boolean;
      gerenciarEmpresas: boolean;
      gerenciarFornecedores: boolean;
      // Configurações
      acessarConfiguracoes: boolean;
    };
  };
}

// Nova interface para precificações customizadas por empresa
export interface PrecificacaoEmpresa {
  id: string;
  cursoId: string; // Vínculo com o curso do Módulo 01
  valorNegociado: number;
  produtosInclusos: string[]; // IDs dos produtos (principais + extras) inclusos nesta precificação
  observacoes?: string;
  dataVigencia?: string;
  ativo: boolean;
}

export interface ClientePJ {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string;
  razaoSocial?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  cursoId?: string; // ID do curso vinculado (mantido para compatibilidade)
  precificacaoNegociada: number; // Mantido para compatibilidade
  precificacoes: PrecificacaoEmpresa[]; // Nova funcionalidade: múltiplas precificações
  formasPagamentoPermitidas?: string[]; // Formas de pagamento permitidas para esta empresa
  // Credenciais de acesso para Módulo 05
  login?: string;
  senha?: string;
  acessoAtivo?: boolean;
}

export interface CustoAuditavel {
  id: string;
  codigo: string; // 🆕 Código sequencial CA0001, CA0002, etc.
  nome: string;
  valor: number;
  fornecedorId?: string; // ID do fornecedor vinculado
  clientePJId?: string; // 🆕 ID da empresa vinculada
  criterioCustoId?: string; // 🆕 ID do critério de custo vinculado
  tipoVinculo?: 'nenhum' | 'empresa' | 'instrutor'; // 🆕 Tipo de vínculo (Nenhum, Empresa ou Instrutor)
  instrutorId?: string; // 🆕 ID do instrutor vinculado (quando tipoVinculo = 'instrutor')
}

// 🆕 Interface para Lançamentos de Custo (custos gerados automaticamente ou manualmente)
export interface LancamentoCusto {
  id: string;
  codigo: string; // L0001, L0002, etc.
  custoAuditavelId: string; // ID do custo auditável
  criterioCustoId?: string; // ID do critério que gerou (se automático)
  alunoId?: string; // ID do aluno vinculado (se aplicável)
  turmaId?: string; // ID da turma (derivado do aluno)
  cursoId?: string; // ID do curso (derivado da turma)
  fornecedorId?: string; // 🆕 ID do fornecedor (copiado do custo auditável no momento da criação)
  instrutorId?: string; // 🆕 ID do instrutor (quando aplicável)
  numeroProva?: string; // 🆕 Número da prova (ex: "01", "02")
  nomeProva?: string; // 🆕 Nome da prova (ex: "Prova Teórica", "Prova Prática")
  valor: number;
  dataGeracao: string; // Data que o lançamento foi criado
  dataVencimento: string; // Data de vencimento
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';
  dataPagamento?: string; // Data que foi pago (se aplicável)
  observacoes?: string;
  geradoAutomaticamente: boolean; // true se foi gerado por disparo automático
  acaoDisparo?: AcaoDisparoCusto; // Qual ação disparou (se automático)
}

// 🆕 Tipo para ações que disparam custos (Comando QUANDO)
export type AcaoDisparoCusto = 
  | 'Nova Matrícula Criada'
  | 'Status → Agendado'
  | 'Status → Confirmar'
  | 'Status → Confirmado'
  | 'Status → Presente'
  | 'Primeiro Pagamento Registrado'
  | 'Pagamento Confirmado (Master)'
  | 'Todos Documentos Aprovados'
  | 'Documento Individual Aprovado'
  | 'Prova Agendada'
  | 'Prova Cancelada'
  | 'Resultado Prova → Aprovado'
  | 'Resultado Prova → Reprovado'
  | 'Resultado Prova → No Show'
  | 'Aluno Editado'
  | 'Aluno Substituído'
  | 'Aluno Transferido'
  | 'Presença Marcada no Dia'
  | 'Link Enviado (WhatsApp/Email)'
  | 'Presença Instrutor Confirmada' // 🆕 Disparo baseado em presença de instrutor
  | 'Instrutor Vinculado à Prova'; // 🆕 Disparo quando instrutor é selecionado para uma prova

// 🆕 Interface para Critérios de Custo
export interface CriterioCusto {
  id: string;
  codigo: string; // 🆕 Código sequencial CR0001, CR0002, etc.
  nome: string;
  frequenciaLancamento: 'Mensalmente' | 'Diariamente' | 'Única vez';
  vinculo: 'Aluno Matriculado' | 'Não Vinculado' | 'Instrutor'; // 🆕 Adicionado vínculo com Instrutor
  criterioVencimento: 'Data Término do Curso' | '30 dias após término' | 'Fechamento Mensal' | 'Data Específica' | 'Sem Vencimento';
  diasParaVencimento?: number; // Usado para vencimentos personalizados
  diaFechamentoMensal?: number; // Dia do mês para fechamento mensal (1-31)
  diasPagamentoAposFechamento?: number; // 🆕 Dias para pagamento após o fechamento mensal
  quando?: AcaoDisparoCusto[]; // 🆕 COMANDO QUANDO: Define em qual momento/ação o custo é gerado (OPCIONAL)
  ativo: boolean;
  dataCriacao: string;
}

// 🆕 Lista de todas as ações disponíveis para o Comando QUANDO
export const ACOES_DISPARO_CUSTO: AcaoDisparoCusto[] = [
  'Nova Matrícula Criada',
  'Status → Agendado',
  'Status → Confirmar',
  'Status → Confirmado',
  'Status → Presente',
  'Primeiro Pagamento Registrado',
  'Pagamento Confirmado (Master)',
  'Todos Documentos Aprovados',
  'Documento Individual Aprovado',
  'Prova Agendada',
  'Prova Cancelada',
  'Resultado Prova → Aprovado',
  'Resultado Prova → Reprovado',
  'Resultado Prova → No Show',
  'Aluno Editado',
  'Aluno Substituído',
  'Aluno Transferido',
  'Presença Marcada no Dia',
  'Link Enviado (WhatsApp/Email)',
  'Presença Instrutor Confirmada', // 🆕 Nova ação para instrutores
  'Instrutor Vinculado à Prova' // 🆕 Disparo quando instrutor é selecionado para uma prova
];

export interface Fornecedor {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email?: string;
}

// 🆕 Interface para Instrutores
export interface Instrutor {
  id: string;
  codigo: string; // IN0001, IN0002, etc.
  nome: string;
  funcao: string;
  telefone?: string; // 🆕 Telefone do instrutor para contato via WhatsApp
  custosVinculados?: string[]; // 🆕 IDs dos custos vinculados ao instrutor
}

// 🆕 Interface para Provas Agendadas
export interface ProvaAgendada {
  id: string;
  turmaId: string;
  numeroProva: string; // P001, P002, etc.
  nomeProva: string; // Nome da prova
  data: string; // Data da prova (YYYY-MM-DD)
  hora: string; // Horário da prova (HH:MM)
  instrutorId: string; // ID do instrutor aplicador
  alunosIds: string[]; // IDs dos alunos que farão a prova
  dataCriacao: string; // Data de criação do agendamento
  criadoPor?: string; // ID do usuário que criou
}

export interface ProdutoExtra {
  id: string;
  codigo: string; // PV0001 para Produto/Valor, EX0001 para Extra
  tipo: 'produto' | 'extra'; // Produto = valor de curso, Extra = produto extra
  nome: string;
  valor: number;
  custosAssociados: string[]; // IDs dos custos auditáveis
}

export interface Curso {
  id: string;
  codigo: string; // Código sequencial C0001, C0002, etc.
  nome: string;
  categoria: string;
  cargaHoraria: number;
  cargaHorariaTotal: number;
  horasAulaPorDia: number;
  horarioInicio: string;
  horarioFim: string;
  usaFimDeSemana: boolean;
  valorBase: number;
  descricao: string;
  produtosVinculados?: string[]; // IDs dos produtos do tipo 'produto' (PV0001)
  extrasVinculados?: string[]; // IDs dos produtos do tipo 'extra' (EX0001)
  intervalo?: number;
  conteudoProgramatico?: string;
  validadeCertificacao?: number; // Em meses (ex: 12, 24, 36)
  documentosObrigatorios?: {
    nome: string;
    requerUpload: boolean;
  }[];
  excluido?: boolean; // Soft delete - marcar curso como excluído sem remover do histórico
}

export interface Turma {
  id: string;
  codigo: string;
  cursoId: string;
  dataInicio: string;
  dataFim: string;
  horario: string;
  salaId: string;
  vagasDisponiveis: number;
  statusTurma: 'Planejada' | 'Confirmada' | 'Em Andamento' | 'Concluída';
  nomePersonalizado?: string;
  clientePJId?: string;
  preco: number;
  instrutores?: { // 🆕 Instrutores vinculados à turma
    instrutorId: string;
    presencas: { // Presenças confirmadas por data
      data: string; // YYYY-MM-DD
      confirmadoEm: string; // Timestamp de confirmação
      confirmadoPor: string; // ID do usuário que confirmou
    }[];
  }[];
}

export interface Aluno {
  id: string;
  codigoSistema: string;
  turmaId: string;
  nome: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string;
  telefone: string;
  email: string;
  endereco?: string;
  valorTotal: number;
  desconto: number;
  statusLink: 'Agendado' | 'Confirmar' | 'Confirmado' | 'Presente';
  foto?: string;
  statusPagamento: boolean; // Mantido para compatibilidade (será calculado baseado em pagamentos)
  statusDocumentos: boolean;
  pagamentos?: {
    historico: {
      id: string;
      valor: number;
      data: string;
      hora: string;
      formaPagamento: string;
      observacoes?: string;
      registradoPor: string; // ID do usuário que registrou
      confirmedoPor?: string; // ID do usuário Master que confirmou
      dataConfirmacao?: string;
      horaConfirmacao?: string;
      codigoBarrasBoleto?: string; // Código de barras (quando forma = Boleto)
      dataVencimentoBoleto?: string; // Data de vencimento (quando forma = Boleto)
      numeroNotaFiscal?: string; // 🆕 Número da Nota Fiscal (obrigatório PJ, opcional PF)
      vinculadoA?: string; // CPF (PF) ou CNPJ (PJ) vinculado ao pagamento
      loteConfirmacaoPagamentoId?: string; // 🆕 ID do lote de confirmação em massa no Módulo 07
    }[];
    valorPago: number; // Total pago
    pendente: boolean; // Tem pagamento aguardando confirmação do Master
  };
  documentos: {
    nome: string;
    tipo: 'upload' | 'texto'; // Upload de arquivo ou preenchimento de texto
    arquivo?: string; // Base64 ou URL do arquivo (se tipo = upload)
    valorTexto?: string; // Valor digitado (se tipo = texto)
    dataEnvio: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado';
  }[];
  dataInicioAluno: string;
  dataFimAluno: string;
  statusProva: {
    ativo: boolean;
    instrutor?: string;
    data?: string;
    hora?: string;
    numeroProva?: string;
    nomeProva?: string;
    resultado?: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Faltou';
  };
  resultadoProva?: {
    status: 'Aprovado' | 'Reprovado' | 'No Show';
    data: string;
    hora: string;
    observacoes: string;
    registradoPor: string; // ID do usuário que registrou
    confirmedoPor: string; // ID do usuário Master que confirmou
    dataConfirmacao: string;
    horaConfirmacao: string;
  };
  produtosExtras?: string[];
  recibos?: {
    produtoId: string; // ID do produto vinculado
    produtoNome: string; // Nome do produto
    numeroRecibo: string; // CP0001, CP0002, etc
    dataGeracao: string; // Data de geração do recibo
    tipoProduto: 'principal' | 'extra'; // Produto principal ou extra
    pagoPorPF?: boolean; // Se for PJ, indica se este produto foi pago pela PF
  }[]; // 🆕 Recibos gerados por produto
  lancamentosProdutosPF?: {
    id: string; // ID único do lançamento
    produtoId: string; // ID do produto extra
    produtoNome: string; // Nome do produto
    valorTotal: number; // Valor do produto
    pagamentos: {
      historico: {
        id: string;
        valor: number;
        data: string;
        hora: string;
        formaPagamento: string;
        observacoes?: string;
        registradoPor: string;
        confirmedoPor?: string;
        dataConfirmacao?: string;
        horaConfirmacao?: string;
        numeroNotaFiscal?: string;
      }[];
      valorPago: number;
      pendente: boolean;
    };
    recibos?: {
      numeroRecibo: string;
      dataGeracao: string;
    }[];
  }[]; // 🆕 Lançamentos separados para produtos extras pagos pela PF (quando aluno é PJ)
  observacoes?: string;
  presencasPorDia?: {
    [data: string]: boolean; // "2026-01-20": true
  };
  filaEspera?: boolean; // Indica que o aluno está em fila de espera (não matriculado ainda)
  substituido?: boolean; // Indica se este aluno foi substituído e não deve mais aparecer na turma
  substitutoDe?: string; // Código do aluno que este aluno substituiu (ex: "A0009")
  dataSubstituicao?: string; // Data em que o aluno foi substituído
  motivoSubstituicao?: string; // Motivo da substituição
  loteAprovacaoId?: string; // ID único do lote de aprovação (para agrupar pagamentos no Módulo 08)
  clientePJId?: string; // ID do Cliente PJ (Pessoa Jurídica) vinculado ao aluno
}

interface SMCorpContextType {
  dadosInstitucionais: DadosInstitucionais;
  configuracoesEmail: ConfiguracoesEmail;
  configuracoesWhatsApp: ConfiguracoesWhatsApp;
  salas: Sala[];
  usuarios: Usuario[];
  usuarioAtual: Usuario; // Usuário logado no sistema
  clientesPJ: ClientePJ[];
  custosAuditaveis: CustoAuditavel[];
  criteriosCusto: CriterioCusto[]; // 🆕 Critérios de Custo
  lancamentosCusto: LancamentoCusto[]; // 🆕 Lançamentos de Custo (gerados automaticamente ou manualmente)
  fornecedores: Fornecedor[];
  instrutores: Instrutor[]; // 🆕 Instrutores
  provasAgendadas: ProvaAgendada[]; // 🆕 Provas Agendadas
  produtosExtras: ProdutoExtra[];
  cursos: Curso[];
  turmas: Turma[];
  alunos: Aluno[];
  adicionarSala: (sala: Omit<Sala, 'id'>) => void;
  adicionarUsuario: (usuario: Omit<Usuario, 'id'>) => void;
  editarUsuario: (id: string, dados: Partial<Omit<Usuario, 'id'>>) => void;
  adicionarClientePJ: (cliente: Omit<ClientePJ, 'id' | 'codigo'>) => void;
  editarClientePJ: (id: string, dados: Partial<Omit<ClientePJ, 'id' | 'codigo'>>) => void;
  adicionarPrecificacaoEmpresa: (clientePJId: string, precificacao: Omit<PrecificacaoEmpresa, 'id'>) => void;
  editarPrecificacaoEmpresa: (clientePJId: string, precificacaoId: string, dadosAtualizados: Partial<Omit<PrecificacaoEmpresa, 'id'>>) => void;
  excluirPrecificacaoEmpresa: (clientePJId: string, precificacaoId: string) => void;
  adicionarCustoAuditavel: (custo: Omit<CustoAuditavel, 'id' | 'codigo'>) => void;
  editarCustoAuditavel: (id: string, custoAtualizado: Partial<Omit<CustoAuditavel, 'id' | 'codigo'>>) => void;
  removerCustoAuditavel: (id: string) => void;
  adicionarCriterioCusto: (criterio: Omit<CriterioCusto, 'id' | 'dataCriacao'>) => void; // 🆕
  editarCriterioCusto: (id: string, criterioAtualizado: Partial<Omit<CriterioCusto, 'id' | 'dataCriacao'>>) => void; // 🆕
  excluirCriterioCusto: (id: string) => void; // 🆕
  adicionarFornecedor: (fornecedor: Omit<Fornecedor, 'id'>) => void;
  editarFornecedor: (id: string, fornecedorAtualizado: Partial<Omit<Fornecedor, 'id'>>) => void;
  adicionarInstrutor: (instrutor: Omit<Instrutor, 'id' | 'codigo'>) => void; // 🆕
  editarInstrutor: (id: string, instrutorAtualizado: Partial<Omit<Instrutor, 'id' | 'codigo'>>) => void; // 🆕
  excluirInstrutor: (id: string) => void; // 🆕
  vincularCustoInstrutor: (instrutorId: string, custoId: string) => void; // 🆕 Vincular custo ao instrutor
  desvincularCustoInstrutor: (instrutorId: string, custoId: string) => void; // 🆕 Desvincular custo do instrutor
  dispararCustosInstrutorAutomaticos: (instrutorId: string, turmaId: string, dataPresenca: string) => void; // 🆕 Disparar custos automáticos de instrutor
  dispararCustosInstrutorProva: (instrutorId: string, alunoId: string, numeroProva: string, nomeProva: string, dataProva?: string) => void; // 🆕 Disparar custos quando instrutor é vinculado a prova
  adicionarProdutoExtra: (produto: Omit<ProdutoExtra, 'id' | 'codigo'>) => void;
  editarProdutoExtra: (id: string, produtoAtualizado: Partial<Omit<ProdutoExtra, 'id' | 'codigo' | 'tipo'>>) => void;
  editarSala: (id: string, salaAtualizada: Partial<Omit<Sala, 'id'>>) => void;
  adicionarCurso: (curso: Omit<Curso, 'id' | 'codigo'>) => void;
  atualizarCurso: (id: string, dadosAtualizados: Partial<Curso>) => void;
  excluirCurso: (id: string) => void;
  adicionarTurma: (turma: Omit<Turma, 'id' | 'codigo'>) => void;
  atualizarTurma: (id: string, dadosAtualizados: Partial<Turma>) => void;
  excluirTurma: (id: string) => void;
  vincularInstrutorTurma: (turmaId: string, instrutorId: string) => void; // 🆕 Vincular instrutor à turma
  desvincularInstrutorTurma: (turmaId: string, instrutorId: string) => void; // 🆕 Desvincular instrutor da turma
  confirmarPresencaInstrutor: (turmaId: string, instrutorId: string, data: string, usuarioId: string) => void; // 🆕 Confirmar presença do instrutor
  adicionarAluno: (aluno: Omit<Aluno, 'id' | 'codigoSistema'>) => void;
  atualizarAluno: (id: string, dadosAtualizados: Partial<Aluno>) => void;
  atualizarAlunosEmLote: (atualizacoes: Map<string, Partial<Aluno>>) => void;
  excluirAluno: (id: string) => void;
  substituirAluno: (alunoAntigoId: string, alunoNovoId: string, motivo?: string) => void; // Substituir aluno por outro da fila
  transferirAluno: (alunoId: string, novaTurmaId: string) => void; // Transferir aluno para outra turma do mesmo curso
  marcarPresencaDia: (alunoId: string, data: string) => void; // Marcar presença em um dia específico
  gerarCodigoProva: () => string;
  cancelarProva: (alunoId: string) => void;
  registrarResultadoProva: (alunoId: string, status: 'Aprovado' | 'Reprovado' | 'No Show', observacoes: string, usuarioId: string) => void;
  agendarProva: (dados: { turmaId: string; numeroProva: string; nomeProva: string; data: string; hora: string; instrutorId: string; alunosIds: string[] }) => void; // 🆕 Agendar prova
  editarProvaAgendada: (provaId: string, dados: Partial<Omit<ProvaAgendada, 'id' | 'dataCriacao'>>) => void; // 🆕 Editar prova agendada
  excluirProvaAgendada: (provaId: string) => void; // 🆕 Excluir prova agendada
  atualizarConfiguracoesEmail: (config: Partial<ConfiguracoesEmail>) => void;
  atualizarConfiguracoesWhatsApp: (config: Partial<ConfiguracoesWhatsApp>) => void;
  atualizarDadosInstitucionais: (dados: Partial<DadosInstitucionais>) => void; // 🆕 Atualizar dados da empresa
  resetarDados: () => void;
  gerarNumeroRecibo: () => string; // 🆕 Gerar número sequencial de recibo
  dispararCustosAutomaticos: (acao: AcaoDisparoCusto, alunoId: string, dadosAdicionais?: any) => void; // 🆕 Disparar custos automaticamente
  cancelarCustosPorAcao: (alunoId: string, acao: AcaoDisparoCusto) => void; // 🆕 Cancelar custos gerados por uma ação específica
  limparLancamentosOrfaos: () => number; // 🆕 Limpar lançamentos de custos órfãos (retorna quantidade removida)
  renumerarLancamentosCusto: () => void; // 🔧 Renumerar lançamentos com códigos duplicados
  excluirLancamentoCusto: (lancamentoId: string) => void; // 🗑️ Excluir lançamento de custo específico
  verificarCustosProvaParaExcluir: (alunoId: string) => { custos: LancamentoCusto[], excluir: boolean, motivo: string }; // 🆕 Verificar custos de prova que serão excluídos na transferência
  obterAlunosNaMesmaProva: (instrutorId: string, numeroProva: string) => Aluno[]; // 🆕 Obter alunos com mesma prova e instrutor
}

const SMCorpContext = createContext<SMCorpContextType | undefined>(undefined);

export const useSMCorp = () => {
  const context = useContext(SMCorpContext);
  if (!context) {
    throw new Error('useSMCorp must be used within SMCorpProvider');
  }
  return context;
};

// Hook alternativo que retorna undefined se não estiver no Provider (para casos especiais)
export const useSMCorpSafe = () => {
  return useContext(SMCorpContext);
};

// Helper para parsing seguro do localStorage
const safeJSONParse = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(`❌ Erro ao carregar ${key} do localStorage:`, error);
    return defaultValue;
  }
};

// Provider do contexto SMCorp v2.1.1
export const SMCorpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('🚀 SMCorpProvider: Inicializando...');
  
  // Estados com localStorage
  const [dadosInstitucionais, setDadosInstitucionais] = useState<DadosInstitucionais>(() =>
    safeJSONParse('smcorp-dados-institucionais', {
      nome: 'SMCORP',
      razaoSocial: 'Sociedade de Melhoria Contínua e Operações de Recursos',
      cnpj: '12.345.678/0001-90',
      endereco: 'Av. Paulista, 1000 - São Paulo, SP',
      telefone: '(11) 98765-4321',
      email: 'contato@smcorp.com',
      site: 'https://www.smcorp.com',
      cor: '#DC2626',
      // 💰 Dados Financeiros - Caixa
      contaCorrente: '123456-7',
      agencia: '0001',
      banco: 'Banco do Brasil',
      chavePix: 'contato@smcorp.com',
      caixaFisico: 5000.00,
      observacoesCaixa: 'Caixa para despesas operacionais pequenas e emergenciais'
    })
  );

  const [configuracoesEmail, setConfiguracoesEmail] = useState<ConfiguracoesEmail>(() =>
    safeJSONParse('smcorp-config-email', {
      remetente: 'noreply@smcorp.com',
      host: 'smtp.example.com',
      porta: 587,
      usuario: 'user@example.com',
      senha: 'password',
      ativo: true
    })
  );

  const [configuracoesWhatsApp, setConfiguracoesWhatsApp] = useState<ConfiguracoesWhatsApp>(() =>
    safeJSONParse('smcorp-config-whatsapp', {
      numero: '5511987654321',
      apiKey: 'your_api_key_here_1234567890',
      webhookUrl: 'https://api.smcorp.com/webhook/whatsapp',
      ativo: true,
      mensagemPadrao: 'Olá! Segue o link para sua inscrição: {link}'
    })
  );

  const [salas, setSalas] = useState<Sala[]>(() =>
    safeJSONParse('smcorp-salas', [
      { id: '1', nome: 'Sala 101', localizacao: 'Bloco A', capacidadeMaxima: 30, custoDiaria: 150 },
      { id: '2', nome: 'Sala 102', localizacao: 'Bloco A', capacidadeMaxima: 25, custoDiaria: 120 },
      { id: '3', nome: 'Lab 201', localizacao: 'Bloco B', capacidadeMaxima: 20, custoDiaria: 200 }
    ])
  );

  const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
    safeJSONParse('smcorp-usuarios', [
      { id: '1', codigo: 'U0001', nome: 'Admin Principal', nivel: 'Master' as const, pin: '281242', permissoes: { modulos: { modulo00: true, modulo01: true, modulo02: true, modulo03: true, modulo04: true, modulo05: true, modulo06: true, modulo07: true, modulo08: true }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: true, alterarStatusPagamento: true, alterarStatusDocumentos: true, alterarStatusProva: true, cadastrarCurso: true, editarCurso: true, excluirCurso: true, cadastrarTurma: true, editarTurma: true, excluirTurma: true, gerenciarSalas: true, gerenciarUsuarios: true, gerenciarEmpresas: true, gerenciarFornecedores: true, acessarConfiguracoes: true } } },
      { id: '2', codigo: 'U0002', nome: 'Gerente Operações', nivel: 'Admin' as const, permissoes: { modulos: { modulo00: true, modulo01: true, modulo02: true, modulo03: true, modulo04: true, modulo05: true, modulo06: true, modulo07: false, modulo08: true }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: true, alterarStatusPagamento: true, alterarStatusDocumentos: true, alterarStatusProva: true, cadastrarCurso: true, editarCurso: true, excluirCurso: true, cadastrarTurma: true, editarTurma: true, excluirTurma: true, gerenciarSalas: true, gerenciarUsuarios: true, gerenciarEmpresas: true, gerenciarFornecedores: true, acessarConfiguracoes: true } } },
      { id: '3', codigo: 'U0003', nome: 'Vendedor 1', nivel: 'Vendedor' as const, permissoes: { modulos: { modulo00: false, modulo01: true, modulo02: true, modulo03: false, modulo04: true, modulo05: false, modulo06: false, modulo07: false, modulo08: false }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: false, alterarStatusPagamento: false, alterarStatusDocumentos: false, alterarStatusProva: false, cadastrarCurso: false, editarCurso: false, excluirCurso: false, cadastrarTurma: false, editarTurma: false, excluirTurma: false, gerenciarSalas: false, gerenciarUsuarios: false, gerenciarEmpresas: false, gerenciarFornecedores: false, acessarConfiguracoes: false } } }
    ])
  );

  const [clientesPJ, setClientesPJ] = useState<ClientePJ[]>(() => {
    const saved = localStorage.getItem('smcorp-clientespj');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar dados antigos que não têm credenciais
        return parsed.map((empresa: any) => ({
          ...empresa,
          login: empresa.login || undefined,
          senha: empresa.senha || undefined,
          acessoAtivo: empresa.acessoAtivo !== undefined ? empresa.acessoAtivo : false
        }));
      } catch (e) {
        console.error('Erro ao carregar empresas:', e);
      }
    }
    return [
      {
        id: '1',
        codigo: 'CP0001',
        nome: 'Tech Solutions Ltda',
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Tech Solutions Tecnologia Ltda',
        endereco: 'Av. Paulista, 1000 - São Paulo, SP',
        telefone: '(11) 3000-1000',
        email: 'contato@techsolutions.com',
        precificacaoNegociada: 0,
        login: 'techsolutions',
        senha: 'tech123',
        acessoAtivo: true,
        precificacoes: [
          {
            id: '1',
            cursoId: '1', // NR-10 Básico
            valorNegociado: 450.00,
            produtosInclusos: ['PV0001'], // 🆕 Produto principal: NR-10 Básico PJ
            observacoes: 'Desconto de 10% para turmas acima de 15 alunos',
            dataVigencia: '2025-12-31',
            ativo: true
          },
          {
            id: '2',
            cursoId: '2', // NR-35 Trabalho em Altura
            valorNegociado: 520.00,
            produtosInclusos: ['PV0002'], // 🆕 Produto principal: NR-35 PJ
            observacoes: 'Preço especial para parceria anual',
            dataVigencia: '2025-12-31',
            ativo: true
          }
        ]
      },
      {
        id: '2',
        codigo: 'CP0002',
        nome: 'Industrias ABC S.A.',
        cnpj: '98.765.432/0001-10',
        razaoSocial: 'Indústrias ABC Sociedade Anônima',
        endereco: 'Rua Industrial, 500 - Guarulhos, SP',
        telefone: '(11) 4000-2000',
        email: 'rh@industriasabc.com.br',
        precificacaoNegociada: 0,
        login: 'industriasabc',
        senha: 'abc123',
        acessoAtivo: true,
        precificacoes: [
          {
            id: '3',
            cursoId: '3', // Operador de Empilhadeira
            valorNegociado: 1100.00,
            produtosInclusos: ['PV0003'], // 🆕 Produto principal: Operador de Empilhadeira PJ
            observacoes: 'Desconto de 15% - contrato de 100 alunos/ano',
            dataVigencia: '2026-03-31',
            ativo: true
          }
        ]
      },
      {
        id: '3',
        codigo: 'CP0003',
        nome: 'Construções e Montagens Ltda',
        cnpj: '55.666.777/0001-22',
        razaoSocial: 'Construções e Montagens Ltda',
        endereco: 'Av. Trabalhadores, 2500 - São Paulo, SP',
        telefone: '(11) 5000-3000',
        email: 'rh@construcoes.com.br',
        precificacaoNegociada: 0,
        login: 'construcoes',
        senha: 'const123',
        acessoAtivo: true,
        precificacoes: [
          {
            id: '4',
            cursoId: '1769041011635', // C0004
            valorNegociado: 2500.00,
            produtosInclusos: ['PV0004'], // 🆕 Produto principal: IRATA N1 PJ
            observacoes: 'Desconto de 5% para contrato anual',
            dataVigencia: '2026-12-31',
            ativo: true
          }
        ]
      },
      {
        id: '4',
        codigo: 'CP0004',
        nome: 'Empresa Teste Importa��ão',
        cnpj: '11.222.333/0001-44',
        razaoSocial: 'Empresa Teste Importa��ão Ltda',
        endereco: 'Rua Teste, 100 - São Paulo, SP',
        telefone: '(11) 9999-0000',
        email: 'teste@empresa.com.br',
        precificacaoNegociada: 0,
        login: 'teste',
        senha: 'teste123',
        acessoAtivo: true,
        precificacoes: [
          {
            id: '5',
            cursoId: '1769041011635', // C0004 - IRATA N1
            valorNegociado: 2800.00,
            produtosInclusos: ['PV0004'], // 🆕 Produto principal: IRATA N1 PJ
            observacoes: 'Empresa teste para importação de planilha',
            dataVigencia: '2026-12-31',
            ativo: true
          }
        ]
      }
    ];
  });

  const [custosAuditaveis, setCustosAuditaveis] = useState<CustoAuditavel[]>(() =>
    safeJSONParse('smcorp-custosauditaveis', [
      { id: '0', codigo: 'CA0001', nome: 'Custo por Aluno Matriculado', valor: 100, criterioCustoId: '4' },
      { id: '1', codigo: 'CA0002', nome: 'Material Didático', valor: 50, criterioCustoId: '1' },
      { id: '2', codigo: 'CA0003', nome: 'Certificado', valor: 30, criterioCustoId: '2' },
      { id: '3', codigo: 'CA0004', nome: 'Taxa IRATA', valor: 800, fornecedorId: '3', criterioCustoId: '2' },
      { id: '4', codigo: 'CA0005', nome: 'Taxa IRATA Internacional', valor: 450, fornecedorId: '4', criterioCustoId: '5' },
      { id: '5', codigo: 'CA0006', nome: 'Alimentação', valor: 16, fornecedorId: '5', criterioCustoId: '6' },
      // 🆕 Custos vinculados a Instrutores
      { id: '6', codigo: 'CA0007', nome: 'Diária de Instrutor', valor: 350, tipoVinculo: 'instrutor', instrutorId: '0', criterioCustoId: '7' }, // Pago ao instrutor
      { id: '7', codigo: 'CA0008', nome: 'Transporte de Instrutor', valor: 120, fornecedorId: '6', tipoVinculo: 'instrutor', instrutorId: '0', criterioCustoId: '8' }, // Pago ao fornecedor F0006
      { id: '8', codigo: 'CA0009', nome: 'Alimentação de Instrutor', valor: 80, fornecedorId: '5', tipoVinculo: 'instrutor', instrutorId: '0', criterioCustoId: '8' } // Pago ao fornecedor F0005
    ])
  );

  // 🆕 Estado para Critérios de Custo
  const [criteriosCusto, setCriteriosCusto] = useState<CriterioCusto[]>(() =>
    safeJSONParse('smcorp-criterios-custo', [
      {
        id: '1',
        codigo: 'CR0001',
        nome: 'Material Didático Mensal',
        frequenciaLancamento: 'Mensalmente',
        vinculo: 'Aluno Matriculado',
        criterioVencimento: 'Fechamento Mensal',
        diaFechamentoMensal: 5,
        diasPagamentoAposFechamento: 10, // 🆕 Paga 10 dias após fechamento
        ativo: true,
        dataCriacao: '2026-01-22'
      },
      {
        id: '2',
        codigo: 'CR0002',
        nome: 'Taxa de Certificação',
        frequenciaLancamento: 'Única vez',
        vinculo: 'Aluno Matriculado',
        criterioVencimento: 'Data Término do Curso',
        quando: ['Prova Agendada'], // 🆕 Disparar quando prova for agendada
        ativo: true,
        dataCriacao: '2026-01-22'
      },
      {
        id: '4',
        codigo: 'CR0003',
        nome: 'Custo Individual por Aluno',
        frequenciaLancamento: 'Única vez',
        vinculo: 'Aluno Matriculado',
        criterioVencimento: 'Data Término do Curso',
        ativo: true,
        dataCriacao: '2026-01-23'
      },
      {
        id: '5',
        codigo: 'CR0004',
        nome: 'Taxa irata inter',
        frequenciaLancamento: 'Única vez',
        vinculo: 'Aluno Matriculado',
        criterioVencimento: 'Fechamento Mensal',
        diaFechamentoMensal: 5,
        diasPagamentoAposFechamento: 0,
        quando: ['Prova Agendada'], // 🆕 Disparar quando prova for agendada
        ativo: true,
        dataCriacao: '2026-01-23'
      },
      {
        id: '6',
        codigo: 'CR0005',
        nome: 'alimentação',
        frequenciaLancamento: 'Diariamente',
        vinculo: 'Aluno Matriculado',
        criterioVencimento: 'Fechamento Mensal',
        diaFechamentoMensal: 5,
        diasPagamentoAposFechamento: 0,
        quando: ['Presença Marcada no Dia'], // 🆕 Disparar quando presença for marcada
        ativo: true,
        dataCriacao: '2026-01-23'
      },
      // 🆕 Critérios para Custos de Instrutor
      {
        id: '7',
        codigo: 'CR0006',
        nome: 'Diária de Instrutor',
        frequenciaLancamento: 'Diariamente',
        vinculo: 'Instrutor em Turma',
        criterioVencimento: 'Fechamento Mensal',
        diaFechamentoMensal: 5,
        diasPagamentoAposFechamento: 5,
        quando: ['Instrutor Vinculado à Turma'],
        ativo: true,
        dataCriacao: '2026-01-27'
      },
      {
        id: '8',
        codigo: 'CR0007',
        nome: 'Custos de Instrutor (Transporte/Alimentação)',
        frequenciaLancamento: 'Diariamente',
        vinculo: 'Instrutor em Turma',
        criterioVencimento: 'Fechamento Mensal',
        diaFechamentoMensal: 5,
        diasPagamentoAposFechamento: 5,
        quando: ['Instrutor Vinculado à Turma'],
        ativo: true,
        dataCriacao: '2026-01-27'
      }
    ]).map((criterio: any) => ({
      ...criterio,
      quando: criterio.quando || [] // 🆕 Migração: Garantir que todos tenham o campo "quando"
    }))
  );

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() =>
    safeJSONParse('smcorp-fornecedores', [
      { id: '1', codigo: 'F0001', nome: 'Fornecedor A', cnpj: '12.345.678/0001-90', telefone: '(11) 98765-4321', email: 'fornecedorA@email.com' },
      { id: '2', codigo: 'F0002', nome: 'Fornecedor B', cnpj: '98.765.432/0001-89', telefone: '(11) 91234-5678', email: 'fornecedorB@email.com' },
      { id: '3', codigo: 'F0003', nome: 'IRATA', cnpj: '11.222.333/0001-44', telefone: '(11) 99999-8888', email: 'contato@irata.com.br' },
      { id: '4', codigo: 'F0004', nome: 'IRATA Internacional', cnpj: '22.333.444/0001-55', telefone: '(11) 98888-7777', email: 'internacional@irata.com.br' },
      { id: '5', codigo: 'F0005', nome: 'Restaurante da Fram', cnpj: '33.444.555/0001-66', telefone: '(11) 97777-6666', email: 'contato@restaurantefram.com.br' },
      { id: '6', codigo: 'F0006', nome: 'TransRio - Transportes', cnpj: '44.555.666/0001-77', telefone: '(11) 96666-5555', email: 'contato@transrio.com.br' }
    ])
  );

  // 🆕 Estado para Instrutores
  const [instrutores, setInstrutores] = useState<Instrutor[]>(() =>
    safeJSONParse('smcorp-instrutores', [])
  );

  // 🆕 Estado para Provas Agendadas
  const [provasAgendadas, setProvasAgendadas] = useState<ProvaAgendada[]>(() =>
    safeJSONParse('smcorp-provas-agendadas', [])
  );

  // 🆕 Estado para Lançamentos de Custo (gerados automaticamente ou manualmente)
  const [lancamentosCusto, setLancamentosCusto] = useState<LancamentoCusto[]>(() =>
    safeJSONParse('smcorp-lancamentos-custo', [])
  );

  const [produtosExtras, setProdutosExtras] = useState<ProdutoExtra[]>(() => {
    const saved = localStorage.getItem('smcorp-produtosextra');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar dados antigos que não têm custosAssociados
        return parsed.map((produto: any) => ({
          ...produto,
          custosAssociados: produto.custosAssociados || []
        }));
      } catch (e) {
        console.error('Erro ao carregar produtos extras:', e);
      }
    }
    return [
      { id: '1', codigo: 'PV0001', tipo: 'produto', nome: 'Apostila Premium', valor: 80, custosAssociados: ['1'] },
      { id: '2', codigo: 'EX0001', tipo: 'extra', nome: 'Kit Ferramentas', valor: 150, custosAssociados: ['2'] },
      { id: '3', codigo: 'PV0002', tipo: 'produto', nome: 'Material Didático Completo', valor: 120, custosAssociados: ['1'] },
      { id: '4', codigo: 'EX0002', tipo: 'extra', nome: 'Acesso por Cordas N1', valor: 350, custosAssociados: ['2'] },
      { id: '5', codigo: 'EX0003', tipo: 'extra', nome: 'Certificação NR35', valor: 280, custosAssociados: ['1'] },
      { id: '6', codigo: 'PV0003', tipo: 'produto', nome: 'Uniforme Completo', valor: 95, custosAssociados: ['2'] },
      { id: '7', codigo: 'PV0004', tipo: 'produto', nome: 'IRATA N1 PJ', valor: 2650, custosAssociados: ['3', '4', '5'] },
      { id: '8', codigo: 'PV0005', tipo: 'produto', nome: 'IRATA N1 PF', valor: 2500, custosAssociados: ['3', '4', '5'] }
    ];
  });

  const [cursos, setCursos] = useState<Curso[]>(() => {
    const saved = localStorage.getItem('smcorp-cursos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar cursos antigos que têm custosAuditaveis para o novo formato
        return parsed.map((curso: any) => {
          const { custosAuditaveis, ...resto } = curso;
          return {
            ...resto,
            produtosVinculados: curso.produtosVinculados || [],
            extrasVinculados: curso.extrasVinculados || []
          };
        });
      } catch (e) {
        console.error('Erro ao carregar cursos:', e);
      }
    }
    return [
      {
        id: '1',
        codigo: 'C0001',
        nome: 'Eletricista Predial',
        categoria: 'Elétrica',
        cargaHoraria: 80,
        cargaHorariaTotal: 80,
        horasAulaPorDia: 4,
        horarioInicio: '19:00',
        horarioFim: '22:00',
        usaFimDeSemana: false,
        valorBase: 1200,
        descricao: 'Curso completo de instalações elétricas prediais',
        intervalo: 15,
        produtosVinculados: ['1'],
        extrasVinculados: ['2'],
        documentosObrigatorios: []
      },
      {
        id: '2',
        codigo: 'C0002',
        nome: 'Mecânica Automotiva',
        categoria: 'Automotiva',
        cargaHoraria: 120,
        cargaHorariaTotal: 120,
        horasAulaPorDia: 4,
        horarioInicio: '19:00',
        horarioFim: '22:00',
        usaFimDeSemana: false,
        valorBase: 1800,
        descricao: 'Manutenção preventiva e corretiva de veículos',
        intervalo: 15,
        produtosVinculados: [],
        extrasVinculados: [],
        documentosObrigatorios: []
      },
      {
        id: '3',
        codigo: 'C0003',
        nome: 'Trabalho em Altura',
        categoria: 'Segurança',
        cargaHoraria: 40,
        cargaHorariaTotal: 40,
        horasAulaPorDia: 4,
        horarioInicio: '08:00',
        horarioFim: '12:00',
        usaFimDeSemana: true,
        valorBase: 850,
        descricao: 'Curso de segurança para trabalhos em altura com certificação NR35',
        intervalo: 15,
        produtosVinculados: ['3', '6'],
        extrasVinculados: ['4', '5'],
        documentosObrigatorios: [
          { nome: 'RG', requerUpload: true },
          { nome: 'CPF', requerUpload: true },
          { nome: 'Comprovante de Residência', requerUpload: true },
          { nome: 'Atestado Médico', requerUpload: true }
        ]
      },
      {
        id: '1769041011635',
        codigo: 'C0004',
        nome: 'Curso Personalizado Aliança Mineral',
        categoria: 'Personalizado',
        cargaHoraria: 40,
        cargaHorariaTotal: 40,
        horasAulaPorDia: 9,
        horarioInicio: '08:00',
        horarioFim: '17:00',
        usaFimDeSemana: false,
        valorBase: 2650,
        descricao: 'Curso personalizado para empresa Aliança Mineral',
        intervalo: 60,
        produtosVinculados: ['7'],
        extrasVinculados: [],
        documentosObrigatorios: []
      }
    ];
  });

  const [turmas, setTurmas] = useState<Turma[]>(() => {
    console.log('🔍 [INICIALIZAÇÃO] Carregando turmas do localStorage...');
    const saved = localStorage.getItem('smcorp-turmas');
    if (saved) {
      const turmasCarregadas = JSON.parse(saved);
      console.log('✅ [INICIALIZAÇÃO] Turmas encontradas no localStorage:', turmasCarregadas.length);
      return turmasCarregadas;
    }
    console.log('⚠️ [INICIALIZAÇÃO] Nenhuma turma no localStorage. Usando dados mockados.');
    return [
      {
        id: '1',
        codigo: '#0001',
        cursoId: '1',
        dataInicio: '2026-01-13',
        dataFim: '2026-02-28',
        horario: '19:00 - 22:00',
        salaId: '1',
        vagasDisponiveis: 25,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '2',
        codigo: '#0002',
        cursoId: '2',
        dataInicio: '2026-01-15',
        dataFim: '2026-03-20',
        horario: '19:00 - 22:00',
        salaId: '2',
        vagasDisponiveis: 20,
        statusTurma: 'Planejada',
        preco: 1800
      },
      {
        id: '3',
        codigo: '#0003',
        cursoId: '1',
        dataInicio: '2026-01-20',
        dataFim: '2026-03-10',
        horario: '14:00 - 18:00',
        salaId: '3',
        vagasDisponiveis: 15,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '4',
        codigo: '#0004',
        cursoId: '2',
        dataInicio: '2026-01-22',
        dataFim: '2026-03-28',
        horario: '08:00 - 12:00',
        salaId: '1',
        vagasDisponiveis: 25,
        statusTurma: 'Em Andamento',
        preco: 1800
      },
      {
        id: '5',
        codigo: '#0005',
        cursoId: '1',
        dataInicio: '2026-01-17',
        dataFim: '2026-03-05',
        horario: '19:00 - 22:00',
        salaId: '2',
        vagasDisponiveis: 22,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '6',
        codigo: '#0006',
        cursoId: '2',
        dataInicio: '2026-01-19',
        dataFim: '2026-03-30',
        horario: '19:00 - 22:00',
        salaId: '3',
        vagasDisponiveis: 18,
        statusTurma: 'Confirmada',
        nomePersonalizado: 'Mecânica - Turma Premium',
        preco: 2000
      },
      {
        id: '7',
        codigo: '#0007',
        cursoId: '3',
        dataInicio: '2026-01-18',
        dataFim: '2026-02-01',
        horario: '08:00 - 12:00',
        salaId: '1',
        vagasDisponiveis: 20,
        statusTurma: 'Em Andamento',
        nomePersonalizado: 'Trabalho em Altura - Turma Intensiva',
        preco: 850
      },
      // TURMA PARA TESTE DE TRANSFERÊNCIA - Mesmo curso que turma #0006
      {
        id: '8',
        codigo: '#0008',
        cursoId: '2', // Mecânica Automotiva (mesmo da turma #0006)
        dataInicio: '2026-02-10',
        dataFim: '2026-04-20',
        horario: '14:00 - 18:00',
        salaId: '2',
        vagasDisponiveis: 25,
        statusTurma: 'Confirmada',
        nomePersonalizado: 'Mecânica - Turma Tarde',
        preco: 2200
      },
      {
        id: '1769041531251',
        codigo: '#0009',
        cursoId: '1769041011635',
        dataInicio: '2026-01-26',
        dataFim: '2026-01-30',
        horario: '08:00 - 17:00',
        salaId: '2',
        vagasDisponiveis: 30,
        statusTurma: 'Planejada'
      },
      {
        id: '10',
        codigo: '#0010',
        cursoId: '1769041011635',
        dataInicio: '2026-01-26',
        dataFim: '2026-01-30',
        horario: '08:00 - 17:00',
        salaId: '1',
        vagasDisponiveis: 20,
        statusTurma: 'Confirmada',
        nomePersonalizado: 'Acesso por Cordas - Turma CP0003',
        preco: 2500
      }
    ];
  });

  // 🆕 Contador de recibos (CP0001, CP0002, etc)
  const [contadorRecibos, setContadorRecibos] = useState<number>(() => {
    const saved = localStorage.getItem('smcorp-contador-recibos');
    return saved ? parseInt(saved, 10) : 1;
  });

  // 🆕 Função para gerar próximo número de recibo
  const gerarNumeroRecibo = (): string => {
    const numero = contadorRecibos.toString().padStart(4, '0');
    setContadorRecibos(contadorRecibos + 1);
    return `CP${numero}`;
  };

  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    console.log('🔍 [INICIALIZAÇÃO] Carregando alunos do localStorage...');
    const saved = localStorage.getItem('smcorp-alunos');
    if (saved) {
      const alunosCarregados = JSON.parse(saved);
      console.log('✅ [INICIALIZAÇÃO] Alunos encontrados no localStorage:', alunosCarregados.length);
      return alunosCarregados;
    }
    console.log('⚠️ [INICIALIZAÇÃO] Nenhum aluno no localStorage. Usando dados mockados.');
    const alunosData: Aluno[] = [
      // Array vazio - Adicione alunos manualmente através do sistema
      /*{
        id: '1',
        codigoSistema: 'A0001',
        turmaId: '1',
        nome: 'Pedro Oliveira',
        cpf: '123.456.789-00',
        telefone: '(11) 98765-4321',
        email: 'pedro@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '10/01/2026',
              hora: '14:30',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento total à vista',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '10/01/2026',
              horaConfirmacao: '14:35'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['1', '3']
      },
      {
        id: '2',
        codigoSistema: 'A0002',
        turmaId: '1',
        nome: 'Maria Santos',
        cpf: '987.654.321-00',
        telefone: '(11) 91234-5678',
        email: 'maria@email.com',
        valorTotal: 1700,
        desconto: 500,
        statusLink: 'Agendado',
        statusPagamento: false,
        statusDocumentos: false,
        pagamentos: {
          historico: [
            {
              id: '2',
              valor: 500,
              data: '12/01/2026',
              hora: '10:15',
              formaPagamento: 'Dinheiro',
              observacoes: 'Primeira parcela - entrada',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '12/01/2026',
              horaConfirmacao: '10:20'
            }
          ],
          valorPago: 500,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['1', '2', '5']
      },
      {
        id: '3',
        codigoSistema: 'A0003',
        turmaId: '6',
        nome: 'Carlos Mendes',
        cpf: '111.222.333-44',
        telefone: '(11) 99999-8888',
        email: 'carlos@email.com',
        valorTotal: 2000,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-20',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['3', '4', '6'],
        pagamentos: {
          historico: [
            {
              id: 'pag-1769091573339',
              valor: 2000,
              formaPagamento: 'PIX',
              observacoes: '',
              data: '22/01/2026',
              hora: '11:19',
              registradoPor: 'Admin Principal',
              vinculadoA: 'CPF 111.222.333-44'
            }
          ],
          valorPago: 2000,
          pendente: false
        }
      },
      {
        id: '4',
        codigoSistema: 'A0004',
        turmaId: '6',
        nome: 'Ana Silva',
        cpf: '222.333.444-55',
        telefone: '(11) 98888-7777',
        email: 'ana@email.com',
        valorTotal: 2000,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-19',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['2'],
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        }
      },
      {
        id: '5',
        codigoSistema: 'A0005',
        turmaId: '6',
        nome: 'Roberto Costa',
        cpf: '333.444.555-66',
        telefone: '(11) 97777-6666',
        email: 'roberto@email.com',
        valorTotal: 2000,
        desconto: 100,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        statusPagamento: false,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-19',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: [],
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        }
      },
      {
        id: '6',
        codigoSistema: 'A0006',
        turmaId: '7',
        nome: 'Fernanda Lima',
        cpf: '444.555.666-77',
        telefone: '(11) 96666-5555',
        email: 'fernanda@email.com',
        valorTotal: 1065,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '7',
        codigoSistema: 'A0007',
        turmaId: '7',
        nome: 'Bruno Alves',
        cpf: '555.666.777-88',
        telefone: '(11) 95555-4444',
        email: 'bruno@email.com',
        valorTotal: 1415,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        statusPagamento: false,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['4']
      },
      {
        id: '8',
        codigoSistema: 'A0008',
        turmaId: '7',
        nome: 'Juliana Souza',
        cpf: '666.777.888-99',
        telefone: '(11) 94444-3333',
        email: 'juliana@email.com',
        valorTotal: 1345,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['5']
      },
      {
        id: '25',
        codigoSistema: 'A0025',
        turmaId: '1',
        nome: 'João Silva Lote',
        cpf: '111.111.111-01',
        telefone: '(11) 91111-1111',
        email: 'joao.lote@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '15/01/2026',
              hora: '10:00',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '15/01/2026',
              horaConfirmacao: '10:05',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-001'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '26',
        codigoSistema: 'A0026',
        turmaId: '1',
        nome: 'Maria Santos Lote',
        cpf: '222.222.222-02',
        telefone: '(11) 92222-2222',
        email: 'maria.lote@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '15/01/2026',
              hora: '10:01',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '15/01/2026',
              horaConfirmacao: '10:05',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-001'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '27',
        codigoSistema: 'A0027',
        turmaId: '1',
        nome: 'Carlos Oliveira Lote',
        cpf: '333.333.333-03',
        telefone: '(11) 93333-3333',
        email: 'carlos.lote@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '15/01/2026',
              hora: '10:02',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '15/01/2026',
              horaConfirmacao: '10:05',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-001'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '28',
        codigoSistema: 'A0028',
        turmaId: '1',
        nome: 'Ana Paula Lote',
        cpf: '444.444.444-04',
        telefone: '(11) 94444-4444',
        email: 'ana.lote@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '15/01/2026',
              hora: '10:03',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '15/01/2026',
              horaConfirmacao: '10:05',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-001'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '31',
        codigoSistema: 'A0014',
        turmaId: '1',
        nome: 'Pedro Costa Lote 2',
        cpf: '555.555.555-05',
        telefone: '(11) 95555-5555',
        email: 'pedro.lote2@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        tipoPessoa: 'PJ',
        empresaId: '1',
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '16/01/2026',
              hora: '14:00',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '16/01/2026',
              horaConfirmacao: '14:10',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-002',
              numeroNotaFiscal: 'NF-12345'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '32',
        codigoSistema: 'A0015',
        turmaId: '1',
        nome: 'Lucia Fernandes Lote 2',
        cpf: '666.666.666-06',
        telefone: '(11) 96666-6666',
        email: 'lucia.lote2@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        tipoPessoa: 'PJ',
        empresaId: '1',
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '16/01/2026',
              hora: '14:01',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento confirmado em lote',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '16/01/2026',
              horaConfirmacao: '14:10',
              loteConfirmacaoPagamentoId: 'LOTE-PAG-MASTER-2026-002',
              numeroNotaFiscal: 'NF-12345'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '33',
        codigoSistema: 'A0031',
        turmaId: '10',
        nome: 'Roberto Silva Cordas',
        cpf: '111.222.333-01',
        telefone: '(11) 91111-0001',
        email: 'roberto.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '34',
        codigoSistema: 'A0032',
        turmaId: '10',
        nome: 'Marcela Santos Cordas',
        cpf: '111.222.333-02',
        telefone: '(11) 91111-0002',
        email: 'marcela.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '35',
        codigoSistema: 'A0033',
        turmaId: '10',
        nome: 'Carlos Oliveira Cordas',
        cpf: '111.222.333-03',
        telefone: '(11) 91111-0003',
        email: 'carlos.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '36',
        codigoSistema: 'A0034',
        turmaId: '10',
        nome: 'Patricia Lima Cordas',
        cpf: '111.222.333-04',
        telefone: '(11) 91111-0004',
        email: 'patricia.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '37',
        codigoSistema: 'A0035',
        turmaId: '10',
        nome: 'Fernando Costa Cordas',
        cpf: '111.222.333-05',
        telefone: '(11) 91111-0005',
        email: 'fernando.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '38',
        codigoSistema: 'A0036',
        turmaId: '10',
        nome: 'Juliana Ferreira Cordas',
        cpf: '111.222.333-06',
        telefone: '(11) 91111-0006',
        email: 'juliana.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '39',
        codigoSistema: 'A0037',
        turmaId: '10',
        nome: 'Ricardo Almeida Cordas',
        cpf: '111.222.333-07',
        telefone: '(11) 91111-0007',
        email: 'ricardo.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '40',
        codigoSistema: 'A0038',
        turmaId: '10',
        nome: 'Amanda Rodrigues Cordas',
        cpf: '111.222.333-08',
        telefone: '(11) 91111-0008',
        email: 'amanda.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '41',
        codigoSistema: 'A0039',
        turmaId: '10',
        nome: 'Lucas Martins Cordas',
        cpf: '111.222.333-09',
        telefone: '(11) 91111-0009',
        email: 'lucas.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '42',
        codigoSistema: 'A0040',
        turmaId: '10',
        nome: 'Beatriz Souza Cordas',
        cpf: '111.222.333-10',
        telefone: '(11) 91111-0010',
        email: 'beatriz.cordas@construcoes.com.br',
        valorTotal: 2500,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        statusPagamento: false,
        statusDocumentos: false,
        tipoPessoa: 'PJ',
        empresaId: '1',
        clientePJId: '1',
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '30',
        codigoSistema: 'A0030',
        turmaId: '1769041531251',
        nome: 'Andre Macondo',
        cpf: '082.873.367-83',
        rg: '05679678',
        dataNascimento: '1978-02-05',
        telefone: '22997416052',
        email: 'macondo@aliancamineral.com',
        endereco: 'Andre Macondo',
        valorTotal: 2650,
        desconto: 0,
        statusLink: 'Confirmado',
        statusPagamento: false,
        statusDocumentos: false,
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['7'],
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        }
      },
      {
        id: '41',
        codigoSistema: 'A0041',
        turmaId: '1769041531251',
        nome: 'Carlos Eduardo Silva',
        cpf: '123.456.789-11',
        rg: '12345678',
        dataNascimento: '1985-05-15',
        telefone: '21987654321',
        email: 'carlos.silva@empresa.com',
        endereco: 'Rua das Flores, 123',
        valorTotal: 2650,
        desconto: 0,
        statusLink: 'Confirmado',
        statusPagamento: false,
        statusDocumentos: false,
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['7'],
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        }
      },
      {
        id: '42',
        codigoSistema: 'A0042',
        turmaId: '1769041531251',
        nome: 'Mariana Costa Santos',
        cpf: '987.654.321-22',
        rg: '87654321',
        dataNascimento: '1990-08-20',
        telefone: '21912345678',
        email: 'mariana.costa@empresa.com',
        endereco: 'Av. Principal, 456',
        valorTotal: 2650,
        desconto: 0,
        statusLink: 'Confirmado',
        statusPagamento: false,
        statusDocumentos: false,
        documentos: [],
        dataInicioAluno: '2026-01-26',
        dataFimAluno: '2026-01-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['7'],
        pagamentos: {
          historico: [],
          valorPago: 0,
          pendente: false
        }
      }*/
    ];
    
    // Migração: garantir que todos os alunos tenham produtosExtras
    return alunosData.map(aluno => ({
      ...aluno,
      produtosExtras: aluno.produtosExtras || []
    }));
  });

  // Contador de provas
  const [contadorProvas, setContadorProvas] = useState<number>(() => {
    const saved = localStorage.getItem('smcorp-contador-provas');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Validação inicial do localStorage - verifica se há dados corrompidos
  useEffect(() => {
    const keysToValidate = [
      'smcorp-config-email',
      'smcorp-config-whatsapp',
      'smcorp-salas',
      'smcorp-usuarios',
      'smcorp-clientespj',
      'smcorp-custosauditaveis',
      'smcorp-fornecedores',
      'smcorp-produtosextra',
      'smcorp-cursos',
      'smcorp-turmas',
      'smcorp-alunos'
    ];

    keysToValidate.forEach(key => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          JSON.parse(saved); // Tenta fazer o parsing
        }
      } catch (error) {
        console.error(`❌ Dados corrompidos detectados em ${key}, limpando...`, error);
        localStorage.removeItem(key);
      }
    });
  }, []);

  // 🔧 CORREÇÃO AUTOMÁTICA: Renumerar lançamentos duplicados (executa uma vez)
  useEffect(() => {
    const jaCorrigido = localStorage.getItem('smcorp-lancamentos-corrigidos');
    if (!jaCorrigido && lancamentosCusto.length > 0) {
      renumerarLancamentosCusto();
      localStorage.setItem('smcorp-lancamentos-corrigidos', 'true');
    }
  }, []); // Executa apenas uma vez ao montar

  // Persistência no localStorage
  useEffect(() => {
    localStorage.setItem('smcorp-dados-institucionais', JSON.stringify(dadosInstitucionais));
  }, [dadosInstitucionais]);

  useEffect(() => {
    localStorage.setItem('smcorp-salas', JSON.stringify(salas));
  }, [salas]);

  useEffect(() => {
    localStorage.setItem('smcorp-usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem('smcorp-clientespj', JSON.stringify(clientesPJ));
  }, [clientesPJ]);

  useEffect(() => {
    localStorage.setItem('smcorp-custosauditaveis', JSON.stringify(custosAuditaveis));
  }, [custosAuditaveis]);

  // 🆕 Persistir Critérios de Custo
  useEffect(() => {
    localStorage.setItem('smcorp-criterios-custo', JSON.stringify(criteriosCusto));
  }, [criteriosCusto]);

  useEffect(() => {
    localStorage.setItem('smcorp-fornecedores', JSON.stringify(fornecedores));
  }, [fornecedores]);

  // 🆕 Persistir Instrutores
  useEffect(() => {
    localStorage.setItem('smcorp-instrutores', JSON.stringify(instrutores));
  }, [instrutores]);

  // 🆕 Persistir Provas Agendadas
  useEffect(() => {
    localStorage.setItem('smcorp-provas-agendadas', JSON.stringify(provasAgendadas));
  }, [provasAgendadas]);

  useEffect(() => {
    localStorage.setItem('smcorp-produtosextra', JSON.stringify(produtosExtras));
  }, [produtosExtras]);

  useEffect(() => {
    localStorage.setItem('smcorp-cursos', JSON.stringify(cursos));
  }, [cursos]);

  // 🆕 Persistir contador de recibos
  useEffect(() => {
    localStorage.setItem('smcorp-contador-recibos', contadorRecibos.toString());
  }, [contadorRecibos]);

  // 🆕 Persistir lançamentos de custo
  useEffect(() => {
    console.log('💾 [PERSISTÊNCIA] Salvando lançamentos de custo no localStorage...');
    console.log('💾 [PERSISTÊNCIA] Total de lançamentos:', lancamentosCusto.length);
    localStorage.setItem('smcorp-lancamentos-custo', JSON.stringify(lancamentosCusto));
    console.log('✅ [PERSISTÊNCIA] Lançamentos de custo salvos com sucesso!');
  }, [lancamentosCusto]);

  useEffect(() => {
    console.log('💾 [PERSISTÊNCIA] Salvando turmas no localStorage...');
    console.log('💾 [PERSISTÊNCIA] Total de turmas:', turmas.length);
    localStorage.setItem('smcorp-turmas', JSON.stringify(turmas));
    console.log('✅ [PERSISTÊNCIA] Turmas salvas com sucesso!');
  }, [turmas]);

  useEffect(() => {
    console.log('💾 [PERSISTÊNCIA] Salvando alunos no localStorage...');
    console.log('💾 [PERSISTÊNCIA] Total de alunos:', alunos.length);
    localStorage.setItem('smcorp-alunos', JSON.stringify(alunos));
    console.log('✅ [PERSISTÊNCIA] Alunos salvos com sucesso!');
    
    // Log para debug de substituições
    const alunosSubstituidos = alunos.filter(a => a.substituido);
    if (alunosSubstituidos.length > 0) {
      console.log('📊 [CONTEXT] Alunos marcados como substituídos:', alunosSubstituidos.map(a => `${a.codigoSistema} - ${a.nome}`));
    }
    
    const alunosSubstitutos = alunos.filter(a => a.substitutoDe);
    if (alunosSubstitutos.length > 0) {
      console.log('🔄 [CONTEXT] Alunos que são substitutos:', alunosSubstitutos.map(a => `${a.codigoSistema} (substituiu ${a.substitutoDe})`));
    }
    
    // Debug específico da Turma #0001
    const alunosTurma0001 = alunos.filter(a => a.turmaId === '1');
    console.log('🎯 [CONTEXT] TODOS os alunos da Turma #0001 (turmaId=1):', alunosTurma0001.length);
    console.log('🎯 [CONTEXT] Detalhes:', alunosTurma0001.map(a => ({
      codigo: a.codigoSistema,
      nome: a.nome,
      substituido: a.substituido || false,
      substitutoDe: a.substitutoDe || 'N/A'
    })));
  }, [alunos]);

  useEffect(() => {
    localStorage.setItem('smcorp-contador-provas', contadorProvas.toString());
  }, [contadorProvas]);

  useEffect(() => {
    localStorage.setItem('smcorp-config-email', JSON.stringify(configuracoesEmail));
  }, [configuracoesEmail]);

  useEffect(() => {
    localStorage.setItem('smcorp-config-whatsapp', JSON.stringify(configuracoesWhatsApp));
  }, [configuracoesWhatsApp]);

  // Funções de adição
  const adicionarSala = (sala: Omit<Sala, 'id'>) => {
    const novaSala = { ...sala, id: Date.now().toString() };
    setSalas([...salas, novaSala]);
  };

  const editarSala = (id: string, salaAtualizada: Partial<Omit<Sala, 'id'>>) => {
    setSalas(salas.map(sala => 
      sala.id === id ? { ...sala, ...salaAtualizada } : sala
    ));
  };

  const adicionarUsuario = (usuario: Omit<Usuario, 'id'>) => {
    // Gerar código sequencial U0001, U0002, etc.
    const proximoCodigo = usuarios.length + 1;
    const codigo = `U${proximoCodigo.toString().padStart(4, '0')}`;
    const novoUsuario = { ...usuario, id: Date.now().toString(), codigo };
    setUsuarios([...usuarios, novoUsuario]);
  };

  const editarUsuario = (id: string, dados: Partial<Omit<Usuario, 'id'>>) => {
    setUsuarios(usuarios.map(usuario => 
      usuario.id === id ? { ...usuario, ...dados } : usuario
    ))
  };

  const adicionarClientePJ = (cliente: Omit<ClientePJ, 'id' | 'codigo'>) => {
    // Gerar código sequencial CP0001, CP0002, etc.
    const proximoCodigo = clientesPJ.length + 1;
    const codigo = `CP${proximoCodigo.toString().padStart(4, '0')}`;
    const novoCliente = { 
      ...cliente, 
      id: Date.now().toString(), 
      codigo,
      precificacoes: cliente.precificacoes || [] // Garantir que precificacoes existe
    };
    setClientesPJ([...clientesPJ, novoCliente]);
  };

  const editarClientePJ = (id: string, dados: Partial<Omit<ClientePJ, 'id' | 'codigo'>>) => {
    setClientesPJ(clientesPJ.map(cliente =>
      cliente.id === id ? { ...cliente, ...dados } : cliente
    ));
  };

  const adicionarPrecificacaoEmpresa = (clientePJId: string, precificacao: Omit<PrecificacaoEmpresa, 'id'>) => {
    setClientesPJ(clientesPJ.map(cliente => {
      if (cliente.id === clientePJId) {
        const novaPrecificacao = {
          ...precificacao,
          id: Date.now().toString()
        };
        return {
          ...cliente,
          precificacoes: [...(cliente.precificacoes || []), novaPrecificacao]
        };
      }
      return cliente;
    }));
  };

  const editarPrecificacaoEmpresa = (clientePJId: string, precificacaoId: string, dadosAtualizados: Partial<Omit<PrecificacaoEmpresa, 'id'>>) => {
    setClientesPJ(clientesPJ.map(cliente => {
      if (cliente.id === clientePJId) {
        return {
          ...cliente,
          precificacoes: cliente.precificacoes.map(prec =>
            prec.id === precificacaoId ? { ...prec, ...dadosAtualizados } : prec
          )
        };
      }
      return cliente;
    }));
  };

  const excluirPrecificacaoEmpresa = (clientePJId: string, precificacaoId: string) => {
    setClientesPJ(clientesPJ.map(cliente => {
      if (cliente.id === clientePJId) {
        return {
          ...cliente,
          precificacoes: cliente.precificacoes.filter(prec => prec.id !== precificacaoId)
        };
      }
      return cliente;
    }));
  };

  const adicionarCustoAuditavel = (custo: Omit<CustoAuditavel, 'id' | 'codigo'>) => {
    // Gerar código sequencial CA0001, CA0002, etc.
    const proximoNumero = custosAuditaveis.length + 1;
    const codigo = `CA${String(proximoNumero).padStart(4, '0')}`;
    const novoCusto = { ...custo, id: Date.now().toString(), codigo };
    setCustosAuditaveis([...custosAuditaveis, novoCusto]);
  };

  const editarCustoAuditavel = (id: string, custoAtualizado: Partial<Omit<CustoAuditavel, 'id'>>) => {
    setCustosAuditaveis(custosAuditaveis.map(custo => 
      custo.id === id ? { ...custo, ...custoAtualizado } : custo
    ));
  };

  const removerCustoAuditavel = (id: string) => {
    setCustosAuditaveis(custosAuditaveis.filter(custo => custo.id !== id));
    // Também remover lançamentos relacionados a este custo
    setLancamentosCusto(lancamentosCusto.filter(lanc => lanc.custoAuditavelId !== id));
  };

  // 🆕 Funções para gerenciar Critérios de Custo
  const adicionarCriterioCusto = (criterio: Omit<CriterioCusto, 'id' | 'codigo' | 'dataCriacao'>) => {
    // Gerar código sequencial CR0001, CR0002, etc.
    const proximoNumero = criteriosCusto.length + 1;
    const codigo = `CR${String(proximoNumero).padStart(4, '0')}`;
    const novoCriterio: CriterioCusto = { 
      ...criterio, 
      id: Date.now().toString(),
      codigo,
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };
    setCriteriosCusto([...criteriosCusto, novoCriterio]);
  };

  const editarCriterioCusto = (id: string, criterioAtualizado: Partial<Omit<CriterioCusto, 'id' | 'dataCriacao'>>) => {
    setCriteriosCusto(criteriosCusto.map(criterio => 
      criterio.id === id ? { ...criterio, ...criterioAtualizado } : criterio
    ));
  };

  const excluirCriterioCusto = (id: string) => {
    setCriteriosCusto(criteriosCusto.filter(criterio => criterio.id !== id));
  };

  const adicionarFornecedor = (fornecedor: Omit<Fornecedor, 'id'>) => {
    // Gerar código sequencial F0001, F0002, etc.
    const proximoCodigo = fornecedores.length + 1;
    const codigo = `F${proximoCodigo.toString().padStart(4, '0')}`;
    const novoFornecedor = { ...fornecedor, id: Date.now().toString(), codigo };
    setFornecedores([...fornecedores, novoFornecedor]);
  };

  const editarFornecedor = (id: string, fornecedorAtualizado: Partial<Omit<Fornecedor, 'id'>>) => {
    setFornecedores(fornecedores.map(fornecedor => 
      fornecedor.id === id ? { ...fornecedor, ...fornecedorAtualizado } : fornecedor
    ));
  };

  // 🆕 Funções para gerenciar Instrutores
  const adicionarInstrutor = (instrutor: Omit<Instrutor, 'id' | 'codigo'>) => {
    // Gerar código sequencial IN0001, IN0002, etc.
    const proximoCodigo = instrutores.length + 1;
    const codigo = `IN${proximoCodigo.toString().padStart(4, '0')}`;
    const novoInstrutor = { ...instrutor, id: Date.now().toString(), codigo };
    setInstrutores([...instrutores, novoInstrutor]);
    toast.success(`Instrutor ${novoInstrutor.nome} cadastrado com sucesso!`);
  };

  const editarInstrutor = (id: string, instrutorAtualizado: Partial<Omit<Instrutor, 'id' | 'codigo'>>) => {
    setInstrutores(instrutores.map(instrutor => 
      instrutor.id === id ? { ...instrutor, ...instrutorAtualizado } : instrutor
    ));
    toast.success('Instrutor atualizado com sucesso!');
  };

  const excluirInstrutor = (id: string) => {
    const instrutor = instrutores.find(i => i.id === id);
    setInstrutores(instrutores.filter(i => i.id !== id));
    if (instrutor) {
      toast.success(`Instrutor ${instrutor.nome} removido com sucesso!`);
    }
  };

  // 🆕 Funções para vincular/desvincular custos aos instrutores
  const vincularCustoInstrutor = (instrutorId: string, custoId: string) => {
    setInstrutores(instrutores.map(instrutor => {
      if (instrutor.id === instrutorId) {
        const custosAtuais = instrutor.custosVinculados || [];
        // Verificar se o custo já está vinculado
        if (custosAtuais.includes(custoId)) {
          return instrutor;
        }
        return {
          ...instrutor,
          custosVinculados: [...custosAtuais, custoId]
        };
      }
      return instrutor;
    }));
  };

  const desvincularCustoInstrutor = (instrutorId: string, custoId: string) => {
    setInstrutores(instrutores.map(instrutor => {
      if (instrutor.id === instrutorId) {
        const custosAtuais = instrutor.custosVinculados || [];
        return {
          ...instrutor,
          custosVinculados: custosAtuais.filter(id => id !== custoId)
        };
      }
      return instrutor;
    }));
  };

  // 🆕 SISTEMA DE DISPARO AUTOMÁTICO DE CUSTOS PARA INSTRUTORES
  const dispararCustosInstrutorAutomaticos = (instrutorId: string, turmaId: string, dataPresenca: string) => {
    console.log(`🎯 [DISPARO INSTRUTOR] Presença confirmada | Instrutor: ${instrutorId} | Turma: ${turmaId}`);
    
    const instrutor = instrutores.find(i => i.id === instrutorId);
    if (!instrutor) {
      console.error(`❌ [DISPARO INSTRUTOR] Instrutor ${instrutorId} não encontrado!`);
      return;
    }

    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) {
      console.error(`❌ [DISPARO INSTRUTOR] Turma ${turmaId} não encontrada!`);
      return;
    }

    // Buscar critérios com ação 'Presença Instrutor Confirmada'
    const criteriosParaDisparar = criteriosCusto.filter(criterio => 
      criterio.ativo && 
      criterio.vinculo === 'Instrutor' && 
      criterio.quando && 
      criterio.quando.includes('Presença Instrutor Confirmada')
    );

    if (criteriosParaDisparar.length === 0) {
      console.log(`ℹ️ [DISPARO INSTRUTOR] Nenhum critério configurado para presença de instrutor`);
      return;
    }

    console.log(`✅ [DISPARO INSTRUTOR] ${criteriosParaDisparar.length} critério(s) encontrado(s):`, criteriosParaDisparar.map(c => c.nome));

    // Buscar custos vinculados ao instrutor
    const custosVinculadosInstrutor = instrutor.custosVinculados || [];
    if (custosVinculadosInstrutor.length === 0) {
      console.log(`ℹ️ [DISPARO INSTRUTOR] Instrutor ${instrutor.nome} não possui custos vinculados`);
      return;
    }

    console.log(`📦 [DISPARO INSTRUTOR] Custos vinculados ao instrutor:`, custosVinculadosInstrutor.length);

    // 🆕 Array para coletar TODOS os lançamentos antes de gerar códigos
    const lancamentosParaCriar: Array<{
      custoAuditavel: CustoAuditavel;
      criterio: CriterioCusto;
      dataVencimento: string;
    }> = [];

    // Para cada critério, coletar os custos
    criteriosParaDisparar.forEach(criterio => {
      console.log(`💰 [DISPARO INSTRUTOR] Processando critério: ${criterio.nome}`);
      
      // Buscar custos auditáveis vinculados ao critério E ao instrutor
      const custosAuditaveisInstrutor = custosAuditaveis.filter(custo => 
        custo.criterioCustoId === criterio.id && 
        custosVinculadosInstrutor.includes(custo.id)
      );
      
      if (custosAuditaveisInstrutor.length === 0) {
        console.log(`ℹ️ [DISPARO INSTRUTOR] Nenhum custo auditável vinculado ao critério "${criterio.nome}" e ao instrutor`);
        return;
      }
      
      console.log(`✅ [DISPARO INSTRUTOR] ${custosAuditaveisInstrutor.length} custo(s) auditável(is) encontrado(s):`, custosAuditaveisInstrutor.map(c => c.nome));
      
      // Para cada custo auditável, coletar para criar depois
      custosAuditaveisInstrutor.forEach((custoAuditavel) => {
        // Verificar duplicação (se frequência = "Única vez")
        if (criterio.frequenciaLancamento === 'Única vez') {
          const jaExiste = lancamentosCusto.some(l => 
            l.criterioCustoId === criterio.id && 
            l.custoAuditavelId === custoAuditavel.id &&
            l.instrutorId === instrutorId &&
            l.turmaId === turmaId &&
            l.status !== 'Cancelado'
          );
          
          if (jaExiste) {
            console.log(`⚠️ [DISPARO INSTRUTOR] Lançamento já existe para ${custoAuditavel.nome} (única vez)`);
            return;
          }
        }
        
        // Calcular data de vencimento
        const hoje = new Date();
        let dataVencimento = '';
        
        switch (criterio.criterioVencimento) {
          case 'Data Término do Curso':
            dataVencimento = turma.dataFim;
            break;
          
          case '30 dias após término':
            const dataFim = new Date(turma.dataFim.split('/').reverse().join('-'));
            dataFim.setDate(dataFim.getDate() + 30);
            dataVencimento = dataFim.toLocaleDateString('pt-BR');
            break;
          
          case 'Fechamento Mensal':
            const diaFechamento = criterio.diaFechamentoMensal || 5;
            const diasPagamento = criterio.diasPagamentoAposFechamento || 0;
            const dataVenc = new Date(hoje.getFullYear(), hoje.getMonth(), diaFechamento + diasPagamento);
            if (dataVenc < hoje) {
              dataVenc.setMonth(dataVenc.getMonth() + 1);
            }
            dataVencimento = dataVenc.toLocaleDateString('pt-BR');
            break;
          
          case 'Sem Vencimento':
            dataVencimento = '-';
            break;
          
          default:
            dataVencimento = new Date(hoje.setMonth(hoje.getMonth() + 1)).toLocaleDateString('pt-BR');
        }
        
        // 🔧 COLETAR para criar depois (não criar ainda!)
        lancamentosParaCriar.push({
          custoAuditavel,
          criterio,
          dataVencimento
        });
      });
    });

    // 🔧 FIX CRÍTICO: Agora criar TODOS os lançamentos de uma vez, com códigos sequenciais corretos
    if (lancamentosParaCriar.length === 0) {
      console.log(`ℹ️ [DISPARO INSTRUTOR] Nenhum lançamento para criar`);
      return;
    }

    console.log(`🔢 [DISPARO INSTRUTOR] Total de lançamentos a criar: ${lancamentosParaCriar.length}`);

    // 🔧 FIX DEFINITIVO: Mover cálculo do código para DENTRO do setState para evitar race condition
    const curso = cursos.find(c => c.id === turma.cursoId);
    
    setLancamentosCusto(prev => {
      // Calcular o maior código existente com base no estado ATUAL (incluindo lançamentos anteriores)
      const codigosExistentes = prev
        .map(l => parseInt(l.codigo.replace('L', '')))
        .filter(n => !isNaN(n));
      
      const maiorCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
      console.log(`🔢 [DISPARO INSTRUTOR] Maior código no estado atual: L${String(maiorCodigo).padStart(4, '0')}`);

      // Criar todos os lançamentos com códigos sequenciais
      const novosLancamentos: LancamentoCusto[] = [];
      
      lancamentosParaCriar.forEach((dados, index) => {
        const proximoNumero = maiorCodigo + index + 1;
        const codigoLancamento = `L${String(proximoNumero).padStart(4, '0')}`;
        
        const novoLancamento: LancamentoCusto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
          codigo: codigoLancamento,
          custoAuditavelId: dados.custoAuditavel.id,
          criterioCustoId: dados.criterio.id,
          instrutorId: instrutor.id,
          fornecedorId: dados.custoAuditavel.fornecedorId,
          turmaId: turma.id,
          cursoId: turma.cursoId,
          valor: dados.custoAuditavel.valor,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          dataVencimento: dados.dataVencimento,
          status: 'Pendente',
          observacoes: `Gerado automaticamente pela presença do instrutor em ${dataPresenca}`,
          geradoAutomaticamente: true,
          acaoDisparo: 'Presença Instrutor Confirmada'
        };
        
        novosLancamentos.push(novoLancamento);
        
        console.log(`✅ [DISPARO INSTRUTOR] Lançamento ${index + 1}/${lancamentosParaCriar.length} criado:`);
        console.log(`   - Código: ${codigoLancamento}`);
        console.log(`   - Custo: ${dados.custoAuditavel.nome}`);
        console.log(`   - Valor: R$ ${dados.custoAuditavel.valor.toFixed(2)}`);
        console.log(`   - Instrutor: ${instrutor.nome} (${instrutor.codigo})`);
        console.log(`   - Turma: ${turma.codigo} - ${curso?.nome || 'N/A'}`);
        console.log(`   - Vencimento: ${dados.dataVencimento}`);
        
        // Toast visual de sucesso
        toast.success(`💰 Custo de instrutor gerado!`, {
          description: `${codigoLancamento} - ${dados.custoAuditavel.nome} - R$ ${dados.custoAuditavel.valor.toFixed(2)} | ${instrutor.codigo} - ${instrutor.nome}`,
          duration: 5000
        });
      });

      console.log(`🎉 [DISPARO INSTRUTOR] ${novosLancamentos.length} lançamento(s) adicionado(s) ao estado!`);
      
      // Retornar o novo estado com os lançamentos adicionados
      return [...prev, ...novosLancamentos];
    });
  };

  // 🆕 SISTEMA DE DISPARO AUTOMÁTICO DE CUSTOS PARA INSTRUTORES - Prova
  const dispararCustosInstrutorProva = (instrutorId: string, alunoId: string, numeroProva: string, nomeProva: string, dataProva?: string) => {
    console.log(`🎯 [DISPARO INSTRUTOR PROVA] Instrutor vinculado à prova | Instrutor: ${instrutorId} | Prova: ${numeroProva} - ${nomeProva} | Data: ${dataProva || 'N/A'}`);
    
    const instrutor = instrutores.find(i => i.id === instrutorId);
    if (!instrutor) {
      console.error(`❌ [DISPARO INSTRUTOR PROVA] Instrutor ${instrutorId} não encontrado!`);
      return;
    }

    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) {
      console.error(`❌ [DISPARO INSTRUTOR PROVA] Aluno ${alunoId} não encontrado!`);
      return;
    }

    const turma = turmas.find(t => t.id === aluno.turmaId);
    if (!turma) {
      console.error(`❌ [DISPARO INSTRUTOR PROVA] Turma não encontrada!`);
      return;
    }

    // Buscar critérios com ação 'Instrutor Vinculado à Prova'
    const criteriosParaDisparar = criteriosCusto.filter(criterio => 
      criterio.ativo && 
      criterio.vinculo === 'Instrutor' && 
      criterio.quando && 
      criterio.quando.includes('Instrutor Vinculado à Prova')
    );

    if (criteriosParaDisparar.length === 0) {
      console.log(`ℹ️ [DISPARO INSTRUTOR PROVA] Nenhum critério configurado para instrutor vinculado à prova`);
      return;
    }

    console.log(`✅ [DISPARO INSTRUTOR PROVA] ${criteriosParaDisparar.length} critério(s) encontrado(s):`, criteriosParaDisparar.map(c => c.nome));

    // Buscar custos vinculados ao instrutor
    const custosVinculadosInstrutor = instrutor.custosVinculados || [];
    if (custosVinculadosInstrutor.length === 0) {
      console.log(`ℹ️ [DISPARO INSTRUTOR PROVA] Instrutor ${instrutor.nome} não possui custos vinculados`);
      return;
    }

    console.log(`📦 [DISPARO INSTRUTOR PROVA] Custos vinculados ao instrutor:`, custosVinculadosInstrutor.length);

    // Para cada critério, gerar os custos
    criteriosParaDisparar.forEach(criterio => {
      console.log(`💰 [DISPARO INSTRUTOR PROVA] Processando critério: ${criterio.nome}`);
      
      // Buscar custos auditáveis vinculados ao critério E ao instrutor
      const custosAuditaveisInstrutor = custosAuditaveis.filter(custo => 
        custo.criterioCustoId === criterio.id && 
        custosVinculadosInstrutor.includes(custo.id)
      );
      
      if (custosAuditaveisInstrutor.length === 0) {
        console.log(`ℹ️ [DISPARO INSTRUTOR PROVA] Nenhum custo auditável vinculado ao critério "${criterio.nome}" e ao instrutor`);
        return;
      }
      
      console.log(`✅ [DISPARO INSTRUTOR PROVA] ${custosAuditaveisInstrutor.length} custo(s) auditável(is) encontrado(s):`, custosAuditaveisInstrutor.map(c => c.nome));
      
      // Para cada custo auditável, gerar lançamento
      custosAuditaveisInstrutor.forEach((custoAuditavel, index) => {
        // Verificar duplicação (se frequência = "Única vez")
        if (criterio.frequenciaLancamento === 'Única vez') {
          const jaExiste = lancamentosCusto.some(l => 
            l.custoAuditavelId === custoAuditavel.id && 
            l.instrutorId === instrutor.id &&
            l.acaoDisparo === 'Instrutor Vinculado à Prova' &&
            l.observacoes?.includes(numeroProva)
          );
          
          if (jaExiste) {
            console.log(`ℹ️ [DISPARO INSTRUTOR PROVA] Custo "${custoAuditavel.nome}" já foi gerado para esta prova`);
            return;
          }
        }

        const curso = cursos.find(c => c.id === turma.cursoId);
        
        // 🎯 CORREÇÃO: Para provas, a data de vencimento é a data da própria prova
        // Converter data de YYYY-MM-DD para DD/MM/YYYY
        let dataVencimento = new Date().toLocaleDateString('pt-BR');
        if (dataProva) {
          // Converter YYYY-MM-DD para DD/MM/YYYY
          const [ano, mes, dia] = dataProva.split('-');
          dataVencimento = `${dia}/${mes}/${ano}`;
        } else {
          // Fallback: usar critério de vencimento se não tiver data da prova
          if (criterio.criterioVencimento === 'Data Término do Curso' && curso?.dataTermino) {
            dataVencimento = curso.dataTermino;
          } else if (criterio.criterioVencimento === '30 dias após término' && curso?.dataTermino) {
            const [dia, mes, ano] = curso.dataTermino.split('/');
            const dataBase = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            dataBase.setDate(dataBase.getDate() + 30);
            dataVencimento = dataBase.toLocaleDateString('pt-BR');
          } else if (criterio.criterioVencimento === 'Fechamento Mensal') {
            const hoje = new Date();
            const diaFechamento = criterio.diaFechamentoMensal || 5;
            const dataFechamento = new Date(hoje.getFullYear(), hoje.getMonth(), diaFechamento);
            if (hoje.getDate() > diaFechamento) {
              dataFechamento.setMonth(dataFechamento.getMonth() + 1);
            }
            dataFechamento.setDate(dataFechamento.getDate() + (criterio.diasPagamentoAposFechamento || 0));
            dataVencimento = dataFechamento.toLocaleDateString('pt-BR');
          }
        }

        // Gerar código do lançamento
        const proximoNumero = lancamentosCusto.length + 1 + index;
        const codigoLancamento = `L${proximoNumero.toString().padStart(4, '0')}`;
        
        const novoLancamento: LancamentoCusto = {
          id: `${Date.now()}-${index}`,
          codigo: codigoLancamento,
          custoAuditavelId: custoAuditavel.id,
          criterioCustoId: criterio.id,
          instrutorId: instrutor.id,
          fornecedorId: custoAuditavel.fornecedorId, // 🆕 Copiar do custo auditável
          turmaId: turma.id,
          cursoId: turma.cursoId,
          numeroProva: numeroProva, // 🆕 Número da prova
          nomeProva: nomeProva, // 🆕 Nome da prova
          valor: custoAuditavel.valor,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          dataVencimento: dataVencimento,
          status: 'Pendente',
          observacoes: `Gerado automaticamente pelo vínculo do instrutor à prova ${numeroProva} - ${nomeProva}${dataProva ? ` na data ${dataProva}` : ''}`,
          geradoAutomaticamente: true,
          acaoDisparo: 'Instrutor Vinculado à Prova'
        };
        
        // Adicionar ao estado
        setLancamentosCusto(prev => [...prev, novoLancamento]);
        
        console.log(`✅ [DISPARO INSTRUTOR PROVA] Lançamento criado com sucesso!`);
        console.log(`   - Código: ${codigoLancamento}`);
        console.log(`   - Custo: ${custoAuditavel.nome}`);
        console.log(`   - Valor: R$ ${custoAuditavel.valor.toFixed(2)}`);
        console.log(`   - Instrutor: ${instrutor.nome} (${instrutor.codigo})`);
        console.log(`   - Prova: ${numeroProva}`);
        console.log(`   - Turma: ${turma.codigo} - ${curso?.nome || 'N/A'}`);
        console.log(`   - Vencimento: ${dataVencimento}`);
        
        // Toast visual de sucesso
        toast.success(`💰 Custo de instrutor gerado pela prova!`, {
          description: `${custoAuditavel.nome} - R$ ${custoAuditavel.valor.toFixed(2)} | ${instrutor.codigo} - ${instrutor.nome}`,
          duration: 5000
        });
      });
    });
  };

  const adicionarProdutoExtra = (produto: Omit<ProdutoExtra, 'id' | 'codigo'>) => {
    // Gerar código sequencial baseado no tipo
    const produtosMesmoTipo = produtosExtras.filter(p => p.tipo === produto.tipo);
    const proximoCodigo = produtosMesmoTipo.length + 1;
    const prefixo = produto.tipo === 'produto' ? 'PV' : 'EX';
    const codigo = `${prefixo}${proximoCodigo.toString().padStart(4, '0')}`;
    
    const novoProduto = { ...produto, id: Date.now().toString(), codigo };
    setProdutosExtras([...produtosExtras, novoProduto]);
  };

  const editarProdutoExtra = (id: string, produtoAtualizado: Partial<Omit<ProdutoExtra, 'id' | 'codigo' | 'tipo'>>) => {
    setProdutosExtras(produtosExtras.map(produto => 
      produto.id === id ? { ...produto, ...produtoAtualizado } : produto
    ));
  };

  const adicionarCurso = (curso: Omit<Curso, 'id' | 'codigo'>) => {
    // Gerar código sequencial para o curso (C0001, C0002, etc.)
    const proximoCodigo = cursos.length + 1;
    const codigo = `C${proximoCodigo.toString().padStart(4, '0')}`;
    
    const novoCurso = { ...curso, id: Date.now().toString(), codigo };
    setCursos([...cursos, novoCurso]);
  };

  const atualizarCurso = (id: string, dadosAtualizados: Partial<Curso>) => {
    setCursos(cursos.map(curso => 
      curso.id === id ? { ...curso, ...dadosAtualizados } : curso
    ));
  };

  const excluirCurso = (id: string) => {
    setCursos(cursos.map(curso => 
      curso.id === id ? { ...curso, excluido: true } : curso
    ));
    // Nota: As turmas e alunos vinculados ao curso permanecem salvos no histórico
  };

  const adicionarTurma = (turma: Omit<Turma, 'id' | 'codigo'>) => {
    const proximoCodigo = turmas.length + 1;
    const codigo = `#${proximoCodigo.toString().padStart(4, '0')}`;
    
    // Pegar o curso para definir valores padrão
    const curso = cursos.find(c => c.id === turma.cursoId);
    
    const novaTurma = { 
      ...turma, 
      id: Date.now().toString(), 
      codigo,
      // Definir valores padrão se não fornecidos
      horario: turma.horario || (curso ? `${curso.horarioInicio} - ${curso.horarioFim}` : ''),
      vagasDisponiveis: turma.vagasDisponiveis || 30,
      statusTurma: (turma.statusTurma || 'Planejada') as 'Planejada' | 'Confirmada' | 'Em Andamento' | 'Concluída',
      // Pegar preço do curso automaticamente
      preco: curso ? curso.valorBase : 0
    };
    setTurmas([...turmas, novaTurma]);
  };

  const atualizarTurma = (id: string, dadosAtualizados: Partial<Turma>) => {
    console.log('🔄 [PERSISTÊNCIA] atualizarTurma chamado');
    console.log('🔄 [PERSISTÊNCIA] ID da turma:', id);
    console.log('🔄 [PERSISTÊNCIA] Dados atualizados:', dadosAtualizados);
    
    setTurmas(turmas.map(turma => 
      turma.id === id ? { ...turma, ...dadosAtualizados } : turma
    ));
    
    console.log('✅ [PERSISTÊNCIA] Turma atualizada no estado. O useEffect salvará no localStorage automaticamente.');
  };

  const excluirTurma = (id: string) => {
    setTurmas(turmas.filter(turma => turma.id !== id));
    toast.success('Turma excluída com sucesso!');
  };

  // 🆕 Funções para gerenciar instrutores nas turmas
  const vincularInstrutorTurma = (turmaId: string, instrutorId: string) => {
    setTurmas(turmas.map(turma => {
      if (turma.id === turmaId) {
        const instrutoresAtuais = turma.instrutores || [];
        // Verificar se o instrutor já está vinculado
        if (instrutoresAtuais.some(i => i.instrutorId === instrutorId)) {
          toast.error('Este instrutor já está vinculado a esta turma!');
          return turma;
        }
        // Adicionar o instrutor
        const instrutor = instrutores.find(i => i.id === instrutorId);
        toast.success(`Instrutor ${instrutor?.nome} vinculado à turma com sucesso!`);
        return {
          ...turma,
          instrutores: [...instrutoresAtuais, { instrutorId, presencas: [] }]
        };
      }
      return turma;
    }));
  };

  const desvincularInstrutorTurma = (turmaId: string, instrutorId: string) => {
    // Contar quantos lançamentos e provas serão removidos
    const lancamentosRemovidos = lancamentosCusto.filter(lanc => 
      lanc.instrutorId === instrutorId && lanc.turmaId === turmaId
    ).length;
    
    const provasRemovidas = provasAgendadas.filter(prova =>
      prova.instrutorId === instrutorId && prova.turmaId === turmaId
    ).length;
    
    setTurmas(turmas.map(turma => {
      if (turma.id === turmaId) {
        const instrutoresAtuais = turma.instrutores || [];
        const instrutor = instrutores.find(i => i.id === instrutorId);
        
        // 🆕 Remover lançamentos de custo relacionados ao instrutor nesta turma
        setLancamentosCusto(lancamentos => 
          lancamentos.filter(lanc => 
            !(lanc.instrutorId === instrutorId && lanc.turmaId === turmaId)
          )
        );
        
        // 🆕 Remover provas agendadas do instrutor nesta turma
        setProvasAgendadas(provas =>
          provas.filter(prova =>
            !(prova.instrutorId === instrutorId && prova.turmaId === turmaId)
          )
        );
        
        // Mensagem detalhada sobre o que foi removido
        let mensagem = `Instrutor ${instrutor?.nome} removido da turma!`;
        const itensRemovidos = [];
        if (lancamentosRemovidos > 0) itensRemovidos.push(`${lancamentosRemovidos} lançamento(s)`);
        if (provasRemovidas > 0) itensRemovidos.push(`${provasRemovidas} prova(s)`);
        if (itensRemovidos.length > 0) {
          mensagem += ` Também removidos: ${itensRemovidos.join(' e ')}.`;
        }
        
        toast.success(mensagem);
        return {
          ...turma,
          instrutores: instrutoresAtuais.filter(i => i.instrutorId !== instrutorId)
        };
      }
      return turma;
    }));
  };

  const confirmarPresencaInstrutor = (turmaId: string, instrutorId: string, data: string, usuarioId: string) => {
    setTurmas(turmas.map(turma => {
      if (turma.id === turmaId) {
        const instrutoresAtuais = turma.instrutores || [];
        return {
          ...turma,
          instrutores: instrutoresAtuais.map(inst => {
            if (inst.instrutorId === instrutorId) {
              // Verificar se a presença já foi confirmada nesta data
              if (inst.presencas.some(p => p.data === data)) {
                toast.error('Presença já confirmada para esta data!');
                return inst;
              }
              // Adicionar nova presença
              const instrutor = instrutores.find(i => i.id === instrutorId);
              toast.success(`Presença de ${instrutor?.nome} confirmada!`);
              
              // 🆕 DISPARO AUTOMÁTICO DE CUSTOS DE INSTRUTOR
              setTimeout(() => {
                dispararCustosInstrutorAutomaticos(instrutorId, turmaId, data);
              }, 100);
              
              return {
                ...inst,
                presencas: [...inst.presencas, {
                  data,
                  confirmadoEm: new Date().toISOString(),
                  confirmadoPor: usuarioId
                }]
              };
            }
            return inst;
          })
        };
      }
      return turma;
    }));
  };

  const adicionarAluno = (aluno: Omit<Aluno, 'id' | 'codigoSistema'>) => {
    console.log('➕ [CONTEXT] adicionarAluno chamado');
    console.log('➕ [CONTEXT] Dados recebidos:', aluno);
    console.log('➕ [CONTEXT] Campo substitutoDe:', aluno.substitutoDe);
    console.log('➕ [CONTEXT] produtosExtras recebido:', aluno.produtosExtras);
    
    // 🔧 FIX: Buscar o maior código existente e incrementar para garantir unicidade
    const codigosExistentes = alunos
      .map(a => {
        const match = a.codigoSistema.match(/A(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maiorCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
    const proximoCodigo = maiorCodigo + 1;
    const codigoSistema = `A${proximoCodigo.toString().padStart(4, '0')}`;
    
    console.log('🔢 [CONTEXT] Códigos existentes:', codigosExistentes);
    console.log('🔢 [CONTEXT] Maior código:', maiorCodigo);
    console.log('🔢 [CONTEXT] Próximo código:', proximoCodigo);
    
    // 🔧 FIX: Garantir que produtosExtras seja sempre um array
    const novoAluno = { 
      ...aluno, 
      id: Date.now().toString(), 
      codigoSistema,
      produtosExtras: aluno.produtosExtras || [] // ✅ Sempre array!
    };
    
    console.log('➕ [CONTEXT] Novo aluno criado:', novoAluno);
    console.log('➕ [CONTEXT] Novo código:', codigoSistema);
    console.log('➕ [CONTEXT] produtosExtras final:', novoAluno.produtosExtras);
    console.log('➕ [CONTEXT] Campo substitutoDe no novo aluno:', novoAluno.substitutoDe);
    
    setAlunos([...alunos, novoAluno]);
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Nova Matrícula Criada
    // ✅ FIX: Passar o objeto do aluno diretamente para evitar race condition
    setTimeout(() => {
      dispararCustosAutomaticos('Nova Matrícula Criada', novoAluno.id, undefined, novoAluno);
    }, 100);
  };

  const atualizarAluno = (id: string, dadosAtualizados: Partial<Aluno>) => {
    console.log('🔄 [CONTEXT] atualizarAluno chamado');
    console.log('🔄 [CONTEXT] ID:', id);
    console.log('🔄 [CONTEXT] Dados recebidos:', dadosAtualizados);
    console.log('🔄 [CONTEXT] produtosExtras recebidos:', dadosAtualizados.produtosExtras);
    
    // Buscar aluno antes da atualização
    const alunoAntes = alunos.find(a => a.id === id);
    
    // Criar objeto do aluno atualizado
    const alunoAtualizado = alunoAntes ? { ...alunoAntes, ...dadosAtualizados } : undefined;
    
    setAlunos(alunos.map(aluno => 
      aluno.id === id ? { ...aluno, ...dadosAtualizados } : aluno
    ));
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Mudanças de Status
    // ✅ FIX: Passar o objeto do aluno atualizado para evitar race condition
    if (dadosAtualizados.statusLink && alunoAntes && dadosAtualizados.statusLink !== alunoAntes.statusLink && alunoAtualizado) {
      setTimeout(() => {
        const acao = `Status → ${dadosAtualizados.statusLink}` as AcaoDisparoCusto;
        dispararCustosAutomaticos(acao, id, undefined, alunoAtualizado);
      }, 100);
    }
  };

  // 🆕 Atualiza múltiplos alunos de uma vez (batch update)
  const atualizarAlunosEmLote = (atualizacoes: Map<string, Partial<Aluno>>) => {
    console.log('🔄 [CONTEXT] atualizarAlunosEmLote chamado');
    console.log('🔄 [CONTEXT] Quantidade de alunos a atualizar:', atualizacoes.size);
    
    setAlunos(prevAlunos => prevAlunos.map(aluno => {
      const atualizacao = atualizacoes.get(aluno.id);
      if (atualizacao) {
        console.log(`🔄 [CONTEXT] Atualizando aluno ${aluno.codigoSistema}`);
        return { ...aluno, ...atualizacao };
      }
      return aluno;
    }));
    
    console.log('✅ [CONTEXT] Lote de atualizações aplicado!');
  };

  // Remove um aluno do sistema
  const excluirAluno = (id: string) => {
    // 🆕 Verificar custos de prova que serão excluídos
    const verificacaoCustos = verificarCustosProvaParaExcluir(id);
    
    // 🆕 Se há custos para excluir, excluí-los
    if (verificacaoCustos.excluir && verificacaoCustos.custos.length > 0) {
      console.log(`🗑️ [EXCLUSÃO ALUNO] Excluindo ${verificacaoCustos.custos.length} custo(s) de prova...`);
      
      setLancamentosCusto(prev => 
        prev.filter(l => !verificacaoCustos.custos.some(c => c.id === l.id))
      );
      
      verificacaoCustos.custos.forEach(custo => {
        console.log(`   ❌ Custo excluído: ${custo.codigo} - R$ ${custo.valor.toFixed(2)}`);
      });
    }
    
    // Remover aluno
    setAlunos(alunos.filter(aluno => aluno.id !== id));
  };

  // Substitui um aluno por outro da fila de espera
  const substituirAluno = (alunoAntigoId: string, alunoNovoId: string, motivo?: string) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // ✅ FIX: Criar objetos atualizados antes de disparar custos
    const alunoNovo = alunos.find(a => a.id === alunoNovoId);
    const alunoAntigo = alunos.find(a => a.id === alunoAntigoId);
    
    const alunoNovoAtualizado = alunoNovo ? {
      ...alunoNovo,
      filaEspera: false,
      substitutoDe: alunoAntigo?.codigoSistema,
      observacoes: `${alunoNovo.observacoes || ''}\n✅ ATIVADO em ${dataAtual} substituindo ${alunoAntigo?.nome} (${alunoAntigo?.codigoSistema})`
    } : undefined;
    
    setAlunos(alunos.map(aluno => {
      // Marcar aluno antigo como substituído
      if (aluno.id === alunoAntigoId) {
        return {
          ...aluno,
          substituido: true,
          dataSubstituicao: dataAtual,
          motivoSubstituicao: motivo || 'Substituição solicitada',
          observacoes: `${aluno.observacoes || ''}\n🔄 SUBSTITUÍDO em ${dataAtual} por ${alunoNovo?.nome} (${alunoNovo?.codigoSistema}). Motivo: ${motivo || 'Substituição solicitada'}`
        };
      }
      // Ativar aluno novo (remover da fila de espera)
      if (aluno.id === alunoNovoId) {
        return {
          ...aluno,
          filaEspera: false,
          substitutoDe: alunoAntigo?.codigoSistema,
          observacoes: `${aluno.observacoes || ''}\n✅ ATIVADO em ${dataAtual} substituindo ${alunoAntigo?.nome} (${alunoAntigo?.codigoSistema})`
        };
      }
      return aluno;
    }));
    
    console.log('🔄 [SUBSTITUIÇÃO] Aluno substituído com sucesso');
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Aluno Substituído
    // ✅ FIX: Passar o objeto do aluno novo atualizado
    if (alunoNovoAtualizado) {
      setTimeout(() => {
        dispararCustosAutomaticos('Aluno Substituído', alunoNovoId, { alunoAntigoId, motivo }, alunoNovoAtualizado);
      }, 100);
    }
  };

  // 🆕 Obter alunos com mesma prova e instrutor
  const obterAlunosNaMesmaProva = (instrutorId: string, numeroProva: string): Aluno[] => {
    return alunos.filter(a => 
      a.statusProva.ativo && 
      a.statusProva.instrutor === instrutorId && 
      a.statusProva.numeroProva === numeroProva
    );
  };

  // 🆕 Verificar custos de prova que serão excluídos na transferência
  const verificarCustosProvaParaExcluir = (alunoId: string): { custos: LancamentoCusto[], excluir: boolean, motivo: string } => {
    const aluno = alunos.find(a => a.id === alunoId);
    
    if (!aluno) {
      return { custos: [], excluir: false, motivo: '' };
    }

    // Se não tem prova agendada, não tem custos para excluir
    if (!aluno.statusProva.ativo || !aluno.statusProva.instrutor || !aluno.statusProva.numeroProva) {
      return { custos: [], excluir: false, motivo: 'Aluno não possui prova agendada' };
    }

    // Buscar custos vinculados ao aluno com ação "Instrutor Vinculado à Prova"
    const custosProva = lancamentosCusto.filter(l => 
      l.alunoId === alunoId && 
      l.acaoDisparo === 'Instrutor Vinculado à Prova' &&
      l.status !== 'Cancelado'
    );

    // Verificar se há outros alunos com a mesma prova e instrutor
    const alunosNaMesmaProva = obterAlunosNaMesmaProva(
      aluno.statusProva.instrutor, 
      aluno.statusProva.numeroProva
    ).filter(a => a.id !== alunoId); // Excluir o aluno atual da contagem

    if (alunosNaMesmaProva.length > 0) {
      // Há outros alunos na mesma prova - NÃO excluir custos do instrutor
      return { 
        custos: [], 
        excluir: false, 
        motivo: `Há ${alunosNaMesmaProva.length} outro(s) aluno(s) agendado(s) para a mesma prova (${aluno.statusProva.numeroProva}) com o mesmo instrutor. Os custos do instrutor serão mantidos.` 
      };
    }

    // Aluno é o único na prova - custos devem ser excluídos
    if (custosProva.length > 0) {
      const instrutor = instrutores.find(i => i.id === aluno.statusProva.instrutor);
      return { 
        custos: custosProva, 
        excluir: true, 
        motivo: `Aluno é o único agendado para a prova ${aluno.statusProva.numeroProva} com o instrutor ${instrutor?.nome || 'N/A'}. Os custos vinculados a esta prova serão excluídos.` 
      };
    }

    return { custos: [], excluir: false, motivo: 'Nenhum custo encontrado para excluir' };
  };

  // Transfere um aluno para outra turma do mesmo curso
  const transferirAluno = (alunoId: string, novaTurmaId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    const novaTurma = turmas.find(t => t.id === novaTurmaId);
    
    if (!aluno || !novaTurma) {
      console.error('❌ [TRANSFERÊNCIA] Aluno ou turma não encontrados');
      return;
    }

    const turmaAntiga = turmas.find(t => t.id === aluno.turmaId);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // 🆕 Verificar custos de prova que serão excluídos
    const verificacaoCustos = verificarCustosProvaParaExcluir(alunoId);
    
    // 🆕 Se há custos para excluir, excluí-los
    if (verificacaoCustos.excluir && verificacaoCustos.custos.length > 0) {
      console.log(`🗑️ [TRANSFERÊNCIA] Excluindo ${verificacaoCustos.custos.length} custo(s) de prova...`);
      
      setLancamentosCusto(prev => 
        prev.filter(l => !verificacaoCustos.custos.some(c => c.id === l.id))
      );
      
      verificacaoCustos.custos.forEach(custo => {
        console.log(`   ❌ Custo excluído: ${custo.codigo} - R$ ${custo.valor.toFixed(2)}`);
      });
    }

    // ✅ FIX: Criar objeto do aluno atualizado
    const alunoAtualizado = {
      ...aluno,
      turmaId: novaTurmaId,
      dataInicioAluno: novaTurma.dataInicio,
      dataFimAluno: novaTurma.dataFim,
      valorTotal: novaTurma.preco,
      statusProva: {
        ativo: false
      },
      observacoes: `${aluno.observacoes || ''}\n🔄 TRANSFERIDO em ${dataAtual} da turma ${turmaAntiga?.codigo || 'N/A'} para ${novaTurma.codigo}`
    };

    setAlunos(alunos.map(a => {
      if (a.id === alunoId) {
        return alunoAtualizado;
      }
      return a;
    }));

    console.log(`🔄 [TRANSFERÊNCIA] Aluno ${aluno.nome} transferido de ${turmaAntiga?.codigo} para ${novaTurma.codigo}`);
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Aluno Transferido
    // ✅ FIX: Passar o objeto do aluno atualizado
    setTimeout(() => {
      dispararCustosAutomaticos('Aluno Transferido', alunoId, { turmaAntigaId: aluno.turmaId, novaTurmaId }, alunoAtualizado);
    }, 100);
  };

  // Marca presença do aluno em um dia específico
  const marcarPresencaDia = (alunoId: string, data: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    
    if (!aluno) {
      console.error('❌ [PRESENÇA] Aluno não encontrado');
      return;
    }
    
    // ✅ FIX: Criar objeto do aluno atualizado
    const presencasAtualizadas = {
      ...aluno.presencasPorDia,
      [data]: true
    };
    
    const alunoAtualizado = {
      ...aluno,
      presencasPorDia: presencasAtualizadas
    };
    
    setAlunos(alunos.map(a => {
      if (a.id === alunoId) {
        return alunoAtualizado;
      }
      return a;
    }));
    
    console.log(`✅ [PRESENÇA] Presença marcada para aluno ${alunoId} no dia ${data}`);
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Presença Marcada no Dia
    // ✅ FIX: Passar o objeto do aluno atualizado
    setTimeout(() => {
      dispararCustosAutomaticos('Presença Marcada no Dia', alunoId, { data }, alunoAtualizado);
    }, 100);
  };

  const gerarCodigoProva = (): string => {
    const novoContador = contadorProvas + 1;
    setContadorProvas(novoContador);
    const codigoProva = `P${novoContador.toString().padStart(4, '0')}`;
    return codigoProva;
  };

  // 🆕 Cancelar custos gerados por uma ação específica (ex: cancelar custos de "Prova Cancelada" quando uma nova prova é agendada)
  const cancelarCustosPorAcao = (alunoId: string, acao: AcaoDisparoCusto) => {
    setLancamentosCusto(prevLancamentos => 
      prevLancamentos.map(lancamento => {
        // Se o lançamento foi gerado pela ação especificada para este aluno
        if (
          lancamento.alunoId === alunoId && 
          lancamento.acaoDisparo === acao &&
          lancamento.status !== 'Pago' && // Não cancelar se já foi pago
          lancamento.status !== 'Cancelado' // Não cancelar se já está cancelado
        ) {
          console.log(`🔴 [CANCELAR CUSTOS] Cancelando lançamento ${lancamento.codigo} gerado pela ação: ${acao}`);
          toast.info(`🔴 Custo cancelado: ${lancamento.codigo}`, {
            description: `Lançamento gerado pela ação "${acao}" foi cancelado`,
            duration: 4000
          });
          return { ...lancamento, status: 'Cancelado' as const };
        }
        return lancamento;
      })
    );
  };

  const cancelarProva = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    
    if (!aluno) {
      console.error('❌ [CANCELAR PROVA] Aluno não encontrado');
      return;
    }
    
    // 🆕 Verificar custos de prova que serão excluídos (instrutor)
    const verificacaoCustos = verificarCustosProvaParaExcluir(alunoId);
    
    // 🆕 Se há custos de instrutor para excluir (aluno único), excluí-los
    if (verificacaoCustos.excluir && verificacaoCustos.custos.length > 0) {
      console.log(`🗑️ [CANCELAR PROVA] Excluindo ${verificacaoCustos.custos.length} custo(s) de instrutor...`);
      
      setLancamentosCusto(prev => 
        prev.filter(l => !verificacaoCustos.custos.some(c => c.id === l.id))
      );
      
      verificacaoCustos.custos.forEach(custo => {
        console.log(`   ❌ Custo de instrutor excluído: ${custo.codigo} - R$ ${custo.valor.toFixed(2)}`);
      });
    }
    
    // ✅ FIX: Criar objeto do aluno atualizado
    const alunoAtualizado = { ...aluno, statusProva: { ativo: false } };
    
    setAlunos(alunos.map(a => 
      a.id === alunoId ? alunoAtualizado : a
    ));
    
    // 🆕 CANCELAR custos que foram gerados pela ação "Prova Agendada" (custos do aluno)
    cancelarCustosPorAcao(alunoId, 'Prova Agendada');
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Prova Cancelada
    // ✅ FIX: Passar o objeto do aluno atualizado
    setTimeout(() => {
      dispararCustosAutomaticos('Prova Cancelada', alunoId, undefined, alunoAtualizado);
    }, 100);
  };

  // Registra o resultado da prova (requer confirmação de usuário Master)
  const registrarResultadoProva = (
    alunoId: string, 
    status: 'Aprovado' | 'Reprovado' | 'No Show',
    observacoes: string,
    usuarioId: string
  ) => {
    const agora = new Date();
    const dataAtual = agora.toLocaleDateString('pt-BR');
    const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const aluno = alunos.find(a => a.id === alunoId);
    
    if (!aluno) {
      console.error('❌ [RESULTADO PROVA] Aluno não encontrado');
      return;
    }
    
    // ✅ FIX: Criar objeto do aluno atualizado
    const alunoAtualizado = {
      ...aluno,
      resultadoProva: {
        status,
        data: dataAtual,
        hora: horaAtual,
        observacoes,
        registradoPor: usuarioId,
        confirmedoPor: usuarioId, // Já confirmado diretamente pelo Master
        dataConfirmacao: dataAtual,
        horaConfirmacao: horaAtual
      }
    };

    setAlunos(alunos.map(a => {
      if (a.id === alunoId) {
        return alunoAtualizado;
      }
      return a;
    }));

    console.log(`📝 [RESULTADO PROVA] ${status} registrado para aluno ${alunoId}`);
    
    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Resultado de Prova
    // ✅ FIX: Passar o objeto do aluno atualizado
    setTimeout(() => {
      const acao = `Resultado Prova → ${status}` as AcaoDisparoCusto;
      dispararCustosAutomaticos(acao, alunoId, undefined, alunoAtualizado);
    }, 100);
  };

  // 🆕 Agendar Prova
  const agendarProva = (dados: { 
    turmaId: string; 
    numeroProva: string; 
    nomeProva: string; 
    data: string; 
    hora: string; 
    instrutorId: string; 
    alunosIds: string[] 
  }) => {
    const novaProva: ProvaAgendada = {
      id: `prova-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      turmaId: dados.turmaId,
      numeroProva: dados.numeroProva,
      nomeProva: dados.nomeProva,
      data: dados.data,
      hora: dados.hora,
      instrutorId: dados.instrutorId,
      alunosIds: dados.alunosIds,
      dataCriacao: new Date().toISOString()
    };

    setProvasAgendadas(prev => [...prev, novaProva]);

    // Atualizar statusProva dos alunos
    setAlunos(prev => prev.map(aluno => {
      if (dados.alunosIds.includes(aluno.id)) {
        return {
          ...aluno,
          statusProva: {
            ativo: true,
            instrutor: dados.instrutorId,
            data: dados.data,
            hora: dados.hora,
            numeroProva: dados.numeroProva,
            nomeProva: dados.nomeProva,
            resultado: 'Pendente'
          }
        };
      }
      return aluno;
    }));

    // Disparar custos do instrutor para a prova (com verificação de duplicação por data + numeroProva)
    dispararCustosInstrutorProva(dados.instrutorId, dados.alunosIds[0], dados.numeroProva, dados.nomeProva, dados.data);

    // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Prova Agendada para cada aluno
    dados.alunosIds.forEach(alunoId => {
      setTimeout(() => {
        dispararCustosAutomaticos('Prova Agendada', alunoId);
      }, 100);
    });

    console.log(`✅ [AGENDAR PROVA] Prova ${dados.numeroProva} agendada para ${dados.alunosIds.length} alunos`);
  };

  // 🆕 Editar Prova Agendada
  const editarProvaAgendada = (provaId: string, dados: Partial<Omit<ProvaAgendada, 'id' | 'dataCriacao'>>) => {
    const provaAnterior = provasAgendadas.find(p => p.id === provaId);
    if (!provaAnterior) {
      console.error('❌ [EDITAR PROVA] Prova não encontrada');
      return;
    }

    setProvasAgendadas(prev => prev.map(p => 
      p.id === provaId ? { ...p, ...dados } : p
    ));

    // Se a lista de alunos mudou, atualizar os status
    if (dados.alunosIds) {
      const alunosRemovidos = provaAnterior.alunosIds.filter(id => !dados.alunosIds!.includes(id));
      const alunosAdicionados = dados.alunosIds.filter(id => !provaAnterior.alunosIds.includes(id));

      // 🆕 Para cada aluno removido, verificar e excluir custos órfãos de instrutor
      if (alunosRemovidos.length > 0) {
        console.log(`🗑️ [EDITAR PROVA] ${alunosRemovidos.length} aluno(s) removido(s) da prova ${provaAnterior.numeroProva}`);
        
        alunosRemovidos.forEach(alunoId => {
          const aluno = alunos.find(a => a.id === alunoId);
          if (!aluno) return;

          // Verificar custos de prova que serão excluídos (instrutor)
          const verificacaoCustos = verificarCustosProvaParaExcluir(alunoId);
          
          // Se há custos de instrutor para excluir (aluno único), excluí-los
          if (verificacaoCustos.excluir && verificacaoCustos.custos.length > 0) {
            console.log(`   🗑️ Aluno ${aluno.nome}: Excluindo ${verificacaoCustos.custos.length} custo(s) de instrutor...`);
            
            setLancamentosCusto(prev => 
              prev.filter(l => !verificacaoCustos.custos.some(c => c.id === l.id))
            );
            
            verificacaoCustos.custos.forEach(custo => {
              console.log(`      ❌ Custo de instrutor excluído: ${custo.codigo} - R$ ${custo.valor.toFixed(2)}`);
            });
          }

          // 🆕 CANCELAR custos que foram gerados pela ação "Prova Agendada" (custos do aluno)
          cancelarCustosPorAcao(alunoId, 'Prova Agendada');
        });
      }

      setAlunos(prev => prev.map(aluno => {
        // Remover prova dos alunos removidos
        if (alunosRemovidos.includes(aluno.id)) {
          return { ...aluno, statusProva: { ativo: false } };
        }
        // Adicionar prova aos alunos adicionados ou atualizar dados
        if (dados.alunosIds!.includes(aluno.id)) {
          return {
            ...aluno,
            statusProva: {
              ativo: true,
              instrutor: dados.instrutorId || provaAnterior.instrutorId,
              data: dados.data || provaAnterior.data,
              hora: dados.hora || provaAnterior.hora,
              numeroProva: dados.numeroProva || provaAnterior.numeroProva,
              nomeProva: dados.nomeProva || provaAnterior.nomeProva,
              resultado: 'Pendente'
            }
          };
        }
        return aluno;
      }));

      // Se mudou instrutor ou número de prova, disparar novos custos
      if (dados.instrutorId && dados.numeroProva && 
          (dados.instrutorId !== provaAnterior.instrutorId || dados.numeroProva !== provaAnterior.numeroProva)) {
        dispararCustosInstrutorProva(
          dados.instrutorId, 
          dados.alunosIds[0], 
          dados.numeroProva, 
          dados.nomeProva || provaAnterior.nomeProva, 
          dados.data || provaAnterior.data
        );
      }

      // 🆕 DISPARAR CUSTOS AUTOMÁTICOS: Prova Agendada para alunos adicionados
      if (alunosAdicionados.length > 0) {
        alunosAdicionados.forEach(alunoId => {
          setTimeout(() => {
            dispararCustosAutomaticos('Prova Agendada', alunoId);
          }, 100);
        });
      }
    }

    console.log(`✅ [EDITAR PROVA] Prova ${provaId} atualizada`);
  };

  // 🆕 Excluir Prova Agendada
  const excluirProvaAgendada = (provaId: string) => {
    const prova = provasAgendadas.find(p => p.id === provaId);
    if (!prova) {
      console.error('❌ [EXCLUIR PROVA] Prova não encontrada');
      return;
    }

    console.log(`🗑️ [EXCLUIR PROVA] Iniciando exclusão da prova ${provaId}...`);
    console.log(`   📋 Alunos vinculados: ${prova.alunosIds.length}`);

    // 🆕 Para cada aluno vinculado à prova, verificar e excluir custos órfãos
    prova.alunosIds.forEach(alunoId => {
      const aluno = alunos.find(a => a.id === alunoId);
      if (!aluno) return;

      // Verificar custos de prova que serão excluídos (instrutor)
      const verificacaoCustos = verificarCustosProvaParaExcluir(alunoId);
      
      // Se há custos de instrutor para excluir (aluno único), excluí-los
      if (verificacaoCustos.excluir && verificacaoCustos.custos.length > 0) {
        console.log(`   🗑️ Aluno ${aluno.nome}: Excluindo ${verificacaoCustos.custos.length} custo(s) de instrutor...`);
        
        setLancamentosCusto(prev => 
          prev.filter(l => !verificacaoCustos.custos.some(c => c.id === l.id))
        );
        
        verificacaoCustos.custos.forEach(custo => {
          console.log(`      ❌ Custo de instrutor excluído: ${custo.codigo} - R$ ${custo.valor.toFixed(2)}`);
        });
      } else if (!verificacaoCustos.excluir && verificacaoCustos.motivo) {
        console.log(`   ℹ️ Aluno ${aluno.nome}: ${verificacaoCustos.motivo}`);
      }

      // 🆕 CANCELAR custos que foram gerados pela ação "Prova Agendada" (custos do aluno)
      cancelarCustosPorAcao(alunoId, 'Prova Agendada');
    });

    setProvasAgendadas(prev => prev.filter(p => p.id !== provaId));

    // Remover statusProva dos alunos
    setAlunos(prev => prev.map(aluno => {
      if (prova.alunosIds.includes(aluno.id)) {
        return { ...aluno, statusProva: { ativo: false } };
      }
      return aluno;
    }));

    console.log(`✅ [EXCLUIR PROVA] Prova ${provaId} excluída com sucesso`);
  };

  const atualizarConfiguracoesEmail = (config: Partial<ConfiguracoesEmail>) => {
    setConfiguracoesEmail({ ...configuracoesEmail, ...config });
  };

  const atualizarConfiguracoesWhatsApp = (config: Partial<ConfiguracoesWhatsApp>) => {
    setConfiguracoesWhatsApp({ ...configuracoesWhatsApp, ...config });
  };

  // 🆕 Atualizar Dados Institucionais da Empresa
  const atualizarDadosInstitucionais = (dados: Partial<DadosInstitucionais>) => {
    setDadosInstitucionais({ ...dadosInstitucionais, ...dados });
    toast.success('✅ Dados da empresa atualizados com sucesso!');
  };

  // 🆕 Função auxiliar: Calcular data de vencimento
  const calcularDataVencimento = (criterio: CriterioCusto, aluno: Aluno): string => {
    const hoje = new Date();
    
    switch (criterio.criterioVencimento) {
      case 'Data Término do Curso':
        if (aluno.dataFimAluno) {
          return aluno.dataFimAluno;
        }
        return new Date(hoje.setMonth(hoje.getMonth() + 1)).toLocaleDateString('pt-BR');
      
      case '30 dias após término':
        if (aluno.dataFimAluno) {
          const dataFim = new Date(aluno.dataFimAluno.split('/').reverse().join('-'));
          dataFim.setDate(dataFim.getDate() + 30);
          return dataFim.toLocaleDateString('pt-BR');
        }
        return new Date(hoje.setMonth(hoje.getMonth() + 2)).toLocaleDateString('pt-BR');
      
      case 'Fechamento Mensal':
        const diaFechamento = criterio.diaFechamentoMensal || 5;
        const diasPagamento = criterio.diasPagamentoAposFechamento || 0;
        const dataVenc = new Date(hoje.getFullYear(), hoje.getMonth(), diaFechamento + diasPagamento);
        if (dataVenc < hoje) {
          dataVenc.setMonth(dataVenc.getMonth() + 1);
        }
        return dataVenc.toLocaleDateString('pt-BR');
      
      case 'Sem Vencimento':
        return '-';
      
      default:
        return new Date(hoje.setMonth(hoje.getMonth() + 1)).toLocaleDateString('pt-BR');
    }
  };

  // 🆕 SISTEMA DE DISPARO AUTOMÁTICO DE CUSTOS BASEADO NO CAMPO "QUANDO"
  const dispararCustosAutomaticos = (acao: AcaoDisparoCusto, alunoId: string, dadosAdicionais?: any, alunoObj?: Aluno) => {
    console.log(`🎯 [DISPARO AUTOMÁTICO] Ação: ${acao} | Aluno: ${alunoId}`);
    
    // ✅ FIX: Usar alunoObj se fornecido, caso contrário buscar no array
    const aluno = alunoObj || alunos.find(a => a.id === alunoId);
    if (!aluno) {
      console.error(`❌ [DISPARO AUTOMÁTICO] Aluno ${alunoId} não encontrado!`);
      return;
    }
    
    // Buscar critérios que têm essa ação configurada no campo "quando"
    const criteriosParaDisparar = criteriosCusto.filter(criterio => 
      criterio.ativo && criterio.quando && criterio.quando.includes(acao)
    );

    if (criteriosParaDisparar.length === 0) {
      console.log(`ℹ️ [DISPARO AUTOMÁTICO] Nenhum critério configurado para a ação: ${acao}`);
      return;
    }

    console.log(`✅ [DISPARO AUTOMÁTICO] ${criteriosParaDisparar.length} critério(s) encontrado(s):`, criteriosParaDisparar.map(c => c.nome));

    // 🆕 Buscar produto(s) vinculado(s) ao aluno
    const turma = turmas.find(t => t.id === aluno.turmaId);
    const curso = turma ? cursos.find(c => c.id === turma.cursoId) : undefined;
    
    // 🆕 Identificar produtos do aluno (pode vir de Cliente PJ ou do curso)
    let produtosDoAluno: string[] = [];
    
    console.log(`🔍 [DEBUG] Aluno:`, {
      id: aluno.id,
      nome: aluno.nome,
      clientePJId: aluno.clientePJId,
      turmaId: aluno.turmaId
    });
    
    // Se aluno tem Cliente PJ, buscar produtos na precificação
    if (aluno.clientePJId) {
      const clientePJ = clientesPJ.find(c => c.id === aluno.clientePJId);
      console.log(`🔍 [DEBUG] Cliente PJ encontrado:`, clientePJ?.nome);
      
      if (clientePJ && curso) {
        console.log(`🔍 [DEBUG] Curso:`, curso.nome, 'ID:', curso.id);
        const precificacao = clientePJ.precificacoes?.find(p => p.cursoId === curso.id);
        console.log(`🔍 [DEBUG] Precificação encontrada:`, precificacao);
        
        if (precificacao?.produtosInclusos) {
          console.log(`🔍 [DEBUG] Produtos inclusos na precificação (códigos):`, precificacao.produtosInclusos);
          const produtosComCodigo = produtosExtras.filter(p => 
            precificacao.produtosInclusos!.includes(p.codigo)
          );
          console.log(`🔍 [DEBUG] Produtos encontrados:`, produtosComCodigo.map(p => `${p.codigo} (ID: ${p.id})`));
          produtosDoAluno = produtosComCodigo.map(p => p.id);
        }
      }
    }
    
    // Se não encontrou produtos via PJ, buscar no curso
    if (produtosDoAluno.length === 0 && curso?.produtosVinculados) {
      console.log(`🔍 [DEBUG] Buscando produtos vinculados ao curso:`, curso.produtosVinculados);
      produtosDoAluno = curso.produtosVinculados;
    }
    
    console.log(`📦 [DISPARO AUTOMÁTICO] Produtos do aluno (IDs):`, produtosDoAluno);

    // 🆕 Array para coletar TODOS os lançamentos antes de gerar códigos
    const lancamentosParaCriar: Array<{
      custoAuditavel: CustoAuditavel;
      criterio: CriterioCusto;
      dataVencimento: string;
      observacoes: string;
    }> = [];

    // Para cada critério, coletar os custos
    criteriosParaDisparar.forEach(criterio => {
      console.log(`💰 [DISPARO AUTOMÁTICO] Processando critério: ${criterio.nome}`);
      
      // 🆕 Se o critério é para Instrutor, ignorar (não gera custo para aluno)
      if (criterio.vinculo === 'Instrutor') {
        console.log(`ℹ️ [DISPARO AUTOMÁTICO] Critério "${criterio.nome}" é para INSTRUTOR - Ignorado (não aplica a alunos)`);
        return;
      }
      
      // 🆕 Buscar TODOS os custos auditáveis vinculados ao critério E que estejam nos produtos do aluno
      console.log(`🔍 [DEBUG] Buscando custos para critério ${criterio.codigo} (ID: ${criterio.id})`);
      console.log(`🔍 [DEBUG] Todos os custos auditáveis:`, custosAuditaveis.map(c => `${c.codigo} (criterioCustoId: ${c.criterioCustoId})`));
      
      const custosAuditaveisDoAluno = custosAuditaveis.filter(custo => {
        // Custo deve estar vinculado ao critério
        if (custo.criterioCustoId !== criterio.id) {
          console.log(`🔍 [DEBUG] ${custo.codigo} não é do critério ${criterio.id} (é do ${custo.criterioCustoId})`);
          return false;
        }
        
        console.log(`🔍 [DEBUG] ${custo.codigo} pertence ao critério ${criterio.id} ✓`);
        
        // Se temos produtos do aluno, verificar se o custo está associado a algum deles
        if (produtosDoAluno.length > 0) {
          const associado = produtosDoAluno.some(produtoId => {
            const produto = produtosExtras.find(p => p.id === produtoId);
            console.log(`🔍 [DEBUG] Verificando produto ${produto?.codigo} (ID: ${produtoId}) - custos associados:`, produto?.custosAssociados);
            const temCusto = produto?.custosAssociados?.includes(custo.id);
            console.log(`🔍 [DEBUG] Produto ${produto?.codigo} tem custo ${custo.codigo}? ${temCusto ? 'SIM ✓' : 'NÃO ✗'}`);
            return temCusto;
          });
          console.log(`🔍 [DEBUG] ${custo.codigo} está associado a algum produto do aluno? ${associado ? 'SIM ✓' : 'NÃO ✗'}`);
          return associado;
        }
        
        // Se não tem produtos, retornar o custo (comportamento padrão)
        console.log(`🔍 [DEBUG] Aluno sem produtos - incluindo custo ${custo.codigo} por padrão`);
        return true;
      });
      
      if (custosAuditaveisDoAluno.length === 0) {
        console.log(`ℹ️ [DISPARO AUTOMÁTICO] Nenhum custo auditável vinculado ao critério "${criterio.nome}" para os produtos do aluno - OK (critério sem custos configurados)`);
        return;
      }
      
      console.log(`✅ [DISPARO AUTOMÁTICO] ${custosAuditaveisDoAluno.length} custo(s) auditável(is) encontrado(s):`, custosAuditaveisDoAluno.map(c => c.nome));
      
      // 🆕 Para cada custo auditável do aluno, coletar para criar depois
      custosAuditaveisDoAluno.forEach((custoAuditavel) => {
        // Verificar duplicação (se frequência = "Única vez")
        if (criterio.frequenciaLancamento === 'Única vez') {
          const jaExiste = lancamentosCusto.some(l => 
            l.criterioCustoId === criterio.id && 
            l.custoAuditavelId === custoAuditavel.id &&
            l.alunoId === alunoId &&
            l.status !== 'Cancelado'
          );
          
          if (jaExiste) {
            console.log(`⚠️ [DISPARO AUTOMÁTICO] Lançamento já existe para ${custoAuditavel.nome} (única vez)`);
            return;
          }
        }
        
        // Calcular data de vencimento
        const dataVencimento = calcularDataVencimento(criterio, aluno);
        
        // Criar observações detalhadas
        let observacoes = `Gerado automaticamente pela ação: ${acao}`;
        
        // Se for presença marcada, adicionar informações da data (passadas via dadosAdicionais)
        if (acao === 'Presença Marcada no Dia' && dadosAdicionais?.data) {
          observacoes += ` | Data da presença: ${dadosAdicionais.data}`;
        }
        
        // 🔧 COLETAR para criar depois (não criar ainda!)
        lancamentosParaCriar.push({
          custoAuditavel,
          criterio,
          dataVencimento,
          observacoes
        });
      });
    });

    // 🔧 FIX CRÍTICO: Agora criar TODOS os lançamentos de uma vez, com códigos sequenciais corretos
    if (lancamentosParaCriar.length === 0) {
      console.log(`ℹ️ [DISPARO AUTOMÁTICO] Nenhum lançamento para criar`);
      return;
    }

    console.log(`🔢 [DISPARO AUTOMÁTICO] Total de lançamentos a criar: ${lancamentosParaCriar.length}`);

    // 🔧 FIX DEFINITIVO: Mover cálculo do código para DENTRO do setState para evitar race condition
    setLancamentosCusto(prev => {
      // Calcular o maior código existente com base no estado ATUAL (incluindo lançamentos anteriores)
      const codigosExistentes = prev
        .map(l => parseInt(l.codigo.replace('L', '')))
        .filter(n => !isNaN(n));
      
      const maiorCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
      console.log(`🔢 [DISPARO AUTOMÁTICO] Maior código no estado atual: L${String(maiorCodigo).padStart(4, '0')}`);

      // Criar todos os lançamentos com códigos sequenciais
      const novosLancamentos: LancamentoCusto[] = [];
      
      lancamentosParaCriar.forEach((dados, index) => {
        const proximoNumero = maiorCodigo + index + 1;
        const codigoLancamento = `L${String(proximoNumero).padStart(4, '0')}`;
        
        const novoLancamento: LancamentoCusto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
          codigo: codigoLancamento,
          custoAuditavelId: dados.custoAuditavel.id,
          criterioCustoId: dados.criterio.id,
          alunoId: aluno.id,
          fornecedorId: dados.custoAuditavel.fornecedorId,
          turmaId: aluno.turmaId,
          cursoId: turmas.find(t => t.id === aluno.turmaId)?.cursoId,
          valor: dados.custoAuditavel.valor,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          dataVencimento: dados.dataVencimento,
          status: 'Pendente',
          observacoes: dados.observacoes,
          geradoAutomaticamente: true,
          acaoDisparo: acao
        };
        
        novosLancamentos.push(novoLancamento);
        
        console.log(`✅ [DISPARO AUTOMÁTICO] Lançamento ${index + 1}/${lancamentosParaCriar.length} criado:`);
        console.log(`   - Código: ${codigoLancamento}`);
        console.log(`   - Custo: ${dados.custoAuditavel.nome}`);
        console.log(`   - Valor: R$ ${dados.custoAuditavel.valor.toFixed(2)}`);
        console.log(`   - Aluno: ${aluno.nome} (${aluno.codigoSistema})`);
        console.log(`   - Vencimento: ${dados.dataVencimento}`);
        console.log(`   - Ação: ${acao}`);
        
        // Toast visual de sucesso
        toast.success(`💰 Custo gerado automaticamente!`, {
          description: `${codigoLancamento} - ${dados.custoAuditavel.nome} - R$ ${dados.custoAuditavel.valor.toFixed(2)} | ${aluno.codigoSistema} - ${aluno.nome}`,
          duration: 5000
        });
      });

      console.log(`🎉 [DISPARO AUTOMÁTICO] ${novosLancamentos.length} lançamento(s) adicionado(s) ao estado!`);
      
      // Retornar o novo estado com os lançamentos adicionados
      return [...prev, ...novosLancamentos];
    });
  };

  // 🆕 Limpar lançamentos de custos órfãos (cujo aluno ou instrutor não existe mais)
  const limparLancamentosOrfaos = (): number => {
    console.log('🧹 [LIMPEZA] Iniciando limpeza de lançamentos órfãos...');
    
    const alunosIds = new Set(alunos.map(a => a.id));
    const instrutoresIds = new Set(instrutores.map(i => i.id));
    const lancamentosValidos: LancamentoCusto[] = [];
    let removidos = 0;
    
    lancamentosCusto.forEach(lancamento => {
      let isOrfao = false;
      
      // Se o lançamento tem alunoId mas o aluno não existe mais, é órfão
      if (lancamento.alunoId && !alunosIds.has(lancamento.alunoId)) {
        console.warn(`🗑️ Removendo lançamento órfão (aluno): ${lancamento.codigo} (alunoId: ${lancamento.alunoId})`);
        isOrfao = true;
      }
      
      // 🆕 Se o lançamento tem instrutorId mas o instrutor não existe mais, é órfão
      if (lancamento.instrutorId && !instrutoresIds.has(lancamento.instrutorId)) {
        console.warn(`🗑️ Removendo lançamento órfão (instrutor): ${lancamento.codigo} (instrutorId: ${lancamento.instrutorId})`);
        isOrfao = true;
      }
      
      if (isOrfao) {
        removidos++;
      } else {
        lancamentosValidos.push(lancamento);
      }
    });
    
    if (removidos > 0) {
      setLancamentosCusto(lancamentosValidos);
      console.log(`✅ [LIMPEZA] ${removidos} lançamento(s) órfão(s) removido(s)!`);
      toast.success(`🧹 Limpeza concluída!`, {
        description: `${removidos} lançamento(s) órfão(s) foram removidos do sistema.`
      });
    } else {
      console.log(`✅ [LIMPEZA] Nenhum lançamento órfão encontrado!`);
      toast.info('✅ Sistema limpo!', {
        description: 'Nenhum lançamento órfão foi encontrado.'
      });
    }
    
    return removidos;
  };

  // 🔧 FUNÇÃO DE CORREÇÃO: Renumerar lançamentos de custo duplicados
  const renumerarLancamentosCusto = () => {
    console.log('🔧 [CORREÇÃO] Iniciando renumeração de lançamentos de custo...');
    
    // Verificar se há duplicados
    const codigosMap = new Map<string, number>();
    lancamentosCusto.forEach(l => {
      const count = codigosMap.get(l.codigo) || 0;
      codigosMap.set(l.codigo, count + 1);
    });
    
    const hasDuplicados = Array.from(codigosMap.values()).some(count => count > 1);
    
    if (!hasDuplicados) {
      console.log('✅ [CORREÇÃO] Nenhum código duplicado encontrado!');
      return;
    }
    
    console.warn('⚠️ [CORREÇÃO] Códigos duplicados encontrados! Renumerando...');
    
    // Renumerar todos os lançamentos em ordem de criação (ID)
    const lancamentosOrdenados = [...lancamentosCusto].sort((a, b) => {
      return parseInt(a.id) - parseInt(b.id);
    });
    
    const lancamentosRenumerados = lancamentosOrdenados.map((lancamento, index) => {
      const novoCodigo = `L${String(index + 1).padStart(4, '0')}`;
      return {
        ...lancamento,
        codigo: novoCodigo
      };
    });
    
    setLancamentosCusto(lancamentosRenumerados);
    console.log(`✅ [CORREÇÃO] ${lancamentosRenumerados.length} lançamentos renumerados com sucesso!`);
    toast.success('🔧 Códigos corrigidos!', {
      description: `${lancamentosRenumerados.length} lançamentos foram renumerados automaticamente.`,
      duration: 5000
    });
  };

  // 🗑️ FUNÇÃO: Excluir lançamento de custo específico
  const excluirLancamentoCusto = (lancamentoId: string) => {
    const lancamento = lancamentosCusto.find(l => l.id === lancamentoId);
    if (!lancamento) {
      toast.error('Lançamento não encontrado!');
      return;
    }
    
    setLancamentosCusto(lancamentosCusto.filter(l => l.id !== lancamentoId));
    console.log(`🗑️ [EXCLUSÃO] Lançamento ${lancamento.codigo} removido!`);
    toast.success('Lançamento excluído!', {
      description: `O lançamento ${lancamento.codigo} foi removido com sucesso.`
    });
  };

  const resetarDados = () => {
    localStorage.removeItem('smcorp-salas');
    localStorage.removeItem('smcorp-usuarios');
    localStorage.removeItem('smcorp-clientespj');
    localStorage.removeItem('smcorp-custosauditaveis');
    localStorage.removeItem('smcorp-criterios-custo');
    localStorage.removeItem('smcorp-lancamentos-custo');
    localStorage.removeItem('smcorp-fornecedores');
    localStorage.removeItem('smcorp-produtosextra');
    localStorage.removeItem('smcorp-cursos');
    localStorage.removeItem('smcorp-turmas');
    localStorage.removeItem('smcorp-alunos');
    localStorage.removeItem('smcorp-contador-provas');
    localStorage.removeItem('smcorp-config-email');
    localStorage.removeItem('smcorp-config-whatsapp');

    setSalas([
      { id: '1', nome: 'Sala 101', localizacao: 'Bloco A', capacidadeMaxima: 30, custoDiaria: 150 },
      { id: '2', nome: 'Sala 102', localizacao: 'Bloco A', capacidadeMaxima: 25, custoDiaria: 120 },
      { id: '3', nome: 'Lab 201', localizacao: 'Bloco B', capacidadeMaxima: 20, custoDiaria: 200 }
    ]);

    setUsuarios([
      { id: '1', codigo: 'U0001', nome: 'Admin Principal', nivel: 'Master', pin: '281242', permissoes: { modulos: { modulo00: true, modulo01: true, modulo02: true, modulo03: true, modulo04: true, modulo05: true, modulo06: true, modulo07: true, modulo08: true }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: true, alterarStatusPagamento: true, alterarStatusDocumentos: true, alterarStatusProva: true, cadastrarCurso: true, editarCurso: true, excluirCurso: true, cadastrarTurma: true, editarTurma: true, excluirTurma: true, gerenciarSalas: true, gerenciarUsuarios: true, gerenciarEmpresas: true, gerenciarFornecedores: true, acessarConfiguracoes: true } } },
      { id: '2', codigo: 'U0002', nome: 'Gerente Operações', nivel: 'Admin', permissoes: { modulos: { modulo00: true, modulo01: true, modulo02: true, modulo03: true, modulo04: true, modulo05: true, modulo06: true, modulo07: false, modulo08: true }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: false, alterarStatusPagamento: true, alterarStatusDocumentos: true, alterarStatusProva: true, cadastrarCurso: true, editarCurso: true, excluirCurso: false, cadastrarTurma: true, editarTurma: true, excluirTurma: false, gerenciarSalas: true, gerenciarUsuarios: false, gerenciarEmpresas: true, gerenciarFornecedores: true, acessarConfiguracoes: false } } },
      { id: '3', codigo: 'U0003', nome: 'Vendedor 1', nivel: 'Vendedor', permissoes: { modulos: { modulo00: false, modulo01: true, modulo02: true, modulo03: false, modulo04: true, modulo05: false, modulo06: false, modulo07: false, modulo08: false }, acoes: { cadastrarAluno: true, editarAluno: true, excluirAluno: false, alterarStatusPagamento: false, alterarStatusDocumentos: false, alterarStatusProva: false, cadastrarCurso: false, editarCurso: false, excluirCurso: false, cadastrarTurma: false, editarTurma: false, excluirTurma: false, gerenciarSalas: false, gerenciarUsuarios: false, gerenciarEmpresas: false, gerenciarFornecedores: false, acessarConfiguracoes: false } } }
    ]);

    setClientesPJ([]);

    setCustosAuditaveis([
      { id: '1', nome: 'Material Didático', valor: 50 },
      { id: '2', nome: 'Certificado', valor: 30 }
    ]);

    setFornecedores([
      { id: '1', codigo: 'F0001', nome: 'Fornecedor A', cnpj: '12.345.678/0001-90', telefone: '(11) 98765-4321', email: 'fornecedorA@email.com' },
      { id: '2', codigo: 'F0002', nome: 'Fornecedor B', cnpj: '98.765.432/0001-89', telefone: '(11) 91234-5678', email: 'fornecedorB@email.com' }
    ]);

    setProdutosExtras([
      { id: '1', codigo: 'PV0001', tipo: 'produto', nome: 'Apostila Premium', valor: 80, custosAssociados: ['1'] },
      { id: '2', codigo: 'EX0001', tipo: 'extra', nome: 'Kit Ferramentas', valor: 150, custosAssociados: ['2'] },
      { id: '3', codigo: 'PV0002', tipo: 'produto', nome: 'Material Didático Completo', valor: 120, custosAssociados: ['1'] },
      { id: '4', codigo: 'EX0002', tipo: 'extra', nome: 'Acesso por Cordas N1', valor: 350, custosAssociados: ['2'] },
      { id: '5', codigo: 'EX0003', tipo: 'extra', nome: 'Certificação NR35', valor: 280, custosAssociados: ['1'] },
      { id: '6', codigo: 'PV0003', tipo: 'produto', nome: 'Uniforme Completo', valor: 95, custosAssociados: ['2'] }
    ]);

    setCursos([
      {
        id: '1',
        codigo: 'C0001',
        nome: 'Eletricista Predial',
        categoria: 'Elétrica',
        cargaHoraria: 80,
        cargaHorariaTotal: 80,
        horasAulaPorDia: 4,
        horarioInicio: '19:00',
        horarioFim: '22:00',
        usaFimDeSemana: false,
        valorBase: 1200,
        descricao: 'Curso completo de instalações elétricas prediais',
        intervalo: 15,
        produtosVinculados: ['1'],
        extrasVinculados: ['2'],
        documentosObrigatorios: []
      },
      {
        id: '2',
        codigo: 'C0002',
        nome: 'Mecânica Automotiva',
        categoria: 'Automotiva',
        cargaHoraria: 120,
        cargaHorariaTotal: 120,
        horasAulaPorDia: 4,
        horarioInicio: '19:00',
        horarioFim: '22:00',
        usaFimDeSemana: false,
        valorBase: 1800,
        descricao: 'Manutenção preventiva e corretiva de veículos',
        intervalo: 15,
        produtosVinculados: [],
        extrasVinculados: [],
        documentosObrigatorios: []
      },
      {
        id: '3',
        codigo: 'C0003',
        nome: 'Trabalho em Altura',
        categoria: 'Segurança',
        cargaHoraria: 40,
        cargaHorariaTotal: 40,
        horasAulaPorDia: 4,
        horarioInicio: '08:00',
        horarioFim: '12:00',
        usaFimDeSemana: true,
        valorBase: 850,
        descricao: 'Curso de segurança para trabalhos em altura com certificação NR35',
        intervalo: 15,
        produtosVinculados: ['3', '6'],
        extrasVinculados: ['4', '5'],
        documentosObrigatorios: [
          { nome: 'RG', requerUpload: true },
          { nome: 'CPF', requerUpload: true },
          { nome: 'Comprovante de Residência', requerUpload: true },
          { nome: 'Atestado Médico', requerUpload: true }
        ]
      }
    ]);

    setTurmas([
      {
        id: '1',
        codigo: '#0001',
        cursoId: '1',
        dataInicio: '2026-01-13',
        dataFim: '2026-02-28',
        horario: '19:00 - 22:00',
        salaId: '1',
        instrutorId: '1',
        vagasDisponiveis: 25,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '2',
        codigo: '#0002',
        cursoId: '2',
        dataInicio: '2026-01-15',
        dataFim: '2026-03-20',
        horario: '19:00 - 22:00',
        salaId: '2',
        instrutorId: '2',
        vagasDisponiveis: 20,
        statusTurma: 'Planejada',
        preco: 1800
      },
      {
        id: '3',
        codigo: '#0003',
        cursoId: '1',
        dataInicio: '2026-01-20',
        dataFim: '2026-03-10',
        horario: '14:00 - 18:00',
        salaId: '3',
        instrutorId: '3',
        vagasDisponiveis: 15,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '4',
        codigo: '#0004',
        cursoId: '2',
        dataInicio: '2026-01-22',
        dataFim: '2026-03-28',
        horario: '08:00 - 12:00',
        salaId: '1',
        instrutorId: '1',
        vagasDisponiveis: 25,
        statusTurma: 'Em Andamento',
        preco: 1800
      },
      {
        id: '5',
        codigo: '#0005',
        cursoId: '1',
        dataInicio: '2026-01-17',
        dataFim: '2026-03-05',
        horario: '19:00 - 22:00',
        salaId: '2',
        instrutorId: '2',
        vagasDisponiveis: 22,
        statusTurma: 'Confirmada',
        preco: 1200
      },
      {
        id: '6',
        codigo: '#0006',
        cursoId: '2',
        dataInicio: '2026-01-19',
        dataFim: '2026-03-30',
        horario: '19:00 - 22:00',
        salaId: '3',
        instrutorId: '3',
        vagasDisponiveis: 18,
        statusTurma: 'Confirmada',
        nomePersonalizado: 'Mecânica - Turma Premium',
        preco: 2000
      },
      {
        id: '7',
        codigo: '#0007',
        cursoId: '3',
        dataInicio: '2026-01-18',
        dataFim: '2026-02-01',
        horario: '08:00 - 12:00',
        salaId: '1',
        instrutorId: '2',
        vagasDisponiveis: 20,
        statusTurma: 'Em Andamento',
        nomePersonalizado: 'Trabalho em Altura - Turma Intensiva',
        preco: 850
      }
    ]);

    setAlunos([
      {
        id: '1',
        codigoSistema: 'A0001',
        turmaId: '1',
        nome: 'Pedro Oliveira',
        cpf: '123.456.789-00',
        telefone: '(11) 98765-4321',
        email: 'pedro@email.com',
        valorTotal: 1200,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        pagamentos: {
          historico: [
            {
              id: '1',
              valor: 1200,
              data: '10/01/2026',
              hora: '14:30',
              formaPagamento: 'PIX',
              observacoes: 'Pagamento total à vista',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '10/01/2026',
              horaConfirmacao: '14:35'
            }
          ],
          valorPago: 1200,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '2',
        codigoSistema: 'A0002',
        turmaId: '1',
        nome: 'Maria Santos',
        cpf: '987.654.321-00',
        telefone: '(11) 91234-5678',
        email: 'maria@email.com',
        valorTotal: 1700,
        desconto: 500,
        statusLink: 'Agendado',
        statusPagamento: false,
        statusDocumentos: false,
        pagamentos: {
          historico: [
            {
              id: '2',
              valor: 500,
              data: '12/01/2026',
              hora: '10:15',
              formaPagamento: 'Dinheiro',
              observacoes: 'Primeira parcela - entrada',
              registradoPor: 'Vendedor 1',
              confirmedoPor: 'Admin Principal',
              dataConfirmacao: '12/01/2026',
              horaConfirmacao: '10:20'
            }
          ],
          valorPago: 500,
          pendente: false
        },
        documentos: [],
        dataInicioAluno: '2026-01-13',
        dataFimAluno: '2026-02-28',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['1']
      },
      {
        id: '3',
        codigoSistema: 'A0003',
        turmaId: '6',
        nome: 'Carlos Mendes',
        cpf: '111.222.333-44',
        telefone: '(11) 99999-8888',
        email: 'carlos@email.com',
        valorTotal: 2000,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-20',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '4',
        codigoSistema: 'A0004',
        turmaId: '6',
        nome: 'Ana Silva',
        cpf: '222.333.444-55',
        telefone: '(11) 98888-7777',
        email: 'ana@email.com',
        valorTotal: 2000,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-19',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['2']
      },
      {
        id: '5',
        codigoSistema: 'A0005',
        turmaId: '6',
        nome: 'Roberto Costa',
        cpf: '333.444.555-66',
        telefone: '(11) 97777-6666',
        email: 'roberto@email.com',
        valorTotal: 2000,
        desconto: 100,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        statusPagamento: false,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-19',
        dataFimAluno: '2026-03-30',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '6',
        codigoSistema: 'A0006',
        turmaId: '7',
        nome: 'Fernanda Lima',
        cpf: '444.555.666-77',
        telefone: '(11) 96666-5555',
        email: 'fernanda@email.com',
        valorTotal: 1065,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: []
      },
      {
        id: '7',
        codigoSistema: 'A0007',
        turmaId: '7',
        nome: 'Bruno Alves',
        cpf: '555.666.777-88',
        telefone: '(11) 95555-4444',
        email: 'bruno@email.com',
        valorTotal: 1415,
        desconto: 0,
        statusLink: 'Confirmado',
        foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        statusPagamento: false,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['4']
      },
      {
        id: '8',
        codigoSistema: 'A0008',
        turmaId: '7',
        nome: 'Juliana Souza',
        cpf: '666.777.888-99',
        telefone: '(11) 94444-3333',
        email: 'juliana@email.com',
        valorTotal: 1345,
        desconto: 0,
        statusLink: 'Presente',
        foto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
        statusPagamento: true,
        statusDocumentos: true,
        documentos: [],
        dataInicioAluno: '2026-01-18',
        dataFimAluno: '2026-02-01',
        statusProva: {
          ativo: false
        },
        produtosExtras: ['5']
      }
    ]);

    setContadorProvas(0);

    setConfiguracoesEmail({
      remetente: 'noreply@smcorp.com',
      host: 'smtp.example.com',
      porta: 587,
      usuario: 'user@example.com',
      senha: 'password',
      ativo: true
    });

    setConfiguracoesWhatsApp({
      numero: '5511987654321',
      apiKey: 'your_api_key_here_1234567890',
      webhookUrl: 'https://api.smcorp.com/webhook/whatsapp',
      ativo: true
    });
  };

  const value: SMCorpContextType = {
    dadosInstitucionais,
    configuracoesEmail,
    configuracoesWhatsApp,
    salas,
    usuarios,
    usuarioAtual: usuarios[0], // Simulando usuário Master logado
    clientesPJ,
    custosAuditaveis,
    lancamentosCusto,
    fornecedores,
    instrutores, // 🆕
    provasAgendadas, // 🆕
    produtosExtras,
    cursos,
    turmas,
    alunos,
    adicionarSala,
    editarSala,
    adicionarUsuario,
    editarUsuario,
    adicionarClientePJ,
    editarClientePJ,
    adicionarPrecificacaoEmpresa,
    editarPrecificacaoEmpresa,
    excluirPrecificacaoEmpresa,
    adicionarCustoAuditavel,
    editarCustoAuditavel,
    removerCustoAuditavel,
    criteriosCusto,
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
    dispararCustosInstrutorAutomaticos, // 🆕 Disparo automático de custos de instrutores
    dispararCustosInstrutorProva, // 🆕 Disparo quando instrutor é vinculado a prova
    adicionarProdutoExtra,
    editarProdutoExtra,
    adicionarCurso,
    atualizarCurso,
    excluirCurso,
    adicionarTurma,
    atualizarTurma,
    excluirTurma,
    vincularInstrutorTurma, // 🆕
    desvincularInstrutorTurma, // 🆕
    confirmarPresencaInstrutor, // 🆕
    adicionarAluno,
    atualizarAluno,
    atualizarAlunosEmLote,
    excluirAluno,
    substituirAluno,
    transferirAluno,
    marcarPresencaDia,
    gerarCodigoProva,
    cancelarProva,
    registrarResultadoProva,
    agendarProva, // 🆕
    editarProvaAgendada, // 🆕
    excluirProvaAgendada, // 🆕
    atualizarConfiguracoesEmail,
    atualizarConfiguracoesWhatsApp,
    atualizarDadosInstitucionais, // 🆕 Atualizar dados da empresa
    resetarDados,
    gerarNumeroRecibo, // 🆕 Função para gerar número de recibo
    dispararCustosAutomaticos, // 🆕 SISTEMA DE DISPARO AUTOMÁTICO DE CUSTOS
    cancelarCustosPorAcao, // 🆕 Cancelar custos por ação específica
    limparLancamentosOrfaos, // 🆕 Limpar lançamentos órfãos
    renumerarLancamentosCusto, // 🔧 Renumerar lançamentos duplicados
    excluirLancamentoCusto, // 🗑️ Excluir lançamento específico
    verificarCustosProvaParaExcluir, // 🆕 Verificar custos de prova para excluir
    obterAlunosNaMesmaProva // 🆕 Obter alunos na mesma prova
  };

  // 🧹 LIMPEZA AUTOMÁTICA: Limpar lançamentos órfãos ao carregar o sistema
  useEffect(() => {
    // Verificar se existem lançamentos órfãos
    const alunosIds = new Set(alunos.map(a => a.id));
    const instrutoresIds = new Set(instrutores.map(i => i.id));
    
    const temOrfaos = lancamentosCusto.some(l => 
      (l.alunoId && !alunosIds.has(l.alunoId)) ||
      (l.instrutorId && !instrutoresIds.has(l.instrutorId))
    );
    
    if (temOrfaos) {
      console.warn('⚠️ [AUTO-LIMPEZA] Lançamentos órfãos detectados! Executando limpeza automática...');
      const removidos = limparLancamentosOrfaos();
      if (removidos > 0) {
        console.log(`✅ [AUTO-LIMPEZA] ${removidos} lançamento(s) órfão(s) removido(s) automaticamente!`);
      }
    }
  }, [alunos, instrutores, lancamentosCusto]);

  console.log('�� SMCorpProvider: Contexto criado com sucesso!');
  
  return <SMCorpContext.Provider value={value}>{children}</SMCorpContext.Provider>;
};

// Sistema de pagamentos implementado - v1.0