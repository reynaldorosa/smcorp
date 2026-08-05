'use client';

import { useEffect, useRef } from 'react';
import { useCostsStore } from '@/stores/costs.store';
import { useStudentsStore } from '@/stores/students.store';
import { useSettingsStore } from '@/stores/settings.store';

/**
 * Hook que executa limpeza automática de lançamentos de custo órfãos
 * quando alunos ou instrutores mudam (paridade Figma: useEffect em limparLancamentosOrfaos).
 *
 * Deve ser chamado uma única vez no Providers.
 */
export function useOrphanCleanup() {
  const students = useStudentsStore((s) => s.students);
  const instructors = useSettingsStore((s) => s.instructors);
  const cleanupRef = useRef(useCostsStore.getState().cleanupOrphanCostEntries);

  const isInitialMount = useRef(true);

  // Manter referência atualizada sem causar re-render
  useEffect(() => {
    cleanupRef.current = useCostsStore.getState().cleanupOrphanCostEntries;
  });

  useEffect(() => {
    // Pular a primeira montagem para evitar limpeza desnecessária na inicialização
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Executa limpeza de entradas órfãs sempre que alunos ou instrutores mudam
    const removed = cleanupRef.current();
    if (removed > 0) {
      console.info(`[OrphanCleanup] Removidos ${removed} lançamentos de custo órfãos`);
    }
  }, [students, instructors]);
}
