import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Hook para persistir estado no localStorage
 * Mantém o estado mesmo após trocar de módulo ou recarregar a página
 * Suporta tipos primitivos, objetos, arrays e Set
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Tentar carregar do localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      
      // Se o valor inicial é um Set, converter de array para Set
      if (initialValue instanceof Set) {
        return new Set(parsed) as T;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Erro ao carregar estado persistido (${key}):`, error);
      return initialValue;
    }
  });

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      // Se for Set, converter para array antes de salvar
      const valueToSave = state instanceof Set ? Array.from(state) : state;
      localStorage.setItem(key, JSON.stringify(valueToSave));
    } catch (error) {
      console.error(`Erro ao salvar estado persistido (${key}):`, error);
    }
  }, [key, state]);

  return [state, setState];
}
