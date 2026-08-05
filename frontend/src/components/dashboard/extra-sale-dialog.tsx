'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { enrollmentOperations } from '@/services/operations.service';
import { extraProductsService, type ExtraProduct } from '@/services/extra-products.service';

interface ExtraSaleDialogProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentName: string;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function ExtraSaleDialog({
  open,
  onClose,
  enrollmentId,
  studentName,
}: ExtraSaleDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar produtos extras
  const { data: products, isLoading: loadingProducts } = useQuery<ExtraProduct[]>({
    queryKey: ['extra-products'],
    queryFn: async () => {
      const response = await extraProductsService.getAll(1, 100);
      return response.data || [];
    },
    enabled: open,
  });

  // Mutation para criar venda extra
  const createSaleMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      return enrollmentOperations.addExtraProducts(
        enrollmentId,
        items.map((item) => ({
          extraProductId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-extras', enrollmentId] });
      toast({
        title: 'Venda Extra Registrada',
        description: 'Produtos adicionados ao histórico do aluno',
      });
      setCart([]);
      onClose();
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a venda',
        variant: 'destructive',
      });
    },
  });

  const handleAddToCart = () => {
    if (!selectedProductId || quantity < 1) {
      toast({
        title: 'Atenção',
        description: 'Selecione um produto e quantidade válida',
        variant: 'destructive',
      });
      return;
    }

    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    // Verificar se já existe no carrinho
    const existingIndex = cart.findIndex(item => item.productId === selectedProductId);
    
    if (existingIndex >= 0) {
      // Atualizar quantidade
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
      setCart(newCart);
    } else {
      // Adicionar novo item
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price,
      }]);
    }

    // Reset
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrinho Vazio',
        description: 'Adicione produtos antes de finalizar',
        variant: 'destructive',
      });
      return;
    }

    createSaleMutation.mutate(cart);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Venda Extra - {studentName}
          </DialogTitle>
          <DialogDescription>
            Adicione produtos extras à matrícula do aluno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Produto */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={selectedProductId || ''}
                    onValueChange={setSelectedProductId}
                    disabled={loadingProducts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.filter((product) => product.active).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full"
                disabled={!selectedProductId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </CardContent>
          </Card>

          {/* Carrinho */}
          {cart.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Carrinho</h3>
                  <Badge variant="secondary">{cart.length} item(s)</Badge>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFromCart(item.productId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || createSaleMutation.isPending}
          >
            {createSaleMutation.isPending ? 'Processando...' : 'Finalizar Venda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
