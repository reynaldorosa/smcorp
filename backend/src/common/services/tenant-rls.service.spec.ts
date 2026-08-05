import { Test, TestingModule } from '@nestjs/testing';
import { TenantRlsService } from './tenant-rls.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

describe('TenantRlsService', () => {
  let service: TenantRlsService;
  let tenantContext: TenantContextService;

  const mockTx = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $executeRaw: jest.fn().mockResolvedValue(1),
  };

  const mockPrisma = {
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRlsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: TenantContextService,
          useValue: { get: jest.fn(() => ({ tenantId: 'tenant-abc' })) },
        },
      ],
    }).compile();

    service = module.get<TenantRlsService>(TenantRlsService);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('abre transação e arma RLS (SET LOCAL ROLE + app.tenant_id) antes de rodar fn', async () => {
    const fn = jest.fn().mockResolvedValue('resultado');

    const result = await service.withTenantRls(fn);

    expect(result).toBe('resultado');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith('SET LOCAL ROLE smcorp_rls');
    expect(mockTx.$executeRaw).toHaveBeenCalled();
    // set_config com o tenantId do contexto (tagged template do Prisma:
    // (strings, ...values) — o valor interpolado chega como 2º argumento)
    expect(mockTx.$executeRaw.mock.calls[0][1]).toBe('tenant-abc');
    // fn recebe o MESMO client transacional
    expect(fn).toHaveBeenCalledWith(mockTx);
  });

  it('lança erro quando não há tenantId no contexto (fluxo de plataforma/público)', async () => {
    (tenantContext.get as jest.Mock).mockReturnValue({});

    await expect(service.withTenantRls(() => Promise.resolve('x'))).rejects.toThrow(
      'withTenantRls exige tenantId no contexto',
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
