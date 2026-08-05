'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Edit, Trash2, Shield, UserCog, User, KeyRound } from 'lucide-react';
import { usersService, type CreateUserDTO, type UpdateUserDTO, type UserRole } from '@/services/users.service';
import { UserPermissionsDialog, type UserPermissionsPayload } from './dialogs';
import { useSettingsStore, type User as SettingsUser } from '@/stores/settings.store';
import { createDefaultUserPermissions, mapApiRoleToAppRole, type AppUserRole } from '@/lib/user-permissions';

// ============================================
// Types
// ============================================

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  pin: string;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'SELLER',
  pin: '',
};

// ============================================
// Helpers
// ============================================

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'MASTER':
    case 'ADMIN':
    case 'Master':
    case 'Admin':
      return <Shield className="h-4 w-4" />;
    case 'COLLABORATOR':
    case 'Seller':
      return <UserCog className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    MASTER: 'Master',
    ADMIN: 'Admin',
    COLLABORATOR: 'Colaborador',
    SELLER: 'Vendedor',
    Master: 'Master',
    Admin: 'Admin',
    Seller: 'Vendedor',
  };
  return labels[role] || role;
};

const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  switch (role) {
    case 'MASTER':
    case 'Master':
      return 'default';
    case 'ADMIN':
    case 'Admin':
      return 'secondary';
    default:
      return 'outline';
  }
};

const mapAppRoleToApiRole = (role: AppUserRole): UserRole => {
  switch (role) {
    case 'Master':
      return 'MASTER';
    case 'Admin':
      return 'ADMIN';
    default:
      return 'SELLER';
  }
};

const areUsersEqual = (left: SettingsUser[], right: SettingsUser[]) => {
  if (left.length !== right.length) return false;
  const rightById = new Map(right.map((user) => [user.id, user]));
  return left.every((user) => {
    const match = rightById.get(user.id);
    if (!match) return false;
    return (
      user.name === match.name &&
      user.email === match.email &&
      user.role === match.role &&
      user.pin === match.pin &&
      JSON.stringify(user.permissions) === JSON.stringify(match.permissions)
    );
  });
};

const getNextUserCode = (users: SettingsUser[]) => {
  const max = users.reduce((acc, user) => {
    if (!user.code) return acc;
    const match = user.code.match(/U(\d+)/i);
    if (!match) return acc;
    const value = Number(match[1]);
    return Number.isNaN(value) ? acc : Math.max(acc, value);
  }, 0);
  return `U${String(max + 1).padStart(4, '0')}`;
};

// ============================================
// Component
// ============================================

export function UsersTab() {
  const queryClient = useQueryClient();
  const { users: storedUsers, setUsers, addUser, updateUser } = useSettingsStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SettingsUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<SettingsUser | null>(null);

  // Query
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  const mergedUsers = useMemo<SettingsUser[]>(() => {
    if (!usersData?.data) return [];
    const storedById = new Map(storedUsers.map((user) => [user.id, user]));
    return usersData.data.map((user) => {
      const stored = storedById.get(user.id);
      const role = mapApiRoleToAppRole(user.role);
      return {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        role,
        pin: stored?.pin,
        permissions: stored?.permissions || createDefaultUserPermissions(role),
        active: user.active,
        createdAt: user.createdAt,
      };
    });
  }, [storedUsers, usersData?.data]);

  const users = mergedUsers.length ? mergedUsers : storedUsers;

  useEffect(() => {
    if (!usersData?.data || mergedUsers.length === 0) return;
    if (!areUsersEqual(mergedUsers, storedUsers)) {
      setUsers(mergedUsers);
    }
  }, [mergedUsers, setUsers, storedUsers, usersData?.data]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateUserDTO) => usersService.create(data),
    onSuccess: (createdUser) => {
      const role = mapApiRoleToAppRole(createdUser.role);
      const fallbackCode = createdUser.code || getNextUserCode(storedUsers);
      addUser({
        id: createdUser.id,
        code: fallbackCode,
        name: createdUser.name,
        email: createdUser.email,
        role,
        pin: role === 'Master' ? formData.pin : undefined,
        permissions: createDefaultUserPermissions(role),
        active: createdUser.active,
        createdAt: createdUser.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDTO }) => usersService.update(id, data),
    onSuccess: (updatedUser) => {
      const role = mapApiRoleToAppRole(updatedUser.role);
      const previousUser = storedUsers.find((user) => user.id === updatedUser.id);
      const shouldResetPermissions = previousUser?.role !== role;
      updateUser(updatedUser.id, {
        code: updatedUser.code,
        name: updatedUser.name,
        email: updatedUser.email,
        role,
        pin: role === 'Master' ? formData.pin : undefined,
        permissions: shouldResetPermissions
          ? createDefaultUserPermissions(role)
          : previousUser?.permissions || createDefaultUserPermissions(role),
        active: updatedUser.active,
        createdAt: updatedUser.createdAt,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    },
  });

  // Handlers
  const handleOpenDialog = (user?: SettingsUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Never pre-fill password
        role: mapAppRoleToApiRole(user.role),
        pin: user.pin || '',
      });
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome do usuário');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Por favor, insira o e-mail do usuário');
      return;
    }
    if (formData.role === 'MASTER' && formData.pin.trim().length !== 6) {
      toast.error('O PIN Master deve ter 6 dígitos');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error('Por favor, insira a senha do usuário');
      return;
    }

    if (editingUser) {
      const updateData: UpdateUserDTO = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        masterPin: formData.role === 'MASTER' && formData.pin ? formData.pin : undefined,
      };
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        masterPin: formData.role === 'MASTER' ? formData.pin : undefined,
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenPermissions = (user: SettingsUser) => {
    setSelectedUserForPermissions(user);
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async (payload: UserPermissionsPayload) => {
    try {
      await usersService.update(payload.userId, {
        name: payload.userName,
        role: mapAppRoleToApiRole(payload.userRole),
        masterPin: payload.userRole === 'Master' && payload.pin ? payload.pin : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao persistir permissões no servidor';
      toast.error(message);
      return;
    }

    updateUser(payload.userId, {
      code: payload.userCode,
      name: payload.userName,
      role: payload.userRole,
      permissions: payload.permissions,
      pin: payload.pin,
    });
    toast.success(`Permissões de ${payload.userName} atualizadas!`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Erro ao carregar usuários: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gerencie os usuários do sistema</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Novo Usuário&quot; para cadastrar
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.code && (
                        <p className="text-xs text-muted-foreground">Codigo: {user.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant={user.active ? 'default' : 'secondary'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenPermissions(user)}
                      title="Gerenciar Permissões"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>Preencha os dados do usuário</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userName">Nome *</Label>
                <Input
                  id="userName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">E-mail *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!editingUser ? (
                <div>
                  <Label htmlFor="userPassword">Senha *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              ) : (
                <div />
              )}

              <div>
                <Label htmlFor="userRole">Perfil</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) =>
                    setFormData({
                      ...formData,
                      role: value,
                      pin: value === 'MASTER' ? formData.pin : '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASTER">Master</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
                    <SelectItem value="SELLER">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.role === 'MASTER' && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-sm">PIN Master</h3>
                </div>
                <div className="pl-6 border-l-2 border-red-200">
                  <Label htmlFor="userPin">PIN Master (6 dígitos)</Label>
                  <Input
                    id="userPin"
                    type="password"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, pin: value });
                    }}
                    placeholder="Digite 6 dígitos"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Esse PIN será solicitado em ações sensíveis do sistema.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t shrink-0 bg-white">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <UserPermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={selectedUserForPermissions ? {
          id: selectedUserForPermissions.id,
          code: selectedUserForPermissions.code,
          name: selectedUserForPermissions.name,
          role: selectedUserForPermissions.role,
          permissions: selectedUserForPermissions.permissions,
          pin: selectedUserForPermissions.pin,
        } : null}
        onSave={handleSavePermissions}
      />
    </>
  );
}
