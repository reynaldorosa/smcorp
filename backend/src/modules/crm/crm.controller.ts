import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import {
  CreateContactSchema,
  CreateContactDto,
  UpdateContactSchema,
  UpdateContactDto,
} from './dto/contact.dto';
import {
  CreateActivitySchema,
  CreateActivityDto,
  UpdateActivitySchema,
  UpdateActivityDto,
} from './dto/activity.dto';
import {
  CreateDealSchema,
  CreateDealDto,
  UpdateDealSchema,
  UpdateDealDto,
  MoveDealSchema,
  MoveDealDto,
  LostDealSchema,
  LostDealDto,
} from './dto/deal.dto';
import {
  CreatePipelineStageSchema,
  CreatePipelineStageDto,
  UpdatePipelineStageSchema,
  UpdatePipelineStageDto,
  ReorderPipelineSchema,
  ReorderPipelineDto,
} from './dto/pipeline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// CRM não é lido como dado de referência por nenhum outro módulo (ao
// contrário de Cursos/Salas/Instrutores) — pode ser gated inteiro, leitura
// inclusa, no nível da classe.
@ApiTags('CRM')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireModule('modulo04')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ════════ DASHBOARD ════════
  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  getDashboard() {
    return this.crmService.getDashboard();
  }

  // ════════ CONTATOS ════════
  @Get('contacts')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findAllContacts(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    return this.crmService.findAllContacts({ status, source, assignedToId, search, tag });
  }

  @Get('contacts/stats')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  getContactStats() {
    return this.crmService.getContactStats();
  }

  @Get('contacts/:id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findOneContact(@Param('id') id: string) {
    return this.crmService.findOneContact(id);
  }

  @Post('contacts')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  createContact(@Body(new ZodValidationPipe(CreateContactSchema)) dto: CreateContactDto) {
    return this.crmService.createContact(dto);
  }

  @Patch('contacts/:id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  updateContact(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateContactSchema)) dto: UpdateContactDto,
  ) {
    return this.crmService.updateContact(id, dto);
  }

  @Delete('contacts/:id')
  @Roles(UserRole.ADMIN)
  deleteContact(@Param('id') id: string) {
    return this.crmService.deleteContact(id);
  }

  @Post('contacts/:id/convert')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  convertToStudent(@Param('id') id: string) {
    return this.crmService.convertToStudent(id);
  }

  // ════════ ATIVIDADES ════════
  @Get('contacts/:id/activities')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findContactActivities(@Param('id') id: string) {
    return this.crmService.findContactActivities(id);
  }

  @Post('activities')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  createActivity(@Body(new ZodValidationPipe(CreateActivitySchema)) dto: CreateActivityDto) {
    return this.crmService.createActivity(dto);
  }

  @Patch('activities/:id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  updateActivity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateActivitySchema)) dto: UpdateActivityDto,
  ) {
    return this.crmService.updateActivity(id, dto);
  }

  @Delete('activities/:id')
  @Roles(UserRole.ADMIN)
  deleteActivity(@Param('id') id: string) {
    return this.crmService.deleteActivity(id);
  }

  @Get('follow-ups')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  getPendingFollowUps() {
    return this.crmService.getPendingFollowUps();
  }

  // ════════ DEALS ════════
  @Get('deals')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findAllDeals(
    @Query('status') status?: string,
    @Query('stageId') stageId?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.crmService.findAllDeals({ status, stageId, contactId });
  }

  @Get('deals/stats')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  getDealStats() {
    return this.crmService.getDealStats();
  }

  @Post('deals')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  createDeal(@Body(new ZodValidationPipe(CreateDealSchema)) dto: CreateDealDto) {
    return this.crmService.createDeal(dto);
  }

  @Patch('deals/:id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  updateDeal(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDealSchema)) dto: UpdateDealDto,
  ) {
    return this.crmService.updateDeal(id, dto);
  }

  @Patch('deals/:id/move')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  moveDeal(@Param('id') id: string, @Body(new ZodValidationPipe(MoveDealSchema)) dto: MoveDealDto) {
    return this.crmService.moveDeal(id, dto);
  }

  @Post('deals/:id/won')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  markDealWon(@Param('id') id: string) {
    return this.crmService.markDealWon(id);
  }

  @Post('deals/:id/lost')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  markDealLost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LostDealSchema)) dto: LostDealDto,
  ) {
    return this.crmService.markDealLost(id, dto);
  }

  @Delete('deals/:id')
  @Roles(UserRole.ADMIN)
  deleteDeal(@Param('id') id: string) {
    return this.crmService.deleteDeal(id);
  }

  // ════════ PIPELINE ════════
  @Get('pipeline')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findAllStages() {
    return this.crmService.findAllStages();
  }

  @Post('pipeline')
  @Roles(UserRole.ADMIN)
  createStage(@Body(new ZodValidationPipe(CreatePipelineStageSchema)) dto: CreatePipelineStageDto) {
    return this.crmService.createStage(dto);
  }

  @Patch('pipeline/:id')
  @Roles(UserRole.ADMIN)
  updateStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePipelineStageSchema)) dto: UpdatePipelineStageDto,
  ) {
    return this.crmService.updateStage(id, dto);
  }

  @Patch('pipeline/reorder')
  @Roles(UserRole.ADMIN)
  reorderStages(@Body(new ZodValidationPipe(ReorderPipelineSchema)) dto: ReorderPipelineDto) {
    return this.crmService.reorderStages(dto);
  }

  @Delete('pipeline/:id')
  @Roles(UserRole.ADMIN)
  deleteStage(@Param('id') id: string) {
    return this.crmService.deleteStage(id);
  }
}
