'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Percent, Building2, BarChart3, ChevronLeft, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('students');
  
  const tabs = ['students', 'financial', 'operational', 'costs'];
  
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-none shadow-md">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Executivo</h1>
                    <p className="text-slate-600 text-sm">Visão estratégica em tempo real da Plataforma Caiso</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('prev')}
                    disabled={tabs.indexOf(activeTab) === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateTab('next')}
                    disabled={tabs.indexOf(activeTab) === tabs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Horizontal Tabs Navigation */}
              <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <TabsList className="flex w-max h-auto bg-slate-50/50 rounded-none p-1.5 gap-1.5">
                  <TabsTrigger 
                    value="students"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Alunos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="financial"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Financeiro</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="operational"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Operacional</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="costs"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
                  >
                    <PieChartIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Custos</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-32" />
                          <Skeleton className="h-32" />
                          <Skeleton className="h-32" />
                          <Skeleton className="h-32" />
                        </>
                      ) : (
                        <>
                          <Card className="bg-red-50 border-0 rounded-none">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-red-600" />
                                    Total de Alunos
                                  </p>
                                  <p className="text-2xl font-bold text-red-600">{summary?.totalStudents?.value || 0}</p>
                                  <p className="text-xs text-gray-500 mt-1">{summary?.totalStudents?.activeCount || 0} presentes ativos</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-green-50 border-0 rounded-none">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    Fluxo de Caixa
                                  </p>
                                  <p className="text-2xl font-bold text-green-600">
                                    R$ {(summary?.cashFlow?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Saldo atual (Receitas - Despesas)</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-orange-50 border-0 rounded-none">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                                    <Percent className="w-4 h-4 text-orange-600" />
                                    Taxa de Ocupação
                                  </p>
                                  <p className="text-2xl font-bold text-orange-600">{summary?.occupancy?.rate || 0}%</p>
                                  <p className="text-xs text-gray-500 mt-1">{summary?.occupancy?.activeClasses || 0} turmas ativas</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-blue-50 border-0 rounded-none">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    Empresas Parceiras
                                  </p>
                                  <p className="text-2xl font-bold text-blue-600">{summary?.companies?.total || 0}</p>
                                  <p className="text-xs text-gray-500 mt-1">{summary?.companies?.active || 0} cadastradas</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Tabs Content */}
                    <DashboardTabs value={activeTab} onValueChange={setActiveTab} hideTabsList={true} />

                  </div>
                </div>
              </Card>
            </div>
          </main>
        </Tabs>
      </div>
    </div>
  );
}
