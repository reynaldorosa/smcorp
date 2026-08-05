import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@/app/components/ui/separator';
import { Shield, Users, BookOpen, Calendar, BarChart3, ShoppingCart, Settings, Lock } from 'lucide-react';
import type { Usuario } from '@/app/contexts/SMCorpContext';

interface DialogPermissoesUsuarioProps {
  aberto: boolean;
  usuarioEditando: Usuario | null;
  onFechar: () => void;
  onSalvar: () => void;
  onAlterarUsuario: (dados: Partial<Usuario>) => void;
}

export const DialogPermissoesUsuario: React.FC<DialogPermissoesUsuarioProps> = ({
  aberto,
  usuarioEditando,
  onFechar,
  onSalvar,
  onAlterarUsuario
}) => {
  if (!usuarioEditando) return null;

  const modulosConfig = [
    { id: 'modulo00', nome: 'Módulo 00 - Infraestrutura', icon: Settings, cor: 'text-purple-600' },
    { id: 'modulo01', nome: 'Módulo 01 - DNA Técnico', icon: BookOpen, cor: 'text-blue-600' },
    { id: 'modulo02', nome: 'Módulo 02 - Abertura de Turmas', icon: Calendar, cor: 'text-green-600' },
    { id: 'modulo03', nome: 'Módulo 03 - Dashboard Operacional', icon: BarChart3, cor: 'text-orange-600' },
    { id: 'modulo04', nome: 'Módulo 04 - Central de Vendas', icon: ShoppingCart, cor: 'text-red-600' },
    { id: 'modulo05', nome: 'Módulo 05 - Financeiro', icon: Shield, cor: 'text-emerald-600' }
  ];

  const acoesConfig = [
    {
      titulo: 'Gestão de Alunos',
      icon: Users,
      acoes: [
        { id: 'cadastrarAluno', nome: 'Cadastrar Aluno' },
        { id: 'editarAluno', nome: 'Editar Aluno' },
        { id: 'excluirAluno', nome: 'Excluir Aluno', destaque: true },
        { id: 'alterarStatusPagamento', nome: 'Alterar Status de Pagamento', destaque: true },
        { id: 'alterarStatusDocumentos', nome: 'Alterar Status de Documentos' },
        { id: 'alterarStatusProva', nome: 'Alterar Status de Prova' }
      ]
    },
    {
      titulo: 'Gestão de Cursos',
      icon: BookOpen,
      acoes: [
        { id: 'cadastrarCurso', nome: 'Cadastrar Curso' },
        { id: 'editarCurso', nome: 'Editar Curso' },
        { id: 'excluirCurso', nome: 'Excluir Curso', destaque: true }
      ]
    },
    {
      titulo: 'Gestão de Turmas',
      icon: Calendar,
      acoes: [
        { id: 'cadastrarTurma', nome: 'Cadastrar Turma' },
        { id: 'editarTurma', nome: 'Editar Turma' },
        { id: 'excluirTurma', nome: 'Excluir Turma', destaque: true }
      ]
    },
    {
      titulo: 'Gestão de Infraestrutura',
      icon: Settings,
      acoes: [
        { id: 'gerenciarSalas', nome: 'Gerenciar Salas' },
        { id: 'gerenciarInstrutores', nome: 'Gerenciar Instrutores' },
        { id: 'gerenciarUsuarios', nome: 'Gerenciar Usuários', destaque: true },
        { id: 'gerenciarEmpresas', nome: 'Gerenciar Empresas PJ' },
        { id: 'gerenciarFornecedores', nome: 'Gerenciar Fornecedores' }
      ]
    },
    {
      titulo: 'Configurações do Sistema',
      icon: Lock,
      acoes: [
        { id: 'acessarConfiguracoes', nome: 'Acessar Configurações', destaque: true }
      ]
    }
  ];

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Editar Permissões do Usuário
          </DialogTitle>
          <DialogDescription>
            Configure o nível e permissões detalhadas de acesso ao sistema
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 min-h-0">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input value={usuarioEditando.codigo} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={usuarioEditando.nome}
                      onChange={(e) => onAlterarUsuario({ nome: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nível de Acesso (Preset)</Label>
                  <Select
                    value={usuarioEditando.nivel}
                    onValueChange={(valor: 'Master' | 'Admin' | 'Vendedor') => onAlterarUsuario({ nivel: valor })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Master">Master - Acesso Total</SelectItem>
                      <SelectItem value="Admin">Admin - Gestão Operacional</SelectItem>
                      <SelectItem value="Vendedor">Vendedor - Apenas Vendas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    O nível define permissões padrão, mas você pode customizar cada permissão abaixo
                  </p>
                </div>
                {usuarioEditando.nivel === 'Master' && (
                  <div className="space-y-2">
                    <Label>PIN de Segurança (6 dígitos)</Label>
                    <Input
                      type="password"
                      maxLength={6}
                      value={usuarioEditando.pin || ''}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^0-9]/g, '');
                        onAlterarUsuario({ pin: valor });
                      }}
                      placeholder="Digite 6 dígitos"
                    />
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      PIN necessário para ações críticas como aprovação em lote
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acesso aos Módulos */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Acesso aos Módulos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modulosConfig.map((modulo) => {
                  const Icon = modulo.icon;
                  const moduloKey = modulo.id as keyof typeof usuarioEditando.permissoes.modulos;
                  return (
                    <div key={modulo.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <Checkbox
                        id={modulo.id}
                        checked={usuarioEditando.permissoes.modulos[moduloKey]}
                        onCheckedChange={(checked) => {
                          onAlterarUsuario({
                            permissoes: {
                              ...usuarioEditando.permissoes,
                              modulos: {
                                ...usuarioEditando.permissoes.modulos,
                                [moduloKey]: checked === true
                              }
                            }
                          });
                        }}
                      />
                      <Icon className={`w-4 h-4 ${modulo.cor}`} />
                      <Label htmlFor={modulo.id} className="flex-1 cursor-pointer">
                        {modulo.nome}
                      </Label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Permissões de Ações */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Permissões de Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {acoesConfig.map((grupo, idx) => {
                  const Icon = grupo.icon;
                  return (
                    <div key={idx}>
                      {idx > 0 && <Separator className="my-4" />}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-sm text-gray-700">{grupo.titulo}</h4>
                        </div>
                        <div className="space-y-2 ml-6">
                          {grupo.acoes.map((acao) => {
                            const acaoKey = acao.id as keyof typeof usuarioEditando.permissoes.acoes;
                            return (
                              <div key={acao.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={acao.id}
                                  checked={usuarioEditando.permissoes.acoes[acaoKey]}
                                  onCheckedChange={(checked) => {
                                    onAlterarUsuario({
                                      permissoes: {
                                        ...usuarioEditando.permissoes,
                                        acoes: {
                                          ...usuarioEditando.permissoes.acoes,
                                          [acaoKey]: checked === true
                                        }
                                      }
                                    });
                                  }}
                                />
                                <Label 
                                  htmlFor={acao.id} 
                                  className={`cursor-pointer ${acao.destaque ? 'font-medium text-red-600' : ''}`}
                                >
                                  {acao.nome}
                                  {acao.destaque && <span className="ml-1 text-xs">(⚠️ Crítico)</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} className="bg-red-600 hover:bg-red-700">
            Salvar Permissões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};