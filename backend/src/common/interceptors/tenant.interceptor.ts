import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantStatusCacheService } from '../services/tenant-status-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Injeta o tenantId do usuário autenticado no TenantContextService,
 * propagando-o (via AsyncLocalStorage) para todas as queries Prisma
 * executadas durante o handler da requisição.
 *
 * Também bloqueia requisições de tenants SUSPENDED/CANCELLED
 * (inadimplência / assinatura encerrada) com cache de 60s.
 *
 * Fluxos públicos (login, webhooks, matrícula pública) não têm
 * request.user — o contexto fica vazio e o isolamento não é aplicado.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly statusCache: TenantStatusCacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId as string | undefined;

    return new Observable((subscriber) => {
      void this.assertTenantActive(tenantId).then(
        (allowed) => {
          if (!allowed) {
            subscriber.error(
              new ForbiddenException(
                'Assinatura do centro de treinamento inativa. Contate o suporte.',
              ),
            );
            return;
          }
          this.tenantContext.run({ tenantId }, () => {
            next.handle().subscribe(subscriber);
          });
        },
        (error) => subscriber.error(error),
      );
    });
  }

  private async assertTenantActive(tenantId: string | undefined): Promise<boolean> {
    if (!tenantId) return true; // plataforma (MASTER) e fluxos públicos

    const cached = this.statusCache.get(tenantId);
    if (cached) {
      return cached === 'ACTIVE' || cached === 'TRIAL';
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true },
    });

    const status = tenant?.status || 'SUSPENDED';
    this.statusCache.set(tenantId, status);

    return status === 'ACTIVE' || status === 'TRIAL';
  }
}
