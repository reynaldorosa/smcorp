'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart as PieChartIcon,
  Activity,
  Briefcase,
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
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// ============================================
// TYPES
// ============================================

interface KPIData {
  titulo: string;
  valor: string | number;
  subtexto?: string;
  cor: string;
  tendencia?: 'alta' | 'baixa' | 'neutro';
  icone: React.ReactNode;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface DashboardChartsProps {
  // KPIs
  totalAlunos: number;
  alunosAtivos: number;
  totalFaturado: number;
  totalPendente: number;
  taxaOcupacao: number;
  turmasAtivas: number;
  totalEmpresas: number;
  empresasAtivas: number;
  // Dados para gráficos
  alunosPorStatus: { status: string; quantidade: number; cor: string }[];
  faturamentoPorMes: { mes: string; receita: number; despesa: number }[];
  alunosPorEmpresa: { empresa: string; quantidade: number }[];
  ocupacaoPorSala: { sala: string; ocupacao: number; capacidade: number }[];
  custosPorCategoria: { categoria: string; valor: number }[];
}

// ============================================
// KPI CARD COMPONENT
// ============================================

function KPICard({ titulo, valor, subtexto, cor, tendencia, icone }: KPIData) {
  const getTendenciaIcon = () => {
    if (tendencia === 'alta') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (tendencia === 'baixa') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: cor }}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{titulo}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold" style={{ color: cor }}>
                {valor}
              </h3>
              {getTendenciaIcon()}
            </div>
            {subtexto && <p className="text-xs text-gray-500 mt-1">{subtexto}</p>}
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${cor}15` }}>
            <div style={{ color: cor }}>{icone}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// COLORS
// ============================================

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#06b6d4', '#eab308'];

const STATUS_COLORS: Record<string, string> = {
  Agendado: '#eab308',
  Confirmar: '#f97316',
  Confirmado: '#3b82f6',
  Presente: '#22c55e',
};

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DashboardCharts({
  totalAlunos = 0,
  alunosAtivos = 0,
  totalFaturado = 0,
  totalPendente = 0,
  taxaOcupacao = 0,
  turmasAtivas = 0,
  totalEmpresas = 0,
  empresasAtivas = 0,
  alunosPorStatus = [],
  faturamentoPorMes = [],
  alunosPorEmpresa = [],
  ocupacaoPorSala = [],
  custosPorCategoria = [],
}: Partial<DashboardChartsProps>) {
  // KPIs formatados
  const kpis: KPIData[] = [
    {
      titulo: 'Total de Alunos',
      valor: totalAlunos,
      subtexto: `${alunosAtivos} presentes ativos`,
      cor: '#ef4444',
      tendencia: 'alta',
      icone: <Users className="w-6 h-6" />,
    },
    {
      titulo: 'Faturamento',
      valor: formatCurrency(totalFaturado),
      subtexto: `${formatCurrency(totalPendente)} pendente`,
      cor: '#22c55e',
      tendencia: totalFaturado > totalPendente ? 'alta' : 'baixa',
      icone: <DollarSign className="w-6 h-6" />,
    },
    {
      titulo: 'Taxa de Ocupação',
      valor: `${taxaOcupacao}%`,
      subtexto: `${turmasAtivas} turmas ativas`,
      cor: '#f97316',
      tendencia: 'neutro',
      icone: <Percent className="w-6 h-6" />,
    },
    {
      titulo: 'Empresas Parceiras',
      valor: totalEmpresas,
      subtexto: `${empresasAtivas} com alunos ativos`,
      cor: '#3b82f6',
      tendencia: 'alta',
      icone: <Building2 className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="alunos" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="alunos" className="gap-2">
            <Users className="w-4 h-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="operacional" className="gap-2">
            <Activity className="w-4 h-4" />
            Operacional
          </TabsTrigger>
          <TabsTrigger value="custos" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Custos
          </TabsTrigger>
        </TabsList>

        {/* Aba Alunos */}
        <TabsContent value="alunos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Pizza - Alunos por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  Alunos por Status
                </CardTitle>
                <CardDescription>Distribuição de alunos por status de matrícula</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={alunosPorStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, quantidade, percent }) =>
                          `${status}: ${quantidade} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="quantidade"
                        nameKey="status"
                      >
                        {alunosPorStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.cor || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} alunos`, 'Quantidade']}
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Alunos por Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Alunos por Empresa
                </CardTitle>
                <CardDescription>Top empresas por número de alunos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={alunosPorEmpresa}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="empresa" type="category" width={90} />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Receitas vs Despesas
              </CardTitle>
              <CardDescription>Evolução mensal do fluxo de caixa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={faturamentoPorMes}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      name="Receita"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="despesa"
                      name="Despesa"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Operacional */}
        <TabsContent value="operacional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Ocupação por Sala
              </CardTitle>
              <CardDescription>Taxa de ocupação de cada sala de treinamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ocupacaoPorSala}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sala" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="ocupacao"
                      name="Ocupados"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="capacidade"
                      name="Capacidade"
                      fill="#d1d5db"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Custos */}
        <TabsContent value="custos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Pizza - Custos por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-red-600" />
                  Custos por Categoria
                </CardTitle>
                <CardDescription>Distribuição de custos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={custosPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, valor, percent }) =>
                          `${categoria}: ${formatCurrency(valor)}`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey="categoria"
                      >
                        {custosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista de custos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                  Detalhamento
                </CardTitle>
                <CardDescription>Valores por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {custosPorCategoria.map((item, index) => (
                    <div key={item.categoria} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{item.categoria}</span>
                        </div>
                        <span className="text-muted-foreground">{formatCurrency(item.valor)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (item.valor /
                                Math.max(
                                  ...custosPorCategoria.map((c) => c.valor),
                                  1
                                )) *
                                100,
                              100
                            )}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
