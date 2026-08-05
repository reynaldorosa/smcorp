import { describe, it, expect } from 'vitest';
import {
  getFirstAllowedRoute,
  getModuleGateForPathname,
  isAllowedByModuleGate,
} from './route-module-map';
import { createDefaultUserPermissions } from './user-permissions';

describe('route-module-map', () => {
  // A semântica dos módulos segue o protótipo (portalsmcorpfigma/.../Layout.tsx):
  // 04 = Central de Vendas, 05 = Área do Cliente PJ, 06 = Validação de Documentos.
  it('resolve gate do módulo 04 (Central de Vendas) para /vendas e /crm', () => {
    expect(getModuleGateForPathname('/vendas')?.keys).toContain('modulo04');
    expect(getModuleGateForPathname('/crm')?.keys).toContain('modulo04');
  });

  it('resolve gate do módulo 05 (Área do Cliente PJ) para /cliente-pj/dashboard', () => {
    expect(getModuleGateForPathname('/cliente-pj/dashboard')?.keys).toContain('modulo05');
  });

  it('resolve gate do módulo 06 (Validação de Documentos) para /documents', () => {
    expect(getModuleGateForPathname('/documents')?.keys).toContain('modulo06');
  });

  it('valida permissão por regra any/all', () => {
    const modulos = {
      modulo00: false,
      modulo01: false,
      modulo02: false,
      modulo03: false,
      modulo04: true,
      modulo05: false,
      modulo06: false,
      modulo07: false,
      modulo08: true,
      modulo09: false,
    };

    const gateSales = getModuleGateForPathname('/crm');
    expect(gateSales).toBeTruthy();
    expect(isAllowedByModuleGate(modulos, gateSales!)).toBe(true);

    const gateFinancial = getModuleGateForPathname('/financial');
    expect(gateFinancial).toBeTruthy();
    expect(isAllowedByModuleGate(modulos, gateFinancial!)).toBe(true);
  });
});

describe('perfil Seller (COLLABORATOR)', () => {
  const seller = createDefaultUserPermissions('Seller').modulos;

  it('acessa Vendas e CRM — sua função principal', () => {
    expect(isAllowedByModuleGate(seller, getModuleGateForPathname('/vendas')!)).toBe(true);
    expect(isAllowedByModuleGate(seller, getModuleGateForPathname('/crm')!)).toBe(true);
  });

  it('NÃO acessa validação de documentos nem o dashboard executivo', () => {
    expect(isAllowedByModuleGate(seller, getModuleGateForPathname('/documents')!)).toBe(false);
    expect(isAllowedByModuleGate(seller, getModuleGateForPathname('/dashboard')!)).toBe(false);
  });

  it('tem um destino de fallback válido — nunca fica sem rota (tela em branco)', () => {
    const destino = getFirstAllowedRoute(seller);

    expect(destino).not.toBe('/dashboard');
    const gate = getModuleGateForPathname(destino);
    expect(gate ? isAllowedByModuleGate(seller, gate) : true).toBe(true);
  });
});

describe('getFirstAllowedRoute', () => {
  it('prefere /dashboard quando o usuário tem modulo09', () => {
    expect(getFirstAllowedRoute(createDefaultUserPermissions('Master').modulos)).toBe('/dashboard');
  });

  it('cai numa rota ungated quando o usuário não tem módulo nenhum', () => {
    const nenhum = {
      modulo00: false,
      modulo01: false,
      modulo02: false,
      modulo03: false,
      modulo04: false,
      modulo05: false,
      modulo06: false,
      modulo07: false,
      modulo08: false,
      modulo09: false,
    };

    const destino = getFirstAllowedRoute(nenhum);
    expect(getModuleGateForPathname(destino)).toBeNull();
  });
});
