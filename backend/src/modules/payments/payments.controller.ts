import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  RecordPaymentDto,
  UpdatePaymentStatusDto,
  CreateBulkPaymentsDto,
  CreateExpensePaymentDto,
  CreateIncomePaymentDto,
  GetPaymentStatisticsDto,
  CreatePaymentSchema,
  CreateExpensePaymentSchema,
  CreateIncomePaymentSchema,
  RecordPaymentSchema,
  UpdatePaymentStatusSchema,
  CreateBulkPaymentsSchema,
} from './dto/payment.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';

// Igual à regra do frontend (route-module-map.ts): /pagamentos libera com
// modulo07 OU modulo08 ("any"). Pagamentos não é lido como referência por
// nenhum outro módulo — gated inteiro, leitura inclusa.
@ApiTags('payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireModule('modulo07', 'modulo08')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments
   * Cria novo pagamento
   */
  @Post()
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(CreatePaymentSchema)) body: CreatePaymentDto) {
    return this.paymentsService.create(body);
  }

  /**
   * POST /payments/expense
   * Cria novo lançamento de despesa
   */
  @Post('expense')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Body(new ZodValidationPipe(CreateExpensePaymentSchema)) body: CreateExpensePaymentDto,
  ) {
    return this.paymentsService.createExpense(body);
  }

  /**
   * POST /payments/income
   * Cria novo lançamento de receita manual
   */
  @Post('income')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  async createIncome(
    @Body(new ZodValidationPipe(CreateIncomePaymentSchema)) body: CreateIncomePaymentDto,
  ) {
    return this.paymentsService.createIncome(body);
  }

  /**
   * POST /payments/bulk
   * Cria pagamentos parcelados
   */
  @Post('bulk')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @Body(new ZodValidationPipe(CreateBulkPaymentsSchema))
    body: CreateBulkPaymentsDto,
  ) {
    return this.paymentsService.createBulkPayments(body);
  }

  /**
   * POST /payments/:id/record
   * Registra pagamento recebido
   */
  @Post(':id/record')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async recordPayment(
    @Param('id') paymentId: string,
    @Body(new ZodValidationPipe(RecordPaymentSchema))
    body: Omit<RecordPaymentDto, 'paymentId'>,
  ) {
    return this.paymentsService.recordPayment({
      paymentId,
      ...body,
    });
  }

  /**
   * PUT /payments/:id/status
   * Atualiza status do pagamento
   */
  @Put(':id/status')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async updateStatus(
    @Param('id') paymentId: string,
    @Body(new ZodValidationPipe(UpdatePaymentStatusSchema))
    body: Omit<UpdatePaymentStatusDto, 'paymentId'>,
  ) {
    return this.paymentsService.updateStatus({
      paymentId,
      ...body,
    });
  }

  /**
   * GET /payments/enrollment/:enrollmentId
   * Lista pagamentos de uma matrícula
   */
  @Get('enrollment/:enrollmentId')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async getByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.paymentsService.getByEnrollment({ enrollmentId });
  }

  /**
   * GET /payments/statistics
   * Estatísticas de pagamentos
   */
  @Get('statistics')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      companyId,
      status: status as GetPaymentStatisticsDto['status'],
    });
  }

  /**
   * POST /payments/mark-overdue
   * Marca pagamentos vencidos
   */
  @Post('mark-overdue')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.OK)
  async markOverdue() {
    return this.paymentsService.markOverduePayments();
  }

  /**
   * GET /payments
   * Lista todos os pagamentos
   */
  @Get()
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  /**
   * GET /payments/:id/checkout-status
   * Status do checkout online (polling quando o webhook não alcança o servidor)
   */
  @Get(':id/checkout-status')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async getCheckoutStatus(@Param('id') paymentId: string) {
    return this.paymentsService.getCheckoutStatus(paymentId);
  }

  /**
   * POST /payments/checkout
   * Cria checkout PIX (Mercado Pago) para o pagamento pendente mais antigo da matrícula
   */
  @Post('checkout')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.CREATED)
  async createCheckout(@Body() body: { enrollmentId: string }) {
    if (!body?.enrollmentId) {
      throw new BadRequestException('enrollmentId é obrigatório');
    }
    return this.paymentsService.createCheckout(body.enrollmentId);
  }

  /**
   * GET /payments/:id
   * Busca detalhes de um pagamento
   */
  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  /**
   * DELETE /payments/:id
   * Remove pagamento (soft delete)
   */
  @Delete(':id')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.paymentsService.remove(id);
  }
}
