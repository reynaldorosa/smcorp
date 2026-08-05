import React, { useMemo } from 'react';
import { UserCheck, Calendar, TrendingUp, Award, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import type { Instrutor, Turma, Curso } from '@/app/contexts/SMCorpContext';

interface DialogRelatorioInstrutorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrutor: Instrutor;
  turmas: Turma[];
  cursos: Curso[];
}

export const DialogRelatorioInstrutor: React.FC<DialogRelatorioInstrutorProps> = ({
  open,
  onOpenChange,
  instrutor,
  turmas,
  cursos
}) => {
  // Calcular estatísticas do instrutor
  const estatisticas = useMemo(() => {
    // Encontrar todas as turmas onde o instrutor está vinculado
    const turmasVinculadas = turmas.filter(turma => 
      turma.instrutores?.some(inst => inst.instrutorId === instrutor.id)
    );

    // Contar total de presenças confirmadas
    let totalPresencas = 0;
    const presencasPorTurma: { turma: Turma; curso: Curso; presencas: number; ultimaPresenca?: string }[] = [];

    turmasVinculadas.forEach(turma => {
      const instrutorNaTurma = turma.instrutores?.find(inst => inst.instrutorId === instrutor.id);
      if (instrutorNaTurma) {
        const numPresencas = instrutorNaTurma.presencas.length;
        totalPresencas += numPresencas;

        const curso = cursos.find(c => c.id === turma.cursoId);
        if (curso) {
          // Encontrar a última presença
          const ultimaPresenca = instrutorNaTurma.presencas.length > 0
            ? instrutorNaTurma.presencas
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
                .data
            : undefined;

          presencasPorTurma.push({
            turma,
            curso,
            presencas: numPresencas,
            ultimaPresenca
          });
        }
      }
    });

    // Ordenar por número de presenças (decrescente)
    presencasPorTurma.sort((a, b) => b.presencas - a.presencas);

    return {
      totalTurmas: turmasVinculadas.length,
      totalPresencas,
      presencasPorTurma,
      turmasAtivas: turmasVinculadas.filter(t => t.statusTurma === 'Em Andamento').length,
      turmasConcluidas: turmasVinculadas.filter(t => t.statusTurma === 'Concluída').length
    };
  }, [instrutor, turmas, cursos]);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCheck className="w-6 h-6 text-purple-600" />
            Relatório do Instrutor
          </DialogTitle>
          <DialogDescription>
            Histórico completo de presenças e turmas ministradas
          </DialogDescription>
        </DialogHeader>

        {/* Informações do Instrutor */}
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-600 text-xs">
                    {instrutor.codigo}
                  </Badge>
                  <CardTitle className="text-xl">
                    {instrutor.nome}
                  </CardTitle>
                </div>
                <p className="text-sm text-gray-600">
                  {instrutor.funcao}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de Turmas */}
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {estatisticas.totalTurmas}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Turmas Vinculadas
              </div>
            </CardContent>
          </Card>

          {/* Total de Presenças */}
          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {estatisticas.totalPresencas}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Presenças Confirmadas
              </div>
            </CardContent>
          </Card>

          {/* Turmas Ativas */}
          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {estatisticas.turmasAtivas}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Turmas Ativas
              </div>
            </CardContent>
          </Card>

          {/* Turmas Concluídas */}
          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {estatisticas.turmasConcluidas}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Turmas Concluídas
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Lista de Turmas com Presenças */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Histórico de Turmas e Presenças
          </h3>

          {estatisticas.presencasPorTurma.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Nenhuma turma vinculada ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {estatisticas.presencasPorTurma.map(({ turma, curso, presencas, ultimaPresenca }) => {
                // Definir cor baseada no status da turma
                const corStatus = 
                  turma.statusTurma === 'Em Andamento' ? 'bg-green-100 border-green-300' :
                  turma.statusTurma === 'Concluída' ? 'bg-purple-100 border-purple-300' :
                  turma.statusTurma === 'Confirmada' ? 'bg-blue-100 border-blue-300' :
                  'bg-gray-100 border-gray-300';

                const corBadge = 
                  turma.statusTurma === 'Em Andamento' ? 'bg-green-600' :
                  turma.statusTurma === 'Concluída' ? 'bg-purple-600' :
                  turma.statusTurma === 'Confirmada' ? 'bg-blue-600' :
                  'bg-gray-600';

                return (
                  <Card key={turma.id} className={`border-l-4 ${corStatus}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Informações da Turma */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {turma.codigo}
                            </Badge>
                            <h4 className="font-semibold text-gray-900">
                              {turma.nomePersonalizado || curso.nome}
                            </h4>
                            <Badge className={corBadge}>
                              {turma.statusTurma}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Período:</span>{' '}
                              {new Date(turma.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                              {new Date(turma.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <span className="font-medium">Horário:</span> {turma.horario}
                            </div>
                            {ultimaPresenca && (
                              <div>
                                <span className="font-medium">Última presença:</span>{' '}
                                {new Date(ultimaPresenca + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badge de Presenças */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {presencas}
                          </div>
                          <div className="text-xs text-gray-600 whitespace-nowrap">
                            {presencas === 1 ? 'presença' : 'presenças'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Custos Vinculados */}
        {instrutor.custosVinculados && instrutor.custosVinculados.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Custos Vinculados
              </h3>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <Badge className="bg-red-600">
                    {instrutor.custosVinculados.length} {instrutor.custosVinculados.length === 1 ? 'custo vinculado' : 'custos vinculados'}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-2">
                    Os custos vinculados são gerenciados no Módulo 00 - Infraestrutura
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleImprimir}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Imprimir Relatório
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
