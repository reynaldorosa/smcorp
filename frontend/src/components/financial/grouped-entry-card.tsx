'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Check,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface EntryDetail {
  codigo: string;
  data: string;
  valor: number;
  descricao: string;
  observacoes?: string;
}

export interface GroupedEntry {
  id: string;
  codigo: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status:
    | 'pendente'
    | 'vencido'
    | 'pago'
    | 'cancelado'
    | 'aguardando-autorizacao';
  agrupado: boolean;
  detalhamento?: EntryDetail[];
  fornecedorNome?: string;
  alunoNome?: string;
  alunocodigo?: string;
  turmacodigo?: string;
  custoNome?: string;
  instrutorNome?: string;
  instrutorCodigo?: string;
}

interface GroupedEntryCardProps {
  lancamento: GroupedEntry;
  onVerDetalhes: () => void;
  onDarBaixa: () => void;
  formatarValor?: (valor: number) => string;
  formatarData?: (data: string) => string;
  hideActions?: boolean;
}

export function GroupedEntryCard({
  lancamento,
  onVerDetalhes,
  onDarBaixa,
  formatarValor = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  formatarData = (data) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  },
  hideActions = false,
}: GroupedEntryCardProps) {
  const [expandido, setExpandido] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Pago
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        );
      case 'vencido':
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="mr-1 h-3 w-3" /> Vencido
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-gray-500">
            <XCircle className="mr-1 h-3 w-3" /> Cancelado
          </Badge>
        );
      case 'aguardando-autorizacao':
        return (
          <Badge className="bg-blue-500">
            <Clock className="mr-1 h-3 w-3" /> Aguardando Autorização
          </Badge>
        );
      default:
        return null;
    }
  };

  const totalLancamentos = lancamento.detalhamento?.length || 1;

  return (
    <Card
      className={`border-l-4 border-l-red-500 ${
        lancamento.status === 'cancelado' ? 'opacity-50' : ''
      } bg-gradient-to-r from-red-50 via-white to-white transition-shadow hover:shadow-md dark:from-red-950/20 dark:via-gray-900 dark:to-gray-900`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Cabeçalho do Agrupamento */}
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-2">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-bold text-red-700 dark:text-red-400">
                    {lancamento.codigo}
                  </span>
                  {getStatusBadge(lancamento.status)}
                  <Badge className="bg-purple-600">
                    📦 {totalLancamentos}{' '}
                    {totalLancamentos === 1 ? 'lançamento' : 'lançamentos'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {lancamento.custoNome || 'Custo'}
                  {lancamento.alunocodigo && ` - ${lancamento.alunocodigo}`}
                  {lancamento.alunoNome && ` ${lancamento.alunoNome}`}
                </p>
              </div>
            </div>

            {/* Informações Consolidadas */}
            <div className="mb-3 grid grid-cols-2 gap-4 rounded-lg border-2 border-red-200 bg-gradient-to-r from-white to-red-50 p-3 shadow-sm dark:border-red-800 dark:from-gray-900 dark:to-red-950/20 md:grid-cols-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">
                  💰 Valor Total
                </p>
                <p className="text-xl font-bold text-red-600">
                  {formatarValor(lancamento.valor)}
                </p>
              </div>
              {lancamento.detalhamento && lancamento.detalhamento.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-500">
                    📊 Valor Unitário
                  </p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {formatarValor(lancamento.detalhamento[0].valor)}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">
                  📅 Vencimento
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatarData(lancamento.dataVencimento)}
                </p>
              </div>
              {lancamento.fornecedorNome && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-500">
                    🏢 Fornecedor
                  </p>
                  <p className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                    <Building2 className="h-3 w-3" />
                    {lancamento.fornecedorNome}
                  </p>
                </div>
              )}
              {lancamento.turmacodigo && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-500">
                    👥 Turma
                  </p>
                  <p className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                    <Users className="h-3 w-3" />
                    {lancamento.turmacodigo}
                  </p>
                </div>
              )}
              {lancamento.instrutorNome && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-500">
                    👨‍🏫 Instrutor
                  </p>
                  <p className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                    <Users className="h-3 w-3" />
                    {lancamento.instrutorNome}
                  </p>
                </div>
              )}
            </div>

            {/* Fórmula de Cálculo */}
            {lancamento.detalhamento && lancamento.detalhamento.length > 1 && (
              <div className="mb-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
                <p className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  💡 Cálculo Consolidado:
                </p>
                <p className="font-mono text-sm text-blue-900 dark:text-blue-200">
                  {formatarValor(lancamento.detalhamento[0].valor)} ×{' '}
                  {lancamento.detalhamento.length} lançamentos ={' '}
                  <span className="font-bold">
                    {formatarValor(lancamento.valor)}
                  </span>
                </p>
              </div>
            )}

            {/* Detalhamento Expandível */}
            {lancamento.detalhamento && lancamento.detalhamento.length > 1 && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandido(!expandido)}
                  className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    {expandido ? 'Ocultar' : 'Ver'} detalhes dos{' '}
                    {lancamento.detalhamento.length} lançamentos
                  </span>
                  {expandido ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {expandido && (
                  <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                    {lancamento.detalhamento.map((detalhe) => (
                      <div
                        key={detalhe.codigo}
                        className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-xs transition-all hover:border-red-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <span className="min-w-[80px] font-mono font-semibold text-gray-500">
                            {detalhe.codigo}
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {detalhe.data}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-red-500" />
                          <span className="min-w-[80px] text-right font-bold text-red-600">
                            {formatarValor(detalhe.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          {!hideActions && (
            <div className="ml-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onVerDetalhes}
                className="whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Eye className="mr-1 h-4 w-4" />
                Detalhes
              </Button>
              {lancamento.status === 'aguardando-autorizacao' ? (
                <Button
                  variant="default"
                  size="sm"
                  className="whitespace-nowrap bg-green-600 shadow-md hover:bg-green-700"
                  onClick={onDarBaixa}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Confirmar Pagamento
                </Button>
              ) : lancamento.status !== 'pago' &&
                lancamento.status !== 'cancelado' ? (
                <Button
                  variant="default"
                  size="sm"
                  className="whitespace-nowrap bg-orange-600 shadow-md hover:bg-orange-700"
                  onClick={onDarBaixa}
                >
                  <DollarSign className="mr-1 h-4 w-4" />
                  Autorizar Pagamento
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
