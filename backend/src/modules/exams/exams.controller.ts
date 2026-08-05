import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import {
  ScheduleExamDto,
  RecordExamResultDto,
  UpdateExamStatusDto,
  CancelExamDto,
  ScheduleExamSchema,
  RecordExamResultSchema,
  UpdateExamStatusSchema,
  CancelExamSchema,
  UpdateExamDto,
  UpdateExamSchema,
} from './dto/exam.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { z } from 'zod';

const UpdateExamDateSchema = z.object({
  scheduledDate: z.string().transform((val) => new Date(val)),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato inválido, use HH:MM'),
});

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  /**
   * POST /exams/schedule
   * Agenda prova (verifica bloqueio de documentos)
   */
  @Post('schedule')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.CREATED)
  async scheduleExam(@Body(new ZodValidationPipe(ScheduleExamSchema)) body: ScheduleExamDto) {
    return this.examsService.scheduleExam(body);
  }

  /**
   * GET /exams/enrollment/:enrollmentId/can-schedule
   * Verifica se pode agendar prova (documentos OK?)
   */
  @Get('enrollment/:enrollmentId/can-schedule')
  @Roles('ADMIN', 'COLLABORATOR')
  async canScheduleExam(@Param('enrollmentId') enrollmentId: string) {
    return this.examsService.canScheduleExam(enrollmentId);
  }

  /**
   * POST /exams/:id/result
   * Registra resultado da prova
   */
  @Post(':id/result')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async recordExamResult(
    @Param('id') examId: string,
    @Body(new ZodValidationPipe(RecordExamResultSchema))
    body: Omit<RecordExamResultDto, 'examId'>,
  ) {
    return this.examsService.recordExamResult({
      examId,
      ...body,
    });
  }

  /**
   * POST /exams/:id/status
   * Atualiza status da prova
   */
  @Post(':id/status')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') examId: string,
    @Body(new ZodValidationPipe(UpdateExamStatusSchema))
    body: Omit<UpdateExamStatusDto, 'examId'>,
  ) {
    return this.examsService.updateStatus({
      examId,
      ...body,
    });
  }

  /**
   * POST /exams/:id/cancel
   * Cancela prova (versão com reason)
   */
  @Post(':id/cancel')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async cancelExamWithReason(
    @Param('id') examId: string,
    @Body(new ZodValidationPipe(CancelExamSchema))
    body: Omit<CancelExamDto, 'examId'>,
  ) {
    return this.examsService.cancelExamWithReason({
      examId,
      ...body,
    });
  }

  /**
   * GET /exams/enrollment/:enrollmentId
   * Lista provas de uma matrícula
   */
  @Get('enrollment/:enrollmentId')
  @Roles('ADMIN', 'COLLABORATOR')
  async getExamsByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.examsService.getExamsByEnrollment({ enrollmentId });
  }

  /**
   * GET /exams/instructor/:instructorId
   * Lista provas de um instrutor
   */
  @Get('instructor/:instructorId')
  @Roles('ADMIN', 'COLLABORATOR')
  async getExamsByInstructor(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.examsService.getExamsByInstructor({
      instructorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * GET /exams/operational
   * Lista provas agregadas para hidratação operacional (frontend API-first)
   */
  @Get('operational')
  @Roles('ADMIN', 'COLLABORATOR')
  async getOperationalExams() {
    return this.examsService.getOperationalExams();
  }

  /**
   * GET /exams/:id
   * Busca detalhes de uma prova
   */
  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  async findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  /**
   * PATCH /exams/:id/date
   * Atualiza data/hora da prova
   */
  @Patch(':id/date')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async updateExamDate(
    @Param('id') examId: string,
    @Body(new ZodValidationPipe(UpdateExamDateSchema))
    body: { scheduledDate: Date; scheduledTime: string },
  ) {
    return this.examsService.updateExamDate(examId, body);
  }

  /**
   * PATCH /exams/:id
   * Atualiza todos os campos da prova (exceto examCode)
   */
  @Patch(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async updateExam(
    @Param('id') examId: string,
    @Body(new ZodValidationPipe(UpdateExamSchema))
    body: UpdateExamDto,
  ) {
    return this.examsService.updateExam(examId, body);
  }

  /**
   * DELETE /exams/:id
   * Cancela uma prova
   */
  @Delete(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async deleteExam(@Param('id') examId: string) {
    return this.examsService.cancelExam(examId);
  }
}
