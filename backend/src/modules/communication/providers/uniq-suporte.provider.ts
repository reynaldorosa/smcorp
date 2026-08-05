import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UniqSuporteSendResult {
  messageId: string | null;
  providerStatus: string | null;
}

/**
 * Cliente da API de comunicação da Uniq Suporte (connect.uniqsuporte.com.br).
 *
 * Contrato (documentado pelo provedor):
 * - Auth: header `Api-key: {MESSAGING_API_KEY}`
 * - POST /api/email/send    { contact: [{ email, subject, message, sender_name? }] }
 * - POST /api/whatsapp/send { contact: [{ number, message }] }
 * - POST /api/sms/send      { contact: [{ number, message }] }
 * - GET  /api/get/{channel}/{message_id} → status (pending|processing|delivered|schedule|fail)
 * - Resposta: { status: "success", data: { id, status } }
 */
@Injectable()
export class UniqSuporteProvider {
  private readonly logger = new Logger(UniqSuporteProvider.name);

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly apiKeyHeader: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('MESSAGING_API_URL') || 'https://connect.uniqsuporte.com.br'
    ).replace(/\/$/, '');
    this.apiKey = this.configService.get<string>('MESSAGING_API_KEY');
    this.apiKeyHeader = this.configService.get<string>('MESSAGING_API_KEY_HEADER') || 'Api-key';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      h[this.apiKeyHeader] = this.apiKey;
    }
    return h;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('MESSAGING_API_KEY não configurada');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // corpo não-JSON
    }

    if (!response.ok || json?.status !== 'success') {
      const message =
        json?.message || (response.status === 401 ? 'API key inválida' : `HTTP ${response.status}`);
      throw new Error(`UniqSuporte ${path}: ${message}`);
    }

    return json as T;
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    senderName?: string;
  }): Promise<UniqSuporteSendResult> {
    const result = await this.post<{
      status: string;
      data?: { id?: number | string; status?: string };
    }>('/api/email/send', {
      contact: [
        {
          email: data.to,
          subject: data.subject,
          message: data.html,
          ...(data.senderName ? { sender_name: data.senderName } : {}),
        },
      ],
    });

    return {
      messageId: result.data?.id != null ? String(result.data.id) : null,
      providerStatus: result.data?.status || null,
    };
  }

  async sendWhatsApp(data: { to: string; message: string }): Promise<UniqSuporteSendResult> {
    const result = await this.post<{
      status: string;
      data?: { id?: number | string; status?: string };
    }>('/api/whatsapp/send', {
      contact: [{ number: data.to, message: data.message }],
    });

    return {
      messageId: result.data?.id != null ? String(result.data.id) : null,
      providerStatus: result.data?.status || null,
    };
  }

  async sendSms(data: { to: string; message: string }): Promise<UniqSuporteSendResult> {
    const result = await this.post<{
      status: string;
      data?: { id?: number | string; status?: string };
    }>('/api/sms/send', {
      contact: [{ number: data.to, message: data.message }],
    });

    return {
      messageId: result.data?.id != null ? String(result.data.id) : null,
      providerStatus: result.data?.status || null,
    };
  }

  /**
   * Consulta o status de entrega (pending|processing|delivered|schedule|fail)
   */
  async getDeliveryStatus(
    channel: 'email' | 'whatsapp' | 'sms',
    messageId: string,
  ): Promise<string | null> {
    if (!this.isConfigured()) return null;

    const response = await fetch(`${this.baseUrl}/api/get/${channel}/${messageId}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      this.logger.warn(
        `Falha ao consultar status ${channel}/${messageId}: HTTP ${response.status}`,
      );
      return null;
    }

    try {
      const json = await response.json();
      return json?.data?.status || json?.status || null;
    } catch {
      return null;
    }
  }
}
