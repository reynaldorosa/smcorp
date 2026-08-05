'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Download } from 'lucide-react';
import { enrollmentOperations } from '@/services/operations.service';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  studentName: string;
}

export function QRCodeModal({ open, onClose, enrollmentId, studentName }: QRCodeModalProps) {
  const [format, setFormat] = useState<'png' | 'svg'>('png');

  const { data: qrData, isLoading } = useQuery({
    queryKey: ['qrcode', enrollmentId, format],
    queryFn: async () => {
      return enrollmentOperations.getQRCode(enrollmentId, format);
    },
    enabled: open,
  });

  const handleDownload = () => {
    if (!qrData) return;

    if (format === 'png') {
      // Download PNG (Data URL)
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `qrcode-matricula-${enrollmentId}.png`;
      link.click();
    } else {
      // Download SVG
      const blob = new Blob([qrData.qrCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-matricula-${enrollmentId}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code de Matrícula
          </DialogTitle>
          <DialogDescription>
            QR Code para check-in de {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de Formato */}
          <div className="flex gap-2">
            <Button
              variant={format === 'png' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormat('png')}
            >
              PNG
            </Button>
            <Button
              variant={format === 'svg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormat('svg')}
            >
              SVG
            </Button>
          </div>

          {/* QR Code Display */}
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              {isLoading ? (
                <Skeleton className="h-64 w-64" />
              ) : qrData ? (
                <div className="text-center">
                  {format === 'png' ? (
                    <img 
                      src={qrData.qrCode} 
                      alt="QR Code Matrícula"
                      className="mx-auto"
                    />
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: qrData.qrCode }}
                      className="mx-auto"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Gerado em {new Date(qrData.generatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Erro ao carregar QR Code</p>
              )}
            </CardContent>
          </Card>

          {/* Botão de Download */}
          <Button 
            onClick={handleDownload}
            disabled={!qrData}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>

          {/* Informações */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-900 mb-1">Como usar:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>• Use este QR Code em fluxos internos de check-in</li>
              <li>• Ele contém um payload do enrollment para validação</li>
              <li>• A leitura/validação depende do fluxo de check-in</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
