'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Check,
  Users,
  Download,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface FinancialEntry {
  id: string;
  code: string;
  type: 'pagar' | 'receber';
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao';
  studentId?: string;
  companyId?: string;
  instructorId?: string;
  supplierId?: string;
  classId?: string;
  invoiceNumber?: string;
  notes?: string;
  grouped?: boolean;
  breakdown?: Array<{
    code: string;
    date: string;
    amount: number;
    description: string;
    notes?: string;
  }>;
}

export interface Student {
  id: string;
  name: string;
  code: string;
  personType?: 'PF' | 'PJ';
}

export interface Instructor {
  id: string;
  name: string;
  code: string;
}

export interface Class {
  id: string;
  code: string;
  courseName: string;
}

export interface EntryGroup {
  code: string;
  groupId?: string;
  entries: FinancialEntry[];
  isBatch: boolean;
  isDailyGroup?: boolean;
  totalAmount: number;
  type: 'pagar' | 'receber';
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado' | 'faturado' | 'aguardando-autorizacao';
  dueDate: string;
  paidDate?: string;
  invoiceNumber?: string;
}

interface FinancialBatchCardProps {
  group: EntryGroup;
  students: Student[];
  instructors?: Instructor[];
  classes?: Class[];
  onViewDetails: (entry: FinancialEntry) => void;
  onSettle: (entryId: string) => void;
  onGenerateReceipt?: (entry: FinancialEntry) => void;
  onGenerateReceiptPF?: (entry: FinancialEntry) => void;
  formatValue: (value: number) => string;
  formatDate: (value: string) => string;
  hideActions?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function getStatusBadge(status: string) {
  switch (status) {
    case 'pago':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
        </Badge>
      );
    case 'pendente':
      return (
        <Badge className="bg-yellow-500">
          <Clock className="w-3 h-3 mr-1" /> Pendente
        </Badge>
      );
    case 'vencido':
      return (
        <Badge className="bg-red-500">
          <AlertCircle className="w-3 h-3 mr-1" /> Vencido
        </Badge>
      );
    case 'cancelado':
      return (
        <Badge className="bg-gray-500">
          <XCircle className="w-3 h-3 mr-1" /> Cancelado
        </Badge>
      );
    case 'faturado':
      return (
        <Badge className="bg-blue-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Faturado
        </Badge>
      );
    case 'aguardando-autorizacao':
      return (
        <Badge className="bg-orange-500">
          <Clock className="w-3 h-3 mr-1" /> Aguardando
        </Badge>
      );
    default:
      return null;
  }
}

function isPFStudent(student: Student | undefined): boolean {
  // No protótipo, o gating era `!aluno.tipoPessoa` (campo inconsistente).
  // Aqui tratamos `personType` ausente como PF por padrão, e PJ como não-elegível.
  return !student?.personType || student.personType === 'PF';
}

// ============================================
// FinancialBatchCard Component
// ============================================

export function FinancialBatchCard({
  group,
  students,
  instructors = [],
  classes = [],
  onViewDetails,
  onSettle,
  onGenerateReceipt,
  onGenerateReceiptPF,
  formatValue,
  formatDate,
  hideActions = false,
}: FinancialBatchCardProps) {
  // Se for lote (múltiplos lançamentos), mostrar card especial
  if (group.isBatch) {
    const pfEntry = group.entries.find((e) => e.description.includes('[PF]'));
    const normalEntry = group.entries.find((e) => !e.description.includes('[PF]'));
    const normalStudent = normalEntry
      ? students.find((s) => s.id === normalEntry.studentId)
      : undefined;

    return (
      <Card
        className={`border-l-4 border-l-green-500 ${
          group.status === 'cancelado' ? 'opacity-50' : ''
        } bg-gradient-to-r from-green-50 to-white`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Cabeçalho do Lote */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-600">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-green-700">{group.code}</span>
                    {getStatusBadge(group.status)}
                    <Badge className="bg-purple-500">
                      📦 LOTE - {group.entries.length} alunos
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">
                    Aprovação em Lote - Pagamento Consolidado
                  </p>
                </div>
              </div>

              {/* Informações Consolidadas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 mb-4 p-3 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor Total do Lote</p>
                  <p className="font-bold text-xl text-green-600">{formatValue(group.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Vencimento</p>
                  <p className="font-semibold text-sm">{formatDate(group.dueDate)}</p>
                </div>
                {group.paidDate && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">Recebimento</p>
                    <p className="font-semibold text-sm text-green-600">
                      {formatDate(group.paidDate)}
                    </p>
                  </div>
                )}
                {group.invoiceNumber && (
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">🧾 Nota Fiscal</p>
                    <p className="font-bold text-sm text-blue-700">{group.invoiceNumber}</p>
                  </div>
                )}
              </div>

              {/* Lista de Alunos do Lote */}
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Alunos incluídos neste lote:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.entries.map((entry) => {
                    const student = students.find((item) => item.id === entry.studentId);
                    if (!student) return null;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              entry.status === 'pago'
                                ? 'bg-green-500'
                                : entry.status === 'vencido'
                                ? 'bg-red-500'
                                : entry.status === 'faturado'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                          />
                          <span className="text-xs font-mono font-semibold text-gray-600">
                            {student.code}
                          </span>
                          <span className="text-xs text-gray-800">{student.name}</span>
                        </div>
                        <span className="text-xs font-bold text-green-600 ml-2">
                          {formatValue(entry.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            {!hideActions && (
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(group.entries[0])}
                  className="whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
                {group.status !== 'pago' && group.status !== 'cancelado' && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    onClick={() => onSettle(group.entries[0].id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Baixar Lote
                  </Button>
                )}
                {/* Recibo PF (LOTE): só se houver [PF] */}
                {group.status === 'pago' && pfEntry && onGenerateReceiptPF && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
                    onClick={() => onGenerateReceiptPF(pfEntry)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Recibo PF
                  </Button>
                )}

                {/* Recibo NORMAL (LOTE): só para PF e lançamento não-[PF] */}
                {group.status === 'pago' &&
                  normalEntry &&
                  onGenerateReceipt &&
                  isPFStudent(normalStudent) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                      onClick={() => onGenerateReceipt(normalEntry)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Recibo
                    </Button>
                  )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tratamento especial para grupos diários (custos com frequência diária)
  if (group.isDailyGroup && group.entries.length > 1) {
    const groupStudent = group.entries[0].studentId
      ? students.find((item) => item.id === group.entries[0].studentId)
      : null;

    const firstEntryDescription = group.entries[0]?.description || '';
    const costName = firstEntryDescription.split(' - ')[0];
    const dailyAmount = group.entries[0].amount;
    const totalDays = group.entries.length;

    return (
      <Card
        className={`border-l-4 border-l-red-500 ${
          group.status === 'cancelado' ? 'opacity-50' : ''
        } bg-gradient-to-r from-red-50 to-white`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Cabeçalho do Grupo Diário */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-600">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl text-red-700">{group.code}</span>
                    {getStatusBadge(group.status)}
                    <Badge className="bg-purple-500">📅 DIÁRIO - {totalDays} dias</Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">
                    {costName} -{' '}
                    {groupStudent
                      ? `${groupStudent.code} - ${groupStudent.name}`
                      : 'Aluno não encontrado'}
                  </p>
                </div>
              </div>

              {/* Informações Consolidadas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-4 p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor por Dia</p>
                  <p className="font-bold text-lg text-red-600">{formatValue(dailyAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Total de Dias</p>
                  <p className="font-bold text-lg text-red-600">{totalDays} dias</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Valor Total</p>
                  <p className="font-bold text-xl text-red-600">{formatValue(group.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold">Período</p>
                  <p className="font-semibold text-sm">
                    {formatDate(group.entries[0].dueDate)} até{' '}
                    {formatDate(group.entries[group.entries.length - 1].dueDate)}
                  </p>
                </div>
              </div>

              {/* Fórmula de Cálculo */}
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 Cálculo do Custo:</p>
                <p className="text-sm font-mono text-blue-900">
                  {formatValue(dailyAmount)} × {totalDays} dias = {formatValue(group.totalAmount)}
                </p>
              </div>

              {/* Lista de Lançamentos Diários (collapsible) */}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                  📋 Ver detalhes dos {group.entries.length} lançamentos diários
                </summary>
                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                  {group.entries.map((entry) => {
                    const dateMatch = entry.description.match(/Dia (\d{2}\/\d{2}\/\d{4})/);
                    const displayDate = dateMatch ? dateMatch[1] : formatDate(entry.dueDate);

                    return (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500">{entry.code}</span>
                          <span className="text-gray-700">{displayDate}</span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${
                              entry.status === 'pago'
                                ? 'bg-green-500'
                                : entry.status === 'vencido'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                        <span className="font-bold text-red-600">{formatValue(entry.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>

            {/* Botões de Ação */}
            {!hideActions && (
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(group.entries[0])}
                  className="whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
                {group.status !== 'pago' && group.status !== 'cancelado' && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                    onClick={() => onSettle(group.entries[0].id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Baixar Grupo
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card individual normal
  const entry = group.entries[0];
  if (!entry) return null;

  const isInstructorPayment = entry.instructorId && !entry.supplierId;
  const isSupplierWithInstructorPayment = entry.instructorId && entry.supplierId;

  const linkedInstructor = entry.instructorId
    ? instructors.find((item) => item.id === entry.instructorId)
    : null;
  const linkedClass = entry.classId
    ? classes.find((item) => item.id === entry.classId)
    : null;

  const entryStudent = entry.studentId
    ? students.find((s) => s.id === entry.studentId)
    : undefined;

  return (
    <Card
      className={`border-l-4 ${
          isInstructorPayment
          ? 'border-l-purple-500 bg-purple-50'
            : entry.type === 'pagar'
          ? 'border-l-red-500'
          : 'border-l-green-500'
        } ${entry.status === 'cancelado' ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-lg ${
                    isInstructorPayment
                    ? 'bg-purple-600'
                      : entry.type === 'pagar'
                    ? 'bg-red-50'
                    : 'bg-green-50'
                }`}
              >
                  {isInstructorPayment ? (
                  <TrendingDown className="w-5 h-5 text-white" />
                  ) : entry.type === 'pagar' ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{entry.code}</span>
                    {getStatusBadge(entry.status)}
                    {isInstructorPayment && (
                    <Badge className="bg-purple-600">👨‍🏫 PAGAMENTO AO INSTRUTOR</Badge>
                  )}
                    {isSupplierWithInstructorPayment && (
                    <Badge className="bg-blue-500">👨‍🏫 Vínculo Instrutor</Badge>
                  )}
                </div>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                  {(linkedInstructor || linkedClass) && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                      {linkedInstructor && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-semibold">
                          👨‍🏫 {linkedInstructor.code} - {linkedInstructor.name}
                      </span>
                    )}
                      {linkedClass && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">
                          📚 {linkedClass.code} - {linkedClass.courseName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Valor</p>
                <p
                  className={`font-bold ${
                    entry.type === 'pagar' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatValue(entry.amount)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Vencimento</p>
                <p className="font-semibold">{formatDate(entry.dueDate)}</p>
              </div>
              {entry.paidDate && (
                <div>
                  <p className="text-gray-500">Pagamento</p>
                  <p className="font-semibold text-green-600">
                    {formatDate(entry.paidDate)}
                  </p>
                </div>
              )}
              {entry.invoiceNumber && (
                <div>
                  <p className="text-gray-500">🧾 Nota Fiscal</p>
                  <p className="font-bold text-blue-700">{entry.invoiceNumber}</p>
                </div>
              )}
            </div>
          </div>

          {!hideActions && (
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => onViewDetails(entry)}>
                <Eye className="w-4 h-4" />
              </Button>
              {entry.status !== 'pago' && entry.status !== 'cancelado' && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onSettle(entry.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              )}
              {/* Botão de Recibo PF para lançamentos individuais com [PF] */}
              {entry.status === 'pago' &&
                entry.description.includes('[PF]') &&
                onGenerateReceiptPF && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => onGenerateReceiptPF(entry)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Recibo PF
                  </Button>
                )}

              {/* Recibo NORMAL (INDIVIDUAL): só para PF e lançamento não-[PF] */}
              {entry.status === 'pago' &&
                !entry.description.includes('[PF]') &&
                onGenerateReceipt &&
                isPFStudent(entryStudent) && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onGenerateReceipt(entry)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Recibo
                  </Button>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
