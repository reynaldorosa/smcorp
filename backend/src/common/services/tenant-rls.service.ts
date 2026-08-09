import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(TenantRlsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Roda fn dentro de uma transação com RLS armado (SET LOCAL SESSION
   * AUTHORIZATION smcorp_rls + app.tenant_id). Exige tenantId no contexto.
   *
   * SESSION AUTHORIZATION (e não apenas SET ROLE): muda o session_user,
   * então um RESET ROLE dentro do callback não consegue voltar para o role
   * dono (`smcorp`) e desativar o RLS no meio da transação.
   */
  async withTenantRls<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const { tenantId } = this.tenantContext.get();
    if (!tenantId) {
      throw new Error(
        'withTenantRls exige tenantId no contexto — não use em fluxo de plataforma/público.',
      );
    }
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL SESSION AUTHORIZATION smcorp_rls`;
          await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
          return fn(tx);
        },
        // Timeout acima do default (5s/2s): operações que antes rodavam sem
        // transação não podem começar a estourar por causa do wrapper RLS.
        { timeout: 15_000, maxWait: 5_000 },
      );
    } catch (error) {
      // Sem este log, uma falha do RLS (ex.: role/GRANT ausente no banco)
      // vira um 500 genérico invisível nos logs de produção.
      this.logger.error(
        `RLS falhou para o tenant ${tenantId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
