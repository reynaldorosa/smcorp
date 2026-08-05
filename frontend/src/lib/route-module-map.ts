import type { UserPermissions } from '@/lib/user-permissions';

/**
 * Canonical (frontend) mapping layer.
 *
 * Convention:
 * - Code identifiers stay in English.
 * - We keep `modulo00..08` ONLY as a data-contract key (Figma-like).
 * - UI labels can be PT-BR.
 */

export type FigmaModuleKey = keyof UserPermissions['modulos'];

export type AppModuleSlug =
  | 'executive_dashboard'
  | 'settings'
  | 'courses'
  | 'classes'
  | 'operational'
  | 'documents'
  | 'sales'
  | 'client_portal'
  | 'financial';

export interface RouteModuleRule {
  /** Route prefix (App Router top-level path) */
  prefix: `/${string}`;
  gate: {
    mode: 'any' | 'all';
    keys: readonly FigmaModuleKey[];
  };
  moduleSlug: AppModuleSlug;
}

/**
 * Safe, non-ambiguous route → module rules.
 *
 * Module semantics follow the SMCORP prototype (`portalsmcorpfigma`), which is
 * the functional reference for this system — see the nav in
 * `portalsmcorpfigma/src/app/components/Layout.tsx`:
 *
 *   modulo00 Infraestrutura        modulo05 Área do Cliente PJ
 *   modulo01 Catálogo de Cursos    modulo06 Validação de Documentos
 *   modulo02 Abertura de Turmas    modulo07 Gestão de Pagamentos
 *   modulo03 Dashboard Operacional modulo08 Fluxo Financeiro
 *   modulo04 Central de Vendas     modulo09 Dashboard Executivo
 *
 * NOTE:
 * Financial routes are currently treated as "visualization" and gated by
 * `modulo07 OR modulo08` (decision on 11/02/2026).
 */
export const ROUTE_MODULE_RULES: readonly RouteModuleRule[] = [
  { prefix: '/dashboard', gate: { mode: 'any', keys: ['modulo09'] }, moduleSlug: 'executive_dashboard' },
  { prefix: '/settings', gate: { mode: 'any', keys: ['modulo00'] }, moduleSlug: 'settings' },
  { prefix: '/courses', gate: { mode: 'any', keys: ['modulo01'] }, moduleSlug: 'courses' },
  { prefix: '/classes', gate: { mode: 'any', keys: ['modulo02'] }, moduleSlug: 'classes' },
  { prefix: '/operacional', gate: { mode: 'any', keys: ['modulo03'] }, moduleSlug: 'operational' },
  { prefix: '/vendas', gate: { mode: 'any', keys: ['modulo04'] }, moduleSlug: 'sales' },
  { prefix: '/crm', gate: { mode: 'any', keys: ['modulo04'] }, moduleSlug: 'sales' },
  { prefix: '/cliente-pj', gate: { mode: 'any', keys: ['modulo05'] }, moduleSlug: 'client_portal' },
  { prefix: '/documents', gate: { mode: 'any', keys: ['modulo06'] }, moduleSlug: 'documents' },

  // Financial visualization (decision): allow when user has module07 OR module08.
  { prefix: '/pagamentos', gate: { mode: 'any', keys: ['modulo07', 'modulo08'] }, moduleSlug: 'financial' },
  { prefix: '/costs', gate: { mode: 'any', keys: ['modulo07', 'modulo08'] }, moduleSlug: 'financial' },
  { prefix: '/financial', gate: { mode: 'any', keys: ['modulo07', 'modulo08'] }, moduleSlug: 'financial' },
] as const;

/**
 * Rota ungated: sempre acessível a quem está autenticado (não tem regra de módulo).
 * Serve de último recurso para o fallback abaixo.
 */
const UNGATED_FALLBACK = '/timeline';

/**
 * Primeira rota que o usuário realmente pode acessar.
 *
 * Necessário porque o destino de fallback NÃO pode ser fixo em `/dashboard`:
 * `/dashboard` é gated por `modulo09` e perfis sem esse módulo (ex.: Seller)
 * ficariam presos — negados na rota e redirecionados para ela de novo,
 * resultando em tela em branco sem navegação.
 */
export function getFirstAllowedRoute(modulos: UserPermissions['modulos']): string {
  const allowed = ROUTE_MODULE_RULES.find((rule) => isAllowedByModuleGate(modulos, rule.gate));
  return allowed?.prefix ?? UNGATED_FALLBACK;
}

export function getModuleGateForPathname(pathname: string): RouteModuleRule['gate'] | null {
  const rule = ROUTE_MODULE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return rule?.gate ?? null;
}

export function isAllowedByModuleGate(
  modulos: UserPermissions['modulos'],
  gate: NonNullable<ReturnType<typeof getModuleGateForPathname>>,
): boolean {
  const values = gate.keys.map((key) => modulos[key] ?? false);
  return gate.mode === 'all' ? values.every(Boolean) : values.some(Boolean);
}
