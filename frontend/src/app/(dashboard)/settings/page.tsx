'use client';

import React, { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Home,
  Users,
  Building2,
  Truck,
  GraduationCap,
  Package,
  MessageCircle,
  DollarSign,
  Briefcase,
  Download,
  CreditCard,
} from 'lucide-react';

// Lazy load tab components for better performance
import {
  RoomsTab,
  UsersTab,
  SuppliersTab,
  InstructorsTab,
  ProductsTab,
  InstitutionalTab,
  CommunicationsTab,
  CostsTab,
  CompaniesTab,
  BackupTab,
  PersistenceDiagnostic,
} from '@/components/settings';
import { BillingCard } from '@/components/settings/billing-card';

// ============================================
// Loading Fallback
// ============================================

function TabLoadingFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-md" />
      <div className="h-4 w-72 bg-slate-100 rounded-md" />
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function SettingsPage() {
  const [currentTab, setCurrentTab] = useState('institutional');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full">
          
          {/* Header Area with Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 py-4 flex-shrink-0">
             <div className="max-w-7xl mx-auto mb-4">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações do Sistema</h1>
               <p className="text-slate-600 text-sm">
                  Gerencie a infraestrutura e parâmetros globais da plataforma
               </p>
             </div>

             {/* Horizontal Tabs Navigation */}
             <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
               <TabsList className="flex w-max h-auto bg-slate-50/50 rounded-none p-1.5 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide px-2">Geral</span>
                    <SettingsTabTrigger value="institutional" icon={Home} label="Institucional" />
                    <SettingsTabTrigger value="companies" icon={Briefcase} label="Empresas" />
                    <SettingsTabTrigger value="users" icon={Users} label="Usuários" />
                    <SettingsTabTrigger value="communications" icon={MessageCircle} label="Comunicações" />
                  </div>
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide px-2">Operacional</span>
                    <SettingsTabTrigger value="rooms" icon={Building2} label="Salas" />
                    <SettingsTabTrigger value="suppliers" icon={Truck} label="Fornecedores" />
                    <SettingsTabTrigger value="instructors" icon={GraduationCap} label="Instrutores" />
                    <SettingsTabTrigger value="products" icon={Package} label="Produtos" />
                  </div>
                  <div className="w-px h-7 bg-slate-300 mx-2" />
                  <div className="flex items-center gap-1.5">
                     <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide px-2">Sistema</span>
                     <SettingsTabTrigger value="costs" icon={DollarSign} label="Custos" />
                     <SettingsTabTrigger value="billing" icon={CreditCard} label="Assinatura" />
                     <SettingsTabTrigger value="backup" icon={Download} label="Backup" />
                  </div>
               </TabsList>
             </div>
          </div>

          {/* Main Content Area - Full Width Card */}
          <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
              <Card className="h-full border-slate-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-none">
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <div className="p-6">
                    
                    <TabsContent value="institutional" className="mt-0 space-y-6">
                      <ContentHeader title="Dados Institucionais" description="Informações básicas da organização e branding." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <InstitutionalTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="rooms" className="mt-0 space-y-6">
                      <ContentHeader title="Gestão de Salas" description="Configure os espaços físicos disponíveis para treinamentos." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <RoomsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="users" className="mt-0 space-y-6">
                      <ContentHeader title="Controle de Usuários" description="Adicione membros da equipe e defina permissões de acesso." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <UsersTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="suppliers" className="mt-0 space-y-6">
                      <ContentHeader title="Fornecedores" description="Cadastro de parceiros e prestadores de serviço." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <SuppliersTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="instructors" className="mt-0 space-y-6">
                       <ContentHeader title="Corpo Docente" description="Gestão de instrutores e professores habilitados." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <InstructorsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="products" className="mt-0 space-y-6">
                      <ContentHeader title="Catálogo de Produtos" description="Itens e materiais utilizados nos cursos e treinamentos." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <ProductsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="costs" className="mt-0 space-y-6">
                      <ContentHeader title="Centros de Custo" description="Categorização financeira para melhor controle de despesas." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <CostsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="communications" className="mt-0 space-y-6">
                      <ContentHeader title="Comunicação" description="Templates de e-mail e configurações de notificações." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <CommunicationsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="companies" className="mt-0 space-y-6">
                      <ContentHeader title="Empresas Parceiras" description="Gestão de clientes PJ e parceiros corporativos." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <CompaniesTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-0 space-y-6">
                      <ContentHeader title="Assinatura do Centro" description="Plano SaaS e cobranças mensais (Mercado Pago)." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <BillingCard />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="backup" className="mt-0 space-y-6">
                       <ContentHeader title="Segurança de Dados" description="Realize backups manuais ou restaure versões anteriores." />
                      <Suspense fallback={<TabLoadingFallback />}>
                        <BackupTab />
                        <Accordion type="single" collapsible defaultValue="diagnostico-persistencia" className="w-full">
                          <AccordionItem value="diagnostico-persistencia" className="border rounded-md px-4 bg-white">
                            <AccordionTrigger>Diagnóstico de Persistência (Avançado)</AccordionTrigger>
                            <AccordionContent>
                              <PersistenceDiagnostic />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Suspense>
                    </TabsContent>

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

// Helper Components for Cleaner Code
function SettingsTabTrigger({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 px-4 py-2.5 rounded-none font-medium text-sm text-slate-600 hover:text-red-700 hover:bg-red-50/70 transition-all border border-transparent data-[state=active]:shadow-md data-[state=active]:border-red-700"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </TabsTrigger>
  );
}

function ContentHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-500 rounded-full shadow-sm"/>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      <p className="text-slate-600 ml-5 text-sm">{description}</p>
    </div>
  );
}
