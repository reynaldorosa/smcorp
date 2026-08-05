import { TenantInterceptor } from './tenant.interceptor';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantStatusCacheService } from '../services/tenant-status-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';

describe('TenantInterceptor', () => {
  const mockTenantContext = {
    run: jest.fn(async (_data: unknown, fn: () => Promise<unknown>) => fn()),
    get: jest.fn(() => ({})),
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
  };

  const makeContext = (user?: { tenantId?: string }) => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  });

  const makeNext = () => ({
    handle: () => of('resultado'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('propaga tenantId no contexto e deixa a requisição seguir (tenant ACTIVE)', async () => {
    mockPrismaService.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    const result = await lastValueFrom(
      interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
    );

    expect(result).toBe('resultado');
    expect(mockTenantContext.run).toHaveBeenCalledWith({ tenantId: 't1' }, expect.any(Function));
  });

  it('bloqueia tenant SUSPENDED com ForbiddenException', async () => {
    mockPrismaService.tenant.findUnique.mockResolvedValue({ status: 'SUSPENDED' });
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloqueia tenant CANCELLED', async () => {
    mockPrismaService.tenant.findUnique.mockResolvedValue({ status: 'CANCELLED' });
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite TRIAL', async () => {
    mockPrismaService.tenant.findUnique.mockResolvedValue({ status: 'TRIAL' });
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    const result = await lastValueFrom(
      interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
    );
    expect(result).toBe('resultado');
  });

  it('não consulta o banco para usuários de plataforma (sem tenant)', async () => {
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    const result = await lastValueFrom(
      interceptor.intercept(makeContext({}) as any, makeNext() as any),
    );

    expect(result).toBe('resultado');
    expect(mockPrismaService.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('usa cache de 60s (não consulta o banco duas vezes no mesmo status)', async () => {
    mockPrismaService.tenant.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    const interceptor = new TenantInterceptor(
      mockTenantContext as unknown as TenantContextService,
      mockPrismaService as unknown as PrismaService,
      new TenantStatusCacheService(),
    );

    await lastValueFrom(
      interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
    );
    await lastValueFrom(
      interceptor.intercept(makeContext({ tenantId: 't1' }) as any, makeNext() as any),
    );

    expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledTimes(1);
  });
});
