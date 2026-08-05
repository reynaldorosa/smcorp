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
import { RoomsService } from './rooms.service';
import { CreateRoomDto, CreateRoomSchema } from './dto/create-room.dto';
import { UpdateRoomDto, UpdateRoomSchema } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';
// AuditInterceptor não é importado aqui: ele está registrado globalmente
// (APP_INTERCEPTOR em app.module.ts) e já lê a metadata de @AuditLog.
import { AuditLog } from '../../common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // Leitura (findAll/findOne) fica só atrás de @Roles: salas são lidas como
  // dado de referência por outros módulos (ex.: criar turma em modulo02
  // precisa listar salas, mesmo para quem não tem modulo00). Só as escritas
  // (criar/editar/excluir sala) são exclusivas de Configurações.
  @Post()
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Criar sala' })
  @AuditLog({
    tableName: 'rooms',
    action: 'CREATE',
    getRecordId: (result) => (result as { id?: string })?.id,
    getNewData: (result) => result,
  })
  create(@Body(new ZodValidationPipe(CreateRoomSchema)) createDto: CreateRoomDto) {
    return this.roomsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Listar salas' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('active') active?: string,
  ) {
    const filters: { active?: boolean } = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }
    return this.roomsService.findAll(page, limit, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @ApiOperation({ summary: 'Buscar sala por ID' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'COLLABORATOR')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Atualizar sala' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoomSchema)) updateDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(PermissionsGuard)
  @RequireModule('modulo00')
  @ApiOperation({ summary: 'Deletar sala' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
