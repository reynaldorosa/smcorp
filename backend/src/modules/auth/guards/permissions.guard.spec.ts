import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';
import { createDefaultPermissions } from '../permissions';

describe('PermissionsGuard', () => {
  const makeContext = (user?: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const makeGuard = (requiredModules: unknown) => {
    const reflector = { getAllAndOverride: jest.fn(() => requiredModules) } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  };

  it('libera quando a rota não declara @RequireModule', () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(makeContext({ role: UserRole.COLLABORATOR }))).toBe(true);
  });

  it('MASTER sempre passa, mesmo sem o módulo nas permissions', () => {
    const guard = makeGuard(['modulo00']);
    expect(guard.canActivate(makeContext({ role: UserRole.MASTER, permissions: undefined }))).toBe(
      true,
    );
  });

  it('CLIENT_PJ (portal externo) sempre passa — módulo é conceito só do dashboard interno', () => {
    const guard = makeGuard(['modulo03']);
    expect(
      guard.canActivate(makeContext({ role: UserRole.CLIENT_PJ, permissions: undefined })),
    ).toBe(true);
  });

  it('nega quando não há request.user', () => {
    const guard = makeGuard(['modulo00']);
    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });

  it('nega (fail-closed) quando o usuário não tem permissions carregadas', () => {
    const guard = makeGuard(['modulo00']);
    expect(
      guard.canActivate(makeContext({ role: UserRole.COLLABORATOR, permissions: undefined })),
    ).toBe(false);
  });

  it('libera quando o usuário tem o módulo exigido', () => {
    const guard = makeGuard(['modulo01']);
    const permissions = createDefaultPermissions(UserRole.COLLABORATOR); // tem modulo01
    expect(guard.canActivate(makeContext({ role: UserRole.COLLABORATOR, permissions }))).toBe(true);
  });

  it('lança ForbiddenException quando o usuário não tem nenhum dos módulos exigidos', () => {
    const guard = makeGuard(['modulo00']);
    const permissions = createDefaultPermissions(UserRole.COLLABORATOR); // não tem modulo00
    expect(() =>
      guard.canActivate(makeContext({ role: UserRole.COLLABORATOR, permissions })),
    ).toThrow(ForbiddenException);
  });

  it('semântica "any": libera se o usuário tiver PELO MENOS UM dos módulos exigidos', () => {
    const guard = makeGuard(['modulo07', 'modulo08']);
    const permissions = createDefaultPermissions(UserRole.ADMIN); // modulo07 false, modulo08 true
    expect(guard.canActivate(makeContext({ role: UserRole.ADMIN, permissions }))).toBe(true);
  });
});
