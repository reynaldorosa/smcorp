import { Test, TestingModule } from '@nestjs/testing';
import { BillingJobsService } from './billing-jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('BillingJobsService', () => {
  const mockPrismaService = {
    tenant: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
    },
  };

  const mockPaymentsService = {
    markOverduePayments: jest.fn().mockResolvedValue({ count: 3 }),
  };

  let service: BillingJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingJobsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<BillingJobsService>(BillingJobsService);
    jest.clearAllMocks();
  });

  it('expira trials vencidos (TRIAL → SUSPENDED)', async () => {
    mockPrismaService.tenant.updateMany.mockResolvedValue({ count: 2 });

    const result = await (service as any).expireTrials();

    expect(result).toBe(2);
    expect(mockPrismaService.tenant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'TRIAL', trialEndsAt: { lt: expect.any(Date) } }),
        data: { status: 'SUSPENDED' },
      }),
    );
  });

  it('suspende tenants com assinatura cancelada', async () => {
    mockPrismaService.subscription.findMany.mockResolvedValue([
      { tenantId: 't1' },
      { tenantId: 't2' },
    ]);
    mockPrismaService.tenant.updateMany.mockResolvedValue({ count: 2 });

    const result = await (service as any).suspendCancelledTenants();

    expect(result).toBe(2);
    expect(mockPrismaService.tenant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['t1', 't2'] },
          status: { notIn: ['CANCELLED', 'SUSPENDED'] },
        }),
      }),
    );
  });

  it('runDailyJobs executa os três passos', async () => {
    mockPrismaService.tenant.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.subscription.findMany.mockResolvedValue([]);

    await service.runDailyJobs();

    expect(mockPaymentsService.markOverduePayments).toHaveBeenCalled();
    expect(mockPrismaService.tenant.updateMany).toHaveBeenCalled();
  });
});
