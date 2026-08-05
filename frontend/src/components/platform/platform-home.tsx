'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Clock, CheckCircle2, AlertTriangle, XCircle, DollarSign, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { platformService, type PlatformMetrics, type PlatformTenant } from '@/services/tenants.service';
import { TenantsTable } from './tenants-table';
import { TenantCreateDialog } from './tenant-create-dialog';

// ============================================
// PLATAFORMA — Home do superadmin (gestão de tenants)
// ============================================

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformHome() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await platformService.getAll();
      setTenants(data.tenants);
      setMetrics(data.metrics);
    } catch (error) {
      toast.error('Não foi possível carregar os tenants. Recarregue a página.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (id: string, status: PlatformTenant['status']) => {
    setUpdatingId(id);
    try {
      await platformService.updateStatus(id, status);
      toast.success(`Status atualizado para ${status}`);
      // Recarrega a lista mantendo as métricas consistentes
      const data = await platformService.getAll();
      setTenants(data.tenants);
      setMetrics(data.metrics);
    } catch (error) {
      toast.error('Não foi possível alterar o status. Tente novamente.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Visão Geral da Plataforma</h1>
          <p className="text-sm text-slate-400">
            Gerencie todos os centros de treinamento (tenants) da plataforma SaaS
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Criar Centro
        </Button>
      </div>

      {/* Métricas */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando plataforma...</span>
        </div>
      ) : (
        metrics && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard icon={Building2} label="Total de Tenants" value={metrics.total} accent="bg-slate-700 text-white" />
            <MetricCard icon={Clock} label="Em Trial" value={metrics.trial} accent="bg-amber-500/20 text-amber-400" />
            <MetricCard icon={CheckCircle2} label="Ativos" value={metrics.active} accent="bg-emerald-500/20 text-emerald-400" />
            <MetricCard icon={AlertTriangle} label="Suspensos" value={metrics.suspended} accent="bg-red-500/20 text-red-400" />
            <MetricCard icon={DollarSign} label="Faturas do Mês" value={brl.format(metrics.invoicesMonth)} accent="bg-blue-500/20 text-blue-400" />
          </div>
        )
      )}

      {/* Tabela de tenants */}
      <TenantsTable
        tenants={tenants}
        loading={loading}
        updatingId={updatingId}
        onStatusChange={handleStatusChange}
      />

      {/* Dialog de criação */}
      <TenantCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />
    </div>
  );
}
