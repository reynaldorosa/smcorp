import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { TenantsController } from './tenants.controller';

// ============================================
// Ordem de declaração das rotas
//
// O Nest resolve as rotas na ordem em que os handlers são declarados na
// classe. Declarar `@Get(':id')` antes de `@Get('billing')` faz o handler
// de `:id` capturar `GET /tenant/billing` — a rota de billing vira
// inalcançável e o usuário do tenant leva 403 (pois `:id` é MASTER-only).
// Este teste garante que rotas com parâmetro fiquem sempre por último.
// ============================================

interface RouteInfo {
  handler: string;
  method: number;
  path: string;
}

function collectRoutes(): RouteInfo[] {
  const prototype = TenantsController.prototype;

  // getOwnPropertyNames preserva a ordem de declaração dos métodos
  return Object.getOwnPropertyNames(prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => {
      const handler = (prototype as unknown as Record<string, unknown>)[name];
      return {
        handler: name,
        method: Reflect.getMetadata('method', handler as object) as number,
        path: Reflect.getMetadata('path', handler as object) as string,
      };
    })
    .filter((route) => route.path !== undefined);
}

const isParamRoute = (path: string) => path.split('/').some((seg) => seg.startsWith(':'));

describe('TenantsController — ordem das rotas', () => {
  const routes = collectRoutes();

  it('registra pelo menos as rotas conhecidas', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining(['signup', 'me', 'billing', 'all', ':id', ':id/status']),
    );
  });

  it.each([
    ['GET', RequestMethod.GET],
    ['POST', RequestMethod.POST],
    ['PATCH', RequestMethod.PATCH],
  ])('declara toda rota estática antes das rotas com :param (%s)', (_label, httpMethod) => {
    const sameMethod = routes.filter((r) => r.method === httpMethod);
    const firstParamIndex = sameMethod.findIndex((r) => isParamRoute(r.path));

    if (firstParamIndex === -1) return; // nenhuma rota com parâmetro nesse verbo

    const shadowed = sameMethod
      .slice(firstParamIndex + 1)
      .filter((r) => !isParamRoute(r.path))
      .map((r) => `${r.handler} ('${r.path}')`);

    expect(shadowed).toEqual([]);
  });

  it('mantém GET /tenant/billing antes de GET /tenant/:id', () => {
    const gets = routes.filter((r) => r.method === RequestMethod.GET).map((r) => r.path);

    expect(gets.indexOf('billing')).toBeGreaterThanOrEqual(0);
    expect(gets.indexOf('billing')).toBeLessThan(gets.indexOf(':id'));
    expect(gets.indexOf('me')).toBeLessThan(gets.indexOf(':id'));
    expect(gets.indexOf('all')).toBeLessThan(gets.indexOf(':id'));
  });
});
