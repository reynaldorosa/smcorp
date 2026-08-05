export type AppUserRole = 'Master' | 'Admin' | 'Seller';

type ModuleKey =
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

type ActionKey =
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

const createBasePermissions = (value: boolean): UserPermissions => ({
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

export const createDefaultUserPermissions = (role: AppUserRole): UserPermissions => {
  if (role === 'Master') {
    return createBasePermissions(true);
  }

  if (role === 'Admin') {
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
};

export const normalizeUserPermissions = (
  role: AppUserRole,
  permissions?: Partial<UserPermissions> | null,
): UserPermissions => {
  const base = createDefaultUserPermissions(role);

  if (!permissions) {
    return base;
  }

  return {
    modulos: {
      ...base.modulos,
      ...(permissions.modulos || {}),
    },
    acoes: {
      ...base.acoes,
      ...(permissions.acoes || {}),
    },
  };
};

export const mapApiRoleToAppRole = (role: string): AppUserRole => {
  switch (role) {
    case 'MASTER':
    case 'Master':
      return 'Master';
    case 'ADMIN':
    case 'Admin':
      return 'Admin';
    case 'COLLABORATOR':
    case 'SELLER':
    case 'Vendedor':
    case 'Seller':
    default:
      return 'Seller';
  }
};
