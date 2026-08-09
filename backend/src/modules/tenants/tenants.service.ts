import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantSignupDto } from './dto/tenant-signup.dto';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { CommunicationService } from '../communication/communication.service';
import { TenantStatusCacheService } from '../../common/services/tenant-status-cache.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TenantStatus } from '@prisma/client';

const TRIAL_DAYS = 14;

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mercadoPago: MercadoPagoService,
    private readonly communicationService: CommunicationService,
    private readonly tenantStatusCache: TenantStatusCacheService,
  ) {}

  /**
   * Núcleo transacional do provisionamento de um tenant:
   * cria Tenant (TRIAL) + Subscription (TRIAL) + usuário ADMIN.
   * Compartilhado pelo onboarding público (signup) e pela plataforma (createByPlatform).
   */
  private async provisionTenantCore(dto: TenantSignupDto) {
    const normalizedEmail = dto.adminEmail.trim().toLowerCase();
    const slug = dto.slug.trim().toLowerCase();

    // Validações de unicidade
    const [existingSlug, existingEmail, existingCnpj] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.user.findFirst({
        where: { email: normalizedEmail, deletedAt: null },
        select: { id: true },
      }),
      dto.cnpj
        ? this.prisma.tenant.findUnique({ where: { cnpj: dto.cnpj }, select: { id: true } })
        : null,
    ]);

    if (existingSlug) {
      throw new ConflictException('Este slug já está em uso');
    }
    if (existingEmail) {
      throw new ConflictException('Este e-mail já está cadastrado');
    }
    if (existingCnpj) {
      throw new ConflictException('Este CNPJ já está cadastrado');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const provisioned = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          slug,
          name: dto.tenantName.trim(),
          cnpj: dto.cnpj || null,
          status: 'TRIAL',
          branding: {
            institutionName: dto.tenantName.trim(),
          },
          trialEndsAt,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: created.id,
          provider: 'MERCADO_PAGO',
          status: 'TRIAL',
          trialEndsAt,
          price: 0,
        },
      });

      const admin = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: passwordHash,
          name: dto.adminName.trim(),
          role: 'ADMIN',
          isActive: true,
          tenantId: created.id,
        },
      });

      return { created, admin };
    });

    return {
      tenant: provisioned.created,
      admin: provisioned.admin,
      normalizedEmail,
      adminName: dto.adminName.trim(),
    };
  }

  /**
   * E-mail de boas-vindas (fire-and-forget — falha não bloqueia o provisionamento)
   */
  private sendWelcomeEmail(
    tenant: { id: string; name: string; trialEndsAt?: Date | null },
    normalizedEmail: string,
    adminName: string,
  ) {
    void this.communicationService
      .send({
        tenantId: tenant.id,
        channel: 'email',
        recipient: normalizedEmail,
        subject: `Bem-vindo(a) à plataforma! Seu centro "${tenant.name}" está ativo`,
        html: `<p>Olá <strong>${adminName}</strong>,</p>
<p>Sua conta na plataforma foi criada com sucesso. Seu centro de treinamento
<strong>${tenant.name}</strong> está em período de teste até
<strong>${tenant.trialEndsAt?.toLocaleDateString('pt-BR')}</strong>.</p>
<p>Acesse a plataforma, cadastre seus cursos e comece a gerenciar seus treinamentos.</p>`,
      })
      .catch((error) =>
        this.logger.warn(
          `Falha ao enviar boas-vindas para ${normalizedEmail}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
  }

  /**
   * Onboarding público de um novo tenant (centro de treinamento).
   * O usuário já sai autenticado (tokens gerados na hora).
   */
  async signup(dto: TenantSignupDto) {
    try {
      const { tenant, admin, normalizedEmail, adminName } = await this.provisionTenantCore(dto);

      // Auto-login: gera tokens do novo admin.
      // `sub` é sempre o ID do USUÁRIO (mesmo contrato do auth.service) —
      // é assim que /users/profile, o PIN do master e a auditoria o resolvem.
      const payload = {
        sub: admin.id,
        email: normalizedEmail,
        role: 'ADMIN',
        tenantId: tenant.id,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
        }),
        this.jwtService.signAsync(payload, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
        }),
      ]);

      this.logger.log(`Novo tenant criado: ${tenant.slug} (${tenant.id})`);

      this.sendWelcomeEmail(tenant, normalizedEmail, adminName);

      return {
        accessToken,
        refreshToken,
        user: {
          id: admin.id,
          email: normalizedEmail,
          name: adminName,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha no onboarding do tenant ${dto.slug}`, message);
      throw new BadRequestException('Não foi possível criar o tenant. Tente novamente.');
    }
  }

  /**
   * Cria um tenant pela plataforma (superadmin MASTER): mesmo provisionamento
   * do signup, porém sem auto-login — as credenciais do admin são retornadas.
   */
  async createByPlatform(dto: TenantSignupDto) {
    try {
      const { tenant, normalizedEmail, adminName } = await this.provisionTenantCore(dto);

      this.logger.log(`Tenant criado pela plataforma: ${tenant.slug} (${tenant.id})`);

      this.sendWelcomeEmail(tenant, normalizedEmail, adminName);

      return {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          status: tenant.status,
          trialEndsAt: tenant.trialEndsAt,
        },
        adminEmail: normalizedEmail,
        adminName,
        message: 'Centro de treinamento criado com sucesso',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao criar tenant pela plataforma: ${dto.slug}`, message);
      throw new BadRequestException('Não foi possível criar o tenant. Tente novamente.');
    }
  }

  /**
   * Dados do tenant autenticado (branding + status da assinatura)
   */
  async getTenantInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        cnpj: true,
        status: true,
        branding: true,
        trialEndsAt: true,
        createdAt: true,
        subscription: {
          select: {
            id: true,
            planName: true,
            price: true,
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    return tenant;
  }

  // ============================================
  // BILLING (assinatura do tenant)
  // ============================================

  /**
   * Dados completos de billing: assinatura + status + faturas recentes
   */
  async getBillingInfo(tenantId: string) {
    const info = await this.getTenantInfo(tenantId);

    const invoices = await this.prisma.payment.findMany({
      where: {
        tenantId,
        kind: 'SUBSCRIPTION_FEE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return {
      ...info,
      paymentGatewayConfigured: this.mercadoPago.isConfigured(),
      invoices,
    };
  }

  /**
   * Ativa a assinatura do tenant: cria preapproval no Mercado Pago
   * (preço customizado por tenant) e devolve o link de pagamento.
   */
  async subscribeToBilling(
    tenantId: string,
    adminEmail: string,
    dto: { planName?: string; price?: number },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    const subscription =
      tenant.subscription ||
      (await this.prisma.subscription.create({
        data: {
          tenantId,
          provider: 'MERCADO_PAGO',
          status: 'TRIAL',
          trialEndsAt: tenant.trialEndsAt,
          price: 0,
        },
      }));

    // Preço customizado por tenant (negociado), definido na ativação
    const price = dto.price !== undefined ? dto.price : Number(subscription.price);
    if (!price || price <= 0) {
      throw new BadRequestException(
        'Defina o valor mensal da assinatura (price > 0) antes de ativar.',
      );
    }
    const planName = dto.planName || subscription.planName || 'Plano Caiso';

    const mp = await this.mercadoPago.createSubscription({
      tenantId,
      tenantName: tenant.name,
      adminEmail,
      price,
      planName,
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        providerSubscriptionId: mp.providerSubscriptionId,
        planName,
        price,
      },
    });

    return {
      providerSubscriptionId: mp.providerSubscriptionId,
      initPoint: mp.initPoint,
      status: mp.status,
      planName,
      price,
      message: 'Assinatura criada. Finalize o pagamento no link do Mercado Pago para ativar.',
    };
  }

  /**
   * Cancela a assinatura no fim do período atual (mantém acesso até lá)
   */
  async cancelBilling(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new BadRequestException('Tenant não possui assinatura');
    }

    if (subscription.providerSubscriptionId) {
      try {
        await this.mercadoPago.cancelSubscription(subscription.providerSubscriptionId);
      } catch (error) {
        this.logger.warn(
          `Falha ao cancelar preapproval ${subscription.providerSubscriptionId} no MP: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return {
      success: true,
      message: 'Assinatura será cancelada ao final do período atual',
    };
  }

  // ============================================
  // PLATAFORMA (superadmin MASTER — gestão de tenants)
  // ============================================

  /**
   * Lista todos os tenants da plataforma + métricas agregadas.
   * Tenant/Subscription não são escopados pelo middleware multi-tenant
   * e o MASTER não possui tenantId → consulta sem filtro.
   */
  async listAll() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [tenants, invoicesAgg] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              planName: true,
              price: true,
              status: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
          _count: { select: { users: true, enrollments: true, payments: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          deletedAt: null,
          kind: 'SUBSCRIPTION_FEE',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const metrics = {
      total: tenants.length,
      trial: tenants.filter((t) => t.status === 'TRIAL').length,
      active: tenants.filter((t) => t.status === 'ACTIVE').length,
      suspended: tenants.filter((t) => t.status === 'SUSPENDED').length,
      cancelled: tenants.filter((t) => t.status === 'CANCELLED').length,
      invoicesMonth: Number(invoicesAgg._sum.amount || 0),
      invoicesMonthCount: invoicesAgg._count,
    };

    return { tenants, metrics };
  }

  /**
   * Detalhe de um tenant pela plataforma: assinatura + contagens + faturas recentes.
   */
  async getById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            id: true,
            planName: true,
            price: true,
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        _count: { select: { users: true, enrollments: true, payments: true } },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    const invoices = await this.prisma.payment.findMany({
      where: {
        tenantId: id,
        kind: 'SUBSCRIPTION_FEE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return { ...tenant, invoices };
  }

  /**
   * Altera o status de um tenant pela plataforma (TRIAL/ACTIVE/SUSPENDED/CANCELLED).
   * Suspensão/cancelamento já bloqueia o acesso do tenant via TenantInterceptor.
   */
  async updateStatus(id: string, status: TenantStatus, actorId?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status },
    });

    // O TenantInterceptor cacheia o status por 60s — sem invalidar, a suspensão
    // (ou a reativação) só valeria no próximo TTL.
    this.tenantStatusCache.invalidate(id);

    await this.prisma.auditLog.create({
      data: {
        tableName: 'Tenant',
        recordId: id,
        action: 'UPDATE',
        userId: actorId,
        newData: {
          status,
          previousStatus: tenant.status,
          changedBy: 'PLATAFORMA',
        },
      },
    });

    this.logger.log(
      `Status do tenant ${tenant.name} (${id}): ${tenant.status} → ${status} (por ${actorId || 'sistema'})`,
    );

    return {
      tenant: updated,
      message: `Status atualizado para ${status}`,
    };
  }
}
