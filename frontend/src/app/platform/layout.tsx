'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { PlatformSidebar } from '@/components/platform/platform-sidebar';

/**
 * Layout da PLATAFORMA (superadmin).
 * Só usuários MASTER (sem tenant) entram aqui — demais são levados ao dashboard do tenant.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const isMaster = user?.role === 'MASTER';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isMaster) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isMaster, router]);

  if (!isAuthenticated || !isMaster) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PlatformSidebar />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
