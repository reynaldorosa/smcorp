import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../../modules/payments/payments.service';

/**
 * Jobs agendados do SaaS (diários, 03:00):
 * - Expira trials vencidos (TRIAL → SUSPENDED)
 * - Suspende tenants cancelados (assinatura CANCELLED sem cancelAtPeriodEnd)
 * - Marca pagamentos vencidos (OVERDUE)
 */
@Injectable()
export class BillingJobsService {
  private readonly logger = new Logger(BillingJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'billing-daily-jobs' })
  async runDailyJobs() {
    this.logger.log('⏰ Iniciando jobs diários de billing...');

    const expiredTrials = await this.expireTrials();
    const suspendedCancelled = await this.suspendCancelledTenants();
    const overdue = await this.paymentsService.markOverduePayments();

    this.logger.log(
      `Jobs diários concluídos: ${expiredTrials} trials expirados, ` +
        `${suspendedCancelled} tenants cancelados suspensos, ${overdue.count} pagamentos vencidos`,
    );
  }

  /** Trials vencidos → tenant e assinatura SUSPENDED (período sem pagamento) */
  private async expireTrials(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.tenant.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: now },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    await this.prisma.tenant.updateMany({
      where: { id: { in: expired.map((t) => t.id) } },
      data: { status: 'SUSPENDED' },
    });

    // Consistência: o período do plano acabou sem pagamento — a assinatura
    // acompanha o tenant (SUSPENDED). O pagamento automático (fase futura)
    // reativa o período via webhook do MP (subscription_authorized_payment).
    await this.prisma.subscription.updateMany({
      where: { tenantId: { in: expired.map((t) => t.id) } },
      data: { status: 'SUSPENDED' },
    });

    this.logger.warn(`${expired.length} tenant(s) com trial expirado → SUSPENDED`);
    return expired.length;
  }

  /** Assinatura cancelada (sem cancelAtPeriodEnd) → tenant CANCELLED */
  private async suspendCancelledTenants(): Promise<number> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['CANCELLED', 'SUSPENDED'] },
        cancelAtPeriodEnd: false,
      },
      select: { tenantId: true },
    });

    if (subscriptions.length === 0) return 0;

    await this.prisma.tenant.updateMany({
      where: {
        id: { in: subscriptions.map((s) => s.tenantId) },
        status: { notIn: ['CANCELLED', 'SUSPENDED'] },
        deletedAt: null,
      },
      data: { status: 'CANCELLED' },
    });

    return subscriptions.length;
  }
}
