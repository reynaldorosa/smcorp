import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Check,
  Users,
  Download
} from 'lucide-react';

interface LancamentoFinanceiro {
  id: string;
  codigo: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado';
  alunoId?: string;
  clientePJId?: string;
  instrutorId?: string; // 🆕 ID do instrutor vinculado
  fornecedorId?: string; // 🆕 ID do fornecedor
  turmaId?: string; // 🆕 ID da turma vinculada
  notaFiscal?: string; // 🧾 Número da Nota Fiscal
  observacoes?: string;
}

interface Aluno {
  id: string;
  nome: string;
  codigoSistema: string;
}

// 🆕 Interfaces para Instrutor e Turma
interface Instrutor {
  id: string;
  nome: string;
  codigoSistema: string;
}

interface Turma {
  id: string;
  codigo: string;
  nomeCurso: string;
}

interface GrupoLancamento {
  codigo: string;
  grupoId?: string; // 🆕 ID do grupo original (usado para grupos diários)
  lancamentos: LancamentoFinanceiro[];
  isLote: boolean;
  isGrupoDiario?: boolean; // 🆕 Flag para identificar grupos diários
  valorTotal: number;
  tipo: 'pagar' | 'receber';
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado';
  dataVencimento: string;
  dataPagamento?: string;
  notaFiscal?: string; // 🧾 Nota Fiscal do lote
}

interface CardLoteModulo08Props {
  grupo: GrupoLancamento;
  alunos: Aluno[];
  instrutores?: Instrutor[]; // 🆕 Lista de instrutores
  turmas?: Turma[]; // 🆕 Lista de turmas
  onVerDetalhes: (lancamento: LancamentoFinanceiro) => void;
  onDarBaixa: (lancamentoId: string) => void;
  onGerarRecibo?: (lancamento: LancamentoFinanceiro) => void; // 🆕 Função para gerar recibo NORMAL (PF)
  onGerarReciboPF?: (lancamento: LancamentoFinanceiro) => void; // 🆕 Função para gerar recibo PF
  formatarValor: (valor: number) => string;
  formatarData: (data: string) => string;
}

export function CardLoteModulo08({
  grupo,
  alunos,
  instrutores = [], // 🆕 Default vazio
  turmas = [], // 🆕 Default vazio
  onVerDetalhes,
  onDarBaixa,
  onGerarRecibo,
  onGerarReciboPF,
  formatarValor,
  formatarData
}: CardLoteModulo08Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      case 'faturado':
        return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Faturado</Badge>;
      default:
        return null;
    }
  };

  // Se for lote (múltiplos lançamentos), mostrar card especial
  if (grupo.isLote) {
    console.log(`🎯 CardLoteModulo08 - Renderizando lote ${grupo.codigo}:`, {
      totalLancamentos: grupo.lancamentos.length,
      lancamentos: grupo.lancamentos.map(l => ({ id: l.id, alunoId: l.alunoId })),
      totalAlunos: alunos.length,
      alunosIds: alunos.map(a => a.id),
      notaFiscal: grupo.notaFiscal // 🧾 Log da nota fiscal
    });
    console.log(`🧾 NOTA FISCAL DO LOTE ${grupo.codigo}:`, grupo.notaFiscal || 'NÃO POSSUI');
    
    return (
      <Card 
        className={`border-l-4 border-l-green-500 ${grupo.status === 'cancelado' ? 'opacity-50' : ''} bg-gradient-to-r from-green-50 to-white`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Cabeçalho do Lote */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-green-700">{grupo.codigo}</span>
                    {getStatusBadge(grupo.status)}
                    <Badge className="bg-purple-500">
                      📦 LOTE - {grupo.lancamentos.length} alunos
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">Aprovação em Lote - Pagamento Consolidado</p>
                </div>
              </div>

              {/* Informações Consolidadas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 mb-4 p-3 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor Total do Lote</p>
                  <p className="font-bold text-xl text-green-600">
                    {formatarValor(grupo.valorTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Vencimento</p>
                  <p className="font-semibold text-sm">{formatarData(grupo.dataVencimento)}</p>
                </div>
                {grupo.dataPagamento && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">Recebimento</p>
                    <p className="font-semibold text-sm text-green-600">
                      {formatarData(grupo.dataPagamento)}
                    </p>
                  </div>
                )}
                {grupo.notaFiscal && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">🧾 Nota Fiscal</p>
                    <p className="font-bold text-sm text-blue-700">
                      {grupo.notaFiscal}
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de Alunos do Lote */}
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Alunos incluídos neste lote:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {grupo.lancamentos.map((lanc) => {
                    const aluno = alunos.find(a => a.id === lanc.alunoId);
                    if (!aluno) {
                      console.warn(`⚠️ CardLoteModulo08 - Aluno não encontrado para lançamento:`, {
                        lancamentoId: lanc.id,
                        alunoId: lanc.alunoId,
                        alunosDisponiveis: alunos.map(a => ({ id: a.id, codigo: a.codigoSistema }))
                      });
                      return null;
                    }
                    
                    return (
                      <div 
                        key={lanc.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-2 h-2 rounded-full ${
                            lanc.status === 'pago' ? 'bg-green-500' : 
                            lanc.status === 'vencido' ? 'bg-red-500' : 
                            lanc.status === 'faturado' ? 'bg-blue-500' : 
                            'bg-yellow-500'
                          }`} />
                          <span className="text-xs font-mono font-semibold text-gray-600">{aluno.codigoSistema}</span>
                          <span className="text-xs text-gray-800">{aluno.nome}</span>
                        </div>
                        <span className="text-xs font-bold text-green-600 ml-2">
                          {formatarValor(lanc.valor)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerDetalhes(grupo.lancamentos[0])}
                className="whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1" />
                Detalhes
              </Button>
              {grupo.status !== 'pago' && grupo.status !== 'cancelado' && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  onClick={() => onDarBaixa(grupo.lancamentos[0].id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Baixar Lote
                </Button>
              )}
              {/* 🆕 Botão de Download para lançamentos PF pagos (lote) */}
              {grupo.status === 'pago' && grupo.lancamentos.some(l => l.descricao.includes('[PF]')) && onGerarReciboPF && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
                  onClick={() => {
                    // Gerar recibo para o primeiro lançamento PF do lote
                    const lancamentoPF = grupo.lancamentos.find(l => l.descricao.includes('[PF]'));
                    if (lancamentoPF) {
                      onGerarReciboPF(lancamentoPF);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Recibo PF
                </Button>
              )}
              {/* 🆕 Botão de Recibo NORMAL para Pessoa Física (não-[PF]) - LOTE */}
              {grupo.status === 'pago' && grupo.lancamentos.some(l => !l.descricao.includes('[PF]')) && onGerarRecibo && (() => {
                const lancamentoNormal = grupo.lancamentos.find(l => !l.descricao.includes('[PF]'));
                const aluno = lancamentoNormal && lancamentoNormal.alunoId ? alunos.find(a => a.id === lancamentoNormal.alunoId) : null;
                return aluno && !aluno.tipoPessoa;
              })() && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  onClick={() => {
                    const lancamentoNormal = grupo.lancamentos.find(l => !l.descricao.includes('[PF]'));
                    if (lancamentoNormal) {
                      onGerarRecibo(lancamentoNormal);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Recibo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🔧 Tratamento especial para grupos diários (custos com frequência diária)
  if (grupo.isGrupoDiario && grupo.lancamentos.length > 1) {
    // Buscar aluno do primeiro lançamento
    const alunoDoGrupo = grupo.lancamentos[0].alunoId 
      ? alunos.find(a => a.id === grupo.lancamentos[0].alunoId)
      : null;
    
    // 🆕 Extrair informações do custo da descrição
    const descricaoPrimeiroLancamento = grupo.lancamentos[0].descricao;
    const nomeCusto = descricaoPrimeiroLancamento.split(' - ')[0]; // Ex: "Alimentação"
    const valorPorDia = grupo.lancamentos[0].valor;
    const totalDias = grupo.lancamentos.length;
    
    return (
      <Card 
        className={`border-l-4 border-l-red-500 ${grupo.status === 'cancelado' ? 'opacity-50' : ''} bg-gradient-to-r from-red-50 to-white`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Cabeçalho do Grupo Diário */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-600">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-red-700">{grupo.codigo}</span>
                    {getStatusBadge(grupo.status)}
                    <Badge className="bg-purple-500">
                      📅 DIÁRIO - {totalDias} dias
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">
                    {nomeCusto} - {alunoDoGrupo ? `${alunoDoGrupo.codigoSistema} - ${alunoDoGrupo.nome}` : 'Aluno não encontrado'}
                  </p>
                </div>
              </div>

              {/* Informações Consolidadas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-4 p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor por Dia</p>
                  <p className="font-bold text-lg text-red-600">
                    {formatarValor(valorPorDia)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Total de Dias</p>
                  <p className="font-bold text-lg text-red-600">
                    {totalDias} dias
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor Total</p>
                  <p className="font-bold text-xl text-red-600">
                    {formatarValor(grupo.valorTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Período</p>
                  <p className="font-semibold text-sm">
                    {formatarData(grupo.lancamentos[0].dataVencimento)} até {formatarData(grupo.lancamentos[grupo.lancamentos.length - 1].dataVencimento)}
                  </p>
                </div>
              </div>

              {/* Fórmula de Cálculo */}
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 Cálculo do Custo:</p>
                <p className="text-sm font-mono text-blue-900">
                  {formatarValor(valorPorDia)} × {totalDias} dias = {formatarValor(grupo.valorTotal)}
                </p>
              </div>

              {/* Lista de Lançamentos Diários (collapsible) */}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                  📋 Ver detalhes dos {grupo.lancamentos.length} lançamentos diários
                </summary>
                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                  {grupo.lancamentos.map((lanc, index) => {
                    // Extrair data da descrição ou usar dataVencimento
                    const dataMatch = lanc.descricao.match(/Dia (\d{2}\/\d{2}\/\d{4})/);
                    const dataExibicao = dataMatch ? dataMatch[1] : formatarData(lanc.dataVencimento);
                    
                    return (
                      <div key={lanc.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500">{lanc.codigo}</span>
                          <span className="text-gray-700">{dataExibicao}</span>
                          <Badge 
                            className={`text-[10px] px-1.5 py-0.5 ${
                              lanc.status === 'pago' 
                                ? 'bg-green-500' 
                                : lanc.status === 'vencido'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          >
                            {lanc.status}
                          </Badge>
                        </div>
                        <span className="font-bold text-red-600">
                          {formatarValor(lanc.valor)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerDetalhes(grupo.lancamentos[0])}
                className="whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1" />
                Detalhes
              </Button>
              {grupo.status !== 'pago' && grupo.status !== 'cancelado' && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                  onClick={() => onDarBaixa(grupo.lancamentos[0].id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Baixar Grupo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card individual normal
  const lancamento = grupo.lancamentos[0];
  
  // 🆕 Detectar se é pagamento ao instrutor (tem instrutorId mas NÃO tem fornecedorId)
  const isPagamentoInstrutor = lancamento.instrutorId && !lancamento.fornecedorId;
  const isPagamentoFornecedorComInstrutor = lancamento.instrutorId && lancamento.fornecedorId;
  
  // 🆕 Buscar dados do instrutor e turma, se existirem
  const instrutorVinculado = lancamento.instrutorId 
    ? instrutores.find(i => i.id === lancamento.instrutorId) 
    : null;
  const turmaVinculada = lancamento.turmaId 
    ? turmas.find(t => t.id === lancamento.turmaId) 
    : null;
  
  return (
    <Card 
      className={`border-l-4 ${
        isPagamentoInstrutor 
          ? 'border-l-purple-500 bg-purple-50' // 🆕 Estilo especial para instrutor
          : lancamento.tipo === 'pagar' ? 'border-l-red-500' : 'border-l-green-500'
      } ${lancamento.status === 'cancelado' ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                isPagamentoInstrutor 
                  ? 'bg-purple-600' // 🆕 Ícone roxo para instrutor
                  : lancamento.tipo === 'pagar' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                {isPagamentoInstrutor ? (
                  <TrendingDown className="w-5 h-5 text-white" />
                ) : lancamento.tipo === 'pagar' ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{lancamento.codigo}</span>
                  {getStatusBadge(lancamento.status)}
                  {/* 🆕 Badge especial para pagamento ao instrutor */}
                  {isPagamentoInstrutor && (
                    <Badge className="bg-purple-600">
                      👨‍🏫 PAGAMENTO AO INSTRUTOR
                    </Badge>
                  )}
                  {/* 🆕 Badge para fornecedor com instrutor vinculado */}
                  {isPagamentoFornecedorComInstrutor && (
                    <Badge className="bg-blue-500">
                      👨‍🏫 Vínculo Instrutor
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{lancamento.descricao}</p>
                {/* 🆕 Exibir informações do instrutor e turma se existirem */}
                {(instrutorVinculado || turmaVinculada) && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {instrutorVinculado && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-semibold">
                        👨‍🏫 {instrutorVinculado.codigoSistema} - {instrutorVinculado.nome}
                      </span>
                    )}
                    {turmaVinculada && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">
                        📚 {turmaVinculada.codigo} - {turmaVinculada.nomeCurso}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Valor</p>
                <p className={`font-bold ${
                  lancamento.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatarValor(lancamento.valor)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Vencimento</p>
                <p className="font-semibold">{formatarData(lancamento.dataVencimento)}</p>
              </div>
              {lancamento.dataPagamento && (
                <div>
                  <p className="text-gray-500">Pagamento</p>
                  <p className="font-semibold text-green-600">
                    {formatarData(lancamento.dataPagamento)}
                  </p>
                </div>
              )}
              {lancamento.notaFiscal && (
                <div>
                  <p className="text-gray-500">🧾 Nota Fiscal</p>
                  <p className="font-bold text-blue-700">
                    {lancamento.notaFiscal}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerDetalhes(lancamento)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {lancamento.status !== 'pago' && lancamento.status !== 'cancelado' && (
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onDarBaixa(lancamento.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Baixar
              </Button>
            )}
            {/* 🆕 Botão de Download para lançamentos PF pagos (individual) */}
            {lancamento.status === 'pago' && lancamento.descricao.includes('[PF]') && onGerarReciboPF && (
              <Button
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => onGerarReciboPF(lancamento)}
              >
                <Download className="w-4 h-4 mr-1" />
                Recibo PF
              </Button>
            )}
            {/* 🆕 Botão de Recibo NORMAL para Pessoa Física (não-[PF]) - INDIVIDUAL */}
            {lancamento.status === 'pago' && !lancamento.descricao.includes('[PF]') && onGerarRecibo && (() => {
              const aluno = lancamento.alunoId ? alunos.find(a => a.id === lancamento.alunoId) : null;
              return aluno && !aluno.tipoPessoa;
            })() && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onGerarRecibo(lancamento)}
              >
                <Download className="w-4 h-4 mr-1" />
                Recibo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}