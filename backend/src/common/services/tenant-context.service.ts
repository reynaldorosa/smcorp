import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  /** Tenant autenticado na requisição (undefined = plataforma/público) */
  tenantId?: string;
  /**
   * true para operações de sistema que ignoram o isolamento
   * (jobs agendados, webhooks, seed, comandos CLI)
   */
  system?: boolean;
}

/**
 * Contexto de tenant propagado por toda a requisição via AsyncLocalStorage.
 * O TenantInterceptor injeta o tenantId do usuário autenticado; o middleware
 * de tenant do PrismaService consome este contexto para filtrar/escrever.
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextData>();

  run<T>(data: TenantContextData, fn: () => T | Promise<T>): Promise<T> {
    return this.storage.run(data, () => Promise.resolve(fn()));
  }

  get(): TenantContextData {
    return this.storage.getStore() || {};
  }
}
