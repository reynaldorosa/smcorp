import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { Prisma, PaymentType, PaymentCategory, PaymentStatus } from '@prisma/client';
import {
  CreatePaymentDto,
  CreateExpensePaymentDto,
  CreateIncomePaymentDto,
  RecordPaymentDto,
  UpdatePaymentStatusDto,
  GetPaymentsByEnrollmentDto,
  GetPaymentStatisticsDto,
  CreateBulkPaymentsDto,
} from './dto/payment.dto';
import { TenantContextService } from '../../common/services/tenant-context.service';
import { TenantRlsService } from '../../common/services/tenant-rls.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPago: MercadoPagoService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantRls: TenantRlsService,
  ) {}

  /**
   * MASTER/plataforma e jobs (sem tenantId no contexto): comportamento atual
   * sem RLS. Usuários de tenant: transação com RLS armado (role smcorp_rls +
   * app.tenant_id) como segunda camada de isolamento em `payments`.
   */
  private async runTenantScoped<T>(
    fn: (client: Prisma.TransactionClient | PrismaService) => Promise<T>,
  ): Promise<T> {
    const { tenantId } = this.tenantContext.get();
    if (!tenantId) return fn(this.prisma);
    return this.tenantRls.withTenantRls(fn);
  }

  private isPaymentStatus(status: string): status is PaymentStatus {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }

  /**
   * Cria novo pagamento
   * @param data - Dados do pagamento
   */
  async create(data: CreatePaymentDto) {
    // Verificar se matrícula existe
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        student: { select: { name: true } },
        class: {
          select: {
            companyId: true,
            course: { select: { name: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    // Criar pagamento
    return await this.runTenantScoped((client) =>
      client.payment.create({
        data: {
          enrollmentId: data.enrollmentId,
          type: PaymentType.INCOME,
          category: PaymentCategory.COURSE_FEE,
          amount: data.amount,
          dueDate: data.dueDate,
          paymentMethod: data.method,
          companyId: enrollment.class.companyId || undefined,
          description: data.description || `Pagamento - ${enrollment.class.course.name}`,
          status: PaymentStatus.PENDING,
        },
        include: {
          enrollment: {
            select: {
              student: { select: { name: true } },
              class: {
                select: {
                  code: true,
                  course: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    );
  }

  async createExpense(data: CreateExpensePaymentDto) {
    return await this.runTenantScoped((client) =>
      client.payment.create({
        data: {
          enrollmentId: null,
          kind: 'OTHER',
          type: PaymentType.EXPENSE,
          category: (data.category as PaymentCategory) || PaymentCategory.OTHER,
          amount: data.amount,
          dueDate: data.dueDate,
          paymentMethod: data.method,
          companyId: data.companyId || undefined,
          description: data.description,
          notes: data.notes,
          status: PaymentStatus.PENDING,
        },
      }),
    );
  }

  async createIncome(data: CreateIncomePaymentDto) {
    return await this.runTenantScoped((client) =>
      client.payment.create({
        data: {
          enrollmentId: null,
          kind: 'OTHER',
          type: PaymentType.INCOME,
          category: (data.category as PaymentCategory) || PaymentCategory.OTHER,
          amount: data.amount,
          dueDate: data.dueDate,
          paymentMethod: data.method,
          companyId: data.companyId || undefined,
          description: data.description,
          notes: data.notes,
          status: PaymentStatus.PENDING,
        },
      }),
    );
  }

  /**
   * Cria pagamentos parcelados
   * @param data - Dados do parcelamento
   */
  async createBulkPayments(data: CreateBulkPaymentsDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      select: {
        id: true,
        class: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    const installmentAmount = data.totalAmount / data.installments;
    const payments: Prisma.PaymentCreateManyInput[] = [];

    for (let i = 0; i < data.installments; i++) {
      const dueDate = new Date(data.firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      payments.push({
        enrollmentId: data.enrollmentId,
        type: PaymentType.INCOME,
        category: PaymentCategory.COURSE_FEE,
        amount: installmentAmount,
        dueDate,
        paymentMethod: data.method,
        companyId: enrollment.class.companyId || undefined,
        description: `Parcela ${i + 1}/${data.installments}`,
        status: PaymentStatus.PENDING,
      });
    }

    // createMany funciona dentro do callback transacional do Prisma
    return await this.runTenantScoped((client) =>
      client.payment.createMany({
        data: payments,
      }),
    );
  }

  /**
   * Registra pagamento recebido
   * @param data - Dados do pagamento
   */
  async recordPayment(data: RecordPaymentDto) {
    const payment = await this.runTenantScoped((client) =>
      client.payment.findUnique({
        where: { id: data.paymentId },
        select: {
          id: true,
          status: true,
          companyId: true,
        },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status === 'PAID') {
      throw new ConflictException('Pagamento já foi registrado');
    }

    if (payment.status === 'CANCELLED') {
      throw new BadRequestException('Pagamento cancelado não pode ser pago');
    }

    const invoiceNumber = data.invoiceNumber?.trim();
    if (payment.companyId && !invoiceNumber) {
      throw new BadRequestException('Número da Nota Fiscal é obrigatório para pagamentos PJ');
    }

    const paidAt = data.paidAt || new Date();

    return await this.runTenantScoped((client) =>
      client.payment.update({
        where: { id: data.paymentId },
        data: {
          status: 'PAID',
          paidAt,
          paymentMethod: data.method,
          invoiceNumber: invoiceNumber || null,
          notes: data.notes,
        },
        include: {
          enrollment: {
            select: {
              student: { select: { name: true } },
            },
          },
        },
      }),
    );
  }

  /**
   * Atualiza status do pagamento
   * @param data - Novo status
   */
  async updateStatus(data: UpdatePaymentStatusDto) {
    const payment = await this.runTenantScoped((client) =>
      client.payment.findUnique({
        where: { id: data.paymentId },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Validar transições de status
    if (payment.status === 'PAID' && data.status === 'PENDING') {
      throw new BadRequestException('Pagamento pago não pode voltar para pendente');
    }

    const updateData: Prisma.PaymentUpdateInput = {
      status: data.status as PaymentStatus,
    };

    // Se cancelando, adicionar motivo
    if (data.status === 'CANCELLED' && data.reason) {
      updateData.notes = data.reason;
    }

    // Se marcando como vencido, verificar data
    if (data.status === 'OVERDUE') {
      const today = new Date();
      if (payment.dueDate > today) {
        throw new BadRequestException('Pagamento ainda não venceu');
      }
    }

    return await this.runTenantScoped((client) =>
      client.payment.update({
        where: { id: data.paymentId },
        data: updateData,
      }),
    );
  }

  /**
   * Busca pagamentos de uma matrícula
   * @param data - ID da matrícula
   */
  async getByEnrollment(data: GetPaymentsByEnrollmentDto) {
    return await this.runTenantScoped((client) =>
      client.payment.findMany({
        where: {
          enrollmentId: data.enrollmentId,
          deletedAt: null,
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
    );
  }

  /**
   * Busca detalhes de um pagamento
   * @param paymentId - ID do pagamento
   */
  async findOne(paymentId: string) {
    const payment = await this.runTenantScoped((client) =>
      client.payment.findUnique({
        where: { id: paymentId },
        include: {
          enrollment: {
            include: {
              student: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              class: {
                select: {
                  code: true,
                  course: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return payment;
  }

  /**
   * Estatísticas de pagamentos
   * @param data - Filtros
   */
  async getStatistics(data: GetPaymentStatisticsDto) {
    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
    };

    if (data.startDate || data.endDate) {
      where.dueDate = {};
      if (data.startDate) where.dueDate.gte = data.startDate;
      if (data.endDate) where.dueDate.lte = data.endDate;
    }

    if (data.status && this.isPaymentStatus(data.status)) {
      where.status = data.status;
    }

    if (data.companyId) {
      where.enrollment = {
        class: {
          companyId: data.companyId,
        },
      };
    }

    // findMany + groupBy no MESMO client (uma transação só quando RLS ativo)
    const [payments, aggregations] = await this.runTenantScoped(async (client) => {
      const [items, groups] = await Promise.all([
        client.payment.findMany({
          where,
          select: {
            status: true,
            amount: true,
            paidAt: true,
          },
        }),
        client.payment.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);
      return [items, groups] as const;
    });

    const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalReceived = payments
      .filter((p) => p.paidAt)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      summary: {
        totalExpected,
        totalReceived,
        totalPending: totalExpected - totalReceived,
        count: payments.length,
      },
      byStatus: aggregations.map((agg) => ({
        status: agg.status,
        count: agg._count?.id || 0,
        totalAmount: Number(agg._sum?.amount || 0),
        totalPaid: 0, // Campo não existe no schema, calculado acima
      })),
    };
  }

  /**
   * Marca pagamentos vencidos automaticamente.
   * Roda em job (sem request) — sem tenantId no contexto, mantém o
   * comportamento atual (executa sem RLS, como antes desta mudança).
   */
  async markOverduePayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.runTenantScoped((client) =>
      client.payment.updateMany({
        where: {
          status: 'PENDING',
          dueDate: { lt: today },
          deletedAt: null,
        },
        data: {
          status: 'OVERDUE',
        },
      }),
    );

    return {
      message: `${result.count} pagamentos marcados como vencidos`,
      count: result.count,
    };
  }

  /**
   * Lista todos os pagamentos com paginação
   */
  async findAll(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = { deletedAt: null };

    if (status && this.isPaymentStatus(status)) {
      where.status = status;
    }

    // findMany + count no MESMO client (uma transação só quando RLS ativo)
    const [payments, total] = await this.runTenantScoped(async (client) => {
      const [items, count] = await Promise.all([
        client.payment.findMany({
          where,
          include: {
            enrollment: {
              select: {
                student: { select: { name: true } },
                class: {
                  select: {
                    code: true,
                    course: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { dueDate: 'desc' },
          skip,
          take: limit,
        }),
        client.payment.count({ where }),
      ]);
      return [items, count] as const;
    });

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Remove pagamento (soft delete)
   */
  async remove(paymentId: string) {
    const payment = await this.runTenantScoped((client) =>
      client.payment.findUnique({
        where: { id: paymentId },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status === 'PAID') {
      throw new ConflictException('Pagamento pago não pode ser removido. Use estorno.');
    }

    return await this.runTenantScoped((client) =>
      client.payment.update({
        where: { id: paymentId },
        data: { deletedAt: new Date() },
      }),
    );
  }

  // ============================================
  // CHECKOUT ONLINE (PIX via Mercado Pago)
  // ============================================

  /**
   * Cria checkout PIX para o pagamento pendente mais antigo da matrícula.
   * O webhook do MP marca o pagamento como pago e confirma a matrícula.
   */
  async createCheckout(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { name: true, email: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    const pending = await this.runTenantScoped((client) =>
      client.payment.findFirst({
        where: {
          enrollmentId,
          deletedAt: null,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        orderBy: { dueDate: 'asc' },
      }),
    );

    if (!pending) {
      throw new BadRequestException('Matrícula sem pagamentos pendentes para checkout');
    }

    if (!enrollment.student.email) {
      throw new BadRequestException(
        'Aluno sem e-mail cadastrado — o PIX exige um e-mail do pagador.',
      );
    }

    const checkout = await this.mercadoPago.createPixPayment({
      amount: Number(pending.amount),
      payerEmail: enrollment.student.email,
      externalReference: pending.id,
      description: pending.description || 'Pagamento de matrícula',
    });

    await this.runTenantScoped((client) =>
      client.payment.update({
        where: { id: pending.id },
        data: {
          transactionId: checkout.providerPaymentId,
          paymentMethod: 'PIX',
        },
      }),
    );

    return {
      paymentId: pending.id,
      amount: Number(pending.amount),
      description: pending.description,
      qrCode: checkout.qrCode,
      qrCodeBase64: checkout.qrCodeBase64,
      providerPaymentId: checkout.providerPaymentId,
      status: 'PENDING',
    };
  }

  /**
   * Status atual do checkout (para polling quando o webhook não alcança)
   */
  async getCheckoutStatus(paymentId: string) {
    const payment = await this.runTenantScoped((client) =>
      client.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          status: true,
          amount: true,
          transactionId: true,
          paidAt: true,
          paymentMethod: true,
        },
      }),
    );

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return payment;
  }
}
