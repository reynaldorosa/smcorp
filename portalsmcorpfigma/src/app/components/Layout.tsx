import React, { useState } from 'react';
import { Settings, BookOpen, Calendar, LayoutDashboard, MessageCircle, Building2, FileCheck, DollarSign, TrendingUp, Activity, Moon, Sun } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { Button } from '@/app/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeModule, onModuleChange }) => {
  const { usuarioAtual } = useSMCorp();
  const { theme, toggleTheme } = useTheme();
  
  const menuItems = [
    { id: 'modulo09', label: 'Módulo 09', subtitle: 'Dashboard Executivo', icon: Activity },
    { id: 'modulo00', label: 'Módulo 00', subtitle: 'Infraestrutura', icon: Settings },
    { id: 'modulo01', label: 'Módulo 01', subtitle: 'Catálogo de Cursos', icon: BookOpen },
    { id: 'modulo02', label: 'Módulo 02', subtitle: 'Abertura de Turmas', icon: Calendar },
    { id: 'modulo03', label: 'Módulo 03', subtitle: 'Dashboard Operacional', icon: LayoutDashboard },
    { id: 'modulo04', label: 'Módulo 04', subtitle: 'Central de Vendas', icon: MessageCircle },
    { id: 'modulo05', label: 'Módulo 05', subtitle: 'Área do Cliente PJ', icon: Building2 },
    { id: 'modulo06', label: 'Módulo 06', subtitle: 'Validação de Documentos', icon: FileCheck },
    { id: 'modulo07', label: 'Módulo 07', subtitle: 'Gestão de Pagamentos', icon: DollarSign },
    { id: 'modulo08', label: 'Módulo 08', subtitle: 'Fluxo Financeiro', icon: TrendingUp }
  ];

  // Filtrar módulos baseado nas permissões do usuário
  const menuItemsFiltrados = menuItems.filter(item => {
    const moduloKey = item.id as keyof typeof usuarioAtual.permissoes.modulos;
    return usuarioAtual?.permissoes?.modulos?.[moduloKey] !== false;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header/Navbar Superior */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="w-full max-w-7xl">
          {/* Logo e Nome */}
          <div className="px-3 py-1 border-b border-gray-200 dark:border-gray-700 transition-colors" style={{ backgroundColor: '#DC2626' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-base font-bold text-white leading-tight">SMCORP</h1>
                  <p className="text-white text-[9px] opacity-90 leading-tight">Gestão Profissionalizante</p>
                </div>
                <div className="text-white text-[9px] opacity-75 border-l border-white/30 pl-3">
                  v1.0
                </div>
              </div>
              
              {/* Botão de Dark Mode */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 text-white hover:bg-red-700 transition-colors"
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Navegação Horizontal */}
          <nav className="bg-[rgb(252,246,246)] dark:bg-gray-800 shadow-sm transition-colors">
            <div className="flex items-center gap-1 px-3">
              {menuItemsFiltrados.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 border-b-2 transition-all ${
                      isActive
                        ? 'border-red-600 text-red-600 bg-red-50 dark:bg-red-900/30'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`} />
                    <div className="text-left">
                      <div className="font-medium text-[11px]">{item.label}</div>
                      <div className={`text-[9px] ${isActive ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors">
        {children}
      </div>
    </div>
  );
};