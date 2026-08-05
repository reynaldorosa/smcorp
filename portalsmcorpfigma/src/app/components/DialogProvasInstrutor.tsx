import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { FileText, Calendar, Clock, Users, Edit2, Plus, Trash2 } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { DialogAgendarProva } from './DialogAgendarProva';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DialogProvasInstrutorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrutorId: string;
  turmaId: string;
}

export const DialogProvasInstrutor: React.FC<DialogProvasInstrutorProps> = ({
  open,
  onOpenChange,
  instrutorId,
  turmaId
}) => {
  const { provasAgendadas, instrutores, alunos, turmas, excluirProvaAgendada } = useSMCorp();
  
  const [dialogAgendarAberto, setDialogAgendarAberto] = useState(false);
  const [provaParaEditar, setProvaParaEditar] = useState<any>(null);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);
  const [provaParaExcluir, setProvaParaExcluir] = useState<string | null>(null);

  const instrutor = instrutores.find(i => i.id === instrutorId);
  const turma = turmas.find(t => t.id === turmaId);
  
  // Filtrar provas deste instrutor nesta turma
  const provasDoInstrutor = provasAgendadas.filter(
    p => p.instrutorId === instrutorId && p.turmaId === turmaId
  );

  const handleNovaProva = () => {
    setProvaParaEditar(null);
    setDialogAgendarAberto(true);
  };

  const handleEditarProva = (prova: any) => {
    setProvaParaEditar(prova);
    setDialogAgendarAberto(true);
  };

  const handleExcluirProva = (provaId: string) => {
    setProvaParaExcluir(provaId);
    setDialogExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (provaParaExcluir) {
      excluirProvaAgendada(provaParaExcluir);
      toast.success('Prova excluída com sucesso!');
      setProvaParaExcluir(null);
      setDialogExcluirAberto(false);
      
      // Se não restaram provas, fecha o dialog principal
      const provasRestantes = provasAgendadas.filter(
        p => p.id !== provaParaExcluir && p.instrutorId === instrutorId && p.turmaId === turmaId
      );
      if (provasRestantes.length === 0) {
        onOpenChange(false);
      }
    }
  };

  const handleFecharDialogAgendar = (aberto: boolean) => {
    setDialogAgendarAberto(aberto);
    if (!aberto) {
      setProvaParaEditar(null);
    }
  };

  return (
    <>
      <Dialog open={open && !dialogAgendarAberto} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Provas do Instrutor
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {instrutor && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {instrutor.codigo}
                    </Badge>
                    <span className="font-medium">{instrutor.nome}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      Turma: {turma?.nomePersonalizado || turma?.codigo}
                    </span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Botão Nova Prova */}
            <Button
              onClick={handleNovaProva}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agendar Nova Prova
            </Button>

            {/* Lista de Provas */}
            {provasDoInstrutor.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhuma prova agendada ainda</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Clique em "Agendar Nova Prova" para começar
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {provasDoInstrutor.map(prova => {
                    const alunosDaProva = alunos.filter(a => prova.alunosIds.includes(a.id));
                    const dataFormatada = new Date(prova.data + 'T00:00:00').toLocaleDateString('pt-BR');
                    
                    return (
                      <Card key={prova.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Cabeçalho da Prova */}
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 font-mono">
                                  {prova.numeroProva}
                                </Badge>
                                <h4 className="font-semibold text-gray-900">
                                  {prova.nomeProva}
                                </h4>
                              </div>

                              {/* Informações da Prova */}
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  {dataFormatada}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {prova.hora}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="w-4 h-4" />
                                  {alunosDaProva.length} aluno{alunosDaProva.length !== 1 ? 's' : ''}
                                </div>
                              </div>

                              {/* Lista de Alunos */}
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  Alunos cadastrados:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {alunosDaProva.map(aluno => (
                                    <Badge key={aluno.id} variant="secondary" className="text-xs">
                                      {aluno.codigoSistema} - {aluno.nome}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditarProva(prova)}
                                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExcluirProva(prova.id)}
                                className="border-red-500 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Agendar/Editar Prova */}
      <DialogAgendarProva
        open={dialogAgendarAberto}
        onOpenChange={handleFecharDialogAgendar}
        modo="selecionar-alunos"
        instrutorId={instrutorId}
        turmaId={turmaId}
        provaExistente={provaParaEditar}
      />

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Excluir Prova
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta prova?
              <br />
              <span className="text-red-600 font-semibold">
                Esta ação não pode ser desfeita e removerá o agendamento de todos os alunos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};