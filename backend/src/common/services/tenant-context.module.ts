import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantStatusCacheService } from './tenant-status-cache.service';
import { TenantRlsService } from './tenant-rls.service';

/**
 * Módulo GLOBAL do contexto de tenant.
 * Um ÚNICO singleton compartilhado entre o TenantInterceptor
 * (que grava o contexto) e o PrismaService (que o lê no middleware) —
 * se fossem instâncias separadas, o isolamento não funcionaria.
 *
 * O mesmo vale para o TenantStatusCacheService: o interceptor lê o cache
 * e o TenantsService o invalida ao mudar o status de um tenant.
 *
 * TenantRlsService (RLS como segunda camada de isolamento) também vive
 * aqui para ficar disponível em qualquer módulo sem import extra.
 */
@Global()
@Module({
  providers: [TenantContextService, TenantStatusCacheService, TenantRlsService],
  exports: [TenantContextService, TenantStatusCacheService, TenantRlsService],
})
export class TenantContextModule {}
