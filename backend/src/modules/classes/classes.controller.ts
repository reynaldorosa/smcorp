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
  Req,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateClassDto,
  UpdateClassDto,
  CalculateEndDateDto,
  CheckRoomConflictDto,
  CreateClassSchema,
  UpdateClassSchema,
  CalculateEndDateSchema,
  CheckRoomConflictSchema,
  InstructorAttendanceDto,
  InstructorAttendanceSchema,
} from './dto/class.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /classes
   * Cria nova turma (com cálculo automático de endDate e validação de conflitos)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo02')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(CreateClassSchema)) body: CreateClassDto) {
    return this.classesService.create(body);
  }

  /**
   * POST /classes/calculate-end-date
   * Calcula data de término baseado em workload e hoursPerDay
   */
  @Post('calculate-end-date')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  @HttpCode(HttpStatus.OK)
  async calculateEndDate(
    @Body(new ZodValidationPipe(CalculateEndDateSchema))
    body: CalculateEndDateDto,
  ) {
    const endDate = await this.classesService.calculateEndDate(body);
    return { endDate };
  }

  /**
   * POST /classes/check-room-conflict
   * Verifica se há conflito de sala em período
   */
  @Post('check-room-conflict')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  @HttpCode(HttpStatus.OK)
  async checkRoomConflict(
    @Body(new ZodValidationPipe(CheckRoomConflictSchema))
    body: CheckRoomConflictDto,
  ) {
    const hasConflict = await this.classesService.checkRoomConflict(body);
    return {
      hasConflict,
      message: hasConflict
        ? 'Conflito detectado. Sala ocupada no período.'
        : 'Sala disponível no período.',
    };
  }

  /**
   * GET /classes/:id/check-capacity
   * Valida capacidade da turma
   */
  @Get(':id/check-capacity')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async checkCapacity(@Param('id') classId: string) {
    try {
      await this.classesService.validateMaxCapacity({ classId });
      return {
        ok: true,
        message: 'Capacidade OK',
      };
    } catch (error) {
      // Só "capacidade excedida" (ConflictException) é o resultado de negócio
      // esperado por este endpoint — vira `ok: false` com 200. Qualquer outro
      // erro (turma/sala inexistente, falha de banco) propaga como erro HTTP
      // de verdade: o catch genérico anterior mascarava tudo como `ok: false`
      // e ainda vazava `error.message` bruto (podendo incluir detalhes internos).
      if (error instanceof ConflictException) {
        return {
          ok: false,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * POST /classes/:id/instructors/:instructorId/attendance
   * Confirma a presença do instrutor num dia de aula (M03)
   */
  @Post(':id/instructors/:instructorId/attendance')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @HttpCode(HttpStatus.OK)
  async confirmInstructorAttendance(
    @Param('id') classId: string,
    @Param('instructorId') instructorId: string,
    @Body(new ZodValidationPipe(InstructorAttendanceSchema)) body: InstructorAttendanceDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.classesService.confirmInstructorAttendance(
      classId,
      instructorId,
      body.date,
      req.user.sub,
    );
  }

  /**
   * DELETE /classes/:id/instructors/:instructorId/attendance/:date
   * Remove a confirmação de presença (date em YYYY-MM-DD)
   */
  @Delete(':id/instructors/:instructorId/attendance/:date')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  async removeInstructorAttendance(
    @Param('id') classId: string,
    @Param('instructorId') instructorId: string,
    @Param('date') date: string,
  ) {
    return this.classesService.removeInstructorAttendance(classId, instructorId, date);
  }

  /**
   * GET /classes/course/:courseId
   * Lista turmas de um curso
   */
  @Get('course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async getClassesByCourse(@Param('courseId') courseId: string) {
    // `enrollments` completo (não `_count`) vazava enrollmentToken — um
    // segredo tipo bearer que autoriza os endpoints públicos de matrícula
    // (upload/remoção de documento por token, sem JWT) — além de desconto,
    // notas e status para roles que só precisam contar vagas (CLIENT_PJ,
    // COLLABORATOR). O frontend só lê `_count.enrollments`.
    return this.prisma.class.findMany({
      where: { courseId, deletedAt: null },
      include: {
        room: true,
        instructor: true,
        _count: {
          select: { enrollments: { where: { deletedAt: null } } },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  @Get('room/:roomId')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async getClassesByRoom(
    @Param('roomId') roomId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.classesService.getClassesByRoom({
      roomId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * GET /classes/instructor/:instructorId
   * Lista turmas de um instrutor
   */
  @Get('instructor/:instructorId')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async getClassesByInstructor(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.classesService.getClassesByInstructor({
      instructorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * GET /classes
   * Lista todas as turmas
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeExamDays') includeExamDays?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string | string[],
  ) {
    if (includeExamDays === 'true') {
      return this.classesService.findAllWithExams();
    }
    return this.classesService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    });
  }

  /**
   * GET /classes/:id
   * Busca detalhes de uma turma
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.MASTER, UserRole.CLIENT_PJ)
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  /**
   * PUT /classes/:id
   * Atualiza turma
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo02')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateClassSchema)) body: UpdateClassDto,
  ) {
    return this.classesService.update(id, body);
  }

  /**
   * DELETE /classes/:id
   * Remove turma (soft delete)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo02')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.classesService.remove(id);
  }
}
