import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Hook for persisting state in localStorage
 * Maintains state even after module changes or page reloads
 * Supports primitive types, objects, arrays and Set
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Try to load from localStorage
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsed = JSON.parse(item);
      
      // If initial value is a Set, convert from array to Set
      if (initialValue instanceof Set) {
        return new Set(parsed) as T;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error loading persisted state (${key}):`, error);
      return initialValue;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      // If Set, convert to array before saving
      const valueToSave = state instanceof Set ? Array.from(state) : state;
      localStorage.setItem(key, JSON.stringify(valueToSave));
    } catch (error) {
      console.error(`Error saving persisted state (${key}):`, error);
    }
  }, [key, state]);

  return [state, setState];
}
