import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Database, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

export const DiagnosticoPersistencia: React.FC = () => {
  const { turmas, alunos, cursos } = useSMCorp();
  const [diagnostico, setDiagnostico] = useState<any>(null);
  
  const realizarDiagnostico = () => {
    console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico de persistência...');
    
    const resultado = {
      timestamp: new Date().toLocaleString('pt-BR'),
      localStorage: {
        turmas: {
          existe: !!localStorage.getItem('smcorp-turmas'),
          quantidade: 0,
          tamanho: 0
        },
        alunos: {
          existe: !!localStorage.getItem('smcorp-alunos'),
          quantidade: 0,
          tamanho: 0
        },
        cursos: {
          existe: !!localStorage.getItem('smcorp-cursos'),
          quantidade: 0,
          tamanho: 0
        }
      },
      estado: {
        turmas: turmas.length,
        alunos: alunos.length,
        cursos: cursos.length
      },
      sincronizado: false
    };
    
    // Verificar localStorage de turmas
    const turmasLS = localStorage.getItem('smcorp-turmas');
    if (turmasLS) {
      try {
        const turmasParsed = JSON.parse(turmasLS);
        resultado.localStorage.turmas.quantidade = turmasParsed.length;
        resultado.localStorage.turmas.tamanho = new Blob([turmasLS]).size;
      } catch (e) {
        console.error('❌ [DIAGNÓSTICO] Erro ao ler turmas do localStorage:', e);
      }
    }
    
    // Verificar localStorage de alunos
    const alunosLS = localStorage.getItem('smcorp-alunos');
    if (alunosLS) {
      try {
        const alunosParsed = JSON.parse(alunosLS);
        resultado.localStorage.alunos.quantidade = alunosParsed.length;
        resultado.localStorage.alunos.tamanho = new Blob([alunosLS]).size;
      } catch (e) {
        console.error('❌ [DIAGNÓSTICO] Erro ao ler alunos do localStorage:', e);
      }
    }
    
    // Verificar localStorage de cursos
    const cursosLS = localStorage.getItem('smcorp-cursos');
    if (cursosLS) {
      try {
        const cursosParsed = JSON.parse(cursosLS);
        resultado.localStorage.cursos.quantidade = cursosParsed.length;
        resultado.localStorage.cursos.tamanho = new Blob([cursosLS]).size;
      } catch (e) {
        console.error('❌ [DIAGNÓSTICO] Erro ao ler cursos do localStorage:', e);
      }
    }
    
    // Verificar se está sincronizado
    resultado.sincronizado = 
      resultado.estado.turmas === resultado.localStorage.turmas.quantidade &&
      resultado.estado.alunos === resultado.localStorage.alunos.quantidade &&
      resultado.estado.cursos === resultado.localStorage.cursos.quantidade;
    
    console.log('📊 [DIAGNÓSTICO] Resultado:', resultado);
    setDiagnostico(resultado);
    
    if (resultado.sincronizado) {
      toast.success('✅ Todos os dados estão sincronizados corretamente!');
    } else {
      toast.warning('⚠️ Detectada diferença entre estado e localStorage');
    }
  };
  
  const formatarBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  useEffect(() => {
    // Realizar diagnóstico automático ao montar
    realizarDiagnostico();
  }, []);
  
  if (!diagnostico) return null;
  
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Diagnóstico de Persistência</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={realizarDiagnostico}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
        <CardDescription>
          Última verificação: {diagnostico.timestamp}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          diagnostico.sincronizado ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {diagnostico.sincronizado ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Sincronização OK</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Divergência Detectada</span>
            </>
          )}
        </div>
        
        {/* Detalhes */}
        <div className="grid grid-cols-3 gap-3">
          {/* Turmas */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Turmas</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold">{diagnostico.estado.turmas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LocalStorage:</span>
                <span className="font-semibold">{diagnostico.localStorage.turmas.quantidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tamanho:</span>
                <span className="text-gray-500">{formatarBytes(diagnostico.localStorage.turmas.tamanho)}</span>
              </div>
              <div className="pt-1">
                {diagnostico.estado.turmas === diagnostico.localStorage.turmas.quantidade ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sincronizado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    <span>Divergente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Alunos */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Alunos</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold">{diagnostico.estado.alunos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LocalStorage:</span>
                <span className="font-semibold">{diagnostico.localStorage.alunos.quantidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tamanho:</span>
                <span className="text-gray-500">{formatarBytes(diagnostico.localStorage.alunos.tamanho)}</span>
              </div>
              <div className="pt-1">
                {diagnostico.estado.alunos === diagnostico.localStorage.alunos.quantidade ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sincronizado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    <span>Divergente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Cursos */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Cursos</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-semibold">{diagnostico.estado.cursos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LocalStorage:</span>
                <span className="font-semibold">{diagnostico.localStorage.cursos.quantidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tamanho:</span>
                <span className="text-gray-500">{formatarBytes(diagnostico.localStorage.cursos.tamanho)}</span>
              </div>
              <div className="pt-1">
                {diagnostico.estado.cursos === diagnostico.localStorage.cursos.quantidade ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sincronizado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    <span>Divergente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Avisos */}
        {!diagnostico.sincronizado && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="text-yellow-800">
              <strong>⚠️ Atenção:</strong> Foi detectada uma divergência entre o estado do React e o localStorage. 
              Isso pode indicar que alguma atualização não foi persistida corretamente. 
              Verifique o console do navegador (F12) para mais detalhes.
            </p>
          </div>
        )}
        
        {/* Dica */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p>
            <strong>💡 Dica:</strong> Abra o Console do navegador (pressione F12) para ver os logs detalhados 
            de todas as operações de persistência em tempo real. Procure por mensagens com os prefixos 
            [INICIALIZAÇÃO] e [PERSISTÊNCIA].
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
