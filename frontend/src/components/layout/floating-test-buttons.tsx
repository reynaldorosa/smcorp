'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { studentsService } from '@/services/students.service';
import { enrollmentOperations } from '@/services/operations.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Botões flutuantes de teste — APENAS PARA DESENVOLVIMENTO
 * Permite testar rapidamente a página de matrícula do aluno
 * Referência: Figma App.tsx (botões fixos no canto inferior direito)
 */
export function FloatingTestButtons() {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [codigoMatricula, setCodigoMatricula] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const isLikelyEnrollmentToken = (value: string) => /^[a-f0-9]{32,}$/i.test(value.trim());

  const openEnrollmentPublicLink = (token: string) => {
    window.open(`/enrollment/${encodeURIComponent(token)}`, '_blank');
  };

  const generateAndOpenPublicLinkByStudentCode = async (rawCode: string) => {
    const studentCode = rawCode.split('-')[0].trim();

    if (!studentCode) {
      toast.error('Informe um código de aluno válido');
      return;
    }

    const student = await studentsService.getByCode(studentCode);
    if (!student?.enrollmentId) {
      toast.error('Aluno sem matrícula ativa para gerar link');
      return;
    }

    const tokenResult = await enrollmentOperations.generateToken({
      enrollmentId: student.enrollmentId,
      expiresInHours: 24,
    });

    const token = (tokenResult?.enrollmentToken || '').trim();
    if (!token) {
      toast.error('Não foi possível gerar token de matrícula');
      return;
    }

    openEnrollmentPublicLink(token);
    toast.success(`Link público gerado para ${student.code}`);
  };

  const abrirPaginaAluno = async () => {
    const code = codigoMatricula.trim();
    if (!code) return;

    setIsGeneratingLink(true);
    try {
      if (isLikelyEnrollmentToken(code)) {
        openEnrollmentPublicLink(code);
      } else {
        await generateAndOpenPublicLinkByStudentCode(code);
      }

      setDialogAberto(false);
      setCodigoMatricula('');
    } catch {
      toast.error('Falha ao abrir link público de matrícula');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const testeRapido = async () => {
    setIsGeneratingLink(true);
    try {
      await generateAndOpenPublicLinkByStudentCode('A0001');
    } catch {
      toast.error('Teste rápido falhou. Use o botão "Testar Link do Aluno" com um código válido.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // APENAS PARA DESENVOLVIMENTO — nunca renderizar em produção
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {/* TESTE RÁPIDO — abre /enrollment/A0001-1 em nova aba */}
      <Button
        variant="outline"
        size="sm"
        className="bg-yellow-500 shadow-lg border-2 border-yellow-600 text-white hover:bg-yellow-600 font-bold"
        onClick={testeRapido}
        disabled={isGeneratingLink}
      >
        {isGeneratingLink ? 'Gerando...' : '🧪 TESTE RÁPIDO'}
      </Button>

      {/* TESTAR LINK DO ALUNO — Dialog para digitar código */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Testar Link do Aluno
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔗 Testar Link de Matrícula</DialogTitle>
            <DialogDescription>
              Informe o código do aluno para gerar e abrir automaticamente o link público com token
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="codigoMatricula">Código de Matrícula</Label>
              <Input
                id="codigoMatricula"
                placeholder="Ex: A0004"
                value={codigoMatricula}
                onChange={(e) => setCodigoMatricula(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void abrirPaginaAluno();
                }}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Aceita também token direto (quando já existir)
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-semibold text-blue-900 mb-1">💡 Como obter o código:</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>1. Vá para um aluno em qualquer módulo</li>
                <li>2. Copie o código do aluno (ex: A0004)</li>
                <li>3. Cole aqui e o sistema gera o token automaticamente</li>
                <li>4. A página pública será aberta em nova aba</li>
              </ul>
            </div>
            <Button
              onClick={abrirPaginaAluno}
              className="w-full"
              disabled={!codigoMatricula.trim() || isGeneratingLink}
            >
              {isGeneratingLink ? 'Gerando Link...' : 'Visualizar Página do Aluno'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
