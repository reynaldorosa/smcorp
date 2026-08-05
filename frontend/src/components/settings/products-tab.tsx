'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { 
  extraProductsService, 
  type ExtraProduct, 
  type CreateExtraProductDTO, 
  type UpdateExtraProductDTO,
  type ProductType 
} from '@/services/extra-products.service';
import { useCostsStore } from '@/stores/costs.store';

// ============================================
// Types
// ============================================

interface ProductFormData {
  name: string;
  type: ProductType;
  price: number;
  description: string;
  associatedCosts: string[];
}

// Custos associados serão carregados do store de custos auditáveis

const initialFormData: ProductFormData = {
  name: '',
  type: 'product',
  price: 0,
  description: '',
  associatedCosts: [],
};

// ============================================
// Component
// ============================================

export function ProductsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtraProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Custos auditáveis do store (dados reais)
  const { auditableCosts } = useCostsStore();
  const availableCosts = auditableCosts.map((c) => ({
    id: c.id,
    code: c.code || c.id,
    name: c.name,
    value: c.value || 0,
  }));

  // Query
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['extra-products'],
    queryFn: () => extraProductsService.getAll(),
  });

  const products = productsData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateExtraProductDTO) => extraProductsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-products'] });
      toast.success('Produto criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExtraProductDTO }) => extraProductsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-products'] });
      toast.success('Produto atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => extraProductsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-products'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover produto: ${error.message}`);
    },
  });

  // Handlers
  const handleOpenDialog = (product?: ExtraProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        type: product.type,
        price: product.price,
        description: product.description || '',
        associatedCosts: product.associatedCosts || [],
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Por favor, insira o nome do produto');
      return;
    }

    const data: CreateExtraProductDTO = {
      name: formData.name,
      type: formData.type,
      price: formData.price,
      description: formData.description || undefined,
      associatedCosts: formData.associatedCosts.length > 0 ? formData.associatedCosts : undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o produto "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTypeLabel = (type: ProductType): string => {
    return type === 'product' ? 'Produto' : 'Extra';
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
          <p className="text-destructive">Erro ao carregar produtos: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['extra-products'] })}>
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
            <CardTitle>Produtos e Extras</CardTitle>
            <CardDescription>Gerencie os produtos extras para venda avulsa</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Novo Produto&quot; para cadastrar
                </p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.code && <span>Codigo: {product.code} • </span>}
                        {getTypeLabel(product.type)} • {formatCurrency(product.price)}
                        {product.description && <span> • {product.description}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.type === 'product' ? 'default' : 'secondary'}>
                      {getTypeLabel(product.type)}
                    </Badge>
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(product.id, product.name)}
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
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>Preencha os dados do produto extra</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Nome *</Label>
              <Input
                id="productName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="extra">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productPrice">Preço (R$)</Label>
                <Input
                  id="productPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productDescription">Descrição</Label>
              <Textarea
                id="productDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>
            
            {/* Custos Associados */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <Label>Custos Associados</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione os custos que compõem este produto:
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {availableCosts.map((custo) => (
                  <div key={custo.id} className="flex items-center space-x-2 p-2 bg-white rounded border hover:bg-blue-50">
                    <Checkbox
                      id={`custo-${custo.id}`}
                      checked={formData.associatedCosts.includes(custo.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, associatedCosts: [...formData.associatedCosts, custo.id] });
                        } else {
                          setFormData({ ...formData, associatedCosts: formData.associatedCosts.filter(id => id !== custo.id) });
                        }
                      }}
                    />
                    <Label htmlFor={`custo-${custo.id}`} className="text-sm font-normal cursor-pointer flex-1">
                      <span className="font-mono text-xs text-blue-600">{custo.code}</span> - {custo.name}
                      <span className="ml-2 text-green-600">R$ {Number(custo.value).toFixed(2)}</span>
                    </Label>
                  </div>
                ))}
              </div>
              {formData.associatedCosts.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs text-green-700 font-medium">
                    ✓ {formData.associatedCosts.length} custo(s) associado(s) - Total: R$ {
                      availableCosts.filter(c => formData.associatedCosts.includes(c.id))
                        .reduce((sum, c) => sum + Number(c.value), 0).toFixed(2)
                    }
                  </p>
                </div>
              )}
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
