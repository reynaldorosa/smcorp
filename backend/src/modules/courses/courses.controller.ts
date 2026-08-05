import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateCourseSchema } from './dto/create-course.dto';
import { UpdateCourseDto, UpdateCourseSchema } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Leitura fica só atrás de @Roles: cursos são referência ao criar turma
  // (modulo02), mesmo para quem não tem modulo01.
  @Get()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo01')
  create(@Body(new ZodValidationPipe(CreateCourseSchema)) createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo01')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCourseSchema)) updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo01')
  remove(@Param('id') id: string) {
    return this.coursesService.softDelete(id);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo01')
  restore(@Param('id') id: string) {
    return this.coursesService.restore(id);
  }
}
