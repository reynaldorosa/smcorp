import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

export const BackupDados: React.FC = () => {
  const { custosAuditaveis, criteriosCusto, instrutores } = useSMCorp();
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiarParaClipboard = (dados: any, tipo: string) => {
    const jsonFormatado = JSON.stringify(dados, null, 2);
    navigator.clipboard.writeText(jsonFormatado);
    setCopiado(tipo);
    toast.success(`${tipo} copiado para a área de transferência!`);
    setTimeout(() => setCopiado(null), 2000);
  };

  const exportarTodos = () => {
    const backup = {
      custosAuditaveis,
      criteriosCusto,
      instrutores,
      dataBackup: new Date().toISOString(),
      versao: '1.0'
    };
    const jsonFormatado = JSON.stringify(backup, null, 2);
    navigator.clipboard.writeText(jsonFormatado);
    toast.success('Backup completo copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Card de Exportação Completa */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Backup Completo
          </CardTitle>
          <CardDescription>
            Exportar todos os dados de custos, critérios e instrutores em formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportarTodos} className="w-full bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Copiar Backup Completo
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Total: {custosAuditaveis.length} custos + {criteriosCusto.length} critérios + {instrutores.length} instrutores
          </p>
        </CardContent>
      </Card>

      {/* Cards Individuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Custos Auditáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Custos Auditáveis</CardTitle>
            <CardDescription className="text-xs">
              {custosAuditaveis.length} registro(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copiarParaClipboard(custosAuditaveis, 'Custos')}
              className="w-full"
            >
              {copiado === 'Custos' ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
            
            {/* Preview */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
              {custosAuditaveis.slice(0, 3).map(c => (
                <div key={c.id} className="text-gray-600">
                  • {c.codigo} - {c.nome}
                </div>
              ))}
              {custosAuditaveis.length > 3 && (
                <div className="text-gray-400 mt-1">
                  ... e mais {custosAuditaveis.length - 3}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critérios de Custo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Critérios de Custo</CardTitle>
            <CardDescription className="text-xs">
              {criteriosCusto.length} registro(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copiarParaClipboard(criteriosCusto, 'Critérios')}
              className="w-full"
            >
              {copiado === 'Critérios' ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
            
            {/* Preview */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
              {criteriosCusto.slice(0, 3).map(c => (
                <div key={c.id} className="text-gray-600">
                  • {c.codigo} - {c.nome}
                </div>
              ))}
              {criteriosCusto.length > 3 && (
                <div className="text-gray-400 mt-1">
                  ... e mais {criteriosCusto.length - 3}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instrutores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instrutores</CardTitle>
            <CardDescription className="text-xs">
              {instrutores.length} registro(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copiarParaClipboard(instrutores, 'Instrutores')}
              className="w-full"
            >
              {copiado === 'Instrutores' ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
            
            {/* Preview */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
              {instrutores.length === 0 ? (
                <div className="text-gray-400">Nenhum instrutor cadastrado</div>
              ) : (
                <>
                  {instrutores.slice(0, 3).map(i => (
                    <div key={i.id} className="text-gray-600">
                      • {i.codigo} - {i.nome}
                    </div>
                  ))}
                  {instrutores.length > 3 && (
                    <div className="text-gray-400 mt-1">
                      ... e mais {instrutores.length - 3}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">📋 Como usar o backup</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>1.</strong> Clique em "Copiar Backup Completo" ou nos botões individuais</p>
          <p><strong>2.</strong> Cole os dados em um arquivo de texto (.txt ou .json)</p>
          <p><strong>3.</strong> Após resetar o sistema, você poderá reimportar manualmente</p>
          <p className="text-xs text-blue-600 mt-3">
            💡 Dica: Salve o backup em um local seguro antes de resetar os dados!
          </p>
        </CardContent>
      </Card>

      {/* Dados Completos em JSON (expandível) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visualizar JSON Completo</CardTitle>
          <CardDescription className="text-xs">
            Código completo para copiar/colar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Custos Auditáveis */}
            <details className="border rounded p-3">
              <summary className="cursor-pointer font-semibold text-sm mb-2">
                Custos Auditáveis ({custosAuditaveis.length})
              </summary>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(custosAuditaveis, null, 2)}
              </pre>
            </details>

            {/* Critérios de Custo */}
            <details className="border rounded p-3">
              <summary className="cursor-pointer font-semibold text-sm mb-2">
                Critérios de Custo ({criteriosCusto.length})
              </summary>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(criteriosCusto, null, 2)}
              </pre>
            </details>

            {/* Instrutores */}
            <details className="border rounded p-3">
              <summary className="cursor-pointer font-semibold text-sm mb-2">
                Instrutores ({instrutores.length})
              </summary>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {instrutores.length === 0 
                  ? '[]' 
                  : JSON.stringify(instrutores, null, 2)
                }
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
