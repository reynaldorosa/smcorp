import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogTransferirTurmaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: {
    id: string;
    nome: string;
    turmaId: string;
  };
}

export const DialogTransferirTurma: React.FC<DialogTransferirTurmaProps> = ({
  open,
  onOpenChange,
  aluno
}) => {
  const { turmas, cursos, salas, transferirAluno, verificarCustosProvaParaExcluir, instrutores, lancamentosCusto } = useSMCorp();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [verificacaoCustos, setVerificacaoCustos] = useState<{ custos: any[], excluir: boolean, motivo: string } | null>(null);

  // Verificar custos quando o dialog abre
  useEffect(() => {
    if (open) {
      const result = verificarCustosProvaParaExcluir(aluno.id);
      setVerificacaoCustos(result);
    }
  }, [open, aluno.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Buscar turma atual do aluno
  const turmaAtual = turmas.find(t => t.id === aluno.turmaId);
  const cursoAtual = turmaAtual ? cursos.find(c => c.id === turmaAtual.cursoId) : null;

  // Filtrar apenas turmas do mesmo curso (exceto a turma atual)
  const turmasDisponiveis = turmas.filter(t => 
    t.cursoId === turmaAtual?.cursoId && 
    t.id !== aluno.turmaId
  );

  const handleTransferir = () => {
    if (!turmaSelecionada) return;

    const novaTurma = turmas.find(t => t.id === turmaSelecionada);
    if (!novaTurma) return;

    transferirAluno(aluno.id, turmaSelecionada);
    toast.success(`✅ ${aluno.nome} transferido(a) para a turma ${novaTurma.codigo}!`);
    onOpenChange(false);
    setTurmaSelecionada(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transferir Aluno para Outra Turma</DialogTitle>
          <DialogDescription>
            Selecione a turma de destino. Apenas turmas do mesmo curso "{cursoAtual?.nome}" estão disponíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Aluno */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Aluno a ser transferido:</h4>
            <div className="text-sm">
              <div className="font-medium text-blue-900">{aluno.nome}</div>
              <div className="text-blue-700 text-xs mt-1">
                Curso: {cursoAtual?.nome}
              </div>
            </div>
          </div>

          {/* Turma Atual */}
          {turmaAtual && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">📍 Turma Atual:</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono">{turmaAtual.codigo}</Badge>
                  <span className="text-sm font-medium">
                    {turmaAtual.nomePersonalizado || cursoAtual?.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {turmaAtual.dataInicio.split('-').reverse().join('/')} - {turmaAtual.dataFim.split('-').reverse().join('/')}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  {salas.find(s => s.id === turmaAtual.salaId)?.nome}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Turmas Disponíveis */}
          <div>
            <Label className="text-base mb-3 block">Selecione a Turma de Destino:</Label>
            
            {turmasDisponiveis.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800 font-medium">
                  Não há outras turmas disponíveis para este curso
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Crie uma nova turma do curso "{cursoAtual?.nome}" no Módulo 02 para transferir este aluno.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {turmasDisponiveis.map(turma => {
                  const sala = salas.find(s => s.id === turma.salaId);
                  const ehSelecionada = turmaSelecionada === turma.id;

                  return (
                    <div
                      key={turma.id}
                      onClick={() => setTurmaSelecionada(turma.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        ehSelecionada
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {turma.codigo}
                            </Badge>
                            <span className="font-medium text-sm">
                              {turma.nomePersonalizado || cursoAtual?.nome}
                            </span>
                            {ehSelecionada && (
                              <Badge className="bg-green-600 text-xs">
                                ✓ Selecionada
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {turma.dataInicio.split('-').reverse().join('/')} - {turma.dataFim.split('-').reverse().join('/')}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {sala?.nome} - {sala?.localizacao}
                            </div>
                            <div className="text-xs text-gray-500">
                              Preço: R$ {(turma.preco || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visualização da Transferência */}
          {turmaSelecionada && turmaAtual && (() => {
            const novaTurma = turmas.find(t => t.id === turmaSelecionada);
            if (!novaTurma) return null;

            return (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  Resumo da Transferência:
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-gray-600 mb-1">Turma Origem:</div>
                    <div className="font-mono font-medium">{turmaAtual.codigo}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Turma Destino:</div>
                    <div className="font-mono font-medium text-green-600">{novaTurma.codigo}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    ℹ️ As informações do aluno (foto, status PAG/DOC) serão mantidas. A prova será resetada na nova turma.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* 🆕 Aviso de Custos que Serão Excluídos */}
          {verificacaoCustos && verificacaoCustos.excluir && verificacaoCustos.custos.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                ⚠️ ATENÇÃO: Custos Serão Excluídos
              </h4>
              <p className="text-xs text-yellow-800 mb-3">
                {verificacaoCustos.motivo}
              </p>
              <div className="bg-white rounded border border-yellow-300 p-3 space-y-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  Custos que serão excluídos ({verificacaoCustos.custos.length}):
                </div>
                {verificacaoCustos.custos.map((custo) => (
                  <div key={custo.id} className="flex items-center justify-between text-xs bg-red-50 border border-red-200 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-white">
                        {custo.codigo}
                      </Badge>
                      <span className="text-gray-700">
                        {lancamentosCusto.find(l => l.id === custo.id)?.observacoes || 'Custo de prova'}
                      </span>
                    </div>
                    <span className="font-semibold text-red-700">
                      R$ {custo.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-yellow-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Total a excluir:</span>
                  <span className="text-sm font-bold text-red-700">
                    R$ {verificacaoCustos.custos.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 Aviso quando há outros alunos na prova */}
          {verificacaoCustos && !verificacaoCustos.excluir && verificacaoCustos.motivo && verificacaoCustos.motivo.includes('outro') && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                {verificacaoCustos.motivo}
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setTurmaSelecionada(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransferir}
              disabled={!turmaSelecionada}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Confirmar Transferência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
