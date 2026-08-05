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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, CreateSupplierSchema } from './dto/create-supplier.dto';
import { UpdateSupplierDto, UpdateSupplierSchema } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // Leitura só atrás de @Roles (fornecedores são referência p/ outros
  // módulos, ex. custos). Escrita é exclusiva de Configurações (modulo00).
  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Criar fornecedor' })
  create(@Body(new ZodValidationPipe(CreateSupplierSchema)) createDto: CreateSupplierDto) {
    return this.suppliersService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar fornecedores' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('active') active?: string,
  ) {
    const filters: { active?: boolean } = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }
    return this.suppliersService.findAll(page, limit, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSupplierSchema)) updateDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Deletar fornecedor' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
