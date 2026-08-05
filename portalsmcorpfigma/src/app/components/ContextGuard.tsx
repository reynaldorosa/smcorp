import React, { ReactNode } from 'react';
import { useSMCorpSafe } from '@/app/contexts/SMCorpContext';

interface ContextGuardProps {
  children: ReactNode;
}

// Componente que garante que o contexto está disponível antes de renderizar os filhos
// Útil para prevenir erros durante hot-reload do React
export const ContextGuard: React.FC<ContextGuardProps> = ({ children }) => {
  const context = useSMCorpSafe();
  
  console.log('🔍 ContextGuard: Verificando contexto...', context ? 'DISPONÍVEL ✅' : 'NÃO DISPONÍVEL ❌');
  
  if (!context) {
    // Durante hot-reload, pode haver um momento em que o contexto não está disponível
    // Mostra um indicador de carregamento ao invés de null
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando SMCORP...</p>
          <p className="text-gray-400 text-sm mt-2">Iniciando contexto do sistema</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};