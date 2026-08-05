import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { TenantSignupDto, TenantSignupSchema } from './dto/tenant-signup.dto';
import { UpdateTenantStatusDto, UpdateTenantStatusSchema } from './dto/update-tenant-status.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post('signup')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
  })
  @ApiOperation({ summary: 'Onboarding de um novo tenant (centro de treinamento)' })
  signup(@Body(new ZodValidationPipe(TenantSignupSchema)) dto: TenantSignupDto) {
    return this.tenantsService.signup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do tenant autenticado (branding + assinatura)' })
  getTenantInfo(@Req() req: { user: { tenantId?: string } }) {
    if (!req.user?.tenantId) {
      return { tenant: null, message: 'Usuário de plataforma (sem tenant)' };
    }
    return this.tenantsService.getTenantInfo(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Billing do tenant: assinatura + faturas' })
  getBilling(@Req() req: { user: { tenantId?: string } }) {
    if (!req.user?.tenantId) {
      return { tenant: null, message: 'Usuário de plataforma (sem tenant)' };
    }
    return this.tenantsService.getBillingInfo(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post('billing/subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar assinatura do tenant (gera link de pagamento MP)' })
  subscribe(
    @Req() req: { user: { tenantId?: string; email: string } },
    @Body() body: { planName?: string; price?: number },
  ) {
    if (!req.user?.tenantId) {
      throw new BadRequestException('Usuário de plataforma não possui assinatura');
    }
    return this.tenantsService.subscribeToBilling(req.user.tenantId, req.user.email, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post('billing/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar assinatura ao fim do período atual' })
  cancelBilling(@Req() req: { user: { tenantId?: string } }) {
    if (!req.user?.tenantId) {
      throw new BadRequestException('Usuário de plataforma não possui assinatura');
    }
    return this.tenantsService.cancelBilling(req.user.tenantId);
  }

  // ============================================
  // SUPERADMIN (MASTER) — gestão de tenants
  //
  // ATENÇÃO: as rotas com parâmetro (`:id`) ficam por ÚLTIMO de propósito.
  // O Nest resolve as rotas na ordem de declaração — declarar `@Get(':id')`
  // antes de `@Get('billing')`/`@Get('me')` faria `:id` capturar essas URLs.
  // ============================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER)
  @Get('all')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Plataforma] Lista todos os tenants + métricas' })
  listAll() {
    return this.tenantsService.listAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Plataforma] Cria um tenant manualmente' })
  createTenant(@Body(new ZodValidationPipe(TenantSignupSchema)) dto: TenantSignupDto) {
    return this.tenantsService.createByPlatform(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Plataforma] Detalhe de um tenant (assinatura + faturas)' })
  getTenantById(@Param('id') id: string) {
    return this.tenantsService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Plataforma] Altera o status de um tenant' })
  updateTenantStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTenantStatusSchema)) body: UpdateTenantStatusDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.tenantsService.updateStatus(id, body.status, req.user.sub);
  }
}
