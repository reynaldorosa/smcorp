import React, { useState } from 'react';
import { UserCheck, Trash2, CheckCircle, FileText, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import type { Instrutor } from '@/app/contexts/SMCorpContext';

interface CardInstrutorTurmaProps {
  instrutor: Instrutor;
  presencas: { data: string; confirmadoEm: string; confirmadoPor: string }[];
  dataAtual?: string; // Data para verificar presença (no formato YYYY-MM-DD)
  temProvasAgendadas?: boolean; // Se este instrutor tem provas agendadas
  onConfirmarPresenca: () => void;
  onExcluir: () => void;
  onAbrirProvas: () => void; // Callback para abrir dialog de provas
}

export const CardInstrutorTurma: React.FC<CardInstrutorTurmaProps> = ({
  instrutor,
  presencas,
  dataAtual,
  temProvasAgendadas = false,
  onConfirmarPresenca,
  onExcluir,
  onAbrirProvas
}) => {
  const [dialogPresencaAberto, setDialogPresencaAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  // Verificar se já tem presença confirmada na data atual
  const presencaConfirmada = dataAtual 
    ? presencas.some(p => p.data === dataAtual)
    : false;

  const handleConfirmarPresenca = () => {
    onConfirmarPresenca();
    setDialogPresencaAberto(false);
  };

  const handleExcluir = () => {
    onExcluir();
    setDialogExcluirAberto(false);
  };

  // 🆕 Função para abrir WhatsApp
  const abrirWhatsApp = () => {
    if (!instrutor.telefone) {
      alert('Este instrutor não possui telefone cadastrado.');
      return;
    }
    
    // Remover caracteres especiais do telefone
    const telefoneNumeros = instrutor.telefone.replace(/\D/g, '');
    
    // Abrir WhatsApp em nova aba
    const urlWhatsApp = `https://wa.me/55${telefoneNumeros}`;
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <>
      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all overflow-hidden">
        <CardContent className="p-4">
          {/* Layout principal - similar ao CardAluno */}
          <div className="flex items-center gap-3">
            {/* Ícone/Avatar do Instrutor */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-300">
                <UserCheck className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Nome e Função do Instrutor */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                  {instrutor.codigo}
                </Badge>
              </div>
              <h3 className="font-semibold text-base text-gray-900 truncate">
                {instrutor.nome}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {instrutor.funcao}
              </p>
            </div>
          </div>

          {/* Layout 2 colunas - similar ao CardAluno */}
          <div className="mt-3 mb-3 flex items-center gap-3">
            {/* Coluna 1: Status de Presença (50%) */}
            <div className="flex-1">
              <span className="text-[10px] text-gray-600 font-medium block mb-1">Presença Hoje</span>
              {presencaConfirmada && dataAtual ? (
                <Badge className="w-full justify-center h-7 text-xs bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  🟢 Presente
                </Badge>
              ) : dataAtual ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialogPresencaAberto(true)}
                  className="w-full h-7 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Marcar Presença
                </Button>
              ) : (
                <Badge variant="outline" className="w-full justify-center h-7 text-xs bg-gray-100 text-gray-600">
                  -
                </Badge>
              )}
            </div>

            {/* Coluna 2: Ações (50%) */}
            <div className="flex-1">
              <span className="text-[10px] text-gray-600 font-medium block mb-1">Provas</span>
              <Button
                size="sm"
                variant="outline"
                onClick={onAbrirProvas}
                className={`w-full h-7 text-xs ${
                  temProvasAgendadas 
                    ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' 
                    : 'border-blue-500 text-blue-700 hover:bg-blue-50'
                }`}
              >
                <FileText className="w-3 h-3 mr-1" />
                {temProvasAgendadas ? 'Ver Provas' : 'Agendar Prova'}
              </Button>
            </div>
          </div>

          {/* Botões de Ação - WhatsApp e Remover */}
          <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
            {/* 🆕 Botão WhatsApp */}
            {instrutor.telefone && (
              <Button
                size="sm"
                variant="outline"
                onClick={abrirWhatsApp}
                className="border-green-500 text-green-700 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
            )}
            
            {/* Botão Remover */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogExcluirAberto(true)}
              className="border-red-500 text-red-700 hover:bg-red-50 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Confirmar Presença */}
      <AlertDialog open={dialogPresencaAberto} onOpenChange={setDialogPresencaAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Confirmar Presença do Instrutor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar a presença de <strong>{instrutor.nome}</strong> para a data{' '}
              <strong>{dataAtual ? new Date(dataAtual + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarPresenca}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Excluir Instrutor */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Remover Instrutor da Turma
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{instrutor.nome}</strong> desta turma?
              <br />
              <br />
              <span className="text-orange-600 font-semibold">
                ⚠️ Atenção: Serão removidos também:
              </span>
              <br />
              • Todos os lançamentos de custo vinculados a este instrutor nesta turma
              <br />
              • Todas as provas agendadas deste instrutor nesta turma
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};