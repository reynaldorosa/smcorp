'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useSettingsStore } from '@/stores/settings.store';
import {
  getFirstAllowedRoute,
  getModuleGateForPathname,
  isAllowedByModuleGate,
} from '@/lib/route-module-map';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { FloatingTestButtons } from '@/components/layout/floating-test-buttons';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const { currentUser } = useSettingsStore();

  // MASTER é usuário de plataforma (sem tenant) — nunca entra no dashboard de tenant
  const isMaster = user?.role === 'MASTER';

  const gate = getModuleGateForPathname(pathname);
  const isDenied = Boolean(
    gate && currentUser?.permissions && !isAllowedByModuleGate(currentUser.permissions.modulos, gate),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (isMaster) {
      router.push('/platform');
    }
  }, [isAuthenticated, isMaster, router]);

  // Manda para a primeira rota permitida — nunca para `/dashboard` fixo:
  // `/dashboard` é gated por modulo09 e perfis sem esse módulo ficariam presos
  // (negados aqui e redirecionados para cá de novo = tela em branco).
  useEffect(() => {
    if (isDenied && currentUser?.permissions) {
      const destino = getFirstAllowedRoute(currentUser.permissions.modulos);
      if (destino !== pathname) {
        router.push(destino);
      }
    }
  }, [isDenied, currentUser, pathname, router]);

  if (!isAuthenticated || isMaster) {
    return null;
  }

  if (isDenied) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className={`ml-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header />
        <main className="p-4">{children}</main>
      </div>
      <FloatingTestButtons />
    </div>
  );
}
