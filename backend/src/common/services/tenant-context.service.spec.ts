import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('get() retorna vazio fora de um run', () => {
    expect(service.get()).toEqual({});
  });

  it('propaga o contexto dentro do run (AsyncLocalStorage)', async () => {
    let inside: unknown;
    await service.run({ tenantId: 't1' }, async () => {
      inside = service.get();
    });
    expect(inside).toEqual({ tenantId: 't1' });
  });

  it('restaura o contexto após o run', async () => {
    await service.run({ tenantId: 't1' }, async () => {
      // nada
    });
    expect(service.get()).toEqual({});
  });

  it('suporta callback síncrono', async () => {
    let inside: unknown;
    await service.run({ system: true }, () => {
      inside = service.get();
    });
    expect(inside).toEqual({ system: true });
  });
});
