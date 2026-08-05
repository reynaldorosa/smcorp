import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CostsService } from './costs.service';
import { CreateCostDto, CreateCostSchema } from './dto/create-cost.dto';
import { UpdateCostDto, UpdateCostSchema } from './dto/update-cost.dto';
import { CreateCostEntryDto, CreateCostEntrySchema } from './dto/create-cost-entry.dto';
import {
  UpdateCostEntryDto,
  UpdateCostEntrySchema,
  PayCostEntryDto,
  PayCostEntrySchema,
} from './dto/update-cost-entry.dto';
import {
  CreateCostCriterionDto,
  CreateCostCriterionSchema,
  UpdateCostCriterionDto,
  UpdateCostCriterionSchema,
} from './dto/cost-criterion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// Igual à regra do frontend: /costs libera com modulo07 OU modulo08.
@ApiTags('Costs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireModule('modulo07', 'modulo08')
@Controller('costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  // ==========================================
  // COSTS CRUD
  // ==========================================

  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Criar custo' })
  create(@Body(new ZodValidationPipe(CreateCostSchema)) createDto: CreateCostDto) {
    return this.costsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar custos' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('isAuditable') isAuditable?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedIsAuditable =
      isAuditable === undefined ? undefined : isAuditable === 'true' || isAuditable === '1';

    return this.costsService.findAll(page, limit, parsedIsAuditable, category, startDate, endDate);
  }

  // ==========================================
  // COST ENTRIES CRUD (before :id routes)
  // ==========================================

  @Post('entries')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Criar lançamento de custo' })
  createEntry(
    @Body(new ZodValidationPipe(CreateCostEntrySchema))
    body: CreateCostEntryDto,
  ) {
    return this.costsService.createEntry(body);
  }

  @Get('entries')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar lançamentos de custo' })
  findAllEntries(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.costsService.findAllEntries(page, limit);
  }

  @Get('entries/:entryId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar lançamento de custo por ID' })
  findOneEntry(@Param('entryId') entryId: string) {
    return this.costsService.findOneEntry(entryId);
  }

  @Put('entries/:entryId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Atualizar lançamento de custo' })
  updateEntry(
    @Param('entryId') entryId: string,
    @Body(new ZodValidationPipe(UpdateCostEntrySchema))
    body: UpdateCostEntryDto,
  ) {
    return this.costsService.updateEntry(entryId, body);
  }

  @Post('entries/:entryId/pay')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Confirmar pagamento de lançamento de custo' })
  payEntry(
    @Param('entryId') entryId: string,
    @Body(new ZodValidationPipe(PayCostEntrySchema))
    body: PayCostEntryDto,
  ) {
    return this.costsService.payEntry(entryId, body.paidAt);
  }

  @Delete('entries/:entryId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Remover lançamento de custo' })
  removeEntry(@Param('entryId') entryId: string) {
    return this.costsService.removeEntry(entryId);
  }

  // ==========================================
  // COST CRITERIA CRUD (before :id to avoid route conflict)
  // ==========================================

  @Post('criteria')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Criar critério de custo' })
  createCriterion(
    @Body(new ZodValidationPipe(CreateCostCriterionSchema))
    body: CreateCostCriterionDto,
  ) {
    return this.costsService.createCriterion(body);
  }

  @Get('criteria')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar critérios de custo' })
  findAllCriteria(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.costsService.findAllCriteria(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('criteria/:criterionId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar critério por ID' })
  findOneCriterion(@Param('criterionId') criterionId: string) {
    return this.costsService.findOneCriterion(criterionId);
  }

  @Put('criteria/:criterionId')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Atualizar critério de custo' })
  updateCriterion(
    @Param('criterionId') criterionId: string,
    @Body(new ZodValidationPipe(UpdateCostCriterionSchema))
    body: UpdateCostCriterionDto,
  ) {
    return this.costsService.updateCriterion(criterionId, body);
  }

  @Delete('criteria/:criterionId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Deletar critério de custo' })
  removeCriterion(@Param('criterionId') criterionId: string) {
    return this.costsService.removeCriterion(criterionId);
  }

  // ==========================================
  // COST :id ROUTES (after criteria to avoid conflict)
  // ==========================================

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar custo por ID' })
  findOne(@Param('id') id: string) {
    return this.costsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Atualizar custo' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCostSchema)) updateDto: UpdateCostDto,
  ) {
    return this.costsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Deletar custo' })
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}
