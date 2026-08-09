'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer, X, FileText } from 'lucide-react';
import type { Class, Course, Room, Instructor, Student, Company, ExtraProduct } from '@/types';
import { CLASS_STATUS_LABELS, LINK_STATUS_LABELS, EXAM_RESULT_LABELS } from '@/types';

interface ClassReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: Class;
  course: Course;
  room: Room;
  instructor?: Instructor;
  students: Student[];
  company?: Company;
  extraProducts: ExtraProduct[];
}

export const ClassReportDialog: React.FC<ClassReportDialogProps> = ({
  open,
  onOpenChange,
  classItem,
  course,
  room,
  instructor,
  students,
  company,
  extraProducts,
}) => {
  const [reportType, setReportType] = useState<string>('completo');

  const classInfo = {
    id: classItem.id,
    code: classItem.code,
    displayName: classItem.displayName,
    startDate: classItem.startDate,
    endDate: classItem.endDate,
    schedule: classItem.schedule || '',
    statusLabel: CLASS_STATUS_LABELS[classItem.status],
    price: classItem.price,
  };

  const courseInfo = {
    id: course.id,
    code: course.code,
    name: course.name,
  };

  const roomInfo = {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
  };

  const instructorInfo = instructor
    ? {
        id: instructor.id,
        name: instructor.name,
      }
    : undefined;

  const companyClient = company
    ? {
        id: company.id,
        tradeName: company.tradeName || company.name,
        companyTaxId: company.companyTaxId,
      }
    : undefined;

  const enrolledStudents = students.map((student) => {
    const linkStatusLabel = LINK_STATUS_LABELS[student.linkStatus || 'Scheduled'];
    const examResultLabel = student.examResult?.status
      ? EXAM_RESULT_LABELS[student.examResult.status]
      : undefined;

    return {
      id: student.id,
      systemCode: student.code,
      name: student.name,
      taxId: student.taxId || '',
      email: student.email,
      phone: student.phone,
      personType: student.personType === 'company' ? 'PJ' : 'PF',
      linkStatusLabel,
      totalValue: student.totalValue,
      payments: {
        totalPaid: student.payments?.totalPaid || 0,
      },
      documentsComplete: !!student.documentsComplete,
      examStatus: { active: !!student.examStatus?.active },
      examResult: student.examResult
        ? {
            statusLabel: examResultLabel,
            score: student.examResult.score,
            date: student.examResult.date,
            notes: student.examResult.notes,
          }
        : undefined,
      linkedProductIds: student.extraProductIds || [],
    };
  });

  const handlePrint = () => {
    window.print();
  };

  // Statistics
  const companyStudents = enrolledStudents.filter(s => s.personType === 'PJ');
  const individualStudents = enrolledStudents.filter(s => s.personType !== 'PJ');
  const scheduledStudents = enrolledStudents.filter(s => s.linkStatusLabel === 'Agendado');
  const toConfirmStudents = enrolledStudents.filter(s => s.linkStatusLabel === 'Confirmar');
  const confirmedStudents = enrolledStudents.filter(s => s.linkStatusLabel === 'Confirmado');
  const presentStudents = enrolledStudents.filter(s => s.linkStatusLabel === 'Presente');
  
  const totalPaid = enrolledStudents.reduce((sum, s) => sum + (s.payments?.totalPaid || 0), 0);
  const totalExpected = enrolledStudents.reduce((sum, s) => sum + (s.totalValue || 0), 0);
  const totalPending = totalExpected - totalPaid;

  const studentsWithDocuments = enrolledStudents.filter(s => s.documentsComplete).length;
  const studentsWithExam = enrolledStudents.filter(s => s.examStatus?.active).length;
  const approvedStudents = enrolledStudents.filter(s => s.examResult?.statusLabel === 'Aprovado');
  const failedStudents = enrolledStudents.filter(s => s.examResult?.statusLabel === 'Reprovado');

  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[95vh] p-0 flex flex-col overflow-hidden">
        {/* Header with Buttons - NOT PRINTED */}
        <div className="print:hidden flex-shrink-0 bg-white border-b">
          <DialogHeader className="p-6 pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-red-600" />
                  <DialogTitle className="text-xl">Relatório da Turma</DialogTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tipo-relatorio" className="text-sm font-medium whitespace-nowrap">
                    Tipo de Relatório:
                  </Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="tipo-relatorio" className="w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completo">📊 Relatório Completo</SelectItem>
                      <SelectItem value="aprovados-reprovados">✅❌ Aprovados/Reprovados</SelectItem>
                      <SelectItem value="produtos">🛍️ Produtos por Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Relatório
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Report Content - PRINTED */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 max-h-[calc(100vh-200px)] p-6 print:overflow-visible print:p-0">
          <div className="max-w-full mx-auto bg-white print:shadow-none">
            
            {/* FULL REPORT */}
            {reportType === 'completo' && (
              <>
                {/* PAGE 1 - HEADER AND SUMMARY */}
                <div className="print:page-break-after-always">
                  <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                    <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO COMPLETO DA TURMA</h1>
                    <p className="text-sm text-gray-600">Gerado em: {generationDate}</p>
                  </div>

                  {/* Class Info */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📋 DADOS DA TURMA
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Código da Turma</label>
                        <p className="text-lg font-bold text-red-600">{classInfo.code}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Nome da Turma</label>
                        <p className="text-base font-semibold">{classInfo.displayName || courseInfo?.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Curso</label>
                        <p className="text-base">{courseInfo?.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Código do Curso</label>
                        <p className="text-base font-mono">{courseInfo?.code}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Período</label>
                        <p className="text-base">
                          {new Date(classInfo.startDate).toLocaleDateString('pt-BR')} até {new Date(classInfo.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Horário</label>
                        <p className="text-base">{classInfo.schedule}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Instrutor</label>
                        <p className="text-base">{instructorInfo?.name || 'Não atribuído'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Sala</label>
                        <p className="text-base">{roomInfo?.name} (Capacidade: {roomInfo?.capacity})</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Status da Turma</label>
                        <Badge className={`
                          ${classInfo.statusLabel === 'Planejada' ? 'bg-gray-500' : ''}
                          ${classInfo.statusLabel === 'Confirmada' ? 'bg-blue-500' : ''}
                          ${classInfo.statusLabel === 'Em Andamento' ? 'bg-green-500' : ''}
                          ${classInfo.statusLabel === 'Concluída' ? 'bg-purple-500' : ''}
                        `}>
                          {classInfo.statusLabel}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Valor Base</label>
                        <p className="text-base font-bold text-green-600">
                          R$ {(classInfo.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {companyClient && (
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-600">Cliente Pessoa Jurídica</label>
                          <p className="text-base font-semibold text-blue-600">
                            {companyClient.tradeName} - CNPJ: {companyClient.companyTaxId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* General Statistics */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📊 ESTATÍSTICAS GERAIS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-3xl font-bold text-gray-700">{enrolledStudents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Total de Alunos</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-3xl font-bold text-blue-600">{companyStudents.length}</p>
                        <p className="text-xs text-blue-600 mt-1">🏢 Pessoa Jurídica</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-3xl font-bold text-green-600">{individualStudents.length}</p>
                        <p className="text-xs text-green-600 mt-1">👤 Pessoa Física</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-3xl font-bold text-purple-600">
                          {roomInfo?.capacity ? Math.round((enrolledStudents.length / roomInfo.capacity) * 100) : 0}%
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Taxa de Ocupação</p>
                      </div>
                    </div>
                  </div>

                  {/* Student Status */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      🎯 STATUS DOS ALUNOS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-2xl font-bold text-yellow-700">🟡 {scheduledStudents.length}</p>
                        <p className="text-xs text-yellow-600 mt-1">Agendado</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                        <p className="text-2xl font-bold text-orange-700">🟠 {toConfirmStudents.length}</p>
                        <p className="text-xs text-orange-600 mt-1">Confirmar</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-2xl font-bold text-blue-700">🔵 {confirmedStudents.length}</p>
                        <p className="text-xs text-blue-600 mt-1">Confirmado</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <p className="text-2xl font-bold text-green-700">🟢 {presentStudents.length}</p>
                        <p className="text-xs text-green-600 mt-1">Presente</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      💰 RESUMO FINANCEIRO
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 mb-1">Total Esperado</p>
                        <p className="text-2xl font-bold text-green-700">
                          R$ {totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Total Pago</p>
                        <p className="text-2xl font-bold text-blue-700">
                          R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-600 mb-1">Total Pendente</p>
                        <p className="text-2xl font-bold text-red-700">
                          R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Indicators */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📚 INDICADORES ACADÊMICOS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-2xl font-bold text-purple-700">{studentsWithDocuments}</p>
                        <p className="text-xs text-purple-600 mt-1">Documentos Completos</p>
                      </div>
                      <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <p className="text-2xl font-bold text-cyan-700">{studentsWithExam}</p>
                        <p className="text-xs text-cyan-600 mt-1">Provas Agendadas</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{approvedStudents.length}</p>
                        <p className="text-xs text-green-600 mt-1">Aprovados</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-700">{failedStudents.length}</p>
                        <p className="text-xs text-red-600 mt-1">Reprovados</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAGE 2 - STUDENT LIST */}
                <div className="print:page-break-before-always">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      👥 LISTA COMPLETA DE ALUNOS ({enrolledStudents.length})
                    </h2>
                    
                    <div className="border border-gray-300 rounded-lg overflow-x-auto print:overflow-visible">
                      <table className="w-full text-xs min-w-[1400px]">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="text-left p-2 font-semibold min-w-[40px]">#</th>
                            <th className="text-left p-2 font-semibold min-w-[80px]">Código</th>
                            <th className="text-left p-2 font-semibold min-w-[180px]">Nome</th>
                            <th className="text-left p-2 font-semibold min-w-[60px]">Tipo</th>
                            <th className="text-left p-2 font-semibold min-w-[110px]">CPF</th>
                            <th className="text-left p-2 font-semibold min-w-[110px]">Telefone</th>
                            <th className="text-left p-2 font-semibold min-w-[100px]">E-mail</th>
                            <th className="text-left p-2 font-semibold min-w-[90px]">Status</th>
                            <th className="text-left p-2 font-semibold min-w-[80px]">Docs</th>
                            <th className="text-left p-2 font-semibold min-w-[80px]">Prova</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Valor</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Pago</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Pendente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudents.map((student, index) => (
                            <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{student.systemCode}</td>
                              <td className="p-2 font-medium">{student.name}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${
                                  student.personType === 'PJ' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'
                                }`}>
                                  {student.personType === 'PJ' ? '🏢 PJ' : '👤 PF'}
                                </Badge>
                              </td>
                              <td className="p-2 font-mono text-xs">{student.taxId}</td>
                              <td className="p-2 text-xs">{student.phone}</td>
                              <td className="p-2 text-xs truncate max-w-[100px]" title={student.email}>{student.email}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${
                                  student.linkStatusLabel === 'Agendado' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                  student.linkStatusLabel === 'Confirmar' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                                  student.linkStatusLabel === 'Confirmado' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                  'bg-green-50 text-green-700 border-green-300'
                                }`}>
                                  {student.linkStatusLabel}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                {student.documentsComplete ? (
                                  <Badge className="bg-green-500 text-[10px]">✓ OK</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">Pendente</Badge>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {student.examResult?.statusLabel ? (
                                  <Badge className={`text-[10px] ${
                                    student.examResult.statusLabel === 'Aprovado' ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    {student.examResult.statusLabel === 'Aprovado' ? '✓ Aprov' : '✗ Reprov'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">-</Badge>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                R$ {(student.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-semibold text-green-600">
                                R$ {(student.payments?.totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-semibold text-red-600">
                                R$ {((student.totalValue || 0) - (student.payments?.totalPaid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                            <td colSpan={10} className="p-2 text-right">TOTAIS:</td>
                            <td className="p-2 text-right">
                              R$ {totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-green-600">
                              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-red-600">
                              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>Relatório gerado automaticamente pela Plataforma Caiso</p>
                    <p className="mt-1">{generationDate}</p>
                  </div>
                </div>
              </>
            )}

            {/* APPROVED/FAILED REPORT */}
            {reportType === 'aprovados-reprovados' && (
              <div>
                <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                  <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO DE APROVADOS E REPROVADOS</h1>
                  <p className="text-sm text-gray-600">Turma: {classInfo.code} - {classInfo.displayName || courseInfo?.name}</p>
                  <p className="text-sm text-gray-600">Gerado em: {generationDate}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    📊 RESUMO GERAL
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-3xl font-bold text-gray-700">{enrolledStudents.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Total de Alunos</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-3xl font-bold text-green-600">{approvedStudents.length}</p>
                      <p className="text-xs text-green-600 mt-1">✓ Aprovados</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-3xl font-bold text-red-600">{failedStudents.length}</p>
                      <p className="text-xs text-red-600 mt-1">✗ Reprovados</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-3xl font-bold text-blue-600">
                        {enrolledStudents.length > 0 ? Math.round((approvedStudents.length / enrolledStudents.length) * 100) : 0}%
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Taxa de Aprovação</p>
                    </div>
                  </div>
                </div>

                {/* APPROVED LIST */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-green-700 mb-4 pb-2 border-b border-green-300">
                    ✅ ALUNOS APROVADOS ({approvedStudents.length})
                  </h2>
                  {approvedStudents.length > 0 ? (
                    <div className="border border-green-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs min-w-[800px]">
                        <thead>
                          <tr className="bg-green-50 border-b border-green-300">
                            <th className="text-left p-2 font-semibold">#</th>
                            <th className="text-left p-2 font-semibold">Código</th>
                            <th className="text-left p-2 font-semibold">Nome</th>
                            <th className="text-left p-2 font-semibold">CPF</th>
                            <th className="text-center p-2 font-semibold">Nota</th>
                            <th className="text-center p-2 font-semibold">Data Prova</th>
                            <th className="text-left p-2 font-semibold">Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedStudents.map((student, index) => (
                            <tr key={student.id} className="border-b border-green-200 hover:bg-green-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{student.systemCode}</td>
                              <td className="p-2 font-medium">{student.name}</td>
                              <td className="p-2 font-mono">{student.taxId}</td>
                              <td className="p-2 text-center font-bold text-green-600">
                                {student.examResult?.score || '-'}
                              </td>
                              <td className="p-2 text-center">
                                {student.examResult?.date 
                                  ? new Date(student.examResult.date).toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                              <td className="p-2 text-xs">{student.examResult?.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">Nenhum aluno aprovado até o momento</p>
                    </div>
                  )}
                </div>

                {/* FAILED LIST */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-red-700 mb-4 pb-2 border-b border-red-300">
                    ❌ ALUNOS REPROVADOS ({failedStudents.length})
                  </h2>
                  {failedStudents.length > 0 ? (
                    <div className="border border-red-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs min-w-[800px]">
                        <thead>
                          <tr className="bg-red-50 border-b border-red-300">
                            <th className="text-left p-2 font-semibold">#</th>
                            <th className="text-left p-2 font-semibold">Código</th>
                            <th className="text-left p-2 font-semibold">Nome</th>
                            <th className="text-left p-2 font-semibold">CPF</th>
                            <th className="text-center p-2 font-semibold">Nota</th>
                            <th className="text-center p-2 font-semibold">Data Prova</th>
                            <th className="text-left p-2 font-semibold">Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failedStudents.map((student, index) => (
                            <tr key={student.id} className="border-b border-red-200 hover:bg-red-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{student.systemCode}</td>
                              <td className="p-2 font-medium">{student.name}</td>
                              <td className="p-2 font-mono">{student.taxId}</td>
                              <td className="p-2 text-center font-bold text-red-600">
                                {student.examResult?.score || '-'}
                              </td>
                              <td className="p-2 text-center">
                                {student.examResult?.date 
                                  ? new Date(student.examResult.date).toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                              <td className="p-2 text-xs">{student.examResult?.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">Nenhum aluno reprovado até o momento</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>Relatório gerado automaticamente pela Plataforma Caiso</p>
                  <p className="mt-1">{generationDate}</p>
                </div>
              </div>
            )}

            {/* PRODUCTS REPORT */}
            {reportType === 'produtos' && (
              <div>
                <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                  <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO DE PRODUTOS POR ALUNO</h1>
                  <p className="text-sm text-gray-600">Turma: {classInfo.code} - {classInfo.displayName || courseInfo?.name}</p>
                  <p className="text-sm text-gray-600">Gerado em: {generationDate}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    🛍️ PRODUTOS CONTRATADOS POR ALUNO
                  </h2>
                  
                  <div className="space-y-4">
                    {enrolledStudents.map((student, index) => {
                      const linkedItems = (student.linkedProductIds || [])
                        .map((id) => extraProducts.find((item) => item.id === id))
                        .filter((item): item is ExtraProduct => Boolean(item));

                      const studentProductsTotal = linkedItems.reduce((sum, item) => sum + (item.price || 0), 0);

                      return (
                      <div key={student.id} className="border border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-700">#{index + 1}</span>
                              <Badge variant="outline" className="font-mono font-semibold text-blue-600">
                                {student.systemCode}
                              </Badge>
                              <span className="font-semibold text-lg">{student.name}</span>
                              <Badge variant="outline" className={`text-xs ${
                                student.personType === 'PJ' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'
                              }`}>
                                {student.personType === 'PJ' ? '🏢 PJ' : '👤 PF'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              CPF: {student.taxId} | Telefone: {student.phone}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              R$ {studentProductsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">Valor Total</div>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-2 font-semibold">Produto</th>
                                <th className="text-left p-2 font-semibold">Tipo</th>
                                <th className="text-center p-2 font-semibold">Qtd</th>
                                <th className="text-right p-2 font-semibold">Valor Unit.</th>
                                <th className="text-right p-2 font-semibold">Valor Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {linkedItems.length > 0 ? (
                                linkedItems.map((item) => (
                                  <tr key={item.id} className="border-b border-gray-100">
                                    <td className="p-2">{item.code ? `${item.code} - ${item.name}` : item.name}</td>
                                    <td className="p-2">
                                      <Badge
                                        variant="outline"
                                        className={item.type === 'product'
                                          ? 'bg-blue-50 text-blue-700 border-blue-300 text-[10px]'
                                          : 'bg-purple-50 text-purple-700 border-purple-300 text-[10px]'}
                                      >
                                        {item.type === 'product' ? 'Obrigatório' : 'Extra'}
                                      </Badge>
                                    </td>
                                    <td className="p-2 text-center">1</td>
                                    <td className="p-2 text-right">
                                      R$ {(item.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2 text-right font-semibold">
                                      R$ {(item.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                                    Nenhum produto vinculado
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                <td colSpan={4} className="p-2 text-right">TOTAL DO ALUNO:</td>
                                <td className="p-2 text-right text-green-600">
                                  R$ {studentProductsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );})}
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">VALOR TOTAL GERAL DA TURMA</p>
                      <p className="text-xs text-gray-500">{enrolledStudents.length} alunos com produtos contratados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-red-600">
                        R$ {totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>Relatório gerado automaticamente pela Plataforma Caiso</p>
                  <p className="mt-1">{generationDate}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </DialogContent>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:page-break-after-always {
            page-break-after: always;
          }
          
          .print\\:page-break-before-always {
            page-break-before: always;
          }

          .print\\:overflow-visible {
            overflow: visible !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }
      `}} />
    </Dialog>
  );
};
