import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
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
  DollarSign
} from 'lucide-react';

interface LancamentoDetalhado {
  codigo: string;
  data: string;
  valor: number;
  descricao: string;
  observacoes?: string;
}

interface LancamentoAgrupado {
  id: string;
  codigo: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'aguardando-autorizacao'; // 🆕 Status de aguardando autorização
  agrupado: boolean;
  detalhamento?: LancamentoDetalhado[];
  fornecedorNome?: string;
  alunoNome?: string;
  alunocodigo?: string;
  turmacodigo?: string;
  custoNome?: string;
  instrutorNome?: string; // 🆕 Nome do instrutor
  instrutorCodigo?: string; // 🆕 Código do instrutor
}

interface CardLancamentoAgrupadoProps {
  lancamento: LancamentoAgrupado;
  onVerDetalhes: () => void;
  onDarBaixa: () => void;
  formatarValor: (valor: number) => string;
  formatarData: (data: string) => string;
}

export function CardLancamentoAgrupado({
  lancamento,
  onVerDetalhes,
  onDarBaixa,
  formatarValor,
  formatarData
}: CardLancamentoAgrupadoProps) {
  const [expandido, setExpandido] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'vencido':
        return <Badge className="bg-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      case 'aguardando-autorizacao':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Aguardando Autorização</Badge>;
      default:
        return null;
    }
  };

  const totalLancamentos = lancamento.detalhamento?.length || 1;

  return (
    <Card 
      className={`border-l-4 border-l-red-500 ${
        lancamento.status === 'cancelado' ? 'opacity-50' : ''
      } bg-gradient-to-r from-red-50 via-white to-white hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Cabeçalho do Agrupamento */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xl text-red-700">{lancamento.codigo}</span>
                  {getStatusBadge(lancamento.status)}
                  <Badge className="bg-purple-600">
                    📦 {totalLancamentos} {totalLancamentos === 1 ? 'lançamento' : 'lançamentos'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 font-semibold mt-1">
                  {lancamento.custoNome || 'Custo'}
                  {lancamento.alunocodigo && ` - ${lancamento.alunocodigo}`}
                  {lancamento.alunoNome && ` ${lancamento.alunoNome}`}
                </p>
              </div>
            </div>

            {/* Informações Consolidadas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gradient-to-r from-white to-red-50 rounded-lg border-2 border-red-200 mb-3 shadow-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold mb-1">💰 Valor Total</p>
                <p className="font-bold text-xl text-red-600">
                  {formatarValor(lancamento.valor)}
                </p>
              </div>
              {lancamento.detalhamento && lancamento.detalhamento.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-1">📊 Valor Unitário</p>
                  <p className="font-semibold text-gray-700">
                    {formatarValor(lancamento.detalhamento[0].valor)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs font-semibold mb-1">📅 Vencimento</p>
                <p className="font-semibold text-gray-800">
                  {formatarData(lancamento.dataVencimento)}
                </p>
              </div>
              {lancamento.fornecedorNome && (
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-1">🏢 Fornecedor</p>
                  <p className="font-semibold text-blue-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {lancamento.fornecedorNome}
                  </p>
                </div>
              )}
              {lancamento.turmacodigo && (
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-1">👥 Turma</p>
                  <p className="font-semibold text-purple-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {lancamento.turmacodigo}
                  </p>
                </div>
              )}
              {lancamento.instrutorNome && (
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-1">👨‍🏫 Instrutor</p>
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {lancamento.instrutorNome}
                  </p>
                </div>
              )}
            </div>

            {/* Fórmula de Cálculo */}
            {lancamento.detalhamento && lancamento.detalhamento.length > 1 && (
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 Cálculo Consolidado:</p>
                <p className="text-sm font-mono text-blue-900">
                  {formatarValor(lancamento.detalhamento[0].valor)} × {lancamento.detalhamento.length} lançamentos = <span className="font-bold">{formatarValor(lancamento.valor)}</span>
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
                  className="w-full flex items-center justify-between hover:bg-gray-100 rounded-lg p-2"
                >
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {expandido ? 'Ocultar' : 'Ver'} detalhes dos {lancamento.detalhamento.length} lançamentos
                  </span>
                  {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {expandido && (
                  <div className="mt-2 space-y-1 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {lancamento.detalhamento.map((detalhe, index) => (
                      <div 
                        key={detalhe.codigo}
                        className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-mono text-gray-500 font-semibold min-w-[80px]">
                            {detalhe.codigo}
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span className="text-gray-700">{detalhe.data}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-red-500" />
                          <span className="font-bold text-red-600 min-w-[80px] text-right">
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
          <div className="flex flex-col gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onVerDetalhes}
              className="whitespace-nowrap hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </Button>
            {/* 🆕 Mostrar botões específicos baseados no status */}
            {lancamento.status === 'aguardando-autorizacao' ? (
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 whitespace-nowrap shadow-md"
                onClick={onDarBaixa}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirmar Pagamento
              </Button>
            ) : lancamento.status !== 'pago' && lancamento.status !== 'cancelado' ? (
              <Button
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap shadow-md"
                onClick={onDarBaixa}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Autorizar Pagamento
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}