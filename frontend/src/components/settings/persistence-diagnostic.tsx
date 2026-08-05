'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useClassesStore } from '@/stores/classes.store';
import { useStudentsStore } from '@/stores/students.store';
import { useCoursesStore } from '@/stores/courses.store';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface StoreDiagnostic {
  exists: boolean;
  count: number;
  sizeBytes: number;
}

interface DiagnosticResult {
  timestamp: string;
  mode: {
    classes: 'api-memory';
    students: 'api-memory';
    courses: 'local-persist';
  };
  localStorage: {
    courses: StoreDiagnostic;
  };
  storeState: {
    classes: number;
    students: number;
    courses: number;
  };
  synchronized: boolean;
}

// ============================================
// Component
// ============================================

export const PersistenceDiagnostic: React.FC = () => {
  const classes = useClassesStore((s) => s.classes ?? []);
  const students = useStudentsStore((s) => s.students ?? []);
  const courses = useCoursesStore((s) => s.courses ?? []);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = useCallback(() => {
    const result: DiagnosticResult = {
      timestamp: new Date().toLocaleString('pt-BR'),
      mode: {
        classes: 'api-memory',
        students: 'api-memory',
        courses: 'local-persist',
      },
      localStorage: {
        courses: { exists: false, count: 0, sizeBytes: 0 },
      },
      storeState: {
        classes: classes.length,
        students: students.length,
        courses: courses.length,
      },
      synchronized: false,
    };

    const STORE_KEYS: { keys: string[]; field: 'courses' }[] = [
      { keys: ['smcorp-courses', 'smcorp-cursos'], field: 'courses' },
    ];

    for (const { keys, field } of STORE_KEYS) {
      const raw = keys.map((k) => localStorage.getItem(k)).find(Boolean);
      if (!raw) continue;

      result.localStorage[field].exists = true;
      result.localStorage[field].sizeBytes = new Blob([raw]).size;
      try {
        const parsed = JSON.parse(raw);
        const stateData = parsed?.state?.[field] ?? parsed;
        result.localStorage[field].count = Array.isArray(stateData) ? stateData.length : 0;
      } catch {
        /* parse error — count stays 0 */
      }
    }

    result.synchronized =
      result.storeState.courses === result.localStorage.courses.count;

    setDiagnostic(result);

    if (result.synchronized) {
      toast.success('Todos os dados estão sincronizados corretamente!');
    } else {
      toast.warning('Detectada diferença no módulo com persistência local');
    }
  }, [classes.length, students.length, courses.length]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    runDiagnostic();
  }, [runDiagnostic]);

  if (!diagnostic) return null;

  const SECTIONS: { label: string; field: 'classes' | 'students' | 'courses' }[] = [
    { label: 'Turmas', field: 'classes' },
    { label: 'Alunos', field: 'students' },
    { label: 'Cursos', field: 'courses' },
  ];

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Diagnóstico de Persistência</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={runDiagnostic}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
        <CardDescription>Última verificação: {diagnostic.timestamp}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            diagnostic.synchronized ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {diagnostic.synchronized ? (
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

        {/* Detail Cards */}
        <div className="grid grid-cols-3 gap-3">
          {SECTIONS.map(({ label, field }) => {
            const storeCount = diagnostic.storeState[field];
            const isApiMemory = field === 'classes' || field === 'students';
            const lsCount = isApiMemory ? 0 : diagnostic.localStorage.courses.count;
            const lsSize = isApiMemory ? 0 : diagnostic.localStorage.courses.sizeBytes;
            const isSynced = isApiMemory ? true : storeCount === lsCount;

            return (
              <div key={field} className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2">{label}</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-semibold">{storeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LocalStorage:</span>
                    <span className="font-semibold">{isApiMemory ? 'N/A' : lsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="text-gray-500">{isApiMemory ? 'N/A' : formatBytes(lsSize)}</span>
                  </div>
                  <div className="pt-1">
                    {isSynced ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isApiMemory ? 'API/Memória' : 'Sincronizado'}</span>
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
            );
          })}
        </div>

        {/* Warning */}
        {!diagnostic.synchronized && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="text-yellow-800">
              <strong>⚠️ Atenção:</strong> Foi detectada uma divergência entre o estado das stores Zustand e o
              localStorage no módulo ainda persistido localmente. Classes e alunos já usam modo API/Memória.
              Verifique o console do navegador (F12) para mais detalhes.
            </p>
          </div>
        )}

        {/* Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p>
            <strong>💡 Dica:</strong> Abra o Console do navegador (pressione F12) para ver os logs detalhados de
            todas as operações de persistência em tempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
