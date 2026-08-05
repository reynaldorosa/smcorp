'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, Save, Lock, Users, BookOpen, Calendar, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createDefaultUserPermissions, type AppUserRole, type UserPermissions } from '@/lib/user-permissions';

// ============================================
// Types
// ============================================

export interface UserPermissionsPayload {
  userId: string;
  userCode?: string;
  userName: string;
  userRole: AppUserRole;
  permissions: UserPermissions;
  pin?: string;
}

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    code?: string;
    name: string;
    role: AppUserRole;
    permissions?: UserPermissions;
    pin?: string;
  } | null;
  onSave?: (payload: UserPermissionsPayload) => void;
}

// ============================================
// Action Permissions Config
// ============================================

type ModuleKey = keyof UserPermissions['modulos'];
type ActionKey = keyof UserPermissions['acoes'];

const ACTION_GROUPS: Array<{
  title: string;
  icon: typeof Users;
  actions: Array<{ id: ActionKey; name: string; critical?: boolean }>;
}> = [
  {
    title: 'Gestão de Alunos',
    icon: Users,
    actions: [
      { id: 'cadastrarAluno', name: 'Cadastrar Aluno' },
      { id: 'editarAluno', name: 'Editar Aluno' },
      { id: 'excluirAluno', name: 'Excluir Aluno', critical: true },
      { id: 'alterarStatusPagamento', name: 'Alterar Status de Pagamento', critical: true },
      { id: 'alterarStatusDocumentos', name: 'Alterar Status de Documentos' },
      { id: 'alterarStatusProva', name: 'Alterar Status de Prova' },
    ],
  },
  {
    title: 'Gestão de Cursos',
    icon: BookOpen,
    actions: [
      { id: 'cadastrarCurso', name: 'Cadastrar Curso' },
      { id: 'editarCurso', name: 'Editar Curso' },
      { id: 'excluirCurso', name: 'Excluir Curso', critical: true },
    ],
  },
  {
    title: 'Gestão de Turmas',
    icon: Calendar,
    actions: [
      { id: 'cadastrarTurma', name: 'Cadastrar Turma' },
      { id: 'editarTurma', name: 'Editar Turma' },
      { id: 'excluirTurma', name: 'Excluir Turma', critical: true },
    ],
  },
  {
    title: 'Gestão de Infraestrutura',
    icon: Settings,
    actions: [
      { id: 'gerenciarSalas', name: 'Gerenciar Salas' },
      { id: 'gerenciarInstrutores', name: 'Gerenciar Instrutores' },
      { id: 'gerenciarUsuarios', name: 'Gerenciar Usuários', critical: true },
      { id: 'gerenciarEmpresas', name: 'Gerenciar Empresas PJ' },
      { id: 'gerenciarFornecedores', name: 'Gerenciar Fornecedores' },
    ],
  },
  {
    title: 'Configurações do Sistema',
    icon: Lock,
    actions: [
      { id: 'acessarConfiguracoes', name: 'Acessar Configurações', critical: true },
    ],
  },
];

// ============================================
// Constants
// ============================================

const MODULES_CONFIG: Array<{
  moduleId: string;
  moduleKey: ModuleKey;
  moduleName: string;
  moduleDescription: string;
}> = [
  {
    moduleId: '00',
    moduleKey: 'modulo00',
    moduleName: 'Módulo 00 - Configurações',
    moduleDescription: 'Configurações gerais do sistema, cadastros base e parâmetros',
  },
  {
    moduleId: '01',
    moduleKey: 'modulo01',
    moduleName: 'Módulo 01 - Cursos',
    moduleDescription: 'Gestão de cursos, grade curricular e produtos vinculados',
  },
  {
    moduleId: '02',
    moduleKey: 'modulo02',
    moduleName: 'Módulo 02 - Turmas',
    moduleDescription: 'Criação e gestão de turmas, calendário e instrutores',
  },
  {
    moduleId: '03',
    moduleKey: 'modulo03',
    moduleName: 'Módulo 03 - Operacional',
    moduleDescription: 'Gestão de alunos, provas e operações do dia a dia',
  },
  {
    moduleId: '04',
    moduleKey: 'modulo04',
    moduleName: 'Módulo 04 - Central de Vendas',
    moduleDescription: 'CRM, leads, pipeline de vendas e WhatsApp',
  },
  {
    moduleId: '05',
    moduleKey: 'modulo05',
    moduleName: 'Módulo 05 - Área do Cliente PJ',
    moduleDescription: 'Portal de acesso para empresas clientes (PJ)',
  },
  {
    moduleId: '06',
    moduleKey: 'modulo06',
    moduleName: 'Módulo 06 - Validação de Documentos',
    moduleDescription: 'Fluxo de documentos, validações e pendências',
  },
  {
    moduleId: '07',
    moduleKey: 'modulo07',
    moduleName: 'Módulo 07 - Gestão de Pagamentos',
    moduleDescription: 'Contas a pagar/receber, aprovações e relatórios',
  },
  {
    moduleId: '08',
    moduleKey: 'modulo08',
    moduleName: 'Módulo 08 - Fluxo Financeiro',
    moduleDescription: 'Custos, fornecedores e auditorias financeiras',
  },
  {
    moduleId: '09',
    moduleKey: 'modulo09',
    moduleName: 'Módulo 09 - Dashboard Executivo',
    moduleDescription: 'Visão executiva consolidada e indicadores gerais',
  },
];

// ============================================
// Component
// ============================================

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<UserPermissions>(() =>
    createDefaultUserPermissions('Seller')
  );
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<AppUserRole>('Seller');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize permissions when user changes
  useEffect(() => {
    if (user) {
      const initialPermissions = user.permissions || createDefaultUserPermissions(user.role);
      setPermissions(initialPermissions);
      setUserName(user.name || '');
      setUserRole(user.role);
      setPin(user.pin || '');
      setHasChanges(false);
    }
  }, [user]);

  const handleToggleAccess = (moduleKey: keyof UserPermissions['modulos'], hasAccess: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      modulos: {
        ...prev.modulos,
        [moduleKey]: hasAccess,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!userName.trim()) {
      toast.error('Informe o nome do usuário');
      return;
    }
    if (userRole === 'Master' && pin && pin.length !== 6) {
      toast.error('O PIN Master deve ter 6 dígitos');
      return;
    }

    setIsSaving(true);
    try {
      const userPermissions: UserPermissionsPayload = {
        userId: user.id,
        userCode: user.code,
        userName: userName.trim(),
        userRole,
        permissions,
        pin: pin || undefined,
      };

      if (onSave) {
        await onSave(userPermissions);
      }

      toast.success('Permissões salvas com sucesso!');
      setHasChanges(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    setPermissions(() => ({
      modulos: {
        modulo00: true,
        modulo01: true,
        modulo02: true,
        modulo03: true,
        modulo04: true,
        modulo05: true,
        modulo06: true,
        modulo07: true,
        modulo08: true,
        modulo09: true,
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
        acessarConfiguracoes: true,
      },
    }));
    setHasChanges(true);
  };

  const handleClearAll = () => {
    setPermissions(() => ({
      modulos: {
        modulo00: false,
        modulo01: false,
        modulo02: false,
        modulo03: false,
        modulo04: false,
        modulo05: false,
        modulo06: false,
        modulo07: false,
        modulo08: false,
        modulo09: false,
      },
      acoes: {
        cadastrarAluno: false,
        editarAluno: false,
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
    }));
    setHasChanges(true);
  };

  const getPermissionCount = () => {
    return Object.values(permissions.modulos).filter(Boolean).length;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Permissões de Acesso
          </DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso aos módulos do sistema
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="py-3 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                <p className="text-sm text-muted-foreground">Edite nome e nível de acesso do usuário</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {getPermissionCount()}/{MODULES_CONFIG.length}
                </div>
                <div className="text-xs text-muted-foreground">módulos ativos</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={user.code || '-'} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso (Preset)</Label>
              <Select
                value={userRole}
                onValueChange={(value: AppUserRole) => {
                  setUserRole(value);
                  setPermissions(createDefaultUserPermissions(value));
                  if (value !== 'Master') {
                    setPin('');
                  }
                  setHasChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Master">Master - Acesso Total</SelectItem>
                  <SelectItem value="Admin">Admin - Gestão Operacional</SelectItem>
                  <SelectItem value="Seller">Vendedor - Apenas Vendas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                O nível define permissões padrão, mas você pode customizar cada permissão abaixo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            <Check className="w-4 h-4 mr-1" />
            Marcar Todos
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="w-4 h-4 mr-1" />
            Desmarcar Todos
          </Button>
        </div>

        <Separator />

        {/* PIN de Segurança - para usuários admin */}
        {userRole === 'Master' && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                PIN de Segurança (6 dígitos)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^0-9]/g, '');
                  setPin(valor);
                  setHasChanges(true);
                }}
                placeholder="Digite 6 dígitos"
                className="max-w-xs"
              />
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                PIN necessário para ações críticas como aprovação em lote
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Permissões de Ações Granulares */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-700">Permissões de Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ACTION_GROUPS.map((group, idx) => {
              const Icon = group.icon;
              return (
                <div key={idx}>
                  {idx > 0 && <Separator className="my-3" />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium text-sm text-gray-700">{group.title}</h4>
                    </div>
                    <div className="space-y-2 ml-6">
                      {group.actions.map((action) => (
                        <div key={action.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={action.id}
                            checked={permissions.acoes[action.id] ?? false}
                            onCheckedChange={(checked) => {
                              setPermissions((prev) => ({
                                ...prev,
                                acoes: {
                                  ...prev.acoes,
                                  [action.id]: checked === true,
                                },
                              }));
                              setHasChanges(true);
                            }}
                          />
                          <Label
                            htmlFor={action.id}
                            className={`cursor-pointer text-sm ${action.critical ? 'font-medium text-red-600' : ''}`}
                          >
                            {action.name}
                            {action.critical && <span className="ml-1 text-xs">(Critico)</span>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Modules List */}
        <div className="space-y-3">
          {MODULES_CONFIG.map((module) => (
            <Card
              key={module.moduleId}
              className={`transition-all ${
                permissions.modulos[module.moduleKey]
                  ? 'border-l-4 border-l-green-500 bg-green-50/50'
                  : 'border-l-4 border-l-gray-300 bg-gray-50/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Module Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={permissions.modulos[module.moduleKey] ? 'default' : 'secondary'}
                        className="font-mono text-xs"
                      >
                        {module.moduleId}
                      </Badge>
                      <span className="font-medium">{module.moduleName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.moduleDescription}
                    </p>
                  </div>

                  {/* Toggle Access */}
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={permissions.modulos[module.moduleKey]}
                      onCheckedChange={(checked) =>
                        handleToggleAccess(module.moduleKey, checked)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {permissions.modulos[module.moduleKey] ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
