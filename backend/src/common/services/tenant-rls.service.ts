import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

/**
 * SEGUNDA CAMADA de isolamento multi-tenant: Row-Level Security (RLS).
 *
 * O middleware Prisma injeta tenantId em ~28 modelos (camada de aplicação);
 * este serviço arma o RLS do Postgres (`smcorp_rls` + `app.tenant_id`) numa
 * transação explícita, como camada independente para as tabelas mais
 * sensíveis (students, student_documents, payments).
 *
 * Como o app conecta como DONO das tabelas (o dono ignora RLS por padrão),
 * o desenho é: `SET LOCAL ROLE smcorp_rls` (role sem privilégio de dono)
 * DENTRO da transação — RLS já se aplica a role não-dono, sem FORCE.
 * Fora desta transação o app segue conectado como `smcorp` (comportamento
 * atual, zero regressão).
 */
@Injectable()
export class TenantRlsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Roda fn dentro de uma transação com RLS armado (SET LOCAL ROLE
   * smcorp_rls + app.tenant_id). Exige tenantId no contexto.
   */
  async withTenantRls<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const { tenantId } = this.tenantContext.get();
    if (!tenantId) {
      throw new Error(
        'withTenantRls exige tenantId no contexto — não use em fluxo de plataforma/público.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE smcorp_rls');
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
