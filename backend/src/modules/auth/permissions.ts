import { UserRole } from '@prisma/client';

// ============================================
// PERMISSÕES GRANULARES POR MÓDULO (modulo00..modulo09)
//
// Espelha o contrato do frontend (frontend/src/lib/user-permissions.ts).
// Antes disto, as permissões só existiam no localStorage do navegador — o
// backend não conhecia o conceito de "módulo" e só validava role (@Roles).
// Um COLLABORATOR sem acesso a um módulo na UI ainda conseguia chamar o
// endpoint direto via API. Isto dá ao backend a mesma fonte de verdade.
// ============================================

export type ModuleKey =
  | 'modulo00'
  | 'modulo01'
  | 'modulo02'
  | 'modulo03'
  | 'modulo04'
  | 'modulo05'
  | 'modulo06'
  | 'modulo07'
  | 'modulo08'
  | 'modulo09';

export type ActionKey =
  | 'cadastrarAluno'
  | 'editarAluno'
  | 'excluirAluno'
  | 'alterarStatusPagamento'
  | 'alterarStatusDocumentos'
  | 'alterarStatusProva'
  | 'cadastrarCurso'
  | 'editarCurso'
  | 'excluirCurso'
  | 'cadastrarTurma'
  | 'editarTurma'
  | 'excluirTurma'
  | 'gerenciarSalas'
  | 'gerenciarInstrutores'
  | 'gerenciarUsuarios'
  | 'gerenciarEmpresas'
  | 'gerenciarFornecedores'
  | 'acessarConfiguracoes';

export interface UserPermissions {
  modulos: Record<ModuleKey, boolean>;
  acoes: Record<ActionKey, boolean>;
}

const buildBase = (value: boolean): UserPermissions => ({
  modulos: {
    modulo00: value,
    modulo01: value,
    modulo02: value,
    modulo03: value,
    modulo04: value,
    modulo05: value,
    modulo06: value,
    modulo07: value,
    modulo08: value,
    modulo09: value,
  },
  acoes: {
    cadastrarAluno: value,
    editarAluno: value,
    excluirAluno: value,
    alterarStatusPagamento: value,
    alterarStatusDocumentos: value,
    alterarStatusProva: value,
    cadastrarCurso: value,
    editarCurso: value,
    excluirCurso: value,
    cadastrarTurma: value,
    editarTurma: value,
    excluirTurma: value,
    gerenciarSalas: value,
    gerenciarInstrutores: value,
    gerenciarUsuarios: value,
    gerenciarEmpresas: value,
    gerenciarFornecedores: value,
    acessarConfiguracoes: value,
  },
});

/**
 * Defaults por role — espelham exatamente `createDefaultUserPermissions` do
 * frontend (Master↔MASTER, Admin↔ADMIN, Seller↔COLLABORATOR). CLIENT_PF/PJ/MOV
 * são identidades de portal externo, nunca navegam o dashboard com gating por
 * módulo — recebem tudo `false` (não usado, mas precisa de um valor).
 */
export function createDefaultPermissions(role: UserRole): UserPermissions {
  if (role === UserRole.MASTER) {
    return buildBase(true);
  }

  if (role === UserRole.ADMIN) {
    return {
      modulos: {
        modulo00: true,
        modulo01: true,
        modulo02: true,
        modulo03: true,
        modulo04: true,
        modulo05: true,
        modulo06: true,
        modulo07: false,
        modulo08: true,
        modulo09: true,
      },
      acoes: {
        cadastrarAluno: true,
        editarAluno: true,
        excluirAluno: false,
        alterarStatusPagamento: true,
        alterarStatusDocumentos: true,
        alterarStatusProva: true,
        cadastrarCurso: true,
        editarCurso: true,
        excluirCurso: false,
        cadastrarTurma: true,
        editarTurma: true,
        excluirTurma: false,
        gerenciarSalas: true,
        gerenciarInstrutores: true,
        gerenciarUsuarios: false,
        gerenciarEmpresas: true,
        gerenciarFornecedores: true,
        acessarConfiguracoes: false,
      },
    };
  }

  if (role === UserRole.COLLABORATOR) {
    return {
      modulos: {
        modulo00: false,
        modulo01: true,
        modulo02: true,
        modulo03: false,
        modulo04: true,
        modulo05: false,
        modulo06: false,
        modulo07: false,
        modulo08: false,
        modulo09: false,
      },
      acoes: {
        cadastrarAluno: true,
        editarAluno: true,
        excluirAluno: false,
        alterarStatusPagamento: false,
        alterarStatusDocumentos: false,
        alterarStatusProva: false,
        cadastrarCurso: false,
        editarCurso: false,
        excluirCurso: false,
        cadastrarTurma: false,
        editarTurma: false,
        excluirTurma: false,
        gerenciarSalas: false,
        gerenciarInstrutores: false,
        gerenciarUsuarios: false,
        gerenciarEmpresas: false,
        gerenciarFornecedores: false,
        acessarConfiguracoes: false,
      },
    };
  }

  // CLIENT_PF / CLIENT_PJ / CLIENT_MOV: portais externos, sem dashboard gated por módulo.
  return buildBase(false);
}

/** Mescla o JSON salvo (parcial, pode ter campos faltando) com os defaults do role. */
export function normalizePermissions(
  role: UserRole,
  stored?: Partial<UserPermissions> | null,
): UserPermissions {
  const base = createDefaultPermissions(role);
  if (!stored) {
    return base;
  }

  return {
    modulos: { ...base.modulos, ...(stored.modulos || {}) },
    acoes: { ...base.acoes, ...(stored.acoes || {}) },
  };
}
