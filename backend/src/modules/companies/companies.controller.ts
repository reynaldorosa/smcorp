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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, CreateCompanySchema } from './dto/create-company.dto';
import { UpdateCompanyDto, UpdateCompanySchema } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Leitura fica só atrás de @Roles: Company é referência ao criar
  // turma/aluno (companyId), mesmo para quem não tem modulo05. Só a escrita
  // (gerenciar as empresas em si) é exclusiva da Área do Cliente PJ.
  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo05')
  @ApiOperation({ summary: 'Criar empresa' })
  create(@Body(new ZodValidationPipe(CreateCompanySchema)) createDto: CreateCompanyDto) {
    return this.companiesService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar empresas' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.companiesService.findAll(page, limit);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get(':id/students')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar alunos de uma empresa' })
  getStudents(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.companiesService.getStudents(id, page, limit);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo05')
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCompanySchema)) updateDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo05')
  @ApiOperation({ summary: 'Deletar empresa' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
