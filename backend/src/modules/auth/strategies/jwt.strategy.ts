import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { normalizePermissions, UserPermissions } from '../permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Revalida o payload contra o banco a cada request — sem isso, um usuário
   * desativado (ou com role/permissões alteradas) continua autenticado até o
   * access token expirar naturalmente (15min por padrão). Também popula
   * `permissions`, a fonte de verdade que o PermissionsGuard usa.
   *
   * CLIENT_PJ é um caso à parte: o portal PJ (loginPortalPj) assina `sub`
   * como o Company.id, não um User.id — não existe linha em `users` pra
   * essa identidade. Buscar em `user` pra esse role sempre daria "não
   * encontrado" e derrubaria 100% das sessões do portal.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido');
    }

    if (payload.role === UserRole.CLIENT_PJ) {
      const company = await this.prisma.company.findFirst({
        where: { id: payload.sub, deletedAt: null },
        select: { isActive: true },
      });

      if (!company || !company.isActive) {
        throw new UnauthorizedException('Empresa inativa ou não encontrada');
      }

      // Portal PJ é gated por @Roles, não por módulo — não navega o dashboard interno.
      return payload;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { isActive: true, role: true, tenantId: true, permissions: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    return {
      ...payload,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
      isActive: true,
      permissions: normalizePermissions(
        user.role,
        user.permissions as Partial<UserPermissions> | null,
      ),
    };
  }
}
