'use client';

import React, { ReactNode } from 'react';

interface StoreGuardProps {
  children: ReactNode;
}

/**
 * Ensures Zustand stores are hydrated before rendering children.
 * Useful for preventing hydration mismatch errors in Next.js
 * when stores use localStorage persistence.
 */
export const StoreGuard: React.FC<StoreGuardProps> = ({ children }) => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Carregando Caiso...</p>
          <p className="text-gray-400 text-sm mt-2">Inicializando stores do sistema</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
