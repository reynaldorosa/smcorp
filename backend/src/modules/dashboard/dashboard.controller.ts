import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { UserRole } from '@prisma/client';

// Nenhum outro módulo lê o Dashboard Executivo como referência — pode ser
// gated inteiro no nível da classe, ao contrário de Cursos/Salas/Instrutores.
@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@RequireModule('modulo09')
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Cards principais do dashboard' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Dados do resumo' })
  async getSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.dashboardService.getSummary({ startDate, endDate });
  }

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Aba Alunos - Distribuição por status' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Dados dos alunos' })
  async getStudentsDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getStudentsDashboard({ startDate, endDate });
  }

  @Get('financial')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Aba Financeiro - Receitas e despesas' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Dados financeiros' })
  async getFinancialDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.dashboardService.getFinancialDashboard({ startDate, endDate, groupBy });
  }

  @Get('operational')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Aba Operacional - Turmas e ocupação' })
  @ApiResponse({ status: 200, description: 'Dados operacionais' })
  async getOperationalDashboard() {
    return this.dashboardService.getOperationalDashboard();
  }

  @Get('costs')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Aba Custos - Custos por categoria' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Dados de custos' })
  async getCostsDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getCostsDashboard({ startDate, endDate });
  }

  @Get('active-classes')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Turmas ativas (em andamento ou agendadas)' })
  async getActiveClasses(
    @Query('companyId') companyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: Record<string, unknown> = {
      deletedAt: null,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    };
    if (companyId) where.companyId = companyId;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.startDate as Record<string, unknown>).lte = new Date(endDate);
    }
    return this.prisma.class.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
        instructor: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  @Get('pending-documents')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Documentos pendentes de validação' })
  async getPendingDocuments(
    @Query('companyId') companyId?: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit) : 20;
    const where: Record<string, unknown> = {
      status: 'PENDING',
    };
    if (companyId) {
      where.student = { companyId };
    }
    return this.prisma.studentDocument.findMany({
      where,
      take,
      include: {
        student: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('upcoming-exams')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @ApiOperation({ summary: 'Próximas provas agendadas' })
  async getUpcomingExams(
    @Query('instructorId') instructorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit) : 20;
    const where: Record<string, unknown> = {
      status: 'SCHEDULED',
      scheduledDate: { gte: new Date() },
    };
    if (instructorId) where.instructorId = instructorId;
    if (startDate) (where.scheduledDate as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.scheduledDate as Record<string, unknown>).lte = new Date(endDate);
    return this.prisma.exam.findMany({
      where,
      take,
      include: {
        enrollment: {
          include: {
            student: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, code: true, displayName: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}
