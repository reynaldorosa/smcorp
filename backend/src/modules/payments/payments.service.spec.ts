import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMercadoPagoService = {
    isConfigured: jest.fn(() => true),
    createPixPayment: jest.fn(),
    getPayment: jest.fn(),
    createSubscription: jest.fn(),
    getSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  // Sem tenantId no contexto -> runTenantScoped usa `fn(this.prisma)` direto,
  // preservando o comportamento que os testes abaixo já esperam (mocks
  // chamados diretamente, sem passar pela transação com RLS).
  const mockTenantContextService = {
    get: jest.fn(() => ({})),
  };

  const mockTenantRlsService = {
    withTenantRls: jest.fn((fn: (client: unknown) => unknown) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: TenantRlsService,
          useValue: mockTenantRlsService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar pagamento com sucesso', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        student: { name: 'Aluno Teste' },
        class: {
          companyId: null,
          course: { name: 'Curso Teste' },
        },
      };
      const mockPayment = {
        id: 'payment-1',
        enrollmentId: 'enrollment-1',
        amount: 1000,
        status: 'PENDING',
      };

      mockPrismaService.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create({
        enrollmentId: 'enrollment-1',
        amount: 1000,
        installments: 1,
        dueDate: new Date('2026-03-01'),
        method: 'PIX',
        description: 'Mensalidade',
      });

      expect(result.id).toBe('payment-1');
      expect(result.amount).toBe(1000);
      expect(mockPrismaService.payment.create).toHaveBeenCalled();

      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          enrollmentId: 'invalid',
          amount: 1000,
          installments: 1,
          dueDate: new Date(),
          method: 'PIX',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordPayment', () => {
    it('deve registrar pagamento com sucesso', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'PENDING',
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'PAID',
        paidAt: new Date(),
      });

      const result = await service.recordPayment({
        paymentId: 'payment-1',
        method: 'PIX',
        paidAt: new Date(),
      });

      expect(result.status).toBe('PAID');
      expect(result.paidAt).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    it('deve retornar estatísticas de pagamento', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([
        { status: 'PAID', amount: 3000, paidAt: new Date() },
        { status: 'PAID', amount: 4000, paidAt: new Date() },
        { status: 'PENDING', amount: 2000, paidAt: null },
        { status: 'OVERDUE', amount: 1000, paidAt: null },
      ]);

      mockPrismaService.payment.groupBy.mockResolvedValue([
        { status: 'PAID', _count: { id: 2 }, _sum: { amount: 7000 } },
        { status: 'PENDING', _count: { id: 1 }, _sum: { amount: 2000 } },
        { status: 'OVERDUE', _count: { id: 1 }, _sum: { amount: 1000 } },
      ]);

      const result = await service.getStatistics({});

      expect(result.summary.totalExpected).toBe(10000);
      expect(result.summary.totalReceived).toBe(7000);
      expect(result.summary.totalPending).toBe(3000);
      expect(result.summary.count).toBe(4);
      expect(result.byStatus).toHaveLength(3);
    });
  });

  describe('markOverduePayments', () => {
    it('deve marcar pagamentos vencidos', async () => {
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.markOverduePayments();

      expect(result.count).toBe(2);
      expect(mockPrismaService.payment.updateMany).toHaveBeenCalled();
    });
  });
});
