import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { DialogExcluirLancamento } from '@/app/components/DialogExcluirLancamento';
import type { LancamentoCusto, CustoAuditavel, Aluno, Instrutor, Turma, CriterioCusto } from '@/app/contexts/SMCorpContext';

interface AbaLancamentosCustoProps {
  lancamentosCusto: LancamentoCusto[];
  custosAuditaveis: CustoAuditavel[];
  alunos: Aluno[];
  instrutores: Instrutor[];
  turmas: any[];
  criteriosCusto: CriterioCusto[];
  formatarValor: (valor: number) => string;
  formatarData: (data: string) => string;
}

export const AbaLancamentosCusto: React.FC<AbaLancamentosCustoProps> = ({
  lancamentosCusto,
  custosAuditaveis,
  alunos,
  instrutores,
  turmas,
  criteriosCusto,
  formatarValor,
  formatarData
}) => {
  // 🆕 Estado para controlar quais cards estão expandidos
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());

  // 🆕 Agrupar lançamentos por custoAuditavelId
  const lancamentosAgrupados = React.useMemo(() => {
    const grupos = new Map<string, LancamentoCusto[]>();
    
    lancamentosCusto.forEach(lancamento => {
      const key = lancamento.custoAuditavelId || 'sem-custo';
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key)!.push(lancamento);
    });
    
    return Array.from(grupos.entries()).map(([custoAuditavelId, lancamentos]) => ({
      custoAuditavelId,
      lancamentos,
      valorTotal: lancamentos.reduce((sum, l) => sum + l.valor, 0)
    }));
  }, [lancamentosCusto]);

  const toggleCard = (custoAuditavelId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(custoAuditavelId)) {
      newExpanded.delete(custoAuditavelId);
    } else {
      newExpanded.add(custoAuditavelId);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Gerenciar Lançamentos de Custo</h4>
        <p className="text-sm text-yellow-700">
          Esta aba mostra todos os lançamentos de custo gerados automaticamente pelo sistema. 
          Lançamentos relacionados ao mesmo custo estão agrupados. Você pode expandir para ver detalhes individuais
          e excluir lançamentos incorretos usando o botão de exclusão (requer PIN de autorização).
        </p>
      </div>

      {lancamentosCusto.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhum lançamento de custo encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lancamentosAgrupados.map(grupo => {
            const custoAuditavel = custosAuditaveis.find(c => c.id === grupo.custoAuditavelId);
            const isExpanded = expandedCards.has(grupo.custoAuditavelId);
            const quantidade = grupo.lancamentos.length;

            return (
              <Card key={grupo.custoAuditavelId} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  {/* 🆕 CABEÇALHO DO GRUPO - SEMPRE VISÍVEL */}
                  <div 
                    className="flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                    onClick={() => toggleCard(grupo.custoAuditavelId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-50">
                          <DollarSign className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg">
                              {custoAuditavel?.codigo || 'CA????'}
                            </span>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700">
                              Custo Auditável
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {quantidade} lançamento{quantidade > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {custoAuditavel?.nome || 'Custo não identificado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-bold text-orange-600 text-lg">
                            {formatarValor(grupo.valorTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quantidade</p>
                          <p className="font-semibold">{quantidade} lançamento{quantidade > 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-semibold flex items-center gap-1">
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Expandido
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Clique para expandir
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🆕 DETALHES DOS LANÇAMENTOS - EXPANSÍVEL */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                        📋 Detalhamento dos Lançamentos ({quantidade})
                      </p>
                      {grupo.lancamentos.map(lancamento => {
                        const aluno = alunos.find(a => a.id === lancamento.alunoId);
                        const instrutor = instrutores.find(i => i.id === lancamento.instrutorId);
                        const turma = turmas.find(t => t.id === lancamento.turmaId);
                        const criterio = criteriosCusto.find(c => c.id === lancamento.criterioCustoId);

                        return (
                          <div key={lancamento.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="font-bold">{lancamento.codigo}</span>
                                  {lancamento.numeroProva && (
                                    <Badge className="bg-blue-600 text-white">
                                      📝 Prova {lancamento.numeroProva}
                                    </Badge>
                                  )}
                                </div>

                                {lancamento.nomeProva && (
                                  <p className="text-xs text-blue-600 font-semibold mb-2">
                                    🎓 {lancamento.nomeProva}
                                  </p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <p className="text-gray-500">Valor</p>
                                    <p className="font-bold text-orange-600">
                                      {formatarValor(lancamento.valor)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Vencimento</p>
                                    <p className="font-semibold">{formatarData(lancamento.dataVencimento)}</p>
                                  </div>

                                  {/* 🆕 Informações da Prova */}
                                  {lancamento.numeroProva && lancamento.nomeProva && (
                                    <div className="col-span-2 md:col-span-4 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <p className="text-xs text-blue-700 font-semibold mb-1">📋 Origem do Lançamento</p>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                          <span className="text-blue-900 font-bold">Prova {lancamento.numeroProva}</span>
                                        </div>
                                        <div className="text-blue-700">•</div>
                                        <div className="text-blue-800">{lancamento.nomeProva}</div>
                                      </div>
                                    </div>
                                  )}

                                  {aluno && (
                                    <div>
                                      <p className="text-gray-500">Aluno</p>
                                      <p className="font-semibold truncate">{aluno.nome}</p>
                                    </div>
                                  )}
                                  {instrutor && (
                                    <div>
                                      <p className="text-gray-500">Instrutor</p>
                                      <p className="font-semibold truncate">{instrutor.nome}</p>
                                    </div>
                                  )}
                                  {turma && (
                                    <div>
                                      <p className="text-gray-500">Turma</p>
                                      <p className="font-semibold">{turma.codigo}</p>
                                    </div>
                                  )}
                                  {criterio && (
                                    <div>
                                      <p className="text-gray-500">Critério</p>
                                      <p className="font-semibold truncate">{criterio.nome}</p>
                                    </div>
                                  )}
                                </div>

                                {lancamento.observacoes && (
                                  <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                                    <strong>Obs:</strong> {lancamento.observacoes}
                                  </div>
                                )}
                              </div>

                              {/* Botão de Exclusão */}
                              <div className="flex-shrink-0">
                                <DialogExcluirLancamento
                                  lancamentoId={lancamento.id}
                                  lancamentoCodigo={lancamento.codigo}
                                  lancamentoDescricao={custoAuditavel?.nome || 'Custo não identificado'}
                                  lancamentoValor={lancamento.valor}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};