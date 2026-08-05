import { Injectable } from '@nestjs/common';

interface TenantStatusCacheEntry {
  status: string;
  expiresAt: number;
}

/**
 * Cache do status dos tenants (TTL 60s), compartilhado entre o
 * TenantInterceptor (que lê a cada requisição para bloquear tenants
 * SUSPENDED/CANCELLED) e o TenantsService (que invalida a entrada
 * quando a plataforma altera o status).
 *
 * Sem a invalidação, suspender ou reativar um centro só teria efeito
 * depois que o TTL expirasse — até 60s de acesso indevido (ou de bloqueio
 * indevido após a reativação).
 */
@Injectable()
export class TenantStatusCacheService {
  private readonly cache = new Map<string, TenantStatusCacheEntry>();
  private readonly ttlMs = 60_000;

  /** Status em cache, ou undefined se ausente/expirado */
  get(tenantId: string): string | undefined {
    const entry = this.cache.get(tenantId);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(tenantId);
      return undefined;
    }

    return entry.status;
  }

  set(tenantId: string, status: string): void {
    this.cache.set(tenantId, { status, expiresAt: Date.now() + this.ttlMs });
  }

  /** Descarta a entrada — a próxima requisição do tenant relê o banco */
  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }
}
