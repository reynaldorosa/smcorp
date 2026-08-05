'use client';

import React, { useState, useCallback } from 'react';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsStore } from '@/stores/settings.store';
import { useStudentsStore } from '@/stores/students.store';
import { useClassesStore } from '@/stores/classes.store';
import { useCoursesStore } from '@/stores/courses.store';
import { useCompaniesStore } from '@/stores/companies.store';
import { useCostsStore } from '@/stores/costs.store';

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = [
  'smcorp-settings-storage',
  'smcorp-students-storage',
  'smcorp-classes-storage',
  'smcorp-courses-storage',
  'smcorp-companies-storage',
  'smcorp-costs-storage',
  'smcorp-instructors-storage',
  'auth-storage',
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

export function ClearData() {
  const [isClearing, setIsClearing] = useState(false);

  const settingsReset = useSettingsStore((s) => s.reset);
  const studentsReset = useStudentsStore((s) => s.reset);
  const classesReset = useClassesStore((s) => s.reset);
  const coursesReset = useCoursesStore((s) => s.reset);
  const companiesReset = useCompaniesStore((s) => s.reset);
  const costsReset = useCostsStore((s) => s.reset);

  const handleClearAll = useCallback(async () => {
    setIsClearing(true);

    try {
      // Reset all Zustand stores
      settingsReset();
      studentsReset();
      classesReset();
      coursesReset();
      companiesReset();
      costsReset();

      // Remove persisted localStorage keys
      for (const key of STORAGE_KEYS) {
        localStorage.removeItem(key);
      }

      toast.success('Todos os dados foram removidos com sucesso!');

      // Reload after short delay to reset UI state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Erro ao limpar dados do sistema');
      console.error('[ClearData] Failed to clear data:', error);
      setIsClearing(false);
    }
  }, [settingsReset, studentsReset, classesReset, coursesReset, companiesReset, costsReset]);

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <ShieldAlert className="w-5 h-5" />
          Limpar Dados do Sistema
        </CardTitle>
        <CardDescription>
          Remove permanentemente todos os dados locais do Portal SM Corp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Atenção: Ação irreversível</p>
              <p className="text-xs text-red-700 mt-1">
                Esta ação removerá permanentemente todos os dados armazenados localmente, incluindo:
                alunos, turmas, cursos, empresas, configurações, fornecedores, produtos, custos
                auditáveis, critérios de custo e lançamentos. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>

        {/* Items to clear */}
        <div className="grid grid-cols-2 gap-2">
          {[
            'Configurações',
            'Alunos',
            'Turmas',
            'Cursos',
            'Empresas',
            'Custos',
            'Instrutores',
            'Autenticação',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2"
            >
              <Trash2 className="w-3 h-3 text-gray-400" />
              {item}
            </div>
          ))}
        </div>

        {/* Confirm dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isClearing}
              className="w-full"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Limpando dados...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Todos os Dados
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Confirmar limpeza de dados
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja remover permanentemente todos os dados do sistema?
                Esta ação não pode ser desfeita. A página será recarregada automaticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, limpar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
