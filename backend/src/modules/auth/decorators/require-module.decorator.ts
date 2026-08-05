import { SetMetadata } from '@nestjs/common';
import { ModuleKey } from '../permissions';

export const REQUIRE_MODULE_KEY = 'require_module';

/**
 * Exige que o usuário tenha acesso a pelo menos um dos módulos informados
 * (semântica "any" — igual ao `mode: 'any'` do route-module-map.ts do
 * frontend, usado por ex. em /pagamentos que aceita modulo07 OU modulo08).
 * MASTER (plataforma) sempre passa, independente do que for exigido aqui —
 * ver PermissionsGuard.
 */
export const RequireModule = (...modules: ModuleKey[]) => SetMetadata(REQUIRE_MODULE_KEY, modules);
