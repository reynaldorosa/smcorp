import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoConfig, Customer, PreApproval, Payment } from 'mercadopago';

/**
 * Wrapper do SDK do Mercado Pago (conta central da plataforma).
 *
 * Sem MERCADO_PAGO_ACCESS_TOKEN configurado, o serviço fica "não configurado"
 * e as operações lançam 503 — o restante do sistema funciona normalmente
 * (modo dev/sem billing).
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  private readonly config: MercadoPagoConfig | null;
  private readonly webhookSecret?: string;
  private readonly webhookUrl?: string;

  private customerClient: Customer | null = null;
  private preApprovalClient: PreApproval | null = null;
  private paymentClient: Payment | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    this.webhookSecret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
    this.webhookUrl = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_URL');

    if (accessToken) {
      this.config = new MercadoPagoConfig({ accessToken });
      this.customerClient = new Customer(this.config);
      this.preApprovalClient = new PreApproval(this.config);
      this.paymentClient = new Payment(this.config);
      this.logger.log('Mercado Pago configurado (conta da plataforma)');
    } else {
      this.config = null;
      this.logger.warn(
        'MERCADO_PAGO_ACCESS_TOKEN ausente — billing/pagamentos online desativados (503).',
      );
    }
  }

  /** true se o SDK está configurado com token */
  isConfigured(): boolean {
    return this.config !== null;
  }

  private assertConfigured() {
    if (!this.config || !this.customerClient || !this.preApprovalClient || !this.paymentClient) {
      throw new ServiceUnavailableException(
        'Pagamentos online não configurados. Informe MERCADO_PAGO_ACCESS_TOKEN.',
      );
    }
  }

  /**
   * Cria um pagamento PIX único (checkout de matrícula).
   * @returns QR code (copia-e-cola + base64 para exibição) e id do pagamento no MP
   */
  async createPixPayment(data: {
    amount: number;
    payerEmail: string;
    externalReference: string;
    description: string;
  }) {
    this.assertConfigured();
    const paymentClient = this.paymentClient!;

    const result = await paymentClient.create({
      body: {
        transaction_amount: Number(data.amount.toFixed(2)),
        description: data.description,
        payment_method_id: 'pix',
        payer: { email: data.payerEmail },
        external_reference: data.externalReference,
        notification_url: this.getWebhookUrl(),
      },
    });

    const transactionData = (result as any).point_of_interaction?.transaction_data || {};

    return {
      providerPaymentId: String(result.id),
      qrCode: transactionData.qr_code || null,
      qrCodeBase64: transactionData.qr_code_base64 || null,
      status: result.status,
      createdAt: result.date_created,
    };
  }

  /** Consulta um pagamento no MP pelo id */
  async getPayment(providerPaymentId: string) {
    this.assertConfigured();
    return this.paymentClient!.get({ id: providerPaymentId });
  }

  /**
   * Cria assinatura recorrente (preapproval) para o tenant.
   * @returns link de pagamento (init_point) para o admin completar a adesão
   */
  async createSubscription(data: {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    price: number;
    planName: string;
  }) {
    this.assertConfigured();

    const result = await this.preApprovalClient!.create({
      body: {
        reason: `${data.planName} — ${data.tenantName}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(data.price.toFixed(2)),
          currency_id: 'BRL',
        },
        payer_email: data.adminEmail,
        external_reference: data.tenantId,
        back_url: this.getBackUrl(),
        // notification_url não está tipado no SDK 3.x — o MP aceita na API
        notification_url: this.getWebhookUrl(),
      } as any,
    });

    return {
      providerSubscriptionId: String(result.id),
      initPoint: result.init_point || null,
      status: result.status,
    };
  }

  /** Consulta a preapproval (status atual no MP) */
  async getSubscription(providerSubscriptionId: string) {
    this.assertConfigured();
    return this.preApprovalClient!.get({ id: providerSubscriptionId });
  }

  /** Cancela a preapproval no MP */
  async cancelSubscription(providerSubscriptionId: string) {
    this.assertConfigured();
    return this.preApprovalClient!.update({
      id: providerSubscriptionId,
      body: { status: 'cancelled' },
    });
  }

  /**
   * Verifica a assinatura HMAC do webhook (header x-signature).
   * Formato MP: ts=...,v1=... — manifest: "id:{dataId};request-id:{xRequestId};ts:{ts};"
   */
  verifyWebhookSignature(data: {
    signatureHeader: string | undefined;
    xRequestId: string | undefined;
    dataId: string;
    ts: string;
  }): boolean {
    const { signatureHeader, xRequestId, dataId, ts } = data;

    if (!this.webhookSecret) {
      return false;
    }
    if (!signatureHeader) {
      return false;
    }

    const parts = signatureHeader.split(',');
    let v1 = '';
    for (const part of parts) {
      const [key, value] = part.split('=');
      // Header malformado (segmento sem '=') não pode derrubar o handler
      if (!value) continue;
      if (key.trim() === 'v1') v1 = value.trim();
    }
    if (!v1) {
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
    const expected = createHmac('sha256', this.webhookSecret).update(manifest).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  private getWebhookUrl(): string {
    if (this.webhookUrl) return this.webhookUrl;
    const appUrl = this.configService.get<string>('APP_URL') || 'https://caiso.com.br';
    return `${appUrl.replace(/\/$/, '')}/api/v1/webhooks/mercadopago`;
  }

  private getBackUrl(): string {
    const appUrl = this.configService.get<string>('APP_URL') || 'https://caiso.com.br';
    return `${appUrl.replace(/\/$/, '')}/settings/billing`;
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Processa um evento recebido no webhook do Mercado Pago.
   * Verifica a assinatura quando o secret está configurado.
   */
  async handleWebhookEvent(data: {
    action: string;
    type?: string;
    dataId: string;
    ts: string;
    signatureHeader?: string;
    xRequestId?: string;
  }): Promise<{ handled: boolean; detail: string }> {
    const { action, dataId, ts, signatureHeader, xRequestId } = data;

    // Política de segurança do webhook:
    // - Secret configurado → verificação HMAC obrigatória + frescor do ts (anti-replay)
    // - Sem secret → rejeita em QUALQUER ambiente que não seja development
    //   (staging/homologação expostos não podem aceitar eventos forjados)
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    if (this.webhookSecret) {
      const valid = this.verifyWebhookSignature({
        signatureHeader,
        xRequestId,
        dataId,
        ts,
      });
      if (!valid) {
        this.logger.warn(`Webhook MP rejeitado: assinatura inválida (evento ${action})`);
        throw new Error('Assinatura do webhook inválida');
      }

      // Anti-replay: o `ts` do header x-signature só pode ter até 5 min
      const tsMs = Number(ts) * 1000;
      if (!tsMs || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
        this.logger.warn(`Webhook MP rejeitado: ts fora da janela (evento ${action})`);
        throw new Error('ts do webhook expirado');
      }
    } else if (isProduction || this.configService.get<string>('NODE_ENV') !== 'development') {
      this.logger.error('Webhook MP rejeitado: MERCADO_PAGO_WEBHOOK_SECRET não configurado');
      throw new Error('Webhook não configurado');
    }

    if (action.startsWith('payment')) {
      return this.handlePaymentEvent(dataId);
    }
    if (action.startsWith('subscription_preapproval')) {
      return this.handleSubscriptionPreapprovalEvent(dataId);
    }
    if (action.startsWith('subscription_authorized_payment')) {
      return this.handleSubscriptionAuthorizedPaymentEvent(dataId);
    }

    this.logger.log(`Webhook MP: evento "${action}" ignorado (sem handler)`);
    return { handled: false, detail: `evento ${action} ignorado` };
  }

  /** payment.* — pagamento único (matrícula): aprova/rejeita o Payment interno */
  private async handlePaymentEvent(providerPaymentId: string) {
    const mpPayment = await this.getPayment(providerPaymentId);

    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [{ transactionId: String(mpPayment.id) }, { id: mpPayment.external_reference || '' }],
        deletedAt: null,
      },
    });

    if (!payment) {
      this.logger.warn(
        `Webhook MP: pagamento ${providerPaymentId} sem Payment interno correspondente`,
      );
      return { handled: false, detail: 'Payment interno não encontrado' };
    }

    if (mpPayment.status === 'approved' && payment.status !== 'PAID') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : new Date(),
          transactionId: String(mpPayment.id),
        },
      });
      this.logger.log(`Webhook MP: pagamento ${payment.id} aprovado`);

      // Se a matrícula ficou 100% paga, avança para CONFIRMED
      if (payment.enrollmentId) {
        await this.tryConfirmEnrollment(payment.enrollmentId);
      }
      return { handled: true, detail: `pagamento ${payment.id} marcado como pago` };
    }

    if (
      ['cancelled', 'rejected'].includes(mpPayment.status || '') &&
      payment.status === 'PENDING'
    ) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' },
      });
      return { handled: true, detail: `pagamento ${payment.id} cancelado` };
    }

    return { handled: false, detail: `status MP "${mpPayment.status}" sem ação` };
  }

  /** subscription_preapproval.* — ciclo de vida da assinatura */
  private async handleSubscriptionPreapprovalEvent(providerSubscriptionId: string) {
    const mpPreApproval = await this.getSubscription(providerSubscriptionId);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        OR: [
          { providerSubscriptionId: String(mpPreApproval.id) },
          { tenantId: mpPreApproval.external_reference || '' },
        ],
      },
    });

    if (!subscription) {
      this.logger.warn(
        `Webhook MP: preapproval ${providerSubscriptionId} sem Subscription interna`,
      );
      return { handled: false, detail: 'Subscription interna não encontrada' };
    }

    const statusMap: Record<string, { subscription: string; tenant: string }> = {
      authorized: { subscription: 'ACTIVE', tenant: 'ACTIVE' },
      pending: { subscription: 'TRIAL', tenant: 'TRIAL' },
      paused: { subscription: 'SUSPENDED', tenant: 'SUSPENDED' },
      cancelled: { subscription: 'CANCELLED', tenant: 'CANCELLED' },
    };

    const mapped = statusMap[mpPreApproval.status || ''];
    if (!mapped) {
      return { handled: false, detail: `status MP "${mpPreApproval.status}" sem mapeamento` };
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: mapped.subscription as any,
          providerSubscriptionId: String(mpPreApproval.id),
          ...(mapped.subscription === 'ACTIVE'
            ? { currentPeriodStart: subscription.currentPeriodStart || now }
            : {}),
        },
      }),
      this.prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: { status: mapped.tenant as any },
      }),
    ]);

    this.logger.log(
      `Webhook MP: assinatura do tenant ${subscription.tenantId} → ${mapped.subscription}`,
    );
    return { handled: true, detail: `assinatura → ${mapped.subscription}` };
  }

  /** subscription_authorized_payment.* — cobrança mensal efetivada */
  private async handleSubscriptionAuthorizedPaymentEvent(providerPaymentId: string) {
    const mpPayment = await this.getPayment(providerPaymentId);
    const tenantId = mpPayment.external_reference;

    if (!tenantId) {
      return { handled: false, detail: 'cobrança sem external_reference (tenant)' };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return { handled: false, detail: 'Subscription não encontrada para o tenant' };
    }

    if (mpPayment.status === 'approved') {
      const currentPeriodEnd = subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd)
        : new Date();
      const nextPeriodEnd = new Date(currentPeriodEnd);
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      const amount = Number(mpPayment.transaction_amount || subscription.price || 0);

      await this.prisma.$transaction([
        this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: currentPeriodEnd,
            currentPeriodEnd: nextPeriodEnd,
          },
        }),
        this.prisma.tenant.update({
          where: { id: tenantId },
          data: { status: 'ACTIVE' },
        }),
        // Fatura mensal da assinatura (histórico exibido no painel de billing)
        this.prisma.payment.create({
          data: {
            enrollmentId: null,
            companyId: null,
            tenantId,
            kind: 'SUBSCRIPTION_FEE',
            type: 'INCOME',
            category: 'OTHER',
            amount,
            dueDate: currentPeriodEnd,
            paidAt: mpPayment.date_approved ? new Date(mpPayment.date_approved) : new Date(),
            status: 'PAID',
            paymentMethod: 'PIX',
            transactionId: String(mpPayment.id),
            description: `Assinatura mensal — ${subscription.planName || 'Plano'}`,
            notes: 'Cobrança recorrente Mercado Pago',
          },
        }),
      ]);
      this.logger.log(`Webhook MP: mensalidade do tenant ${tenantId} confirmada`);
      return { handled: true, detail: 'mensalidade confirmada' };
    }

    return { handled: false, detail: `cobrança MP "${mpPayment.status}" sem ação` };
  }

  /** Confirma a matrícula quando todos os pagamentos vinculados estão pagos */
  private async tryConfirmEnrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, status: true, documentsStatus: true },
    });
    if (!enrollment || enrollment.status === 'CANCELLED') return;

    const pendingPayments = await this.prisma.payment.count({
      where: {
        enrollmentId,
        deletedAt: null,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
    });

    if (pendingPayments === 0 && enrollment.status === 'SCHEDULED') {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'CONFIRMED' },
      });
      this.logger.log(`Matrícula ${enrollmentId} confirmada automaticamente (pagamento)`);
    }
  }
}
