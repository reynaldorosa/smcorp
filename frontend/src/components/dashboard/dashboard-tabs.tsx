'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import {
  Users,
  DollarSign,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
  Percent,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
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
} from 'recharts';

export function DashboardTabs({ value, hideTabsList = false, onValueChange }: { value?: string; hideTabsList?: boolean; onValueChange?: (value: string) => void }) {
  const { suppliers } = useSettingsStore();
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['dashboard', 'financial'],
    queryFn: () => dashboardService.getFinancial(),
  });

  const { data: operationalData, isLoading: isLoadingOperational } = useQuery({
    queryKey: ['dashboard', 'operational'],
    queryFn: () => dashboardService.getOperational(),
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['dashboard', 'students'],
    queryFn: () => dashboardService.getStudents(),
  });

  const { data: costsData, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['dashboard', 'costs'],
    queryFn: () => dashboardService.getCosts(),
  });

  // ================================
  // Chart Colors
  // ================================
  const CHART_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  const STATUS_COLORS = {
    agendado: '#FCD34D',
    confirmar: '#FB923C',
    confirmado: '#60A5FA',
    presente: '#34D399',
  };

  // ================================
  // Chart Data
  // ================================
  const studentsChartData = [
    { name: 'Agendado', value: studentsData?.byStatus.scheduled || 0, fill: STATUS_COLORS.agendado },
    { name: 'Confirmar', value: studentsData?.byStatus.toConfirm || 0, fill: STATUS_COLORS.confirmar },
    { name: 'Confirmado', value: studentsData?.byStatus.confirmed || 0, fill: STATUS_COLORS.confirmado },
    { name: 'Presente', value: studentsData?.byStatus.present || 0, fill: STATUS_COLORS.presente },
  ];

  const financialChartData = [
    { name: 'Receitas', value: financialData?.revenue || 0, fill: '#10B981' },
    { name: 'Despesas', value: financialData?.expenses || 0, fill: '#EF4444' },
    { name: 'Lucro', value: financialData?.profit || 0, fill: '#3B82F6' },
  ];

  const revenueVsExpenseData = [
    {
      name: 'Receitas',
      Recebido: financialData?.revenue || 0,
      Pendente: financialData?.pendingPayments.amount || 0,
    },
    {
      name: 'Despesas',
      Pago: financialData?.expenses || 0,
      Pendente: financialData?.pendingExpenses.amount || 0,
    },
  ];

  const costsChartData = costsData?.byCategory.map((cat, index) => ({
    name: cat.category,
    value: cat.amount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const supplierSummary = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((supplier) => supplier.active).length;
    const categories = new Set(suppliers.map((supplier) => supplier.category).filter(Boolean));
    return {
      total,
      active,
      inactive: total - active,
      categories: categories.size,
    };
  }, [suppliers]);

  const tabsContent = (
    <>
      <TabsContent value="financial" className="space-y-4">
        {/* Cards de Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Receitas Totais</p>
                  {isLoadingFinancial ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialData?.revenue || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recebido: {formatCurrency((financialData?.revenue || 0) - (financialData?.pendingPayments.amount || 0))}
                      </p>
                    </>
                  )}
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Despesas Totais</p>
                  {isLoadingFinancial ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(financialData?.expenses || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pago: {formatCurrency(financialData?.expenses || 0)}
                      </p>
                    </>
                  )}
                </div>
                <TrendingDown className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Margem de Lucro</p>
                  {isLoadingFinancial ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <>
                      <p className={`text-2xl font-bold ${(financialData?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {((financialData?.profit || 0) / (financialData?.revenue || 1) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lucro: {formatCurrency(financialData?.profit || 0)}
                      </p>
                    </>
                  )}
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
              <DollarSign className="w-5 h-5 text-green-600" />
              Receitas vs Despesas
            </CardTitle>
            <CardDescription>Comparativo de valores recebidos e pagos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFinancial ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueVsExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Recebido" fill="#10B981" name="Recebido" />
                  <Bar dataKey="Pendente" fill="#F59E0B" name="Pendente" />
                  <Bar dataKey="Pago" fill="#EF4444" name="Pago" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pendentes */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFinancial ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-600">
                    {formatCurrency(financialData?.pendingPayments.amount || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {financialData?.pendingPayments.count || 0} pagamentos pendentes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFinancial ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-600">
                    {formatCurrency(financialData?.pendingExpenses.amount || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {financialData?.pendingExpenses.count || 0} despesas pendentes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alerta de Fluxo</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFinancial ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${(financialData?.profit || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(financialData?.profit || 0) < 0 ? 'Negativo' : 'Positivo'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(financialData?.profit || 0)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="operational" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {operationalData?.classes.active || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupacao</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {(operationalData?.occupancy.rate || 0).toFixed(0)}%
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Salas Disponiveis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">
                  {operationalData?.rooms.available || 0}/{operationalData?.rooms.total || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {operationalData?.courses.active || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ocupação por Sala</CardTitle>
              <CardDescription>Taxa de ocupação de cada sala</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {operationalData?.occupancyByRoom.map((room) => (
                    <div key={room.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-muted-foreground">
                          {room.enrolled}/{room.capacity} ({room.rate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(room.rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Operacional</CardTitle>
              <CardDescription>Indicadores principais</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOperational ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Turmas Ativas</span>
                    <span className="font-medium">{operationalData?.classes.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Salas Disponíveis</span>
                    <span className="font-medium">{operationalData?.rooms.available}/{operationalData?.rooms.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cursos Ativos</span>
                    <span className="font-medium">{operationalData?.courses.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Produtos Extras</span>
                    <span className="font-medium">{operationalData?.extraProducts.count}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="students" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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
              {isLoadingStudents ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} alunos`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cards de Status Detalhado */}
          <div className="space-y-4">
            <Card className="border-l-4 border-l-yellow-400">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status: Agendado</p>
                    <p className="text-3xl font-bold text-yellow-600">{studentsData?.byStatus.scheduled || 0}</p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-400">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status: Confirmar</p>
                    <p className="text-3xl font-bold text-orange-600">{studentsData?.byStatus.toConfirm || 0}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-400">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status: Confirmado</p>
                    <p className="text-3xl font-bold text-blue-600">{studentsData?.byStatus.confirmed || 0}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-400">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status: Presente</p>
                    <p className="text-3xl font-bold text-green-600">{studentsData?.byStatus.present || 0}</p>
                  </div>
                  <Target className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Empresas */}
        <Card>
          <CardHeader>
            <CardTitle>Top Empresas</CardTitle>
            <CardDescription>Por número de alunos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentsData?.topCompanies.map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">
                        {company.tradeName || company.name}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {company.studentCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="costs" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(costsData?.totalCosts || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-2xl font-bold text-slate-600">
                  {formatCurrency(costsData?.fixedCosts || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(costsData?.variableCosts || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {costsData?.byCategory.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico de Pizza - Custos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-red-600" />
                Distribuição de Custos
              </CardTitle>
              <CardDescription>Visualização por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <Skeleton className="h-[300px] w-full" />
              ) : costsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum custo registrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Custos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Custos por Categoria</CardTitle>
              <CardDescription>Detalhamento com barras de progresso</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCosts ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {costsData?.byCategory.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{category.category}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatCurrency(category.amount)} ({category.count} {category.count === 1 ? 'item' : 'itens'})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((category.amount / (costsData?.totalCosts || 1)) * 100, 100)}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {supplierSummary.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {supplierSummary.active}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorias de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {supplierSummary.categories}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );

  return (
    <Tabs value={value} onValueChange={onValueChange} defaultValue="students" className="space-y-4">
      {!hideTabsList && (
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Operacional
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Custos
          </TabsTrigger>
        </TabsList>
      )}
      {tabsContent}
    </Tabs>
  );
}
