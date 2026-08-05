'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { checkoutService } from '@/services/tenants.service';
import { formatCurrency } from '@/lib/utils';

interface PixCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  amount: number;
  onPaid?: () => void;
}

/**
 * Checkout PIX (Mercado Pago) de um pagamento pendente da matrícula.
 * Exibe o QR code + copia-e-cola e faz polling até o pagamento ser aprovado
 * (funciona mesmo sem webhook alcançando o servidor — dev).
 */
export function PixCheckoutDialog({
  open,
  onOpenChange,
  enrollmentId,
  amount,
  onPaid,
}: PixCheckoutDialogProps) {
  const [loading, setLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const createCheckout = async () => {
    setLoading(true);
    setPaid(false);
    setCopied(false);
    try {
      const result = await checkoutService.createCheckout(enrollmentId);
      setQrBase64(result.qrCodeBase64 || '');
      setQrCode(result.qrCode || '');
      setPaymentId(result.paymentId);
      if (!result.qrCodeBase64 && !result.qrCode) {
        toast.error('Mercado Pago não retornou o QR code. Verifique a configuração do gateway.');
      }
    } catch (error) {
      console.error('Falha ao criar checkout PIX:', error);
      const message =
        error instanceof Error && error.message ? error.message : 'Erro ao gerar o PIX';
      toast.error(`Erro ao gerar o PIX: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Polling de status (10s) enquanto o dialog está aberto com um PIX gerado
  useEffect(() => {
    if (!open || !paymentId) return;
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await checkoutService.getStatus(paymentId);
        if (status.status === 'PAID') {
          stopPolling();
          setPaid(true);
          toast.success('Pagamento confirmado!');
          onPaid?.();
        }
      } catch (error) {
        console.warn('Polling de checkout falhou:', error);
      }
    }, 10000);
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentId]);

  // Gera o PIX automaticamente ao abrir o dialog
  useEffect(() => {
    if (open && !paymentId) {
      void createCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copyQr = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente o código abaixo.');
    }
  };

  const handleClose = () => {
    stopPolling();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Valor: {formatCurrency(amount)} — Escaneie o QR code ou copie o código PIX para pagar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando QR code...
            </div>
          )}

          {!loading && paid && (
            <div className="flex flex-col items-center gap-2 text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="font-medium text-green-700">Pagamento confirmado!</p>
              <p className="text-sm text-gray-500">
                A matrícula será atualizada automaticamente.
              </p>
            </div>
          )}

          {!loading && !paid && qrBase64 && (
            <>
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR code PIX"
                className="w-56 h-56 rounded-lg border border-gray-200"
              />
              {qrCode ? (
                <>
                  <Button variant="outline" size="sm" onClick={copyQr} className="gap-2">
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copiado!' : 'Copiar código PIX'}
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center break-all max-h-16 overflow-y-auto px-2">
                    {qrCode}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  QR code indisponível — confira a configuração do gateway.
                </p>
              )}
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação do pagamento...
              </p>
            </>
          )}

          {!loading && !paid && !qrBase64 && !qrCode && (
            <div className="flex flex-col items-center gap-2 py-4">
              <XCircle className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhum QR gerado.</p>
              <Button size="sm" onClick={() => void createCheckout()}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
