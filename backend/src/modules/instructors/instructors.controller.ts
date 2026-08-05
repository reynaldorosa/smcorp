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
import { InstructorsService } from './instructors.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructorDto, CreateInstructorSchema } from './dto/create-instructor.dto';
import { UpdateInstructorDto, UpdateInstructorSchema } from './dto/update-instructor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Instructors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly instructorsService: InstructorsService,
    private readonly prisma: PrismaService,
  ) {}

  // Leitura (findAll/findOne/getClasses/getAvailability) só atrás de @Roles:
  // instrutores são referência p/ outros módulos (ex. criar turma em
  // modulo02). Escrita é exclusiva de Configurações (modulo00).
  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Criar instrutor' })
  create(@Body(new ZodValidationPipe(CreateInstructorSchema)) createDto: CreateInstructorDto) {
    return this.instructorsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar instrutores' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('active') active?: string,
  ) {
    const filters: { active?: boolean } = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }
    return this.instructorsService.findAll(page, limit, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar instrutor por ID' })
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Atualizar instrutor' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateInstructorSchema)) updateDto: UpdateInstructorDto,
  ) {
    return this.instructorsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Deletar instrutor' })
  remove(@Param('id') id: string) {
    return this.instructorsService.remove(id);
  }

  @Get(':id/classes')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar turmas do instrutor' })
  async getClasses(@Param('id') id: string) {
    return this.prisma.class.findMany({
      where: { instructorId: id, deletedAt: null },
      include: {
        course: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  @Get(':id/availability')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar disponibilidade do instrutor' })
  async getAvailability(@Param('id') id: string, @Query('date') date?: string) {
    // Find all classes for this instructor
    const classes = await this.prisma.class.findMany({
      where: {
        instructorId: id,
        deletedAt: null,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        displayName: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
      },
    });

    // Find all exams for this instructor
    const exams = await this.prisma.exam.findMany({
      where: {
        instructorId: id,
        status: 'SCHEDULED',
        scheduledDate: date ? { gte: new Date(date) } : { gte: new Date() },
      },
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
      },
    });

    return {
      instructorId: id,
      busySlots: {
        classes: classes.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          startDate: c.startDate,
          endDate: c.endDate,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
        exams: exams.map((e) => ({
          id: e.id,
          date: e.scheduledDate,
          time: e.scheduledTime,
        })),
      },
    };
  }

  @Post(':id/certifications')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Adicionar certificação ao instrutor (armazenado em notes JSON)' })
  async addCertification(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      issuedBy: string;
      issuedAt: string;
      expiresAt?: string;
      documentUrl?: string;
    },
  ) {
    const instructor = await this.prisma.instructor.findUnique({ where: { id } });
    if (!instructor) throw new Error('Instrutor não encontrado');

    // Store certifications in notes as JSON
    let certifications: Array<Record<string, unknown>> = [];
    try {
      const parsed = instructor.notes ? JSON.parse(instructor.notes) : {};
      certifications = parsed.certifications || [];
    } catch {
      certifications = [];
    }

    const newCert = {
      id: `cert_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    certifications.push(newCert);

    await this.prisma.instructor.update({
      where: { id },
      data: { notes: JSON.stringify({ certifications }) },
    });

    return newCert;
  }

  @Delete(':id/certifications/:certId')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Remover certificação do instrutor' })
  async removeCertification(@Param('id') id: string, @Param('certId') certId: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { id } });
    if (!instructor) throw new Error('Instrutor não encontrado');

    let certifications: Array<Record<string, unknown>> = [];
    try {
      const parsed = instructor.notes ? JSON.parse(instructor.notes) : {};
      certifications = parsed.certifications || [];
    } catch {
      certifications = [];
    }

    const filtered = certifications.filter((c) => c.id !== certId);
    await this.prisma.instructor.update({
      where: { id },
      data: { notes: JSON.stringify({ certifications: filtered }) },
    });

    return { message: 'Certificação removida com sucesso' };
  }
}
