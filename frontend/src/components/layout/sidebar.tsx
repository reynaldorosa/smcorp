'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { getModuleGateForPathname, isAllowedByModuleGate } from '@/lib/route-module-map';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  CalendarDays,
  BarChart,
  Clock,
  ShoppingCart,
  CreditCard,
  DollarSign,
  FileCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Award,
  Contact,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard Executivo',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
  {
    title: 'Catálogo de Cursos',
    href: '/courses',
    icon: BookOpen,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Abertura de Turmas',
    href: '/classes',
    icon: CalendarDays,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Dashboard Operacional',
    href: '/operacional',
    icon: BarChart,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Timeline Semanal',
    href: '/timeline',
    icon: Clock,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Central de Vendas',
    href: '/vendas',
    icon: ShoppingCart,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Área do Cliente PJ',
    href: '/cliente-pj',
    icon: Building2,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Validação de Documentos',
    href: '/documents',
    icon: FileCheck,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'Gestão de Pagamentos',
    href: '/pagamentos',
    icon: CreditCard,
    roles: ['ADMIN'],
  },
  {
    title: 'Financeiro',
    href: '/costs',
    icon: DollarSign,
    roles: ['ADMIN'],
  },
  {
    title: 'Certificados',
    href: '/certificados',
    icon: Award,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: Contact,
    roles: ['ADMIN', 'COLLABORATOR'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentUser } = useSettingsStore();
  const { collapsed, toggleCollapsed } = useSidebarStore();

  const filteredNavItems = navItems.filter((item) => {
    const hasRoleAccess = !item.roles || item.roles.includes(user?.role || '');
    if (!hasRoleAccess) return false;

    const gate = getModuleGateForPathname(item.href);
    if (!gate) return true;

    const permissions = currentUser?.permissions;
    if (!permissions) return true;

    return isAllowedByModuleGate(permissions.modulos, gate);
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-bold text-primary">SMCORP</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center px-2',
          )}
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
