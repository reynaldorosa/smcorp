'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { DeleteCostEntryDialog } from '@/components/financial/dialogs/delete-cost-entry-dialog';

// ============================================
// TYPES
// ============================================

export interface CostEntry {
  id: string;
  code: string;
  auditableCostId?: string;
  studentId?: string;
  instructorId?: string;
  classId?: string;
  costCriteriaId?: string;
  amount: number;
  dueDate: string;
  examNumber?: string;
  examName?: string;
  notes?: string;
}

export interface AuditableCost {
  id: string;
  code: string;
  name: string;
}

export interface CostStudent {
  id: string;
  name: string;
}

export interface CostInstructor {
  id: string;
  name: string;
}

export interface CostClass {
  id: string;
  code: string;
}

export interface CostCriteria {
  id: string;
  name: string;
}

interface CostEntriesTabProps {
  costEntries: CostEntry[];
  auditableCosts: AuditableCost[];
  students: CostStudent[];
  instructors: CostInstructor[];
  classes: CostClass[];
  costCriteria: CostCriteria[];
  formatValue: (value: number) => string;
  formatDate: (date: string) => string;
  onDeleteEntry?: (entryId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function CostEntriesTab({
  costEntries,
  auditableCosts,
  students,
  instructors,
  classes,
  costCriteria,
  formatValue,
  formatDate,
  onDeleteEntry,
}: CostEntriesTabProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Group entries by auditableCostId
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CostEntry[]>();

    costEntries.forEach((entry) => {
      const key = entry.auditableCostId || 'no-cost';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    return Array.from(groups.entries()).map(([auditableCostId, entries]) => ({
      auditableCostId,
      entries,
      totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
    }));
  }, [costEntries]);

  const toggleCard = (auditableCostId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(auditableCostId)) {
        next.delete(auditableCostId);
      } else {
        next.add(auditableCostId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <h4 className="font-semibold text-yellow-900 mb-2">Gerenciar Lançamentos de Custo</h4>
        <p className="text-sm text-yellow-700">
          Esta aba mostra todos os lançamentos de custo gerados automaticamente pelo sistema.
          Lançamentos relacionados ao mesmo custo estão agrupados. Você pode expandir para ver detalhes
          individuais e excluir lançamentos incorretos usando o botão de exclusão (requer PIN de autorização).
        </p>
      </div>

      {costEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhum lançamento de custo encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedEntries.map((group) => {
            const auditableCost = auditableCosts.find((c) => c.id === group.auditableCostId);
            const isExpanded = expandedCards.has(group.auditableCostId);
            const count = group.entries.length;

            return (
              <Card key={group.auditableCostId} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  {/* Header - Always Visible */}
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                    onClick={() => toggleCard(group.auditableCostId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-50">
                          <DollarSign className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg">
                              {auditableCost?.code || 'CA????'}
                            </span>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700">
                              Custo Auditável
                            </Badge>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {count} lançamento{count > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {auditableCost?.name || 'Custo não identificado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-bold text-orange-600 text-lg">
                            {formatValue(group.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quantidade</p>
                          <p className="font-semibold">
                            {count} lançamento{count > 1 ? 's' : ''}
                          </p>
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

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                        Detalhamento dos Lançamentos ({count})
                      </p>
                      {group.entries.map((entry) => {
                        const student = students.find((s) => s.id === entry.studentId);
                        const instructor = instructors.find((i) => i.id === entry.instructorId);
                        const cls = classes.find((c) => c.id === entry.classId);
                        const criteria = costCriteria.find((c) => c.id === entry.costCriteriaId);

                        return (
                          <div
                            key={entry.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="font-bold">{entry.code}</span>
                                  {entry.examNumber && (
                                    <Badge className="bg-blue-600 text-white">
                                      Prova {entry.examNumber}
                                    </Badge>
                                  )}
                                </div>

                                {entry.examName && (
                                  <p className="text-xs text-blue-600 font-semibold mb-2">
                                    {entry.examName}
                                  </p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <p className="text-gray-500">Valor</p>
                                    <p className="font-bold text-orange-600">
                                      {formatValue(entry.amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Vencimento</p>
                                    <p className="font-semibold">{formatDate(entry.dueDate)}</p>
                                  </div>

                                  {entry.examNumber && entry.examName && (
                                    <div className="col-span-2 md:col-span-4 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <p className="text-xs text-blue-700 font-semibold mb-1">
                                        Origem do Lançamento
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <span className="text-blue-900 font-bold">
                                          Prova {entry.examNumber}
                                        </span>
                                        <span className="text-blue-700">•</span>
                                        <span className="text-blue-800">{entry.examName}</span>
                                      </div>
                                    </div>
                                  )}

                                  {student && (
                                    <div>
                                      <p className="text-gray-500">Aluno</p>
                                      <p className="font-semibold truncate">{student.name}</p>
                                    </div>
                                  )}
                                  {instructor && (
                                    <div>
                                      <p className="text-gray-500">Instrutor</p>
                                      <p className="font-semibold truncate">{instructor.name}</p>
                                    </div>
                                  )}
                                  {cls && (
                                    <div>
                                      <p className="text-gray-500">Turma</p>
                                      <p className="font-semibold">{cls.code}</p>
                                    </div>
                                  )}
                                  {criteria && (
                                    <div>
                                      <p className="text-gray-500">Critério</p>
                                      <p className="font-semibold truncate">{criteria.name}</p>
                                    </div>
                                  )}
                                </div>

                                {entry.notes && (
                                  <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                                    <strong>Obs:</strong> {entry.notes}
                                  </div>
                                )}
                              </div>

                              {/* Delete Button with PIN */}
                              {onDeleteEntry && (
                                <div className="flex-shrink-0">
                                  <DeleteCostEntryDialog
                                    entryId={entry.id}
                                    entryCode={entry.code}
                                    entryDescription={auditableCost?.name || 'Custo não identificado'}
                                    entryValue={entry.amount}
                                    onDelete={onDeleteEntry}
                                  />
                                </div>
                              )}
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
}
