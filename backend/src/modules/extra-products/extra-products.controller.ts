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
import { ExtraProductsService } from './extra-products.service';
import { CreateExtraProductDto, CreateExtraProductSchema } from './dto/create-extra-product.dto';
import { UpdateExtraProductDto, UpdateExtraProductSchema } from './dto/update-extra-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Extra Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('extra-products')
export class ExtraProductsController {
  constructor(private readonly extraProductsService: ExtraProductsService) {}

  // Leitura fica só atrás de @Roles: produtos extras são escolhidos na
  // matrícula (modulo03), mesmo por quem não tem modulo00.
  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Criar produto extra' })
  create(@Body(new ZodValidationPipe(CreateExtraProductSchema)) createDto: CreateExtraProductDto) {
    return this.extraProductsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar produtos extras' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('active') active?: string,
  ) {
    const filters: { active?: boolean } = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }
    return this.extraProductsService.findAll(page, limit, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string) {
    return this.extraProductsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateExtraProductSchema)) updateDto: UpdateExtraProductDto,
  ) {
    return this.extraProductsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Deletar produto' })
  remove(@Param('id') id: string) {
    return this.extraProductsService.remove(id);
  }
}
