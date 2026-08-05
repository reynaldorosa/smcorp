import { useMemo } from 'react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Building2,
  GraduationCap,
  Clock,
  Target,
  Percent,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  PackageX
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Componente de KPI Card
interface KPICardProps {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  tendencia?: 'alta' | 'baixa' | 'neutro';
  subtexto?: string;
  cor: string;
}

function KPICard({ titulo, valor, icone, tendencia, subtexto, cor }: KPICardProps) {
  const getTendenciaIcon = () => {
    if (tendencia === 'alta') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (tendencia === 'baixa') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className={`border-l-4 hover:shadow-lg transition-shadow`} style={{ borderLeftColor: cor }}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{titulo}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold" style={{ color: cor }}>{valor}</h3>
              {getTendenciaIcon()}
            </div>
            {subtexto && <p className="text-xs text-gray-500 mt-1">{subtexto}</p>}
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${cor}15` }}>
            <div style={{ color: cor }}>
              {icone}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Modulo09() {
  const { 
    alunos, 
    turmas, 
    cursos,
    clientesPJ,
    lancamentosCusto,
    custosAuditaveis,
    fornecedores,
    salas,
    produtosExtras
  } = useSMCorp();

  // =====================================
  // 📊 CÁLCULOS DE INDICADORES
  // =====================================

  const indicadores = useMemo(() => {
    // 👥 Alunos por Status
    const alunosPorStatus = {
      agendado: alunos.filter(a => a.status === 'Agendado').length,
      confirmar: alunos.filter(a => a.status === 'Confirmar').length,
      confirmado: alunos.filter(a => a.status === 'Confirmado').length,
      presente: alunos.filter(a => a.status === 'Presente').length,
      total: alunos.length
    };

    // 💰 Finanças
    const lancamentosReceber = lancamentosCusto.filter(l => l.tipo === 'receber');
    const lancamentosPagar = lancamentosCusto.filter(l => l.tipo === 'pagar');

    const receitaTotal = lancamentosReceber.reduce((acc, l) => acc + l.valor, 0);
    const receitaPaga = lancamentosReceber
      .filter(l => l.status === 'pago')
      .reduce((acc, l) => acc + l.valor, 0);
    const receitaPendente = lancamentosReceber
      .filter(l => l.status === 'pendente' || l.status === 'vencido')
      .reduce((acc, l) => acc + l.valor, 0);

    const despesaTotal = lancamentosPagar.reduce((acc, l) => acc + l.valor, 0);
    const despesaPaga = lancamentosPagar
      .filter(l => l.status === 'pago')
      .reduce((acc, l) => acc + l.valor, 0);
    const despesaPendente = lancamentosPagar
      .filter(l => l.status === 'pendente' || l.status === 'vencido')
      .reduce((acc, l) => acc + l.valor, 0);

    const fluxoCaixa = receitaPaga - despesaPaga;
    const margemLucro = receitaTotal > 0 ? ((receitaTotal - despesaTotal) / receitaTotal) * 100 : 0;

    // 🎓 Turmas
    const turmasAtivas = turmas.filter(t => t.dataInicio && new Date(t.dataInicio) <= new Date()).length;
    const turmasPendentes = turmas.filter(t => !t.dataInicio || new Date(t.dataInicio) > new Date()).length;

    // Taxa de ocupação
    const capacidadeTotal = turmas.reduce((acc, t) => {
      const sala = salas.find(s => s.id === t.salaId);
      return acc + (sala?.capacidadeMaxima || 0);
    }, 0);
    const alunosMatriculados = turmas.reduce((acc, t) => acc + (t.alunosMatriculados?.length || 0), 0);
    const taxaOcupacao = capacidadeTotal > 0 ? (alunosMatriculados / capacidadeTotal) * 100 : 0;

    // 💼 Empresas
    const empresasAtivas = clientesPJ.filter(c => c.acessoAtivo).length;

    return {
      alunos: alunosPorStatus,
      financeiro: {
        receitaTotal,
        receitaPaga,
        receitaPendente,
        despesaTotal,
        despesaPaga,
        despesaPendente,
        fluxoCaixa,
        margemLucro
      },
      turmas: {
        total: turmas.length,
        ativas: turmasAtivas,
        pendentes: turmasPendentes,
        taxaOcupacao
      },
      empresas: {
        total: clientesPJ.length,
        ativas: empresasAtivas
      },
      infraestrutura: {
        salas: salas.length,
        cursos: cursos.length,
        produtos: produtosExtras.length
      }
    };
  }, [alunos, turmas, lancamentosCusto, clientesPJ, salas, cursos, produtosExtras]);

  // =====================================
  // 📈 DADOS PARA GRÁFICOS
  // =====================================

  // Gráfico de Alunos por Status
  const dadosGraficoAlunos = [
    { name: 'Agendado', value: indicadores.alunos.agendado, fill: '#FCD34D' },
    { name: 'Confirmar', value: indicadores.alunos.confirmar, fill: '#FB923C' },
    { name: 'Confirmado', value: indicadores.alunos.confirmado, fill: '#60A5FA' },
    { name: 'Presente', value: indicadores.alunos.presente, fill: '#34D399' }
  ];

  // Gráfico de Finanças
  const dadosGraficoFinancas = [
    { 
      name: 'Receitas',
      Pago: indicadores.financeiro.receitaPaga,
      Pendente: indicadores.financeiro.receitaPendente
    },
    { 
      name: 'Despesas',
      Pago: indicadores.financeiro.despesaPaga,
      Pendente: indicadores.financeiro.despesaPendente
    }
  ];

  // Gráfico de Custos por Categoria
  const dadosGraficoCustos = useMemo(() => {
    const custosPorCategoria: { [key: string]: number } = {};
    
    lancamentosCusto
      .filter(l => l.tipo === 'pagar' && l.status !== 'cancelado')
      .forEach(lancamento => {
        const custo = custosAuditaveis.find(c => c.id === lancamento.custoAuditavelId);
        const nomeCusto = custo?.nome || 'Outros';
        custosPorCategoria[nomeCusto] = (custosPorCategoria[nomeCusto] || 0) + lancamento.valor;
      });

    return Object.entries(custosPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categorias
  }, [lancamentosCusto, custosAuditaveis]);

  // Cores para gráfico de pizza
  const CORES_PIE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  // Formatador de moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="px-6 py-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors">
      <div className="max-w-[1600px] mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Dashboard Executivo</h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Visão estratégica em tempo real da Plataforma SMCORP</p>
            </div>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            titulo="Total de Alunos"
            valor={indicadores.alunos.total}
            icone={<Users className="w-6 h-6" />}
            subtexto={`${indicadores.alunos.presente} presentes ativos`}
            cor="#EF4444"
            tendencia="alta"
          />
          <KPICard
            titulo="Fluxo de Caixa"
            valor={formatarMoeda(indicadores.financeiro.fluxoCaixa)}
            icone={<DollarSign className="w-6 h-6" />}
            subtexto="Saldo atual (Receitas - Despesas)"
            cor={indicadores.financeiro.fluxoCaixa >= 0 ? "#10B981" : "#EF4444"}
            tendencia={indicadores.financeiro.fluxoCaixa >= 0 ? "alta" : "baixa"}
          />
          <KPICard
            titulo="Taxa de Ocupação"
            valor={`${indicadores.turmas.taxaOcupacao.toFixed(1)}%`}
            icone={<Percent className="w-6 h-6" />}
            subtexto={`${indicadores.turmas.ativas} turmas ativas`}
            cor="#3B82F6"
            tendencia="alta"
          />
          <KPICard
            titulo="Empresas Parceiras"
            valor={indicadores.empresas.ativas}
            icone={<Briefcase className="w-6 h-6" />}
            subtexto={`${indicadores.empresas.total} cadastradas`}
            cor="#8B5CF6"
            tendencia="neutro"
          />
        </div>

        {/* Tabs de Análises */}
        <Tabs defaultValue="alunos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="alunos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="operacional" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Operacional
            </TabsTrigger>
            <TabsTrigger value="custos" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Custos
            </TabsTrigger>
          </TabsList>

          {/* TAB: ALUNOS */}
          <TabsContent value="alunos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza - Alunos por Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" />
                    Distribuição de Alunos por Status
                  </CardTitle>
                  <CardDescription>Visualização em tempo real dos 4 status da cascata</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={dadosGraficoAlunos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosGraficoAlunos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value} alunos`} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cards de Status Detalhado */}
              <div className="space-y-4">
                <Card className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status: Agendado</p>
                        <p className="text-3xl font-bold text-yellow-600">{indicadores.alunos.agendado}</p>
                      </div>
                      <Clock className="w-10 h-10 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-400">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status: Confirmar</p>
                        <p className="text-3xl font-bold text-orange-600">{indicadores.alunos.confirmar}</p>
                      </div>
                      <AlertCircle className="w-10 h-10 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status: Confirmado</p>
                        <p className="text-3xl font-bold text-blue-600">{indicadores.alunos.confirmado}</p>
                      </div>
                      <CheckCircle2 className="w-10 h-10 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-400">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Status: Presente</p>
                        <p className="text-3xl font-bold text-green-600">{indicadores.alunos.presente}</p>
                      </div>
                      <Target className="w-10 h-10 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB: FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-6">
            {/* Cards de Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Receitas Totais</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatarMoeda(indicadores.financeiro.receitaTotal)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pago: {formatarMoeda(indicadores.financeiro.receitaPaga)}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Despesas Totais</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatarMoeda(indicadores.financeiro.despesaTotal)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pago: {formatarMoeda(indicadores.financeiro.despesaPaga)}
                      </p>
                    </div>
                    <TrendingDown className="w-10 h-10 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Margem de Lucro</p>
                      <p className={`text-2xl font-bold ${indicadores.financeiro.margemLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {indicadores.financeiro.margemLucro.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {indicadores.financeiro.margemLucro >= 0 ? 'Saudável' : 'Atenção'}
                      </p>
                    </div>
                    <Percent className="w-10 h-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras - Receitas vs Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Receitas vs Despesas (Pago vs Pendente)
                </CardTitle>
                <CardDescription>Análise comparativa do fluxo financeiro</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosGraficoFinancas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatarMoeda(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Bar dataKey="Pago" fill="#10B981" />
                    <Bar dataKey="Pendente" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alertas Financeiros */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Alertas Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {indicadores.financeiro.receitaPendente > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-800">Receitas Pendentes</p>
                        <p className="text-sm text-yellow-700">
                          {formatarMoeda(indicadores.financeiro.receitaPendente)} aguardando pagamento
                        </p>
                      </div>
                    </div>
                  )}
                  {indicadores.financeiro.despesaPendente > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-800">Despesas Pendentes</p>
                        <p className="text-sm text-orange-700">
                          {formatarMoeda(indicadores.financeiro.despesaPendente)} a pagar
                        </p>
                      </div>
                    </div>
                  )}
                  {indicadores.financeiro.fluxoCaixa < 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">Fluxo de Caixa Negativo</p>
                        <p className="text-sm text-red-700">
                          Despesas pagas excedem receitas em {formatarMoeda(Math.abs(indicadores.financeiro.fluxoCaixa))}
                        </p>
                      </div>
                    </div>
                  )}
                  {indicadores.financeiro.fluxoCaixa >= 0 && indicadores.financeiro.receitaPendente === 0 && indicadores.financeiro.despesaPendente === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">Situação Financeira Saudável</p>
                        <p className="text-sm text-green-700">
                          Sem pendências e fluxo de caixa positivo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: OPERACIONAL */}
          <TabsContent value="operacional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Turmas Ativas</p>
                      <p className="text-3xl font-bold text-blue-600">{indicadores.turmas.ativas}</p>
                      <p className="text-xs text-gray-500 mt-1">de {indicadores.turmas.total} totais</p>
                    </div>
                    <GraduationCap className="w-10 h-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Salas Disponíveis</p>
                      <p className="text-3xl font-bold text-purple-600">{indicadores.infraestrutura.salas}</p>
                      <p className="text-xs text-gray-500 mt-1">espaços físicos</p>
                    </div>
                    <Building2 className="w-10 h-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Cursos Ativos</p>
                      <p className="text-3xl font-bold text-green-600">{indicadores.infraestrutura.cursos}</p>
                      <p className="text-xs text-gray-500 mt-1">programas</p>
                    </div>
                    <GraduationCap className="w-10 h-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Produtos Extras</p>
                      <p className="text-3xl font-bold text-orange-600">{indicadores.infraestrutura.produtos}</p>
                      <p className="text-xs text-gray-500 mt-1">itens adicionais</p>
                    </div>
                    <PackageX className="w-10 h-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Taxa de Ocupação Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Taxa de Ocupação das Turmas
                </CardTitle>
                <CardDescription>Utilização da capacidade máxima das salas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Ocupação Atual: {indicadores.turmas.taxaOcupacao.toFixed(1)}%
                      </span>
                      <Badge 
                        className={
                          indicadores.turmas.taxaOcupacao >= 80 ? 'bg-red-500' :
                          indicadores.turmas.taxaOcupacao >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }
                      >
                        {indicadores.turmas.taxaOcupacao >= 80 ? 'Alta' :
                         indicadores.turmas.taxaOcupacao >= 60 ? 'Média' :
                         'Baixa'}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          indicadores.turmas.taxaOcupacao >= 80 ? 'bg-red-500' :
                          indicadores.turmas.taxaOcupacao >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(indicadores.turmas.taxaOcupacao, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-600">
                        {salas.reduce((acc, s) => acc + s.capacidadeMaxima, 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Capacidade Total</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">
                        {turmas.reduce((acc, t) => acc + (t.alunosMatriculados?.length || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Alunos Matriculados</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-600">
                        {salas.reduce((acc, s) => acc + s.capacidadeMaxima, 0) - turmas.reduce((acc, t) => acc + (t.alunosMatriculados?.length || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Vagas Disponíveis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CUSTOS */}
          <TabsContent value="custos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza - Custos por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-red-600" />
                    Top 6 Categorias de Custo
                  </CardTitle>
                  <CardDescription>Distribuição dos principais custos auditáveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsPie>
                      <Pie
                        data={dadosGraficoCustos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosGraficoCustos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_PIE[index % CORES_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Lista Detalhada de Custos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    Detalhamento de Custos
                  </CardTitle>
                  <CardDescription>Valores totais por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {dadosGraficoCustos.map((item, index) => (
                      <div 
                        key={item.name}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-red-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: CORES_PIE[index % CORES_PIE.length] }}
                          />
                          <span className="font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-bold text-red-600">
                          {formatarMoeda(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo de Fornecedores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  Resumo de Fornecedores
                </CardTitle>
                <CardDescription>Total de fornecedores ativos e custos associados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                    <p className="text-4xl font-bold text-blue-600 mb-2">{fornecedores.length}</p>
                    <p className="text-sm text-gray-700 font-medium">Fornecedores Cadastrados</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                    <p className="text-4xl font-bold text-purple-600 mb-2">{custosAuditaveis.length}</p>
                    <p className="text-sm text-gray-700 font-medium">Custos Auditáveis</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                    <p className="text-4xl font-bold text-red-600 mb-2">
                      {lancamentosCusto.filter(l => l.tipo === 'pagar').length}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">Lançamentos a Pagar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}