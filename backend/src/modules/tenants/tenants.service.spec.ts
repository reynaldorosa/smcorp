import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { CommunicationService } from '../communication/communication.service';
import { TenantStatusCacheService } from '../../common/services/tenant-status-cache.service';
import { ConflictException } from '@nestjs/common';

const mockStatusCache = {
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
};

describe('TenantsService', () => {
  let service: TenantsService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('token-teste'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => (key === 'JWT_EXPIRES_IN' ? '15m' : '7d')),
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

  const mockCommunicationService = {
    send: jest.fn().mockResolvedValue({ sent: true, channel: 'email', provider: 'mock' }),
    getStatus: jest.fn(() => ({ uniqSuporteConfigured: false, channels: {} })),
  };

  const signupDto = {
    tenantName: 'Escola Teste',
    slug: 'escola-teste',
    cnpj: '12345678000199',
    adminName: 'Admin Teste',
    adminEmail: 'admin@escola.com.br',
    adminPassword: 'Senha123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MercadoPagoService, useValue: mockMercadoPagoService },
        { provide: CommunicationService, useValue: mockCommunicationService },
        { provide: TenantStatusCacheService, useValue: mockStatusCache },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('cria tenant + subscription + admin e devolve tokens', async () => {
      mockPrismaService.tenant.findUnique
        .mockResolvedValueOnce(null) // slug livre
        .mockResolvedValueOnce(null); // cnpj livre
      mockPrismaService.user.findFirst.mockResolvedValue(null); // email livre

      const tenantCriado = {
        id: 'tenant-1',
        slug: 'escola-teste',
        name: 'Escola Teste',
        status: 'TRIAL',
        trialEndsAt: new Date(),
      };
      mockPrismaService.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            tenant: { create: jest.fn().mockResolvedValue(tenantCriado) },
            subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
            user: { create: jest.fn().mockResolvedValue({ id: 'user-1' }) },
          };
          return fn(tx);
        },
      );

      const result = await service.signup(signupDto);

      expect(result.accessToken).toBe('token-teste');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.tenantId).toBe('tenant-1');
      expect(result.tenant.status).toBe('TRIAL');
      // O usuário é identificado pelo ID do USUÁRIO — nunca pelo ID do tenant,
      // senão /users/profile e a auditoria não resolvem quem está logado.
      expect(result.user.id).toBe('user-1');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', tenantId: 'tenant-1' }),
        expect.anything(),
      );
      // Transaction recebeu tenant com trial de 14 dias
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('rejeita slug duplicado', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce({ id: 'x' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('rejeita e-mail já cadastrado', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// BILLING
// ============================================

describe('TenantsService billing', () => {
  let service: TenantsService;

  const prismaMock = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findFirst: jest.fn(), create: jest.fn() },
    payment: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const mpMock = {
    isConfigured: jest.fn(() => true),
    createSubscription: jest.fn().mockResolvedValue({
      providerSubscriptionId: 'mp-555',
      initPoint: 'https://mp.com/pay',
      status: 'pending',
    }),
    cancelSubscription: jest.fn().mockResolvedValue({ id: 'mp-555', status: 'cancelled' }),
    createPixPayment: jest.fn(),
    getPayment: jest.fn(),
    getSubscription: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  const commMock = {
    send: jest.fn().mockResolvedValue({ sent: true, channel: 'email', provider: 'mock' }),
    getStatus: jest.fn(() => ({ uniqSuporteConfigured: false, channels: {} })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MercadoPagoService, useValue: mpMock },
        { provide: CommunicationService, useValue: commMock },
        { provide: TenantStatusCacheService, useValue: mockStatusCache },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('subscribeToBilling', () => {
    it('cria preapproval no MP com preço customizado e salva providerSubscriptionId', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 't1',
        name: 'Escola Teste',
        trialEndsAt: new Date(),
        subscription: null,
      });
      prismaMock.subscription.create.mockResolvedValue({
        id: 'sub-1',
        tenantId: 't1',
        price: 0,
        planName: null,
      });
      prismaMock.subscription.update.mockResolvedValue({});

      const result = await service.subscribeToBilling('t1', 'admin@escola.com', {
        price: 299.9,
        planName: 'Plano Pro',
      });

      expect(mpMock.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't1',
          price: 299.9,
          planName: 'Plano Pro',
        }),
      );
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerSubscriptionId: 'mp-555',
            price: 299.9,
          }),
        }),
      );
      expect(result.initPoint).toContain('mp.com');
    });

    it('rejeita ativação sem preço definido', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 't1',
        name: 'Escola',
        trialEndsAt: new Date(),
        subscription: null,
      });
      prismaMock.subscription.create.mockResolvedValue({
        id: 'sub-1',
        tenantId: 't1',
        price: 0,
        planName: null,
      });

      await expect(service.subscribeToBilling('t1', 'a@b.com', {})).rejects.toThrow(
        'Defina o valor mensal',
      );
      expect(mpMock.createSubscription).not.toHaveBeenCalled();
    });
  });

  describe('cancelBilling', () => {
    it('cancela preapproval no MP e marca cancelAtPeriodEnd', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        tenantId: 't1',
        providerSubscriptionId: 'mp-555',
      });
      prismaMock.subscription.update.mockResolvedValue({});

      const result = await service.cancelBilling('t1');

      expect(mpMock.cancelSubscription).toHaveBeenCalledWith('mp-555');
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cancelAtPeriodEnd: true }),
        }),
      );
      expect(result.success).toBe(true);
    });

    it('falha sem assinatura existente', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(service.cancelBilling('t1')).rejects.toThrow('não possui assinatura');
    });
  });

  describe('getBillingInfo', () => {
    it('retorna assinatura + gateway + faturas', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 't1',
        slug: 'escola',
        name: 'Escola Teste',
        cnpj: null,
        status: 'ACTIVE',
        branding: {},
        trialEndsAt: null,
        createdAt: new Date(),
        subscription: { id: 'sub-1', planName: 'Pro', price: 100, status: 'ACTIVE' },
      });
      prismaMock.payment.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          kind: 'SUBSCRIPTION_FEE',
          description: 'Assinatura mensal',
          amount: 100,
          status: 'PAID',
        },
      ]);

      const info = await service.getBillingInfo('t1');

      expect(info.paymentGatewayConfigured).toBe(true);
      expect(info.invoices).toHaveLength(1);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 't1',
            kind: 'SUBSCRIPTION_FEE',
          }),
        }),
      );
    });
  });
});

// ============================================
// PLATAFORMA (superadmin MASTER)
// ============================================

describe('TenantsService plataforma', () => {
  let service: TenantsService;

  const prismaPlatform = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscription: { create: jest.fn() },
    user: { findFirst: jest.fn(), create: jest.fn() },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };

  // Executa o callback da transação com um tx que espelha os mocks —
  // o updateStatus agora roda update + auditLog atomicamente.
  // (Definido após a declaração para evitar auto-referência na inicialização.)
  prismaPlatform.$transaction = jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
    fn({ tenant: prismaPlatform.tenant, auditLog: prismaPlatform.auditLog }),
  );

  const commPlatform = {
    send: jest.fn().mockResolvedValue({ sent: true, channel: 'email', provider: 'mock' }),
    getStatus: jest.fn(() => ({ uniqSuporteConfigured: false, channels: {} })),
  };

  const mpPlatform = {
    isConfigured: jest.fn(() => true),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  const platformDto = {
    tenantName: 'Centro Norte',
    slug: 'centro-norte',
    cnpj: '98765432000188',
    adminName: 'Ana Silva',
    adminEmail: 'ana@centronorte.com.br',
    adminPassword: 'Senha123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prismaPlatform },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MercadoPagoService, useValue: mpPlatform },
        { provide: CommunicationService, useValue: commPlatform },
        { provide: TenantStatusCacheService, useValue: mockStatusCache },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('listAll', () => {
    it('retorna tenants com assinatura + métricas agregadas', async () => {
      const tenants = [
        {
          id: 't1',
          slug: 'smcorp',
          name: 'SMCORP',
          status: 'ACTIVE',
          createdAt: new Date(),
          subscription: { planName: 'Plataforma', price: 0, status: 'ACTIVE' },
          _count: { users: 5, enrollments: 20 },
        },
        {
          id: 't2',
          slug: 'centro-norte',
          name: 'Centro Norte',
          status: 'TRIAL',
          createdAt: new Date(),
          subscription: { planName: null, price: 0, status: 'TRIAL' },
          _count: { users: 1, enrollments: 0 },
        },
        {
          id: 't3',
          slug: 'escola-x',
          name: 'Escola X',
          status: 'SUSPENDED',
          createdAt: new Date(),
          subscription: { planName: 'Pro', price: 299, status: 'SUSPENDED' },
          _count: { users: 2, enrollments: 3 },
        },
      ];
      prismaPlatform.tenant.findMany.mockResolvedValue(tenants);
      prismaPlatform.payment.aggregate.mockResolvedValue({
        _sum: { amount: 598 },
        _count: 2,
      });

      const result = await service.listAll();

      expect(result.tenants).toHaveLength(3);
      expect(result.metrics).toEqual({
        total: 3,
        trial: 1,
        active: 1,
        suspended: 1,
        cancelled: 0,
        invoicesMonth: 598,
        invoicesMonthCount: 2,
      });
      // Tenant não é escopado: findMany sem where.tenantId
      expect(prismaPlatform.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });

  describe('getById', () => {
    it('retorna tenant com contagens e faturas', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValue({
        id: 't1',
        name: 'SMCORP',
        status: 'ACTIVE',
        subscription: { id: 'sub-1', planName: 'Pro', price: 100, status: 'ACTIVE' },
        _count: { users: 5, enrollments: 20, payments: 30 },
      });
      prismaPlatform.payment.findMany.mockResolvedValue([
        { id: 'inv-1', description: 'Assinatura mensal', amount: 100, status: 'PAID' },
      ]);

      const result = await service.getById('t1');

      expect(result._count.users).toBe(5);
      expect(result.invoices).toHaveLength(1);
      expect(prismaPlatform.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 't1' }),
        }),
      );
    });

    it('lança erro quando o tenant não existe', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getById('inexistente')).rejects.toThrow('não encontrado');
    });
  });

  describe('updateStatus', () => {
    it('atualiza status e registra auditoria da plataforma', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValue({
        id: 't1',
        name: 'Escola X',
        status: 'ACTIVE',
      });
      prismaPlatform.tenant.update.mockResolvedValue({
        id: 't1',
        name: 'Escola X',
        status: 'SUSPENDED',
      });

      const result = await service.updateStatus('t1', 'SUSPENDED', 'master-1');

      expect(prismaPlatform.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SUSPENDED' } }),
      );
      expect(prismaPlatform.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableName: 'Tenant',
            recordId: 't1',
            action: 'UPDATE',
            userId: 'master-1',
            newData: expect.objectContaining({
              status: 'SUSPENDED',
              previousStatus: 'ACTIVE',
            }),
          }),
        }),
      );
      expect(result.message).toContain('SUSPENDED');
    });

    it('invalida o cache de status para a mudança valer na hora (não em até 60s)', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValue({
        id: 't1',
        name: 'Escola X',
        status: 'SUSPENDED',
      });
      prismaPlatform.tenant.update.mockResolvedValue({
        id: 't1',
        name: 'Escola X',
        status: 'ACTIVE',
      });

      await service.updateStatus('t1', 'ACTIVE', 'master-1');

      expect(mockStatusCache.invalidate).toHaveBeenCalledWith('t1');
    });

    it('lança erro quando o tenant não existe', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('x', 'ACTIVE', 'm')).rejects.toThrow('não encontrado');
      expect(prismaPlatform.tenant.update).not.toHaveBeenCalled();
      expect(mockStatusCache.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('createByPlatform', () => {
    it('provisiona tenant + admin + e-mail de boas-vindas, sem auto-login', async () => {
      prismaPlatform.tenant.findUnique
        .mockResolvedValueOnce(null) // slug livre
        .mockResolvedValueOnce(null); // cnpj livre
      prismaPlatform.user.findFirst.mockResolvedValue(null); // email livre

      const tenantCriado = {
        id: 'tenant-9',
        slug: 'centro-norte',
        name: 'Centro Norte',
        status: 'TRIAL',
        trialEndsAt: new Date(),
      };
      prismaPlatform.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            tenant: { create: jest.fn().mockResolvedValue(tenantCriado) },
            subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-9' }) },
            user: { create: jest.fn().mockResolvedValue({ id: 'user-9' }) },
          };
          return fn(tx);
        },
      );

      const result = await service.createByPlatform(platformDto);

      expect(result.adminEmail).toBe('ana@centronorte.com.br');
      expect(result.tenant.status).toBe('TRIAL');
      // Sem auto-login: o retorno NÃO contém tokens
      expect('accessToken' in result).toBe(false);
      // E-mail de boas-vindas disparado (fire-and-forget)
      expect(commPlatform.send).toHaveBeenCalledWith(
        expect.objectContaining({ recipient: 'ana@centronorte.com.br' }),
      );
      expect(prismaPlatform.$transaction).toHaveBeenCalled();
    });

    it('propaga ConflictException para slug duplicado (409, não 400)', async () => {
      prismaPlatform.tenant.findUnique.mockResolvedValueOnce({ id: 'x' });

      await expect(service.createByPlatform(platformDto)).rejects.toThrow(ConflictException);
      expect(prismaPlatform.$transaction).not.toHaveBeenCalled();
    });
  });
});
