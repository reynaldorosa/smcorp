'use client';

import React from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Building2,
  Pencil,
  Trash2,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Class } from '@/stores/classes.store';
import type { Course } from '@/stores/courses.store';

// ============================================
// TYPES
// ============================================

interface Room {
  id: string;
  name: string;
  location?: string;
  capacity: number;
}

interface Company {
  id: string;
  name: string;
}

interface StudentStats {
  total: number;
  waitingList: number;
  replaced: number;
  totalRevenue: number;
  receivedRevenue: number;
  paidStudents: number;
}

interface ClassCardProps {
  classItem: Class;
  course?: Course;
  room?: Room;
  company?: Company;
  stats: StudentStats;
  onEdit: (classItem: Class) => void;
  onDelete: (classItem: Class) => void;
  onUploadPlanilha: (classItem: Class) => void;
  onFilaEspera: (classItem: Class) => void;
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getStatusBadgeColor(status: Class['status']): string {
  const colors: Record<Class['status'], string> = {
    Planned: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    InProgress: 'bg-green-100 text-green-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status];
}

function getStatusLabel(status: Class['status']): string {
  const labels: Record<Class['status'], string> = {
    Planned: 'Planejada',
    Confirmed: 'Confirmada',
    InProgress: 'Em Andamento',
    Completed: 'Concluída',
    Cancelled: 'Cancelada'
  };
  return labels[status];
}

// ============================================
// COMPONENT
// ============================================

export function ClassCard({
  classItem,
  course,
  room,
  company,
  stats,
  onEdit,
  onDelete,
  onUploadPlanilha,
  onFilaEspera,
}: ClassCardProps) {
  const courseName = course?.name || 'Curso Excluído';
  const isCourseDeleted = !course;
  const pendingRevenue = stats.totalRevenue - stats.receivedRevenue;
  const receivedPercent = stats.totalRevenue > 0 ? (stats.receivedRevenue / stats.totalRevenue) * 100 : 0;

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 text-white font-mono">{classItem.code}</Badge>
              <CardTitle className="text-xl text-blue-600">
                {classItem.displayName || courseName}
              </CardTitle>
              {classItem.displayName && (
                <Badge variant="outline" className="text-xs">{courseName}</Badge>
              )}
              {isCourseDeleted && (
                <Badge variant="destructive" className="text-xs">Histórico</Badge>
              )}
              <Badge className={getStatusBadgeColor(classItem.status)}>
                {getStatusLabel(classItem.status)}
              </Badge>
            </div>
            <CardDescription className="mt-2">
              {formatDate(classItem.startDate)} - {formatDate(classItem.endDate)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onEdit(classItem)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(classItem)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
            {company && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                Turma PJ: {company.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Cronograma */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Cronograma
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Carga Horária:</span>
                <span className="font-medium">{course?.duration ? `${course.duration}h` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horas/Dia:</span>
                <span className="font-medium">{course?.hoursPerDay || 8}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horário:</span>
                <span className="font-medium">{classItem.schedule || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Alocação de Recurso */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              Alocação de Recurso
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sala:</span>
                <span className="font-medium">{room?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Localização:</span>
                <span className="font-medium">{room?.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidade:</span>
                <span className="font-medium">{room?.capacity || classItem.maxStudents} alunos</span>
              </div>
            </div>
          </div>

          {/* Alunos e Precificação */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Alunos & Precificação
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{company ? 'PJ Negociado' : 'Turma Aberta'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Base:</span>
                <span className="font-medium text-blue-600">{formatCurrency(classItem.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matriculados:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Faturamento */}
        {stats.total > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-green-600" />
                Faturamento da Turma
              </h4>
              
              <div className="grid grid-cols-4 gap-4">
                {/* Previsão Total */}
                <div className="bg-white rounded p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">💰 Previsão Total</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.total} {stats.total === 1 ? 'aluno' : 'alunos'}
                  </div>
                </div>

                {/* Já Recebido */}
                <div className="bg-white rounded p-3 border border-green-300">
                  <div className="text-xs text-green-700 mb-1">✅ Já Recebido</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(stats.receivedRevenue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.paidStudents} {stats.paidStudents === 1 ? 'aluno' : 'alunos'} pagos
                  </div>
                </div>

                {/* Falta Receber */}
                <div className="bg-white rounded p-3 border border-orange-300">
                  <div className="text-xs text-orange-700 mb-1">⏳ Falta Receber</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(pendingRevenue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.total - stats.paidStudents} {(stats.total - stats.paidStudents) === 1 ? 'aluno' : 'alunos'} pendentes
                  </div>
                </div>

                {/* Percentual */}
                <div className="bg-white rounded p-3 border border-purple-300">
                  <div className="text-xs text-purple-700 mb-1">📊 Taxa de Recebimento</div>
                  <div className="text-lg font-bold text-purple-600">
                    {receivedPercent.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" 
                      style={{ width: `${receivedPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Fila de Espera e Substituídos */}
        {(stats.waitingList > 0 || stats.replaced > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {stats.waitingList > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-900">Fila de Espera</span>
                  </div>
                  <Badge className="bg-orange-600">
                    {stats.waitingList} {stats.waitingList === 1 ? 'aluno' : 'alunos'}
                  </Badge>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Aguardando vaga para substituição
                </p>
              </div>
            )}
            
            {stats.replaced > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Alunos Substituídos</span>
                  </div>
                  <Badge variant="outline" className="bg-gray-100">
                    {stats.replaced} {stats.replaced === 1 ? 'aluno' : 'alunos'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  Histórico de substituições
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação para Turmas PJ */}
        {company && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-green-900 mb-1">📊 Cadastro em Lote de Alunos</h4>
                <p className="text-xs text-green-700 mb-3">
                  Esta turma está vinculada à empresa <strong>{company.name}</strong>. 
                  Faça upload de planilha ou adicione à fila de espera.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onUploadPlanilha(classItem)}
                    variant="outline"
                    size="sm"
                    className="border-green-300 hover:bg-green-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload de Planilha
                  </Button>
                  <Button
                    onClick={() => onFilaEspera(classItem)}
                    variant="outline"
                    size="sm"
                    className="border-orange-300 hover:bg-orange-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Adicionar à Fila
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
