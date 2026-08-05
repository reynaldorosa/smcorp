'use client';

import React, { useState } from 'react';
import { Trash2, ShieldAlert, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

// ============================================
// Types
// ============================================

interface DeleteCostEntryDialogProps {
  entryId: string;
  entryCode: string;
  entryDescription: string;
  entryValue: number;
  onDelete: (entryId: string) => void;
  onDeleted?: () => void;
}

// ============================================
// Component
// ============================================

export const DeleteCostEntryDialog: React.FC<DeleteCostEntryDialogProps> = ({
  entryId,
  entryCode,
  entryDescription,
  entryValue,
  onDelete,
  onDeleted,
}) => {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      await authService.authorizeMasterPin(pin);
    } catch {
      setError('PIN invalido!');
      toast.error('PIN incorreto!', {
        description: 'O PIN digitado não corresponde a um usuário Master autorizado.',
      });
      return;
    }

    onDelete(entryId);

    toast.success('✅ Lançamento excluído!', {
      description: `${entryCode} foi removido com sucesso`,
    });

    setPin('');
    setError('');
    setOpen(false);

    if (onDeleted) {
      onDeleted();
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="w-5 h-5" />
            Confirmar Exclusão de Lançamento
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e requer autorização via PIN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entry Info */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Código:</span>
              <Badge variant="destructive">{entryCode}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Descrição:</span>
              <span className="text-sm text-red-700">{entryDescription}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Valor:</span>
              <span className="text-sm font-mono text-red-700">
                R$ {Number(entryValue).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Atenção:</strong> Este lançamento será permanentemente excluído do sistema.
              Esta ação não pode ser desfeita!
            </p>
          </div>

          {/* PIN Field */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-600" />
              Digite seu PIN para confirmar
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length === 6) {
                  handleDelete();
                }
              }}
              className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pin.length !== 6}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </div>

          {/* Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              💡 Use o PIN do usuario Master para autorizar esta acao
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
