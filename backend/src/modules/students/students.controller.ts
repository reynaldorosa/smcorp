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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentsService } from './students.service';
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  CreateStudentDto,
  UpdateStudentDto,
} from './dto/student.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly prisma: PrismaService,
  ) {}

  // CLIENT_PJ (portal) é isento de gating por módulo (ver PermissionsGuard) —
  // continua criando aluno normalmente mesmo sem "permissions" carregadas.
  @Post()
  @Roles('ADMIN', 'COLLABORATOR', 'CLIENT_PJ')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  create(
    @Body(new ZodValidationPipe(CreateStudentSchema)) data: CreateStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const companyScopeId = user.role === 'CLIENT_PJ' ? user.companyId : undefined;
    return this.studentsService.create(data, companyScopeId);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get('code/:code')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  findByCode(@Param('code') code: string) {
    return this.studentsService.findByCode(code);
  }

  @Get('class/:classId')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findByClass(@Param('classId') classId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId, deletedAt: null },
      include: {
        student: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
    });
    return enrollments.map((e: any) => e.student);
  }

  @Get('company/:companyId')
  @Roles('ADMIN', 'COLLABORATOR', 'MASTER')
  async findByCompany(@Param('companyId') companyId: string) {
    return this.prisma.student.findMany({
      where: { companyId, deletedAt: null },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { code: 'asc' },
    });
  }

  @Post(':id/photo')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — evita base64 gigante no Postgres
    }),
  )
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: any) {
    // In production, upload to S3/CloudStorage. For now, store as base64 data URL.
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    await this.prisma.student.update({
      where: { id },
      data: { photoUrl: dataUrl },
    });
    return { url: dataUrl };
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — mesmo teto do upload público
    }),
  )
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('type') documentType: string,
  ) {
    return this.prisma.studentDocument.create({
      data: {
        studentId: id,
        documentType: documentType || 'OTHER',
        fileName: file.originalname,
        fileUrl: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING',
      },
    });
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStudentSchema)) data: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MASTER')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo03')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
