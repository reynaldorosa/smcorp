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
import { Truck, Plus, Edit, Trash2 } from 'lucide-react';
import { suppliersService, type Supplier, type CreateSupplierDTO, type UpdateSupplierDTO } from '@/services/suppliers.service';

// ============================================
// Types
// ============================================

interface SupplierFormData {
  name: string;
  companyTaxId: string;
  phone: string;
  email: string;
  category: string;
  address: string;
}

const initialFormData: SupplierFormData = {
  name: '',
  companyTaxId: '',
  phone: '',
  email: '',
  category: '',
  address: '',
};

// ============================================
// Component
// ============================================

export function SuppliersTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);

  // Query
  const { data: suppliersData, isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.getAll(),
  });

  const suppliers = suppliersData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierDTO) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fornecedor: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDTO }) => suppliersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover fornecedor: ${error.message}`);
    },
  });

  // Handlers
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        companyTaxId: supplier.companyTaxId || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        category: supplier.category || '',
        address: supplier.address || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome do fornecedor');
      return;
    }

    const data: CreateSupplierDTO = {
      name: formData.name,
      companyTaxId: formData.companyTaxId || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      category: formData.category || undefined,
      address: formData.address || undefined,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o fornecedor "${name}"?`)) {
      deleteMutation.mutate(id);
    }
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
          <p className="text-destructive">Erro ao carregar fornecedores: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}>
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
            <CardTitle>Fornecedores</CardTitle>
            <CardDescription>Gerencie os fornecedores cadastrados</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum fornecedor cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Novo Fornecedor&quot; para cadastrar
                </p>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.code && <span>Codigo: {supplier.code} • </span>}
                        {supplier.category && <span>{supplier.category}</span>}
                        {supplier.companyTaxId && <span> • {supplier.companyTaxId}</span>}
                        {supplier.phone && <span> • {supplier.phone}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={supplier.active ? 'default' : 'secondary'}>
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(supplier.id, supplier.name)}
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
            <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Nome *</Label>
              <Input
                id="supplierName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierCnpj">CNPJ</Label>
                <Input
                  id="supplierCnpj"
                  value={formData.companyTaxId}
                  onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierCategory">Categoria</Label>
                <Input
                  id="supplierCategory"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Transporte, Alimentação"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierPhone">Telefone</Label>
                <Input
                  id="supplierPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierEmail">E-mail</Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@fornecedor.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierAddress">Endereço</Label>
              <Input
                id="supplierAddress"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
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
