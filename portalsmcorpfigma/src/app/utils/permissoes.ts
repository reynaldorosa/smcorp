import type { Usuario } from '@/app/contexts/SMCorpContext';

export const criarPermissoesPadrao = (nivel: 'Master' | 'Admin' | 'Vendedor'): Usuario['permissoes'] => {
  if (nivel === 'Master') {
    return {
      modulos: {
        modulo00: true,
        modulo01: true,
        modulo02: true,
        modulo03: true,
        modulo04: true,
        modulo05: true,
        modulo06: true,
        modulo07: true
      },
      acoes: {
        cadastrarAluno: true,
        editarAluno: true,
        excluirAluno: true,
        alterarStatusPagamento: true,
        alterarStatusDocumentos: true,
        alterarStatusProva: true,
        cadastrarCurso: true,
        editarCurso: true,
        excluirCurso: true,
        cadastrarTurma: true,
        editarTurma: true,
        excluirTurma: true,
        gerenciarSalas: true,
        gerenciarInstrutores: true,
        gerenciarUsuarios: true,
        gerenciarEmpresas: true,
        gerenciarFornecedores: true,
        acessarConfiguracoes: true
      }
    };
  } else if (nivel === 'Admin') {
    return {
      modulos: {
        modulo00: true,
        modulo01: true,
        modulo02: true,
        modulo03: true,
        modulo04: true,
        modulo05: true,
        modulo06: true,
        modulo07: false
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
        acessarConfiguracoes: false
      }
    };
  } else { // Vendedor
    return {
      modulos: {
        modulo00: false,
        modulo01: true,
        modulo02: true,
        modulo03: false,
        modulo04: true,
        modulo05: false,
        modulo06: false,
        modulo07: false
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
        acessarConfiguracoes: false
      }
    };
  }
};
