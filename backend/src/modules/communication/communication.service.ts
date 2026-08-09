import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { UniqSuporteProvider } from './providers/uniq-suporte.provider';
import { SmtpEmailProvider, SmtpConfig } from './providers/smtp-email.provider';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email';

export interface SendResult {
  sent: boolean;
  channel: NotificationChannel;
  provider: string;
  messageId?: string | null;
  reason?: string;
}

/**
 * Orquestrador de comunicações do SaaS:
 * - WhatsApp/SMS → API Uniq Suporte (quando MESSAGING_API_KEY configurada)
 * - E-mail → SMTP do tenant (configurado na UI, criptografado) ou Uniq Suporte
 * - Registra cada tentativa em NotificationLog (rastreio de entrega)
 *
 * Nunca lança exceções — falhas de envio viram `sent: false` + log,
 * para não derrubar fluxos de negócio (o frontend faz fallback p/ deep-link).
 */
@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  private readonly sensitiveFields = ['bank', 'smtp', 'email', 'whatsapp'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly uniqSuporte: UniqSuporteProvider,
    private readonly smtpEmail: SmtpEmailProvider,
  ) {}

  /**
   * Configuração disponível para o frontend.
   * O `tenantId` é usado para resolver o SMTP do tenant (criptografado na UI):
   * o e-mail reporta `smtpConfigured` quando o tenant tem SMTP ativo, com
   * fallback para o provedor Uniq Suporte (configuração global).
   */
  async getStatus(tenantId?: string) {
    const uniqConfigured = this.uniqSuporte.isConfigured();
    // Sem tenant (plataforma/público) não há SMTP do tenant para reportar
    const smtpConfigured = Boolean(tenantId && (await this.getTenantSmtp(tenantId)));
    return {
      uniqSuporteConfigured: uniqConfigured,
      smtpConfigured,
      channels: {
        whatsapp: uniqConfigured,
        sms: uniqConfigured,
        // E-mail: SMTP do tenant tem precedência; Uniq Suporte é o fallback
        email: smtpConfigured || uniqConfigured,
      },
    };
  }

  /**
   * Envia uma mensagem pelo melhor provider disponível e registra no log.
   */
  async send(data: {
    tenantId?: string;
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    html?: string;
    text?: string;
    senderName?: string;
  }): Promise<SendResult> {
    const { tenantId, channel, recipient } = data;
    if (!recipient) {
      return { sent: false, channel, provider: 'none', reason: 'destinatário vazio' };
    }

    try {
      if (channel === 'email') {
        return await this.sendEmail(data);
      }
      return await this.sendViaUniqSuporte(channel, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Falha no envio (${channel} → ${recipient}): ${message}`);
      await this.logNotification({
        tenantId,
        channel,
        recipient,
        subject: data.subject,
        message: data.text || data.html,
        provider: 'none',
        status: 'FAILED',
        error: message,
      });
      return { sent: false, channel, provider: 'none', reason: message };
    }
  }

  private async sendEmail(data: {
    tenantId?: string;
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    html?: string;
    text?: string;
    senderName?: string;
  }): Promise<SendResult> {
    const subject = data.subject || 'Caiso';
    const html = data.html || this.escapeToHtml(data.text || '');

    // 1) SMTP do tenant (configurado na UI)
    if (data.tenantId) {
      const smtp = await this.getTenantSmtp(data.tenantId);
      if (smtp && smtp.host && smtp.port) {
        try {
          const result = await this.smtpEmail.send({
            to: data.recipient,
            subject,
            html,
            smtp,
          });
          await this.logNotification({
            tenantId: data.tenantId,
            channel: 'email',
            recipient: data.recipient,
            subject,
            message: html,
            provider: 'smtp',
            status: 'SENT',
            messageId: result.messageId || undefined,
          });
          return { sent: true, channel: 'email', provider: 'smtp', messageId: result.messageId };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`SMTP do tenant falhou, tentando Uniq Suporte: ${message}`);
        }
      }
    }

    // 2) Fallback: API Uniq Suporte
    if (this.uniqSuporte.isConfigured()) {
      const result = await this.uniqSuporte.sendEmail({
        to: data.recipient,
        subject,
        html,
        senderName: data.senderName,
      });
      await this.logNotification({
        tenantId: data.tenantId,
        channel: 'email',
        recipient: data.recipient,
        subject,
        message: html,
        provider: 'uniqsuporte',
        status: 'PENDING',
        messageId: result.messageId || undefined,
      });
      return { sent: true, channel: 'email', provider: 'uniqsuporte', messageId: result.messageId };
    }

    await this.logNotification({
      tenantId: data.tenantId,
      channel: 'email',
      recipient: data.recipient,
      subject,
      message: html,
      provider: 'none',
      status: 'FAILED',
      error: 'nenhum provider de e-mail configurado',
    });
    return { sent: false, channel: 'email', provider: 'none', reason: 'provider_unconfigured' };
  }

  private async sendViaUniqSuporte(
    channel: 'whatsapp' | 'sms',
    data: {
      tenantId?: string;
      recipient: string;
      subject?: string;
      html?: string;
      text?: string;
    },
  ): Promise<SendResult> {
    if (!this.uniqSuporte.isConfigured()) {
      await this.logNotification({
        tenantId: data.tenantId,
        channel,
        recipient: data.recipient,
        message: data.text,
        provider: 'none',
        status: 'FAILED',
        error: 'provider não configurado',
      });
      return { sent: false, channel, provider: 'none', reason: 'provider_unconfigured' };
    }

    const message = data.text || data.html || data.subject || '';
    const result =
      channel === 'whatsapp'
        ? await this.uniqSuporte.sendWhatsApp({ to: data.recipient, message })
        : await this.uniqSuporte.sendSms({ to: data.recipient, message });

    await this.logNotification({
      tenantId: data.tenantId,
      channel,
      recipient: data.recipient,
      message,
      provider: 'uniqsuporte',
      status: 'PENDING',
      messageId: result.messageId || undefined,
    });

    return { sent: true, channel, provider: 'uniqsuporte', messageId: result.messageId };
  }

  /**
   * Resolve a configuração SMTP do tenant (primeira CompanySettings ativa)
   * — é onde a UI de Configurações grava (criptografado).
   */
  private async getTenantSmtp(tenantId: string): Promise<SmtpConfig | null> {
    const settings = await this.prisma.companySettings.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { settings: true },
    });

    if (!settings) return null;

    const decrypted = this.decryptSettings(settings.settings);
    const smtp = decrypted.smtp as SmtpConfig | undefined;

    if (!smtp || smtp.active !== true || !smtp.host) {
      return null;
    }
    return smtp;
  }

  private decryptSettings(settings: unknown): Record<string, unknown> {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }
    const decrypted: Record<string, unknown> = { ...(settings as Record<string, unknown>) };
    for (const field of this.sensitiveFields) {
      const value = decrypted[field];
      if (typeof value === 'string') {
        try {
          decrypted[field] = this.encryptionService.decrypt(value);
        } catch {
          // dado não criptografado (legado)
        }
      }
    }
    return decrypted;
  }

  private async logNotification(data: {
    tenantId?: string;
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    message?: string;
    provider: string;
    status: string;
    messageId?: string;
    error?: string;
  }) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          tenantId: data.tenantId || null,
          channel: data.channel,
          recipient: data.recipient,
          subject: data.subject || null,
          message: data.message ? String(data.message).slice(0, 2000) : null,
          provider: data.provider,
          providerMessageId: data.messageId || null,
          status: data.status,
          error: data.error ? String(data.error).slice(0, 500) : null,
        },
      });
    } catch (error) {
      // O log de notificação nunca deve quebrar o envio
      this.logger.error(
        'Falha ao gravar NotificationLog',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private escapeToHtml(text: string): string {
    return `<p>${text.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`;
  }

  // ============================================
  // POLLING DE STATUS DE ENTREGA (Uniq Suporte)
  // ============================================

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'messaging-delivery-poll' })
  async pollDeliveryStatuses() {
    const pending = await this.prisma.notificationLog.findMany({
      where: {
        provider: 'uniqsuporte',
        providerMessageId: { not: null },
        status: { in: ['PENDING', 'SENT'] },
      },
      take: 50,
      select: { id: true, channel: true, providerMessageId: true },
    });

    if (pending.length === 0) return;

    let updated = 0;
    for (const log of pending) {
      const status = await this.uniqSuporte.getDeliveryStatus(
        log.channel as 'email' | 'whatsapp' | 'sms',
        log.providerMessageId!,
      );
      if (!status) continue;

      if (status === 'delivered') {
        await this.prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'DELIVERED' },
        });
        updated++;
      } else if (status === 'fail') {
        await this.prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'FAILED', error: 'status "fail" reportado pelo provedor' },
        });
        updated++;
      }
    }

    if (updated > 0) {
      this.logger.log(`Polling de entrega: ${updated}/${pending.length} notificações atualizadas`);
    }
  }
}
