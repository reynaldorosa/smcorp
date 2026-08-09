import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';

describe('MercadoPagoService', () => {
  const mockPrismaService = {
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const makeConfigMock = (overrides: Record<string, string | undefined> = {}) => ({
    get: jest.fn((key: string) => overrides[key]),
  });

  describe('sem access token configurado', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          { provide: ConfigService, useValue: makeConfigMock() },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
    });

    it('isConfigured() = false', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('createPixPayment lança 503 (gateway não configurado)', async () => {
      await expect(
        service.createPixPayment({
          amount: 100,
          payerEmail: 'a@b.com',
          externalReference: 'p1',
          description: 'teste',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'segredo-teste';
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({
              MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste',
              MERCADO_PAGO_WEBHOOK_SECRET: secret,
            }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
    });

    it('aceita assinatura válida', () => {
      const dataId = '12345';
      const ts = String(Math.floor(Date.now() / 1000));
      const xRequestId = 'req-1';
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const v1 = createHmac('sha256', secret).update(manifest).digest('hex');

      const valid = service.verifyWebhookSignature({
        signatureHeader: `ts=${ts},v1=${v1}`,
        xRequestId,
        dataId,
        ts,
      });

      expect(valid).toBe(true);
    });

    it('rejeita assinatura adulterada', () => {
      const valid = service.verifyWebhookSignature({
        signatureHeader: 'ts=1700000000,v1=abcdef',
        xRequestId: 'req-1',
        dataId: '12345',
        ts: String(Math.floor(Date.now() / 1000)),
      });

      expect(valid).toBe(false);
    });

    it('rejeita header ausente', () => {
      expect(
        service.verifyWebhookSignature({
          signatureHeader: undefined,
          xRequestId: 'req-1',
          dataId: '12345',
          ts: String(Math.floor(Date.now() / 1000)),
        }),
      ).toBe(false);
    });
  });

  describe('handleWebhookEvent — payment aprovado', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({
              MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste',
              MERCADO_PAGO_WEBHOOK_SECRET: 'segredo',
              NODE_ENV: 'test',
            }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
      jest.clearAllMocks();
    });

    it('marca o Payment interno como PAID e confirma a matrícula', async () => {
      // Mock do client do SDK
      (service as any).paymentClient = {
        get: jest.fn().mockResolvedValue({
          id: 'mp-1',
          status: 'approved',
          external_reference: 'payment-interno-1',
          date_approved: '2026-08-01T12:00:00Z',
        }),
      };

      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'payment-interno-1',
        status: 'PENDING',
        enrollmentId: 'enr-1',
      });
      mockPrismaService.payment.update.mockResolvedValue({ id: 'payment-interno-1' });
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        status: 'SCHEDULED',
        documentsStatus: 'COMPLETE',
      });
      mockPrismaService.payment.count.mockResolvedValue(0);
      mockPrismaService.enrollment.update.mockResolvedValue({});

      // Assinatura HMAC válida (caminho completo de verificação)
      const dataId = 'mp-1';
      const ts = String(Math.floor(Date.now() / 1000));
      const xRequestId = 'req-abc';
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const v1 = createHmac('sha256', 'segredo').update(manifest).digest('hex');

      const result = await service.handleWebhookEvent({
        action: 'payment.created',
        dataId,
        ts,
        xRequestId,
        signatureHeader: `ts=${ts},v1=${v1}`,
      });

      expect(result.handled).toBe(true);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            transactionId: 'mp-1',
          }),
        }),
      );
      // Matrícula confirmada (sem pendências)
      expect(mockPrismaService.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('rejeita evento sem assinatura quando o secret está configurado', async () => {
      await expect(
        service.handleWebhookEvent({
          action: 'payment.created',
          dataId: 'mp-1',
          ts: String(Math.floor(Date.now() / 1000)),
          signatureHeader: undefined,
        }),
      ).rejects.toThrow('Assinatura do webhook inválida');
    });
  });

  describe('createPixPayment', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({ MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste' }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
      jest.clearAllMocks();
    });

    it('cria PIX e devolve QR code + providerPaymentId', async () => {
      (service as any).paymentClient = {
        create: jest.fn().mockResolvedValue({
          id: 999,
          status: 'pending',
          date_created: '2026-08-01T10:00:00Z',
          point_of_interaction: {
            transaction_data: {
              qr_code: '00020126580014br.gov.bcb.pix',
              qr_code_base64: 'aW1nLWJhc2U2NA==',
            },
          },
        }),
      };

      const result = await service.createPixPayment({
        amount: 150.5,
        payerEmail: 'aluno@exemplo.com',
        externalReference: 'payment-1',
        description: 'Curso NR-35',
      });

      expect(result.providerPaymentId).toBe('999');
      expect(result.qrCode).toContain('000201');
      expect(result.qrCodeBase64).toBe('aW1nLWJhc2U2NA==');
      expect((service as any).paymentClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            transaction_amount: 150.5,
            payment_method_id: 'pix',
            external_reference: 'payment-1',
          }),
        }),
      );
    });
  });

  describe('createSubscription / cancelSubscription', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({ MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste' }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
      jest.clearAllMocks();
    });

    it('cria preapproval mensal com external_reference = tenantId', async () => {
      (service as any).preApprovalClient = {
        create: jest
          .fn()
          .mockResolvedValue({ id: 555, init_point: 'https://mp.com/pay', status: 'pending' }),
        get: jest.fn(),
        update: jest.fn(),
      };

      const result = await service.createSubscription({
        tenantId: 'tenant-1',
        tenantName: 'Escola Teste',
        adminEmail: 'admin@escola.com',
        price: 199.9,
        planName: 'Plano Pro',
      });

      expect(result.providerSubscriptionId).toBe('555');
      expect(result.initPoint).toContain('mp.com');
      expect((service as any).preApprovalClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            external_reference: 'tenant-1',
            payer_email: 'admin@escola.com',
            auto_recurring: expect.objectContaining({
              frequency: 1,
              frequency_type: 'months',
              transaction_amount: 199.9,
            }),
          }),
        }),
      );
    });

    it('cancela preapproval via update(status=cancelled)', async () => {
      (service as any).preApprovalClient = {
        create: jest.fn(),
        get: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 555, status: 'cancelled' }),
      };

      await service.cancelSubscription('555');

      expect((service as any).preApprovalClient.update).toHaveBeenCalledWith({
        id: '555',
        body: { status: 'cancelled' },
      });
    });
  });

  describe('handleWebhookEvent — subscription', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({
              MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste',
              MERCADO_PAGO_WEBHOOK_SECRET: 'segredo',
              NODE_ENV: 'test',
            }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
      jest.clearAllMocks();
    });

    it('subscription_preapproval autorizada → assinatura e tenant ACTIVE', async () => {
      (service as any).preApprovalClient = {
        get: jest.fn().mockResolvedValue({
          id: 555,
          status: 'authorized',
          external_reference: 'tenant-1',
        }),
      };

      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        tenantId: 'tenant-1',
        currentPeriodStart: null,
      });
      mockPrismaService.subscription.update.mockResolvedValue({});
      mockPrismaService.tenant.update.mockResolvedValue({});

      const dataId = '555';
      const ts = String(Math.floor(Date.now() / 1000));
      const xRequestId = 'req-sub';
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const v1 = createHmac('sha256', 'segredo').update(manifest).digest('hex');

      const result = await service.handleWebhookEvent({
        action: 'subscription_preapproval.authorized',
        dataId,
        ts,
        xRequestId,
        signatureHeader: `ts=${ts},v1=${v1}`,
      });

      expect(result.handled).toBe(true);
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('subscription_authorized_payment aprovada → renova período + cria fatura', async () => {
      (service as any).paymentClient = {
        get: jest.fn().mockResolvedValue({
          id: 888,
          status: 'approved',
          external_reference: 'tenant-1',
          transaction_amount: 199.9,
          date_approved: '2026-08-01T12:00:00Z',
        }),
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        tenantId: 'tenant-1',
        planName: 'Plano Pro',
        price: 199.9,
        currentPeriodEnd: new Date('2026-09-01'),
      });
      mockPrismaService.subscription.update.mockResolvedValue({});
      mockPrismaService.tenant.update.mockResolvedValue({});
      mockPrismaService.payment.create.mockResolvedValue({});
      mockPrismaService.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

      const dataId = '888';
      const ts = String(Math.floor(Date.now() / 1000));
      const xRequestId = 'req-auth';
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const v1 = createHmac('sha256', 'segredo').update(manifest).digest('hex');

      const result = await service.handleWebhookEvent({
        action: 'subscription_authorized_payment.created',
        dataId,
        ts,
        xRequestId,
        signatureHeader: `ts=${ts},v1=${v1}`,
      });

      expect(result.handled).toBe(true);
      // Fatura mensal registrada
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: expect.stringContaining('Assinatura mensal'),
            status: 'PAID',
            transactionId: '888',
          }),
        }),
      );
    });
  });

  describe('handleWebhookEvent — evento sem handler', () => {
    let service: MercadoPagoService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: ConfigService,
            useValue: makeConfigMock({
              MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-teste',
              MERCADO_PAGO_WEBHOOK_SECRET: 'segredo',
              NODE_ENV: 'test',
            }),
          },
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<MercadoPagoService>(MercadoPagoService);
      jest.clearAllMocks();
    });

    it('ignora eventos desconhecidos sem quebrar', async () => {
      const dataId = 'x1';
      const ts = String(Math.floor(Date.now() / 1000));
      const manifest = `id:${dataId};request-id:req-x;ts:${ts};`;
      const v1 = createHmac('sha256', 'segredo').update(manifest).digest('hex');

      const result = await service.handleWebhookEvent({
        action: 'merchant_order.created',
        dataId,
        ts,
        xRequestId: 'req-x',
        signatureHeader: `ts=${ts},v1=${v1}`,
      });

      expect(result.handled).toBe(false);
      expect(result.detail).toContain('ignorado');
    });

    it('payment não aprovado não altera nada', async () => {
      (service as any).paymentClient = {
        get: jest
          .fn()
          .mockResolvedValue({ id: 'mp-1', status: 'pending', external_reference: 'p1' }),
      };
      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'PENDING',
      });

      const dataId = 'mp-1';
      const ts = String(Math.floor(Date.now() / 1000));
      const manifest = `id:${dataId};request-id:req-p;ts:${ts};`;
      const v1 = createHmac('sha256', 'segredo').update(manifest).digest('hex');

      const result = await service.handleWebhookEvent({
        action: 'payment.updated',
        dataId,
        ts,
        xRequestId: 'req-p',
        signatureHeader: `ts=${ts},v1=${v1}`,
      });

      expect(result.handled).toBe(false);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });
});
