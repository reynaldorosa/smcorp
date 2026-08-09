'use client';

import { useEffect, useState } from 'react';
import { Loader2, CreditCard, CheckCircle2, XCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { tenantsService, type BillingInfo } from '@/services/tenants.service';
import { formatCurrency } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  TRIAL: { label: 'Trial', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Ativa', color: 'bg-green-100 text-green-700' },
  PAST_DUE: { label: 'Pagamento atrasado', color: 'bg-yellow-100 text-yellow-700' },
  SUSPENDED: { label: 'Suspensa', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700' },
};

/**
 * Painel de billing do tenant: status da assinatura, ativação
 * (preço customizado por tenant via Mercado Pago) e faturas.
 */
export function BillingCard() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [price, setPrice] = useState('');
  const [planName, setPlanName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantsService.getBilling();
      setBilling(data);
      if (data.subscription && Number(data.subscription.price) > 0) {
        setPrice(String(data.subscription.price));
      }
    } catch (error) {
      console.error('Falha ao carregar billing:', error);
      toast.error('Não foi possível carregar as informações da assinatura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubscribe = async () => {
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (!parsedPrice || parsedPrice <= 0) {
      toast.error('Informe um valor mensal válido para a assinatura');
      return;
    }
    setSubscribing(true);
    try {
      const result = await tenantsService.subscribe({
        price: parsedPrice,
        planName: planName.trim() || undefined,
      });
      toast.success('Assinatura criada! Finalize o pagamento no Mercado Pago.');
      if (result.initPoint) {
        window.open(result.initPoint, '_blank', 'noopener,noreferrer');
      }
      await load();
    } catch (error) {
      console.error('Falha ao ativar assinatura:', error);
      const message =
        error instanceof Error && error.message ? error.message : 'Erro ao ativar assinatura';
      toast.error(message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancelar a assinatura ao final do período atual?')) return;
    try {
      await tenantsService.cancelBilling();
      toast.success('Assinatura será cancelada ao final do período');
      await load();
    } catch (error) {
      console.error('Falha ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando assinatura...
        </CardContent>
      </Card>
    );
  }

  if (!billing) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Não foi possível carregar as informações da assinatura.
        </CardContent>
      </Card>
    );
  }

  const sub = billing.subscription;
  const statusCfg = STATUS_LABEL[sub?.status || billing.status] || STATUS_LABEL.TRIAL;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Assinatura do Centro
        </CardTitle>
        <CardDescription>
          Status do plano SaaS e cobranças mensais (Mercado Pago)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{sub?.planName || 'Plano Caiso'}</p>
            <p className="text-sm text-gray-500">
              {sub ? formatCurrency(Number(sub.price)) : 'Sem assinatura ativa'}
            </p>
          </div>
          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        </div>

        {sub?.status === 'TRIAL' && billing.trialEndsAt && (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarClock className="h-4 w-4" />
            Período do plano:{' '}
            {sub.currentPeriodStart
              ? `${new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR')} → `
              : ''}
            {new Date(billing.trialEndsAt).toLocaleDateString('pt-BR')}
            <span className="text-xs text-gray-400">(teste)</span>
          </p>
        )}

        {sub?.status === 'ACTIVE' && sub.currentPeriodEnd && (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Período:{' '}
            {sub.currentPeriodStart
              ? `${new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR')} → `
              : ''}
            {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')} · Próxima cobrança em{' '}
            {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
            {sub.cancelAtPeriodEnd && ' (cancelamento agendado)'}
          </p>
        )}

        {sub?.status === 'SUSPENDED' || billing.status === 'SUSPENDED' ? (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="h-4 w-4" />
            Assinatura inativa — reative para liberar o acesso do centro.
          </p>
        ) : null}

        {!billing.paymentGatewayConfigured && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
            Gateway de pagamento não configurado (MERCADO_PAGO_ACCESS_TOKEN ausente). A ativação
            estará disponível quando o administrador configurar.
          </p>
        )}

        {(!sub || sub.status === 'TRIAL' || sub.status === 'SUSPENDED' || sub.status === 'CANCELLED') && (
          <div className="space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="billing-plan">Nome do plano</Label>
                <Input
                  id="billing-plan"
                  placeholder="Ex: Plano Profissional"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="billing-price">Valor mensal (R$)</Label>
                <Input
                  id="billing-price"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 199.90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => void handleSubscribe()}
              disabled={subscribing || !billing.paymentGatewayConfigured}
              className="w-full"
            >
              {subscribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ativando...
                </>
              ) : (
                'Ativar assinatura (Mercado Pago)'
              )}
            </Button>
          </div>
        )}

        {sub?.status === 'ACTIVE' && !sub.cancelAtPeriodEnd && (
          <div className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => void handleCancel()}>
              Cancelar assinatura
            </Button>
          </div>
        )}

        {billing.invoices.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Faturas recentes</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {billing.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-100"
                >
                  <div>
                    <p className="text-gray-700">{invoice.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(invoice.amount))}</p>
                    <Badge
                      className={
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {invoice.status === 'PAID' ? 'Pago' : invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
