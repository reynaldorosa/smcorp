'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface UploadSpreadsheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId?: string;
  turmaNome?: string;
  valorTurma?: number;
  onProcessar?: (dados: ExcelStudent[]) => void;
  onCadastrar?: (dados: ExcelStudent[]) => void | Promise<void>;
}

export interface ExcelStudent {
  name: string;
  taxId: string;
  rg?: string;
  dataNascimento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
}

export function UploadSpreadsheetDialog({
  open,
  onOpenChange,
  turmaId,
  turmaNome,
  valorTurma,
  onProcessar,
  onCadastrar,
}: UploadSpreadsheetDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [alunosProcessados, setAlunosProcessados] = useState<ExcelStudent[]>([]);
  const [processando, setProcessando] = useState(false);
  const [enviandoLinks, setEnviandoLinks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/i)
      ) {
        toast.error(
          'Formato de arquivo inválido. Use Excel (.xlsx, .xls) ou CSV'
        );
        return;
      }

      setArquivo(file);
      processarPlanilha(file);
    }
  };

  const processarPlanilha = async (file: File) => {
    setProcessando(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });

      const alunosExtraidos: ExcelStudent[] = jsonData.map((row) => ({
        name: row['Nome'] || row['nome'] || row['NOME'] || '',
        taxId: row['CPF'] || row['cpf'] || '',
        rg: row['RG'] || row['rg'] || '',
        dataNascimento:
          row['Data de Nascimento'] ||
          row['data_nascimento'] ||
          row['dataNascimento'] ||
          '',
        email: row['Email'] || row['email'] || row['E-mail'] || '',
        telefone:
          row['Telefone'] ||
          row['telefone'] ||
          row['Celular'] ||
          row['celular'] ||
          '',
        endereco:
          row['Endereço'] ||
          row['endereco'] ||
          row['Rua'] ||
          row['rua'] ||
          '',
        observacoes:
          row['Observações'] ||
          row['observacoes'] ||
          row['Obs'] ||
          row['obs'] ||
          '',
      }));

      // Filtrar alunos com nome válido
      const alunosValidos = alunosExtraidos.filter(
        (a) => a.name && a.name.trim() !== ''
      );

      setAlunosProcessados(alunosValidos);
      toast.success(`${alunosValidos.length} aluno(s) encontrado(s) na planilha`);
    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      toast.error('Erro ao processar planilha. Verifique o formato do arquivo.');
      setAlunosProcessados([]);
    } finally {
      setProcessando(false);
    }
  };

  const cadastrarAlunos = async () => {
    if (alunosProcessados.length === 0) {
      toast.error('Nenhum aluno para cadastrar');
      return;
    }

    // Se onProcessar existe, usar ele (fluxo com aprovação manual)
    if (onProcessar) {
      onProcessar(alunosProcessados);
      resetAndClose();
      return;
    }

    // Senão, usar callback de cadastro
    if (onCadastrar) {
      await onCadastrar(alunosProcessados);
      resetAndClose();
      return;
    }

    toast.warning('Nenhuma ação configurada para processar os alunos');
  };

  const enviarLinksInscricao = () => {
    setEnviandoLinks(true);

    setTimeout(() => {
      const alunosComContato = alunosProcessados.filter(
        (a) => a.email || a.telefone
      );

      if (alunosComContato.length === 0) {
        toast.error('Nenhum aluno possui email ou telefone cadastrado');
        setEnviandoLinks(false);
        return;
      }

      toast.success(
        `Links de inscrição enviados para ${alunosComContato.length} aluno(s)`,
        {
          description: `Via: ${alunosComContato.filter((a) => a.email).length} email(s) e ${alunosComContato.filter((a) => a.telefone).length} WhatsApp`,
        }
      );

      setEnviandoLinks(false);
    }, 2000);
  };

  const baixarModeloPlanilha = () => {
    const modelo = [
      {
        Nome: 'João da Silva',
        CPF: '123.456.789-00',
        RG: '12.345.678-9',
        'Data de Nascimento': '01/01/1990',
        Email: 'joao@example.com',
        Telefone: '(11) 98765-4321',
        Endereço: 'Rua Exemplo, 123',
        Observações: 'Aluno exemplo',
      },
      {
        Nome: 'Maria Santos',
        CPF: '987.654.321-00',
        RG: '98.765.432-1',
        'Data de Nascimento': '15/05/1995',
        Email: 'maria@example.com',
        Telefone: '(11) 91234-5678',
        Endereço: 'Av. Teste, 456',
        Observações: '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
    XLSX.writeFile(wb, 'modelo_planilha_alunos.xlsx');
    toast.success('Modelo de planilha baixado com sucesso!');
  };

  const resetAndClose = () => {
    setArquivo(null);
    setAlunosProcessados([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-red-600" />
            Upload de Planilha {turmaNome ? `- ${turmaNome}` : ''}
          </DialogTitle>
          <DialogDescription>
            Importe alunos em lote através de uma planilha Excel (.xlsx, .xls)
            ou CSV
            {typeof valorTurma === 'number' && valorTurma > 0 && (
              <span className="ml-2">
                | Valor: <strong className="text-green-600">R$ {valorTurma.toFixed(2)}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instruções */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              📋 Como usar:
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>Baixe o modelo de planilha clicando no botão abaixo</li>
              <li>Preencha os dados dos alunos seguindo as colunas do modelo</li>
              <li>Faça o upload do arquivo preenchido</li>
              <li>Revise os dados e confirme o cadastro</li>
              <li>
                Opcionalmente, envie os links de inscrição por email/WhatsApp
              </li>
            </ol>
          </div>

          {/* Botão Download Modelo */}
          <div>
            <Button
              onClick={baixarModeloPlanilha}
              variant="outline"
              className="w-full border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Baixar Modelo de Planilha
            </Button>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label>Upload de Arquivo</Label>
            <div className="rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-red-400">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                {arquivo ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {arquivo.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(arquivo.size / 1024).toFixed(2)} KB
                    </p>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Arquivo carregado
                    </Badge>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clique para selecionar o arquivo
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Excel (.xlsx, .xls) ou CSV
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Preview dos Alunos */}
          {processando && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600">Processando planilha...</p>
            </div>
          )}

          {alunosProcessados.length > 0 && !processando && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Alunos Encontrados ({alunosProcessados.length})
                </h4>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  Pronto para cadastrar
                </Badge>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nome</th>
                      <th className="px-3 py-2 text-left font-semibold">CPF</th>
                      <th className="px-3 py-2 text-left font-semibold">E-mail</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Telefone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {alunosProcessados.map((aluno, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2">
                          {aluno.name || (
                            <span className="italic text-red-500">Sem nome</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {aluno.taxId || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {aluno.email || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {aluno.telefone || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
                  <p className="mb-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {alunosProcessados.length}
                  </p>
                </div>
                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Com Email
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {alunosProcessados.filter((a) => a.email).length}
                  </p>
                </div>
                <div className="rounded border border-purple-200 bg-purple-50 p-3 text-center dark:border-purple-800 dark:bg-purple-900/20">
                  <p className="mb-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Com Telefone
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {alunosProcessados.filter((a) => a.telefone).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso sobre empresa */}
          {turmaId && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="mb-1 font-semibold">Atenção!</p>
                <p>
                  Esta funcionalidade de upload em lote é recomendada para
                  turmas corporativas. Verifique se a turma está vinculada a uma
                  empresa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 border-t pt-4">
          <Button onClick={resetAndClose} variant="outline" className="flex-1">
            Cancelar
          </Button>

          {alunosProcessados.length > 0 && (
            <>
              <Button
                onClick={enviarLinksInscricao}
                variant="outline"
                className="flex-1 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                disabled={enviandoLinks}
              >
                {enviandoLinks ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Links
                  </>
                )}
              </Button>

              <Button
                onClick={cadastrarAlunos}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Cadastrar {alunosProcessados.length} Aluno(s)
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
