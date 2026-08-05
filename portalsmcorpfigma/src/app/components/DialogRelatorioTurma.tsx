import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Printer, X, FileText } from 'lucide-react';

interface DialogRelatorioTurmaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turma: any;
  curso: any;
  sala: any;
  instrutor: any;
  alunos: any[];
  clientePJ?: any;
}

export const DialogRelatorioTurma: React.FC<DialogRelatorioTurmaProps> = ({
  open,
  onOpenChange,
  turma,
  curso,
  sala,
  instrutor,
  alunos,
  clientePJ
}) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<string>('completo');

  const handleImprimir = () => {
    window.print();
  };

  // Calcular estatísticas
  const alunosPJ = alunos.filter(a => a.tipoPessoa === 'PJ');
  const alunosPF = alunos.filter(a => a.tipoPessoa !== 'PJ');
  const alunosAgendado = alunos.filter(a => a.statusLink === 'Agendado');
  const alunosConfirmar = alunos.filter(a => a.statusLink === 'Confirmar');
  const alunosConfirmado = alunos.filter(a => a.statusLink === 'Confirmado');
  const alunosPresente = alunos.filter(a => a.statusLink === 'Presente');
  
  const totalPago = alunos.reduce((sum, a) => sum + (a.pagamentos?.valorPago || 0), 0);
  const totalEsperado = alunos.reduce((sum, a) => sum + (a.valorTotal || 0), 0);
  const totalPendente = totalEsperado - totalPago;

  const alunosComDocumentos = alunos.filter(a => a.statusDocumentos).length;
  const alunosComProva = alunos.filter(a => a.statusProva?.ativo).length;
  const alunosAprovados = alunos.filter(a => a.resultadoProva?.status === 'Aprovado');
  const alunosReprovados = alunos.filter(a => a.resultadoProva?.status === 'Reprovado');

  // Data de geração do relatório
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[95vh] p-0 flex flex-col overflow-hidden">
        {/* Cabeçalho com botões - NÃO IMPRIME */}
        <div className="print:hidden flex-shrink-0 bg-white border-b">
          <DialogHeader className="p-6 pb-4">
            <div className="flex flex-col gap-4">
              {/* Linha 1: Título */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-red-600" />
                  <DialogTitle className="text-xl">Relatório da Turma</DialogTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Linha 2: Seletor e Botão Imprimir */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tipo-relatorio" className="text-sm font-medium whitespace-nowrap">
                    Tipo de Relatório:
                  </Label>
                  <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
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

                <Button onClick={handleImprimir} className="bg-red-600 hover:bg-red-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Relatório
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteúdo do Relatório - IMPRIME */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 max-h-[calc(100vh-200px)] p-6 print:overflow-visible print:p-0">
          <div className="max-w-full mx-auto bg-white print:shadow-none">
            
            {/* RELATÓRIO COMPLETO */}
            {tipoRelatorio === 'completo' && (
              <>
                {/* PÁGINA 1 - CABEÇALHO E RESUMO */}
                <div className="print:page-break-after-always">
                  {/* Cabeçalho do Relatório */}
                  <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                    <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO COMPLETO DA TURMA</h1>
                    <p className="text-sm text-gray-600">Gerado em: {dataGeracao}</p>
                  </div>

                  {/* Informações da Turma */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📋 DADOS DA TURMA
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Código da Turma</label>
                        <p className="text-lg font-bold text-red-600">{turma.codigo}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Nome da Turma</label>
                        <p className="text-base font-semibold">{turma.nomePersonalizado || curso?.nome}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Curso</label>
                        <p className="text-base">{curso?.nome}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Código do Curso</label>
                        <p className="text-base font-mono">{curso?.codigo}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Período</label>
                        <p className="text-base">
                          {new Date(turma.dataInicio).toLocaleDateString('pt-BR')} até {new Date(turma.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Horário</label>
                        <p className="text-base">{turma.horario}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Instrutor</label>
                        <p className="text-base">{instrutor?.nome || 'Não atribuído'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Sala</label>
                        <p className="text-base">{sala?.nome} (Capacidade: {sala?.capacidadeMaxima})</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Status da Turma</label>
                        <Badge className={`
                          ${turma.statusTurma === 'Planejada' ? 'bg-gray-500' : ''}
                          ${turma.statusTurma === 'Confirmada' ? 'bg-blue-500' : ''}
                          ${turma.statusTurma === 'Em Andamento' ? 'bg-green-500' : ''}
                          ${turma.statusTurma === 'Concluída' ? 'bg-purple-500' : ''}
                        `}>
                          {turma.statusTurma}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Valor Base</label>
                        <p className="text-base font-bold text-green-600">
                          R$ {(turma.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {clientePJ && (
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-600">Cliente Pessoa Jurídica</label>
                          <p className="text-base font-semibold text-blue-600">
                            {clientePJ.razaoSocial} - CNPJ: {clientePJ.cnpj}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estatísticas Gerais */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📊 ESTATÍSTICAS GERAIS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-3xl font-bold text-gray-700">{alunos.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Total de Alunos</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-3xl font-bold text-blue-600">{alunosPJ.length}</p>
                        <p className="text-xs text-blue-600 mt-1">🏢 Pessoa Jurídica</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-3xl font-bold text-green-600">{alunosPF.length}</p>
                        <p className="text-xs text-green-600 mt-1">👤 Pessoa Física</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-3xl font-bold text-purple-600">
                          {sala?.capacidadeMaxima ? Math.round((alunos.length / sala.capacidadeMaxima) * 100) : 0}%
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Taxa de Ocupação</p>
                      </div>
                    </div>
                  </div>

                  {/* Status dos Alunos */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      🎯 STATUS DOS ALUNOS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-2xl font-bold text-yellow-700">🟡 {alunosAgendado.length}</p>
                        <p className="text-xs text-yellow-600 mt-1">Agendado</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                        <p className="text-2xl font-bold text-orange-700">🟠 {alunosConfirmar.length}</p>
                        <p className="text-xs text-orange-600 mt-1">Confirmar</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-2xl font-bold text-blue-700">🔵 {alunosConfirmado.length}</p>
                        <p className="text-xs text-blue-600 mt-1">Confirmado</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <p className="text-2xl font-bold text-green-700">🟢 {alunosPresente.length}</p>
                        <p className="text-xs text-green-600 mt-1">Presente</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      💰 RESUMO FINANCEIRO
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 mb-1">Total Esperado</p>
                        <p className="text-2xl font-bold text-green-700">
                          R$ {totalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 mb-1">Total Pago</p>
                        <p className="text-2xl font-bold text-blue-700">
                          R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-600 mb-1">Total Pendente</p>
                        <p className="text-2xl font-bold text-red-700">
                          R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores Acadêmicos */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      📚 INDICADORES ACADÊMICOS
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-2xl font-bold text-purple-700">{alunosComDocumentos}</p>
                        <p className="text-xs text-purple-600 mt-1">Documentos Completos</p>
                      </div>
                      <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <p className="text-2xl font-bold text-cyan-700">{alunosComProva}</p>
                        <p className="text-xs text-cyan-600 mt-1">Provas Agendadas</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{alunosAprovados.length}</p>
                        <p className="text-xs text-green-600 mt-1">Aprovados</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-2xl font-bold text-red-700">{alunosReprovados.length}</p>
                        <p className="text-xs text-red-600 mt-1">Reprovados</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PÁGINA 2 - LISTA DE ALUNOS */}
                <div className="print:page-break-before-always">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                      👥 LISTA COMPLETA DE ALUNOS ({alunos.length})
                    </h2>
                    
                    {/* Tabela de Alunos com Scroll Horizontal */}
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
                            <th className="text-left p-2 font-semibold min-w-[100px]">Email</th>
                            <th className="text-left p-2 font-semibold min-w-[90px]">Status</th>
                            <th className="text-left p-2 font-semibold min-w-[80px]">Docs</th>
                            <th className="text-left p-2 font-semibold min-w-[80px]">Prova</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Valor</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Pago</th>
                            <th className="text-right p-2 font-semibold min-w-[100px]">Pendente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alunos.map((aluno, index) => (
                            <tr key={aluno.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{aluno.codigoSistema}</td>
                              <td className="p-2 font-medium">{aluno.nome}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${
                                  aluno.tipoPessoa === 'PJ' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'
                                }`}>
                                  {aluno.tipoPessoa === 'PJ' ? '🏢 PJ' : '👤 PF'}
                                </Badge>
                              </td>
                              <td className="p-2 font-mono text-xs">{aluno.cpf}</td>
                              <td className="p-2 text-xs">{aluno.telefone}</td>
                              <td className="p-2 text-xs truncate max-w-[100px]" title={aluno.email}>{aluno.email}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${
                                  aluno.statusLink === 'Agendado' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                  aluno.statusLink === 'Confirmar' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                                  aluno.statusLink === 'Confirmado' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                  'bg-green-50 text-green-700 border-green-300'
                                }`}>
                                  {aluno.statusLink}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                {aluno.statusDocumentos ? (
                                  <Badge className="bg-green-500 text-[10px]">✓ OK</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">Pendente</Badge>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {aluno.resultadoProva?.status ? (
                                  <Badge className={`text-[10px] ${
                                    aluno.resultadoProva.status === 'Aprovado' ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    {aluno.resultadoProva.status === 'Aprovado' ? '✓ Aprov' : '✗ Reprov'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">-</Badge>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                R$ {(aluno.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-semibold text-green-600">
                                R$ {(aluno.pagamentos?.valorPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-right font-semibold text-red-600">
                                R$ {((aluno.valorTotal || 0) - (aluno.pagamentos?.valorPago || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                            <td colSpan={10} className="p-2 text-right">TOTAIS:</td>
                            <td className="p-2 text-right">
                              R$ {totalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-green-600">
                              R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right text-red-600">
                              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Rodapé do Relatório */}
                  <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>Relatório gerado automaticamente pela Plataforma SMCORP</p>
                    <p className="mt-1">{dataGeracao}</p>
                  </div>
                </div>
              </>
            )}

            {/* RELATÓRIO APROVADOS/REPROVADOS */}
            {tipoRelatorio === 'aprovados-reprovados' && (
              <div>
                {/* Cabeçalho do Relatório */}
                <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                  <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO DE APROVADOS E REPROVADOS</h1>
                  <p className="text-sm text-gray-600">Turma: {turma.codigo} - {turma.nomePersonalizado || curso?.nome}</p>
                  <p className="text-sm text-gray-600">Gerado em: {dataGeracao}</p>
                </div>

                {/* Resumo Geral */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    📊 RESUMO GERAL
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-3xl font-bold text-gray-700">{alunos.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Total de Alunos</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-3xl font-bold text-green-600">{alunosAprovados.length}</p>
                      <p className="text-xs text-green-600 mt-1">✓ Aprovados</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-3xl font-bold text-red-600">{alunosReprovados.length}</p>
                      <p className="text-xs text-red-600 mt-1">✗ Reprovados</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-3xl font-bold text-blue-600">
                        {alunos.length > 0 ? Math.round((alunosAprovados.length / alunos.length) * 100) : 0}%
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Taxa de Aprovação</p>
                    </div>
                  </div>
                </div>

                {/* LISTA DE APROVADOS */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-green-700 mb-4 pb-2 border-b border-green-300">
                    ✅ ALUNOS APROVADOS ({alunosAprovados.length})
                  </h2>
                  {alunosAprovados.length > 0 ? (
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
                          {alunosAprovados.map((aluno, index) => (
                            <tr key={aluno.id} className="border-b border-green-200 hover:bg-green-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{aluno.codigoSistema}</td>
                              <td className="p-2 font-medium">{aluno.nome}</td>
                              <td className="p-2 font-mono">{aluno.cpf}</td>
                              <td className="p-2 text-center font-bold text-green-600">
                                {aluno.resultadoProva?.nota || '-'}
                              </td>
                              <td className="p-2 text-center">
                                {aluno.resultadoProva?.dataProva 
                                  ? new Date(aluno.resultadoProva.dataProva).toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                              <td className="p-2 text-xs">
                                {aluno.resultadoProva?.observacoes || '-'}
                              </td>
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

                {/* LISTA DE REPROVADOS */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-red-700 mb-4 pb-2 border-b border-red-300">
                    ❌ ALUNOS REPROVADOS ({alunosReprovados.length})
                  </h2>
                  {alunosReprovados.length > 0 ? (
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
                          {alunosReprovados.map((aluno, index) => (
                            <tr key={aluno.id} className="border-b border-red-200 hover:bg-red-50">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-600">{aluno.codigoSistema}</td>
                              <td className="p-2 font-medium">{aluno.nome}</td>
                              <td className="p-2 font-mono">{aluno.cpf}</td>
                              <td className="p-2 text-center font-bold text-red-600">
                                {aluno.resultadoProva?.nota || '-'}
                              </td>
                              <td className="p-2 text-center">
                                {aluno.resultadoProva?.dataProva 
                                  ? new Date(aluno.resultadoProva.dataProva).toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                              <td className="p-2 text-xs">
                                {aluno.resultadoProva?.observacoes || '-'}
                              </td>
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

                {/* Rodapé */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>Relatório gerado automaticamente pela Plataforma SMCORP</p>
                  <p className="mt-1">{dataGeracao}</p>
                </div>
              </div>
            )}

            {/* RELATÓRIO DE PRODUTOS */}
            {tipoRelatorio === 'produtos' && (
              <div>
                {/* Cabeçalho do Relatório */}
                <div className="text-center mb-8 pb-4 border-b-2 border-red-600">
                  <h1 className="text-3xl font-bold text-red-600 mb-2">RELATÓRIO DE PRODUTOS POR ALUNO</h1>
                  <p className="text-sm text-gray-600">Turma: {turma.codigo} - {turma.nomePersonalizado || curso?.nome}</p>
                  <p className="text-sm text-gray-600">Gerado em: {dataGeracao}</p>
                </div>

                {/* Lista de Alunos com Produtos */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                    🛍️ PRODUTOS CONTRATADOS POR ALUNO
                  </h2>
                  
                  <div className="space-y-4">
                    {alunos.map((aluno, index) => (
                      <div key={aluno.id} className="border border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-700">#{index + 1}</span>
                              <Badge variant="outline" className="font-mono font-semibold text-blue-600">
                                {aluno.codigoSistema}
                              </Badge>
                              <span className="font-semibold text-lg">{aluno.nome}</span>
                              <Badge variant="outline" className={`text-xs ${
                                aluno.tipoPessoa === 'PJ' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300'
                              }`}>
                                {aluno.tipoPessoa === 'PJ' ? '🏢 PJ' : '👤 PF'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              CPF: {aluno.cpf} | Telefone: {aluno.telefone}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              R$ {(aluno.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">Valor Total</div>
                          </div>
                        </div>

                        {/* Tabela de Produtos */}
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
                              {/* Produtos Obrigatórios */}
                              {aluno.produtosVinculados && aluno.produtosVinculados.length > 0 ? (
                                aluno.produtosVinculados.map((prodId: string, idx: number) => {
                                  const produto = { id: prodId, nome: `Produto ${idx + 1}`, preco: 150, tipo: 'Obrigatório' };
                                  return (
                                    <tr key={prodId} className="border-b border-gray-100">
                                      <td className="p-2">{produto.nome}</td>
                                      <td className="p-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">
                                          Obrigatório
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-center">1</td>
                                      <td className="p-2 text-right">R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2 text-right font-semibold">R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  );
                                })
                              ) : null}
                              
                              {/* Produtos Extras */}
                              {aluno.extrasVinculados && aluno.extrasVinculados.length > 0 ? (
                                aluno.extrasVinculados.map((extraId: string, idx: number) => {
                                  const extra = { id: extraId, nome: `Extra ${idx + 1}`, preco: 80, tipo: 'Extra' };
                                  return (
                                    <tr key={extraId} className="border-b border-gray-100">
                                      <td className="p-2">{extra.nome}</td>
                                      <td className="p-2">
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px]">
                                          Extra
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-center">1</td>
                                      <td className="p-2 text-right">R$ {extra.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2 text-right font-semibold">R$ {extra.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  );
                                })
                              ) : null}

                              {/* Mensagem se não houver produtos */}
                              {(!aluno.produtosVinculados || aluno.produtosVinculados.length === 0) && 
                               (!aluno.extrasVinculados || aluno.extrasVinculados.length === 0) && (
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
                                  R$ {aluno.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Geral */}
                <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">VALOR TOTAL GERAL DA TURMA</p>
                      <p className="text-xs text-gray-500">{alunos.length} alunos com produtos contratados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-red-600">
                        R$ {totalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>Relatório gerado automaticamente pela Plataforma SMCORP</p>
                  <p className="mt-1">{dataGeracao}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </DialogContent>

      {/* Estilos de impressão */}
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
          
          /* Garantir que tabelas não quebrem linhas */
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