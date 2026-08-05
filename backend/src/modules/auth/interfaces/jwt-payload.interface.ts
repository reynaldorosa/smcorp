import { UserRole } from '@prisma/client';
import { UserPermissions } from '../permissions';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId?: string;
  /** Tenant do usuário (undefined = plataforma/MASTER) */
  tenantId?: string;
  iat?: number;
  exp?: number;
  /**
   * Populados por JwtStrategy.validate() a cada request (não fazem parte do
   * token assinado) — é a revalidação de isActive/permissões contra o banco,
   * em vez de confiar cegamente no payload até o token expirar.
   */
  isActive?: boolean;
  permissions?: UserPermissions;
}
