import React, { useState } from 'react';
import { Trash2, ShieldAlert, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogExcluirLancamentoProps {
  lancamentoId: string;
  lancamentoCodigo: string;
  lancamentoDescricao: string;
  lancamentoValor: number;
  onExcluido?: () => void;
}

export const DialogExcluirLancamento: React.FC<DialogExcluirLancamentoProps> = ({
  lancamentoId,
  lancamentoCodigo,
  lancamentoDescricao,
  lancamentoValor,
  onExcluido
}) => {
  const { excluirLancamentoCusto, usuarios } = useSMCorp();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');

  const handleExcluir = () => {
    // Verificar PIN
    const usuarioAutorizado = usuarios.find(u => u.pin === pin);
    
    if (!usuarioAutorizado) {
      setErro('PIN inválido!');
      toast.error('PIN incorreto!', {
        description: 'O PIN digitado não corresponde a nenhum usuário autorizado.'
      });
      return;
    }

    // Verificar permissões (opcional - pode adicionar permissão específica)
    // Por enquanto, qualquer usuário com PIN válido pode excluir
    
    // Executar exclusão
    excluirLancamentoCusto(lancamentoId);
    
    // Feedback e fechamento
    toast.success('✅ Lançamento excluído!', {
      description: `${lancamentoCodigo} foi removido por ${usuarioAutorizado.nome}`
    });
    
    setPin('');
    setErro('');
    setOpen(false);
    
    // Callback opcional
    if (onExcluido) {
      onExcluido();
    }
  };

  const handleClose = () => {
    setPin('');
    setErro('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-2"
        >
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
          {/* Informações do Lançamento */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Código:</span>
              <Badge variant="destructive">{lancamentoCodigo}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Descrição:</span>
              <span className="text-sm text-red-700">{lancamentoDescricao}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Valor:</span>
              <span className="text-sm font-mono text-red-700">
                R$ {lancamentoValor.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Aviso */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Atenção:</strong> Este lançamento será permanentemente excluído do sistema.
              Esta ação não pode ser desfeita!
            </p>
          </div>

          {/* Campo de PIN */}
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
                setErro('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length >= 4) {
                  handleExcluir();
                }
              }}
              className={erro ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {erro && (
              <p className="text-sm text-red-600">{erro}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluir}
              disabled={pin.length < 4}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </div>

          {/* Info dos usuários */}
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              💡 Use o PIN de qualquer usuário cadastrado para autorizar esta ação
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
