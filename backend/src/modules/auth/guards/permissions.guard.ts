import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ModuleKey } from '../permissions';

/**
 * Roles externos (portais de cliente) nunca navegam o dashboard interno e
 * não têm noção de "módulo" — o conjunto modulo00..09 é um conceito
 * exclusivo do staff (ADMIN/COLLABORATOR). Algumas rotas são compartilhadas
 * entre o dashboard interno e o portal externo (ex.: POST /enrollments
 * aceita ADMIN, COLLABORATOR e CLIENT_PJ) — gatear por módulo bloquearia o
 * cliente externo, que hoje só é controlado por @Roles.
 */
const MODULE_GATE_EXEMPT_ROLES: readonly UserRole[] = [
  UserRole.MASTER,
  UserRole.CLIENT_PF,
  UserRole.CLIENT_PJ,
  UserRole.CLIENT_MOV,
];

/**
 * Fecha a lacuna descrita na auditoria: as permissões por módulo
 * (modulo00..modulo09) só existiam no frontend/localStorage — o backend só
 * validava role (@Roles). Um COLLABORATOR sem o módulo na UI ainda
 * conseguia chamar a rota direto via API.
 *
 * Roda DEPOIS do RolesGuard (@Roles continua sendo a checagem grossa).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<ModuleKey[]>(REQUIRE_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      return false;
    }

    if (MODULE_GATE_EXEMPT_ROLES.includes(user.role)) {
      return true;
    }

    const modulos = user.permissions?.modulos;
    if (!modulos) {
      // Sem permissões carregadas (ex.: token de refresh que não passou pela
      // JwtStrategy completa) — nega por padrão em vez de assumir acesso.
      return false;
    }

    const allowed = requiredModules.some((moduleKey) => modulos[moduleKey] === true);
    if (!allowed) {
      throw new ForbiddenException(
        `Acesso negado: requer o módulo ${requiredModules.join(' ou ')}`,
      );
    }

    return true;
  }
}
