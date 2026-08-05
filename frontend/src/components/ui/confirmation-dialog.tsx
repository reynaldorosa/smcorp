'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type ConfirmationLevel = 'simple' | 'pin' | 'double';

export interface ConfirmationOptions {
  title: string;
  description: string;
  level: ConfirmationLevel;
  action: string;
  destructive?: boolean;
  pinLength?: number;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationContextValue {
  requestConfirmation: (options: ConfirmationOptions) => void;
  isOpen: boolean;
}

// ============================================
// Context
// ============================================

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}

// ============================================
// Provider Component
// ============================================

interface ConfirmationProviderProps {
  children: ReactNode;
  masterPin?: string;
  validateMasterPin?: (pin: string) => Promise<boolean>;
}

export function ConfirmationProvider({ children, masterPin, validateMasterPin }: ConfirmationProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'first' | 'pin' | 'second'>('first');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const requestConfirmation = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setStep('first');
    setPin('');
    setPinError('');
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    setOptions(null);
    setPin('');
    setPinError('');
    options?.onCancel?.();
  };

  const handleFirstConfirm = () => {
    if (!options) return;

    if (options.level === 'simple') {
      executeAction();
    } else if (options.level === 'pin') {
      setStep('pin');
    } else if (options.level === 'double') {
      setStep('second');
    }
  };

  const handlePinSubmit = async () => {
    if (!options) return;

    const requiredLength = options.pinLength || 6;

    if (pin.length !== requiredLength) {
      setPinError(`O PIN deve ter ${requiredLength} dígitos`);
      return;
    }

    if (validateMasterPin) {
      try {
        const authorized = await validateMasterPin(pin);
        if (!authorized) {
          setPinError('PIN incorreto. Tente novamente.');
          setPin('');
          return;
        }
      } catch {
        setPinError('PIN incorreto. Tente novamente.');
        setPin('');
        return;
      }
    } else {
      const expectedPin = masterPin;
      if (!expectedPin) {
        setPinError('PIN do usuario master nao configurado.');
        return;
      }

      if (pin !== expectedPin) {
        setPinError('PIN incorreto. Tente novamente.');
        setPin('');
        return;
      }
    }

    // PIN is correct
    if (options.level === 'pin') {
      executeAction();
    } else if (options.level === 'double') {
      setStep('second');
    }
  };

  const handleSecondConfirm = () => {
    executeAction();
  };

  const executeAction = async () => {
    if (!options) return;

    setIsLoading(true);
    try {
      await options.onConfirm();
      toast.success('Ação confirmada com sucesso!');
      setIsOpen(false);
      setOptions(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao executar ação';
      toast.error(message);
    } finally {
      setIsLoading(false);
      setPin('');
      setPinError('');
    }
  };

  const getStepContent = () => {
    if (!options) return null;

    switch (step) {
      case 'first':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                {options.destructive ? (
                  <div className="p-2 rounded-full bg-red-100">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-blue-100">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <DialogTitle>{options.title}</DialogTitle>
                  <DialogDescription className="mt-1">{options.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Ação:</strong> {options.action}
                </p>
                {options.level !== 'simple' && (
                  <p className="text-xs text-amber-600 mt-2">
                    {options.level === 'pin' && '🔐 Esta ação requer confirmação com PIN de segurança.'}
                    {options.level === 'double' && '🔐 Esta ação requer confirmação em 2 níveis + PIN.'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleFirstConfirm}
                variant={options.destructive ? 'destructive' : 'default'}
                disabled={isLoading}
              >
                {options.level === 'simple' ? 'Confirmar' : 'Continuar'}
              </Button>
            </DialogFooter>
          </>
        );

      case 'pin':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <DialogTitle>Digite o PIN de Segurança</DialogTitle>
                  <DialogDescription className="mt-1">
                    Insira o PIN de {options.pinLength || 6} dígitos para confirmar esta ação
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN de Segurança</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= (options.pinLength || 6)) {
                        setPin(value);
                        setPinError('');
                      }
                    }}
                    placeholder="••••••"
                    maxLength={options.pinLength || 6}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {pinError}
                    </p>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-700">
                    <strong>💡 Dica:</strong> O PIN é definido pelo usuário Master no cadastro de usuários.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('first')} disabled={isLoading}>
                Voltar
              </Button>
              <Button
                onClick={handlePinSubmit}
                disabled={isLoading || pin.length !== (options.pinLength || 6)}
              >
                Verificar PIN
              </Button>
            </DialogFooter>
          </>
        );

      case 'second':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <DialogTitle>Confirmação Final</DialogTitle>
                  <DialogDescription className="mt-1">
                    Você está prestes a executar uma ação crítica
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-green-800">
                  <strong>✓ Primeira confirmação:</strong> Aprovada
                </p>
                <p className="text-sm text-green-800">
                  <strong>✓ PIN de segurança:</strong> Verificado
                </p>
                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm font-medium text-green-900">
                    Confirma a execução desta ação?
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {options.action}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSecondConfirm}
                variant={options.destructive ? 'destructive' : 'default'}
                disabled={isLoading}
              >
                {isLoading ? 'Executando...' : 'Confirmar Definitivamente'}
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation, isOpen }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          {getStepContent()}
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  );
}

// ============================================
// Hook for simplified usage
// ============================================

export function useSecureConfirmation() {
  const { requestConfirmation } = useConfirmation();

  const confirmSimple = useCallback(
    (title: string, description: string, action: string, onConfirm: () => void | Promise<void>) => {
      requestConfirmation({
        title,
        description,
        action,
        level: 'simple',
        onConfirm,
      });
    },
    [requestConfirmation]
  );

  const confirmWithPin = useCallback(
    (
      title: string,
      description: string,
      action: string,
      onConfirm: () => void | Promise<void>,
      destructive = false
    ) => {
      requestConfirmation({
        title,
        description,
        action,
        level: 'pin',
        destructive,
        onConfirm,
      });
    },
    [requestConfirmation]
  );

  const confirmDouble = useCallback(
    (
      title: string,
      description: string,
      action: string,
      onConfirm: () => void | Promise<void>,
      destructive = true
    ) => {
      requestConfirmation({
        title,
        description,
        action,
        level: 'double',
        destructive,
        onConfirm,
      });
    },
    [requestConfirmation]
  );

  return {
    confirmSimple,
    confirmWithPin,
    confirmDouble,
    requestConfirmation,
  };
}

// ============================================
// Pre-configured confirmations for common actions
// ============================================

export const CRITICAL_ACTIONS = {
  DELETE_STUDENT: {
    title: 'Excluir Aluno',
    description: 'Esta ação irá excluir permanentemente o aluno e todos os dados associados.',
    level: 'double' as ConfirmationLevel,
    destructive: true,
  },
  DELETE_CLASS: {
    title: 'Excluir Turma',
    description: 'Esta ação irá excluir a turma e remover todas as matrículas associadas.',
    level: 'double' as ConfirmationLevel,
    destructive: true,
  },
  CANCEL_ENROLLMENT: {
    title: 'Cancelar Matrícula',
    description: 'A matrícula será cancelada e o aluno removido da turma.',
    level: 'pin' as ConfirmationLevel,
    destructive: true,
  },
  CONFIRM_PAYMENT: {
    title: 'Confirmar Pagamento',
    description: 'Você está confirmando o recebimento deste pagamento.',
    level: 'pin' as ConfirmationLevel,
    destructive: false,
  },
  REFUND_PAYMENT: {
    title: 'Estornar Pagamento',
    description: 'O pagamento será estornado e o valor retornado ao cliente.',
    level: 'double' as ConfirmationLevel,
    destructive: true,
  },
  APPROVE_ALL_DOCUMENTS: {
    title: 'Aprovar Todos os Documentos',
    description: 'Todos os documentos pendentes serão aprovados.',
    level: 'pin' as ConfirmationLevel,
    destructive: false,
  },
  DELETE_COST: {
    title: 'Excluir Custo',
    description: 'O custo e todos os lançamentos associados serão removidos.',
    level: 'pin' as ConfirmationLevel,
    destructive: true,
  },
};
