import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContextService } from '../common/services/tenant-context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Modelos que devem usar soft delete
  private readonly softDeleteModels = [
    'User',
    'Company',
    'CompanySettings',
    'Student',
    'Course',
    'Room',
    'Class',
    'Enrollment',
    'Payment',
    'Cost',
    'ExtraProduct',
    'Supplier',
    'Instructor',
  ];

  // Modelos isolados por tenant (Tenant/Subscription NÃO são — são da plataforma)
  private readonly tenantScopedModels = [
    'User',
    'Company',
    'CompanySettings',
    'Student',
    'Course',
    'Room',
    'Class',
    'Enrollment',
    'Payment',
    'Cost',
    'CostCriterion',
    'CostEntry',
    'ExtraProduct',
    'Supplier',
    'Instructor',
    'CourseCost',
    'StudentDocument',
    'Exam',
    'EnrollmentExtraProduct',
    'Certificate',
    'CertificateTemplate',
    'CRMContact',
    'CRMActivity',
    'CRMPipelineStage',
    'CRMDeal',
    'AuditLog',
    // Vínculo turma↔instrutor e presença (M03). Não entram em softDeleteModels:
    // o `deletedAt` é tratado explicitamente no service, que precisa enxergar
    // vínculos já removidos para reativá-los em vez de duplicar.
    'ClassInstructor',
    'InstructorAttendance',
  ];

  constructor(private readonly tenantContext: TenantContextService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Middleware de soft delete
    this.$use(this.softDeleteMiddleware.bind(this));
    // Middleware de isolamento multi-tenant
    this.$use(this.tenantMiddleware.bind(this));
  }

  /**
   * Middleware de isolamento multi-tenant:
   * - Leitura (findMany/findFirst/count/aggregate/groupBy): injeta where.tenantId
   * - Escrita (create/createMany/update/updateMany/upsert): injeta data.tenantId
   * Aplicado apenas quando a requisição tem tenantId no contexto
   * (usuário autenticado de um tenant). Plataforma (MASTER), fluxos
   * públicos e operações de sistema (system=true) não são filtrados.
   */
  private async tenantMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ) {
    const context = this.tenantContext.get();
    const tenantId = context.tenantId;

    if (
      !tenantId ||
      context.system === true ||
      !params.model ||
      !this.tenantScopedModels.includes(params.model)
    ) {
      return next(params);
    }

    params.args = params.args || {};

    // Leitura: filtra por tenant
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'findMany' ||
      params.action === 'count' ||
      params.action === 'aggregate' ||
      params.action === 'groupBy'
    ) {
      params.args.where = params.args.where || {};
      // undefined OU null: um `where.tenantId = null` explícito casaria com
      // registros de plataforma (tenantId IS NULL) e furaria o isolamento —
      // sempre força o tenant do contexto.
      if (params.args.where.tenantId === undefined || params.args.where.tenantId === null) {
        params.args.where.tenantId = tenantId;
      }
    }

    // Escrita: vincula o registro ao tenant
    if (params.action === 'create') {
      params.args.data = params.args.data || {};
      params.args.data.tenantId = tenantId;
    }

    if (params.action === 'createMany') {
      const data = params.args.data;
      if (Array.isArray(data)) {
        params.args.data = data.map((item) => ({ ...item, tenantId }));
      } else if (data && typeof data === 'object') {
        params.args.data = { ...data, tenantId };
      }
    }

    if (params.action === 'update' || params.action === 'delete') {
      params.args.where = params.args.where || {};
      // undefined OU null: um `where.tenantId = null` explícito casaria com
      // registros de plataforma (tenantId IS NULL) e furaria o isolamento —
      // sempre força o tenant do contexto.
      if (params.args.where.tenantId === undefined || params.args.where.tenantId === null) {
        params.args.where.tenantId = tenantId;
      }
    }

    if (params.action === 'updateMany' || params.action === 'deleteMany') {
      params.args.where = params.args.where || {};
      // undefined OU null: um `where.tenantId = null` explícito casaria com
      // registros de plataforma (tenantId IS NULL) e furaria o isolamento —
      // sempre força o tenant do contexto.
      if (params.args.where.tenantId === undefined || params.args.where.tenantId === null) {
        params.args.where.tenantId = tenantId;
      }
      // deleteMany vira updateMany (soft delete) — não mexe no data do tenant
    }

    if (params.action === 'upsert') {
      params.args.create = params.args.create || {};
      params.args.update = params.args.update || {};
      params.args.create.tenantId = tenantId;
      params.args.update.tenantId = tenantId;
      params.args.where = params.args.where || {};
      // undefined OU null: um `where.tenantId = null` explícito casaria com
      // registros de plataforma (tenantId IS NULL) e furaria o isolamento —
      // sempre força o tenant do contexto.
      if (params.args.where.tenantId === undefined || params.args.where.tenantId === null) {
        params.args.where.tenantId = tenantId;
      }
    }

    return next(params);
  }

  /**
   * Middleware que automatiza soft delete:
   * - Adiciona filtro deletedAt: null em consultas find*
   * - Transforma delete em update com deletedAt
   * - Transforma deleteMany em updateMany com deletedAt
   */
  private async softDeleteMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ) {
    // Verifica se é um modelo com soft delete
    if (params.model && this.softDeleteModels.includes(params.model)) {
      // Adiciona filtro deletedAt: null em operações de leitura
      if (
        params.action === 'findUnique' ||
        params.action === 'findFirst' ||
        params.action === 'findMany' ||
        params.action === 'count' ||
        params.action === 'aggregate'
      ) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};

        // Só adiciona o filtro se deletedAt não foi especificado
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }

      // Transforma delete em update com deletedAt
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }

      // Transforma deleteMany em updateMany com deletedAt
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data.deletedAt = new Date();
        } else {
          params.args.data = { deletedAt: new Date() };
        }
      }
    }

    return next(params);
  }

  async onModuleInit() {
    const maxRetries = 5;
    const baseDelay = 2000; // 2s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        this.logger.log('Soft delete middleware enabled for all models');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error('Could not connect to database after all retries');
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
