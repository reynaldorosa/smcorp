'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { roomsService, type Room, type CreateRoomDTO, type UpdateRoomDTO } from '@/services/rooms.service';

// ============================================
// Types
// ============================================

interface RoomFormData {
  name: string;
  location: string;
  address: string;
  capacity: number;
  dailyCost: number;
}

const initialFormData: RoomFormData = {
  name: '',
  location: '',
  address: '',
  capacity: 20,
  dailyCost: 0,
};

// ============================================
// Component
// ============================================

export function RoomsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);

  // Query
  const { data: roomsData, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsService.getAll(),
  });

  const rooms = roomsData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateRoomDTO) => roomsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala criada com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar sala: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomDTO }) => roomsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala atualizada com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar sala: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Sala removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover sala: ${error.message}`);
    },
  });

  // Handlers
  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        location: room.location || '',
        address: room.address || '',
        capacity: room.capacity,
        dailyCost: room.dailyCost || 0,
      });
    } else {
      setEditingRoom(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome da sala');
      return;
    }

    const data: CreateRoomDTO = {
      name: formData.name,
      location: formData.location || undefined,
      address: formData.address || undefined,
      capacity: formData.capacity,
      dailyCost: formData.dailyCost || undefined,
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta sala?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          <p className="text-destructive">Erro ao carregar salas: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })}>
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
            <CardTitle>Salas</CardTitle>
            <CardDescription>Gerencie as salas de aula e espaços de treinamento</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sala
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma sala cadastrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Nova Sala&quot; para cadastrar sua primeira sala
                </p>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.location && <span>{room.location} • </span>}
                        Capacidade: {room.capacity} alunos
                        {room.dailyCost ? ` • ${formatCurrency(room.dailyCost)}/dia` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={room.active ? 'default' : 'secondary'}>
                      {room.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(room.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
            <DialogDescription>Preencha os dados da sala de aula</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Nome da Sala *</Label>
              <Input
                id="roomName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sala A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomLocation">Localização</Label>
              <Input
                id="roomLocation"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Prédio Principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomAddress">Endereço</Label>
              <Input
                id="roomAddress"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomCapacity">Capacidade</Label>
                <Input
                  id="roomCapacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomDailyCost">Custo Diário (R$)</Label>
                <Input
                  id="roomDailyCost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.dailyCost}
                  onChange={(e) => setFormData({ ...formData, dailyCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
