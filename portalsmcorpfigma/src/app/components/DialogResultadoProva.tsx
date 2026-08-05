import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/app/components/ui/alert-dialog';
import { CheckCircle2, XCircle, UserX, ShieldAlert } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogResultadoProvaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: {
    id: string;
    nome: string;
    codigoSistema: string;
  };
  prova: {
    numeroProva?: string;
    nomeProva?: string;
    data?: string;
  };
}

export const DialogResultadoProva: React.FC<DialogResultadoProvaProps> = ({
  open,
  onOpenChange,
  aluno,
  prova
}) => {
  const { usuarios, registrarResultadoProva } = useSMCorp();
  const [resultado, setResultado] = useState<'Aprovado' | 'Reprovado' | 'No Show' | ''>('');
  const [observacoes, setObservacoes] = useState('');
  const [mostrarErroPermissao, setMostrarErroPermissao] = useState(false);

  // Usuário atual mockado - em produção viria do contexto de autenticação
  const usuarioAtual = usuarios[0]; // Admin Principal (Master)

  const handleConfirmar = () => {
    if (!resultado) {
      toast.error('Selecione o resultado da prova');
      return;
    }

    // Verificar se usuário é Master
    if (usuarioAtual.nivel !== 'Master') {
      setMostrarErroPermissao(true);
      return;
    }

    // Registrar resultado
    registrarResultadoProva(aluno.id, resultado, observacoes, usuarioAtual.id);

    // Mensagem de sucesso baseada no resultado
    const mensagens = {
      'Aprovado': `✅ ${aluno.nome} foi APROVADO na prova!`,
      'Reprovado': `❌ ${aluno.nome} foi REPROVADO na prova.`,
      'No Show': `⚠️ ${aluno.nome} registrado como NO SHOW (não compareceu).`
    };

    toast.success(mensagens[resultado]);

    // Limpar e fechar
    setResultado('');
    setObservacoes('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setResultado('');
    setObservacoes('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Informar Resultado da Prova</DialogTitle>
            <DialogDescription>
              Registre o resultado da prova. Esta ação requer permissão de usuário Master.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Aluno e Prova */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-blue-700 font-medium">Aluno:</div>
                  <div className="font-semibold text-blue-900">{aluno.nome}</div>
                  <div className="text-blue-600 text-xs">Código: {aluno.codigoSistema}</div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Prova:</div>
                  <div className="font-semibold text-blue-900">
                    {prova.numeroProva || 'N/A'} - {prova.nomeProva || 'Sem nome'}
                  </div>
                  <div className="text-blue-600 text-xs">
                    Data: {prova.data ? new Date(prova.data).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Resultado */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Resultado da Prova: <span className="text-red-600">*</span>
              </Label>
              <Select value={resultado} onValueChange={(value: any) => setResultado(value)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione o resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprovado">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-700">✅ APROVADO</div>
                        <div className="text-xs text-gray-600">O aluno passou na prova</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Reprovado">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-semibold text-red-700">❌ REPROVADO</div>
                        <div className="text-xs text-gray-600">O aluno não atingiu a nota mínima</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="No Show">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-700">⚠️ NO SHOW</div>
                        <div className="text-xs text-gray-600">O aluno não compareceu à prova</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Observações (opcional)
              </Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Nota 8.5, precisa refazer módulo 3..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adicione detalhes sobre o resultado, notas, observações do instrutor, etc.
              </p>
            </div>

            {/* Alerta de Permissão Master */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-700 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-yellow-900">⚠️ Ação Restrita a Usuários Master</div>
                  <div className="text-yellow-800 mt-1">
                    Apenas usuários com nível Master podem registrar resultados de prova.
                    Esta ação será registrada com seu nome e horário.
                  </div>
                  <div className="text-yellow-700 text-xs mt-2">
                    Usuário atual: <span className="font-semibold">{usuarioAtual.nome}</span> ({usuarioAtual.nivel})
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={!resultado}
                className={`flex-1 ${
                  resultado === 'Aprovado' ? 'bg-green-600 hover:bg-green-700' :
                  resultado === 'Reprovado' ? 'bg-red-600 hover:bg-red-700' :
                  resultado === 'No Show' ? 'bg-gray-600 hover:bg-gray-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {resultado === 'Aprovado' && '✅ Confirmar Aprovação'}
                {resultado === 'Reprovado' && '❌ Confirmar Reprovação'}
                {resultado === 'No Show' && '⚠️ Confirmar No Show'}
                {!resultado && 'Confirmar Resultado'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Erro de Permissão */}
      <AlertDialog open={mostrarErroPermissao} onOpenChange={setMostrarErroPermissao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              Permissão Negada
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                Apenas usuários com nível <strong className="text-red-600">Master</strong> podem registrar resultados de prova.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                <div className="font-semibold text-gray-700 mb-1">Seu perfil atual:</div>
                <div>Nome: <span className="font-medium">{usuarioAtual.nome}</span></div>
                <div>Nível: <span className="font-medium text-red-600">{usuarioAtual.nivel}</span></div>
              </div>
              <p className="text-sm text-gray-600">
                Entre em contato com um administrador Master para registrar este resultado.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMostrarErroPermissao(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
