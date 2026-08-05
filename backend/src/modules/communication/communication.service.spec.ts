import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { UniqSuporteProvider } from './providers/uniq-suporte.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { CommunicationService } from './communication.service';

describe('CommunicationService', () => {
  const mockPrismaService = {
    notificationLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    companySettings: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  const mockEncryptionService = {
    decrypt: jest.fn((v: unknown) => v),
  };

  const mockUniqSuporte = {
    isConfigured: jest.fn(() => true),
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'email-1', providerStatus: 'pending' }),
    sendWhatsApp: jest.fn().mockResolvedValue({ messageId: 'wa-1', providerStatus: 'pending' }),
    sendSms: jest.fn().mockResolvedValue({ messageId: 'sms-1', providerStatus: 'pending' }),
    getDeliveryStatus: jest.fn().mockResolvedValue('delivered'),
  };

  const mockSmtpEmail = {
    send: jest.fn().mockResolvedValue({ messageId: 'smtp-1' }),
  };

  const makeModule = async (overrides: Record<string, string> = {}) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        { provide: ConfigService, useValue: { get: (k: string) => overrides[k] } },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: UniqSuporteProvider, useValue: mockUniqSuporte },
        { provide: SmtpEmailProvider, useValue: mockSmtpEmail },
      ],
    }).compile();

    return module.get<CommunicationService>(CommunicationService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('whatsapp', () => {
    it('envia via Uniq Suporte e grava log PENDING', async () => {
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      const result = await service.send({
        tenantId: 't1',
        channel: 'whatsapp',
        recipient: '5511999999999',
        text: 'Olá!',
      });

      expect(result.sent).toBe(true);
      expect(result.provider).toBe('uniqsuporte');
      expect(mockUniqSuporte.sendWhatsApp).toHaveBeenCalledWith({
        to: '5511999999999',
        message: 'Olá!',
      });
      expect(mockPrismaService.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: 'whatsapp',
            provider: 'uniqsuporte',
            status: 'PENDING',
            tenantId: 't1',
          }),
        }),
      );
    });

    it('sem chave configurada → sent:false + log FAILED (sem lançar)', async () => {
      mockUniqSuporte.isConfigured.mockReturnValueOnce(false);
      const service = await makeModule();

      const result = await service.send({
        channel: 'whatsapp',
        recipient: '5511999999999',
        text: 'Olá!',
      });

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('provider_unconfigured');
      expect(mockPrismaService.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });
  });

  describe('email', () => {
    it('prioriza SMTP do tenant quando ativo', async () => {
      mockPrismaService.companySettings.findFirst.mockResolvedValue({
        settings: { smtp: { active: true, host: 'smtp.exemplo.com', port: 587 } },
      });
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      const result = await service.send({
        tenantId: 't1',
        channel: 'email',
        recipient: 'aluno@exemplo.com',
        subject: 'Assunto',
        html: '<p>Corpo</p>',
      });

      expect(result.sent).toBe(true);
      expect(result.provider).toBe('smtp');
      expect(mockSmtpEmail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          smtp: expect.objectContaining({ host: 'smtp.exemplo.com' }),
        }),
      );
    });

    it('faz fallback para Uniq Suporte quando o SMTP do tenant falha', async () => {
      mockPrismaService.companySettings.findFirst.mockResolvedValue({
        settings: { smtp: { active: true, host: 'smtp.exemplo.com', port: 587 } },
      });
      mockSmtpEmail.send.mockRejectedValueOnce(new Error('connection refused'));
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      const result = await service.send({
        tenantId: 't1',
        channel: 'email',
        recipient: 'aluno@exemplo.com',
        subject: 'Assunto',
        html: '<p>Corpo</p>',
      });

      expect(result.sent).toBe(true);
      expect(result.provider).toBe('uniqsuporte');
      expect(mockUniqSuporte.sendEmail).toHaveBeenCalled();
    });
  });

  describe('getDeliveryStatus polling', () => {
    it('atualiza log para DELIVERED quando o provedor confirma', async () => {
      mockPrismaService.notificationLog.findMany.mockResolvedValue([
        { id: 'log-1', channel: 'whatsapp', providerMessageId: 'wa-1' },
      ]);
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      await service.pollDeliveryStatuses();

      expect(mockPrismaService.notificationLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'log-1' },
          data: expect.objectContaining({ status: 'DELIVERED' }),
        }),
      );
    });
  });

  describe('getStatus', () => {
    it('reporta e-mail com fallback Uniq Suporte quando o tenant não tem SMTP', async () => {
      mockPrismaService.companySettings.findFirst.mockResolvedValue(null);
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      const status = await service.getStatus('t1');

      expect(status.uniqSuporteConfigured).toBe(true);
      expect(status.smtpConfigured).toBe(false);
      expect(status.channels).toEqual({ whatsapp: true, sms: true, email: true });
      // Consultou o SMTP do tenant
      expect(mockPrismaService.companySettings.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }),
      );
    });

    it('reporta SMTP do tenant com precedência sobre a Uniq Suporte', async () => {
      mockPrismaService.companySettings.findFirst.mockResolvedValue({
        settings: {
          smtp: { host: 'smtp.tenant.com.br', port: 587, user: 'x', active: true },
        },
      });
      const service = await makeModule({ MESSAGING_API_KEY: 'chave' });

      const status = await service.getStatus('t1');

      expect(status.smtpConfigured).toBe(true);
      expect(status.channels.email).toBe(true);
    });

    it('e-mail fica indisponível quando nem SMTP nem Uniq Suporte existem', async () => {
      mockPrismaService.companySettings.findFirst.mockResolvedValue(null);
      (mockUniqSuporte.isConfigured as jest.Mock).mockReturnValue(false);
      const service = await makeModule({}); // sem MESSAGING_API_KEY

      const status = await service.getStatus('t1');

      expect(status.channels.email).toBe(false);
      expect(status.uniqSuporteConfigured).toBe(false);
    });
  });
});
