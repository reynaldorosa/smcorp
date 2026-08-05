'use client';

import React, { useState } from 'react';
import { UserCheck, Trash2, CheckCircle, FileText, MessageCircle, Phone, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Instrutor {
  id: string;
  codigo: string;
  nome: string;
  funcao: string;
  telefone?: string;
  email?: string;
  especialidades?: string[];
}

interface PresencaInstrutor {
  data: string;
  confirmadoEm: string;
  confirmadoPor: string;
}

interface InstructorClassCardProps {
  instrutor: Instrutor;
  presencas: PresencaInstrutor[];
  dataAtual?: string; // Data para verificar presença (no formato YYYY-MM-DD)
  temProvasAgendadas?: boolean; // Se este instrutor tem provas agendadas
  onConfirmarPresenca: () => void;
  onExcluir: () => void;
  onAbrirProvas: () => void; // Callback para abrir dialog de provas
}

// ============================================
// HELPERS
// ============================================

const formatarTelefoneWhatsApp = (telefone: string): string => {
  return telefone.replace(/\D/g, '');
};

// ============================================
// COMPONENT
// ============================================

export function InstructorClassCard({
  instrutor,
  presencas,
  dataAtual,
  temProvasAgendadas = false,
  onConfirmarPresenca,
  onExcluir,
  onAbrirProvas,
}: InstructorClassCardProps) {
  const [dialogPresencaAberto, setDialogPresencaAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);

  // Verificar se já tem presença confirmada na data atual
  const presencaConfirmada = dataAtual
    ? presencas.some((p) => p.data === dataAtual)
    : false;

  const handleConfirmarPresenca = () => {
    onConfirmarPresenca();
    setDialogPresencaAberto(false);
    toast.success(`✅ Presença do instrutor ${instrutor.nome} confirmada!`);
  };

  const handleExcluir = () => {
    onExcluir();
    setDialogExcluirAberto(false);
    toast.success(`Instrutor ${instrutor.nome} desvinculado da turma.`);
  };

  // Função para abrir WhatsApp
  const abrirWhatsApp = () => {
    if (!instrutor.telefone) {
      toast.error('Este instrutor não possui telefone cadastrado.');
      return;
    }

    // Remover caracteres especiais do telefone
    const telefoneNumeros = formatarTelefoneWhatsApp(instrutor.telefone);

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
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-300"
                >
                  {instrutor.codigo}
                </Badge>
              </div>
              <h3 className="font-semibold text-base text-gray-900 truncate">
                {instrutor.nome}
              </h3>
              <p className="text-sm text-gray-600 truncate">{instrutor.funcao}</p>
            </div>
          </div>

          {/* Layout 2 colunas - similar ao CardAluno */}
          <div className="mt-3 mb-3 flex items-center gap-3">
            {/* Coluna 1: Status de Presença (50%) */}
            <div className="flex-1">
              <span className="text-[10px] text-gray-600 font-medium block mb-1">
                Presença Hoje
              </span>
              {presencaConfirmada && dataAtual ? (
                <Badge className="w-full justify-center h-7 text-xs bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  🟢 Presente
                </Badge>
              ) : dataAtual ? (
                <Popover
                  open={dialogPresencaAberto}
                  onOpenChange={setDialogPresencaAberto}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs bg-purple-100 border-purple-300 text-purple-700 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Confirmar Presença
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="center" side="top" sideOffset={5}>
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Confirmar Presença
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Confirma a presença de{' '}
                            <span className="font-bold text-gray-900">
                              {instrutor.nome}
                            </span>{' '}
                            em{' '}
                            <span className="font-semibold text-gray-900">
                              {dataAtual
                                ? new Date(dataAtual + 'T12:00:00').toLocaleDateString(
                                    'pt-BR',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                    }
                                  )
                                : ''}
                            </span>
                            ?
                          </p>
                        </div>
                      </div>

                      {/* Aviso */}
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-800 flex items-start gap-2">
                          <UserCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            A presença será registrada e os custos do instrutor serão
                            lançados automaticamente.
                          </span>
                        </p>
                      </div>

                      {/* Botões */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setDialogPresencaAberto(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleConfirmarPresenca}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Badge className="w-full justify-center h-7 text-xs bg-gray-100 text-gray-500 border-gray-300">
                  Sem data selecionada
                </Badge>
              )}
            </div>

            {/* Coluna 2: Provas Agendadas (50%) */}
            <div className="flex-1">
              <span className="text-[10px] text-gray-600 font-medium block mb-1">
                Provas
              </span>
              {temProvasAgendadas ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                  onClick={onAbrirProvas}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Ver Provas
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={onAbrirProvas}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Agendar Prova
                </Button>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-1.5 w-full">
            {/* WhatsApp */}
            <Button
              variant="outline"
              size="sm"
              onClick={abrirWhatsApp}
              disabled={!instrutor.telefone}
              className="flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </Button>

            {/* Telefone */}
            {instrutor.telefone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(`tel:${instrutor.telefone}`, '_self');
                }}
                className="flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Phone className="w-3.5 h-3.5" />
                Ligar
              </Button>
            )}

            {/* Remover */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogExcluirAberto(true)}
              className="flex-1 min-w-0 flex items-center justify-center gap-0.5 h-9 px-1.5 text-[10px] font-bold tracking-tight bg-red-50 border-red-500 text-red-700 hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Instrutor da Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular o instrutor{' '}
              <span className="font-bold">{instrutor.nome}</span> desta turma? Esta
              ação não exclui o instrutor do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleExcluir}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
