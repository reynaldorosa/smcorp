import { useState } from 'react';
import { SMCorpProvider } from '@/app/contexts/SMCorpContext';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { Layout } from '@/app/components/Layout';
import { Modulo00 } from '@/app/components/Modulo00';
import { Modulo01 } from '@/app/components/Modulo01';
import { Modulo02 } from '@/app/components/Modulo02';
import { Modulo03 } from '@/app/components/Modulo03';
import { Modulo04 } from '@/app/components/Modulo04';
import { Modulo05 } from '@/app/components/Modulo05';
import { Modulo06 } from '@/app/components/Modulo06';
import { Modulo07 } from '@/app/components/Modulo07';
import { Modulo08 } from '@/app/components/Modulo08';
import { Modulo09 } from '@/app/components/Modulo09';
import { PaginaMatriculaAluno } from '@/app/components/PaginaMatriculaAluno';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { ContextGuard } from '@/app/components/ContextGuard';
import { AvisoArmazenamentoLocal } from '@/app/components/AvisoArmazenamentoLocal';
import { Button } from '@/app/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Toaster } from 'sonner';

// SMCORP - Sistema de Gestão para Centros de Treinamento Profissionalizante v2.5.2
// Sistema completo com 10 módulos integrados + Context Provider + Dashboard Executivo
function AppContent() {
  const [moduloAtivo, setModuloAtivo] = useState('modulo09');
  const [modoVisualizacao, setModoVisualizacao] = useState<'admin' | 'aluno'>('admin');
  const [codigoMatriculaTeste, setCodigoMatriculaTeste] = useState('');
  const [dialogTesteAberto, setDialogTesteAberto] = useState(false);

  const renderModulo = () => {
    switch (moduloAtivo) {
      case 'modulo00':
        return <Modulo00 />;
      case 'modulo01':
        return <Modulo01 />;
      case 'modulo02':
        return <Modulo02 />;
      case 'modulo03':
        return <Modulo03 />;
      case 'modulo04':
        return <Modulo04 />;
      case 'modulo05':
        return <Modulo05 />;
      case 'modulo06':
        return <Modulo06 />;
      case 'modulo07':
        return <Modulo07 />;
      case 'modulo08':
        return <Modulo08 />;
      case 'modulo09':
        return <Modulo09 />;
      default:
        return <Modulo09 />;
    }
  };

  const abrirPaginaAluno = () => {
    if (codigoMatriculaTeste.trim()) {
      console.log('🔍 DEBUG - Abrindo página do aluno');
      console.log('Código:', codigoMatriculaTeste);
      console.log('Modo antes:', modoVisualizacao);
      
      setDialogTesteAberto(false);
      
      // Forçar uma pequena espera antes de mudar o modo
      setTimeout(() => {
        setModoVisualizacao('aluno');
        console.log('Modo depois:', 'aluno');
      }, 100);
    } else {
      console.log('⚠️ Código vazio!');
    }
  };

  const voltarParaAdmin = () => {
    console.log('🔙 Voltando para admin');
    setModoVisualizacao('admin');
    setCodigoMatriculaTeste('');
  };

  console.log('🎬 RENDER - Modo:', modoVisualizacao, 'Código:', codigoMatriculaTeste);

  // Se estiver no modo aluno, renderizar a página de matrícula
  if (modoVisualizacao === 'aluno' && codigoMatriculaTeste) {
    console.log('✅ Renderizando página do aluno');
    return (
      <div className="h-full w-full">
        <PaginaMatriculaAluno codigoMatricula={codigoMatriculaTeste} onVoltar={voltarParaAdmin} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Botões flutuantes - APENAS PARA DESENVOLVIMENTO */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {/* TESTE DIRETO - SEM DIALOG */}
        <Button
          variant="outline"
          size="sm"
          className="bg-yellow-500 shadow-lg border-2 border-yellow-600 text-white hover:bg-yellow-600 font-bold"
          onClick={() => {
            console.log('🚀 TESTE DIRETO - Clicou no botão');
            setCodigoMatriculaTeste('A0001-1');
            setTimeout(() => {
              setModoVisualizacao('aluno');
            }, 100);
          }}
        >
          🧪 TESTE RÁPIDO
        </Button>

        {/* Botão de Teste de Link */}
        <Dialog open={dialogTesteAberto} onOpenChange={setDialogTesteAberto}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Testar Link do Aluno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🔗 Testar Link de Matrícula</DialogTitle>
              <DialogDescription>
                Cole o código de matrícula de um aluno para visualizar a página que ele verá
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="codigoMatricula">Código de Matrícula</Label>
                <Input
                  id="codigoMatricula"
                  placeholder="Ex: A0001-123456789"
                  value={codigoMatriculaTeste}
                  onChange={(e) => setCodigoMatriculaTeste(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: CodigoSistema-ID (exemplo: A0001-1)
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-semibold text-blue-900 mb-1">💡 Como obter o código:</p>
                <ul className="text-blue-800 space-y-1 text-xs">
                  <li>1. Vá para um aluno em qualquer módulo</li>
                  <li>2. Clique no botão "Link"</li>
                  <li>3. Copie o código do link (parte após /matricula/)</li>
                  <li>4. Cole aqui para testar!</li>
                </ul>
              </div>
              <Button onClick={abrirPaginaAluno} className="w-full" disabled={!codigoMatriculaTeste.trim()}>
                Visualizar Página do Aluno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Layout activeModule={moduloAtivo} onModuleChange={setModuloAtivo}>
        {renderModulo()}
      </Layout>
    </div>
  );
}

// Componente principal com providers v2.5.2
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SMCorpProvider>
          <ContextGuard>
            <div className="h-screen w-full overflow-hidden flex flex-col">
              <AvisoArmazenamentoLocal />
              <AppContent />
              <Toaster position="top-right" richColors />
            </div>
          </ContextGuard>
        </SMCorpProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}