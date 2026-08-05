import { PrismaService } from './prisma.service';
import { TenantContextService } from '../common/services/tenant-context.service';

/**
 * Testa o middleware de isolamento multi-tenant diretamente
 * (sem banco — a lógica pura de injeção de tenantId).
 */
describe('PrismaService tenantMiddleware', () => {
  const makeContext = (data: { tenantId?: string; system?: boolean }) => ({
    get: jest.fn(() => data),
  });

  const next = jest.fn(async (params: any) => params);

  const callMiddleware = async (service: PrismaService, params: any) => {
    next.mockClear();
    await (service as any).tenantMiddleware(params, next);
    return next;
  };

  describe('com tenantId no contexto', () => {
    let service: PrismaService;

    beforeEach(() => {
      service = new PrismaService(
        makeContext({ tenantId: 'tenant-1' }) as unknown as TenantContextService,
      );
    });

    it('injetar tenantId em findMany', async () => {
      const params: any = { model: 'Course', action: 'findMany', args: { where: {} } };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBe('tenant-1');
    });

    it('injetar tenantId em count/aggregate/groupBy', async () => {
      for (const action of ['count', 'aggregate', 'groupBy']) {
        const params: any = { model: 'Student', action, args: { where: {} } };
        await callMiddleware(service, params);
        expect(params.args.where.tenantId).toBe('tenant-1');
      }
    });

    it('injetar tenantId em create (data)', async () => {
      const params: any = { model: 'Course', action: 'create', args: { data: { name: 'X' } } };
      await callMiddleware(service, params);
      expect(params.args.data.tenantId).toBe('tenant-1');
    });

    it('injetar tenantId em update (where)', async () => {
      const params: any = {
        model: 'Course',
        action: 'update',
        args: { where: { id: 'c1' }, data: {} },
      };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBe('tenant-1');
    });

    it('injetar tenantId em upsert (create/update/where)', async () => {
      const params: any = {
        model: 'Room',
        action: 'upsert',
        args: { where: { id: 'r1' }, create: { name: 'A' }, update: { name: 'B' } },
      };
      await callMiddleware(service, params);
      expect(params.args.create.tenantId).toBe('tenant-1');
      expect(params.args.update.tenantId).toBe('tenant-1');
      expect(params.args.where.tenantId).toBe('tenant-1');
    });

    it('injetar tenantId em createMany com array', async () => {
      const params: any = {
        model: 'Student',
        action: 'createMany',
        args: { data: [{ name: 'A' }, { name: 'B' }] },
      };
      await callMiddleware(service, params);
      expect(params.args.data[0].tenantId).toBe('tenant-1');
      expect(params.args.data[1].tenantId).toBe('tenant-1');
    });

    it('injetar tenantId em updateMany (where)', async () => {
      const params: any = { model: 'Payment', action: 'updateMany', args: { where: {}, data: {} } };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBe('tenant-1');
    });

    it('NÃO injeta em Tenant (modelo da plataforma)', async () => {
      const params: any = { model: 'Tenant', action: 'findMany', args: { where: {} } };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBeUndefined();
    });

    it('NÃO injeta em Subscription', async () => {
      const params: any = { model: 'Subscription', action: 'findMany', args: { where: {} } };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBeUndefined();
    });

    it('não sobrescreve tenantId já especificado no where', async () => {
      const params: any = {
        model: 'Course',
        action: 'findMany',
        args: { where: { tenantId: 'outro' } },
      };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBe('outro');
    });
  });

  describe('sem tenantId no contexto', () => {
    let service: PrismaService;

    beforeEach(() => {
      service = new PrismaService(makeContext({}) as unknown as TenantContextService);
    });

    it('não altera os args (plataforma/fluxo público)', async () => {
      const params: any = { model: 'Course', action: 'findMany', args: { where: {} } };
      await callMiddleware(service, params);
      expect(params.args.where.tenantId).toBeUndefined();
    });
  });

  describe('contexto system=true', () => {
    let service: PrismaService;

    beforeEach(() => {
      service = new PrismaService(
        makeContext({ tenantId: 'tenant-1', system: true }) as unknown as TenantContextService,
      );
    });

    it('não injeta (jobs/webhooks/seed)', async () => {
      const params: any = { model: 'Course', action: 'create', args: { data: {} } };
      await callMiddleware(service, params);
      expect(params.args.data.tenantId).toBeUndefined();
    });
  });
});
