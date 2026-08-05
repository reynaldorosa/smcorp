import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompanySettingsService } from './company-settings.service';
import {
  UpdateCompanySettingsDto,
  UpdateCompanySettingsSchema,
} from './dto/update-company-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Company Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireModule('modulo00')
@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  // Diferente de Salas/Instrutores: isto guarda segredos (banco, SMTP,
  // WhatsApp) por empresa, não dado de referência lido por outros módulos —
  // gateia leitura E escrita, não só a escrita.
  @Get(':companyId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Obter configurações da empresa' })
  @ApiResponse({ status: 200, description: 'Configurações retornadas com sucesso' })
  async getSettings(@Param('companyId') companyId: string) {
    return this.companySettingsService.getSettings(companyId);
  }

  @Put(':companyId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar configurações da empresa' })
  @ApiResponse({ status: 200, description: 'Configurações atualizadas com sucesso' })
  async updateSettings(
    @Param('companyId') companyId: string,
    @Body(new ZodValidationPipe(UpdateCompanySettingsSchema))
    updateDto: UpdateCompanySettingsDto,
  ) {
    return this.companySettingsService.updateSettings(companyId, updateDto);
  }
}
