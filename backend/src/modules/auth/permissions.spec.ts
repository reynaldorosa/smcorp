import { UserRole } from '@prisma/client';
import { createDefaultPermissions, normalizePermissions } from './permissions';

describe('permissions', () => {
  describe('createDefaultPermissions', () => {
    it('MASTER recebe todos os módulos e ações liberados', () => {
      const perms = createDefaultPermissions(UserRole.MASTER);
      expect(Object.values(perms.modulos).every(Boolean)).toBe(true);
      expect(Object.values(perms.acoes).every(Boolean)).toBe(true);
    });

    it('ADMIN não tem modulo07 (Financeiro) por padrão', () => {
      const perms = createDefaultPermissions(UserRole.ADMIN);
      expect(perms.modulos.modulo07).toBe(false);
      expect(perms.modulos.modulo08).toBe(true);
      expect(perms.modulos.modulo00).toBe(true);
    });

    it('COLLABORATOR (Seller) tem só cursos/turmas/vendas por padrão', () => {
      const perms = createDefaultPermissions(UserRole.COLLABORATOR);
      expect(perms.modulos.modulo01).toBe(true);
      expect(perms.modulos.modulo02).toBe(true);
      expect(perms.modulos.modulo04).toBe(true);
      expect(perms.modulos.modulo00).toBe(false);
      expect(perms.modulos.modulo09).toBe(false);
    });

    it.each([UserRole.CLIENT_PF, UserRole.CLIENT_PJ, UserRole.CLIENT_MOV])(
      '%s (portal externo) não recebe nenhum módulo do dashboard interno',
      (role) => {
        const perms = createDefaultPermissions(role);
        expect(Object.values(perms.modulos).every((v) => v === false)).toBe(true);
      },
    );
  });

  describe('normalizePermissions', () => {
    it('sem valor salvo, devolve os defaults do role', () => {
      const perms = normalizePermissions(UserRole.COLLABORATOR, null);
      expect(perms).toEqual(createDefaultPermissions(UserRole.COLLABORATOR));
    });

    it('mescla override parcial preservando os demais defaults do role', () => {
      const perms = normalizePermissions(UserRole.COLLABORATOR, {
        modulos: { modulo00: true } as never,
      });

      expect(perms.modulos.modulo00).toBe(true); // override aplicado
      expect(perms.modulos.modulo01).toBe(true); // default do COLLABORATOR preservado
      expect(perms.modulos.modulo03).toBe(false); // default do COLLABORATOR preservado
    });
  });
});
