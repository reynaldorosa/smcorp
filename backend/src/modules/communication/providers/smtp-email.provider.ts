import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  from?: string;
  fromName?: string;
  useSsl?: boolean;
  active?: boolean;
}

/**
 * Envio de e-mail via SMTP (Nodemailer) usando a configuração
 * armazenada nas CompanySettings do tenant (criptografada).
 */
@Injectable()
export class SmtpEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);

  async send(data: {
    to: string;
    subject: string;
    html: string;
    smtp: SmtpConfig;
  }): Promise<{ messageId: string | null }> {
    const { smtp } = data;

    if (!smtp.host || !smtp.port) {
      throw new Error('SMTP sem host/porta configurados');
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: smtp.useSsl === true,
      ...(smtp.user ? { auth: { user: smtp.user, pass: smtp.password || '' } } : {}),
    });

    const fromName = smtp.fromName || 'Caiso';
    const fromEmail = smtp.from || 'noreply@caiso.com.br';

    try {
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      return { messageId: info.messageId || null };
    } finally {
      transporter.close();
    }
  }
}
