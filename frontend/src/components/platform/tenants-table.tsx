'use client';

import { useMemo, useState } from 'react';
import { Search, Loader2, Play, Pause, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import type { PlatformTenant } from '@/services/tenants.service';

// ============================================
// PLATAFORMA — Tabela de tenants (superadmin)
// ============================================

const STATUS_LABEL: Record<PlatformTenant['status'], string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<PlatformTenant['status'], string> = {
  TRIAL: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/40',
  CANCELLED: 'bg-slate-600/30 text-slate-400 border-slate-500/40',
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface TenantsTableProps {
  tenants: PlatformTenant[];
  loading: boolean;
  updatingId: string | null;
  onStatusChange: (id: string, status: PlatformTenant['status']) => void;
}

export function TenantsTable({ tenants, loading, updatingId, onStatusChange }: TenantsTableProps) {
  const [search, setSearch] = useState('');
  const { requestConfirmation } = useConfirmation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [tenants, search]);

  const confirmStatusChange = (tenant: PlatformTenant, next: PlatformTenant['status']) => {
    const labels: Record<PlatformTenant['status'], { title: string; desc: string; destructive: boolean }> = {
      ACTIVE: {
        title: 'Ativar centro de treinamento',
        desc: `O centro "${tenant.name}" voltará a ter acesso à plataforma.`,
        destructive: false,
      },
      SUSPENDED: {
        title: 'Suspender centro de treinamento',
        desc: `O centro "${tenant.name}" perderá o acesso à plataforma imediatamente.`,
        destructive: true,
      },
      CANCELLED: {
        title: 'Cancelar centro de treinamento',
        desc: `O centro "${tenant.name}" será cancelado e perderá o acesso.`,
        destructive: true,
      },
      TRIAL: {
        title: 'Reativar trial',
        desc: `O centro "${tenant.name}" voltará ao período de teste.`,
        destructive: false,
      },
    };
    const { title, desc, destructive } = labels[next];
    requestConfirmation({
      title,
      description: desc,
      level: 'simple',
      action: 'Confirmar',
      destructive,
      onConfirm: () => onStatusChange(tenant.id, next),
    });
  };

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-white">
            Centros de Treinamento
            <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {filtered.length}
            </span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Centro</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Assinatura</TableHead>
                <TableHead className="text-slate-400">Trial expira</TableHead>
                <TableHead className="text-slate-400">Usuários</TableHead>
                <TableHead className="text-right text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhum centro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tenant) => {
                  const sub = tenant.subscription;
                  const daysLeft = tenant.trialEndsAt
                    ? Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / DAY_MS)
                    : null;
                  const trialWarning =
                    tenant.status === 'TRIAL' && daysLeft !== null && daysLeft <= 7;

                  return (
                    <TableRow key={tenant.id} className="border-slate-800 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="font-medium text-white">{tenant.name}</div>
                        <div className="text-xs text-slate-500">/{tenant.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[tenant.status]}>
                          {STATUS_LABEL[tenant.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub ? (
                          <div>
                            <div className="text-sm text-slate-200">
                              {sub.planName || 'Sem plano'} · {brl.format(Number(sub.price))}
                            </div>
                            <div className="text-xs text-slate-500">{sub.status}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">Sem assinatura</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${trialWarning ? 'font-medium text-amber-400' : 'text-slate-300'}`}>
                          {formatDate(tenant.trialEndsAt)}
                        </span>
                        {trialWarning && daysLeft !== null && (
                          <div className="text-xs text-amber-500">
                            {daysLeft < 0 ? 'expirado' : `expira em ${daysLeft}d`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">{tenant._count?.users ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {tenant.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                              disabled={updatingId === tenant.id}
                              onClick={() => confirmStatusChange(tenant, 'ACTIVE')}
                            >
                              <Play className="mr-1 h-3.5 w-3.5" />
                              Ativar
                            </Button>
                          )}
                          {tenant.status !== 'SUSPENDED' && tenant.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                              disabled={updatingId === tenant.id}
                              onClick={() => confirmStatusChange(tenant, 'SUSPENDED')}
                            >
                              <Pause className="mr-1 h-3.5 w-3.5" />
                              Suspender
                            </Button>
                          )}
                          {tenant.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              disabled={updatingId === tenant.id}
                              onClick={() => confirmStatusChange(tenant, 'CANCELLED')}
                            >
                              <Ban className="mr-1 h-3.5 w-3.5" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
