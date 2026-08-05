import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useSMCorp } from '@/app/contexts/SMCorpContext';

interface DialogUploadPlanilhaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId?: string;
  turmaNome?: string;
  onProcessar?: (dados: any[]) => void; // Nova prop opcional
}

interface AlunoExcel {
  nome: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
}

export const DialogUploadPlanilha: React.FC<DialogUploadPlanilhaProps> = ({
  open,
  onOpenChange,
  turmaId,
  turmaNome,
  onProcessar
}) => {
  const { adicionarAluno, turmas, cursos, configuracoesWhatsApp } = useSMCorp();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [alunosProcessados, setAlunosProcessados] = useState<AlunoExcel[]>([]);
  const [processando, setProcessando] = useState(false);
  const [enviandoLinks, setEnviandoLinks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const turma = turmaId ? turmas.find(t => t.id === turmaId) : undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error('Formato de arquivo inválido. Use Excel (.xlsx, .xls) ou CSV');
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
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const alunosExtraidos: AlunoExcel[] = jsonData.map((row: any) => ({
        nome: row['Nome'] || row['nome'] || row['NOME'] || '',
        cpf: row['CPF'] || row['cpf'] || '',
        rg: row['RG'] || row['rg'] || '',
        dataNascimento: row['Data de Nascimento'] || row['data_nascimento'] || row['dataNascimento'] || '',
        email: row['Email'] || row['email'] || row['E-mail'] || '',
        telefone: row['Telefone'] || row['telefone'] || row['Celular'] || row['celular'] || '',
        endereco: row['Endereço'] || row['endereco'] || row['Rua'] || row['rua'] || '',
        observacoes: row['Observações'] || row['observacoes'] || row['Obs'] || row['obs'] || ''
      }));

      // Filtrar alunos com nome válido
      const alunosValidos = alunosExtraidos.filter(a => a.nome && a.nome.trim() !== '');

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

  const cadastrarAlunos = () => {
    if (alunosProcessados.length === 0) {
      toast.error('Nenhum aluno para cadastrar');
      return;
    }

    // Se onProcessar existe, usar ele (fluxo do Módulo 05 com aprovação manual)
    if (onProcessar) {
      console.log('🔄 [DIALOG UPLOAD] Chamando onProcessar com', alunosProcessados.length, 'alunos');
      onProcessar(alunosProcessados);
      return; // Retorna aqui, não executa o resto
    }

    // Senão, usar o fluxo padrão (adicionar diretamente)
    if (!turmaId || !turma) {
      toast.error('Turma não encontrada');
      return;
    }

    // 🔧 Buscar curso e produtos vinculados
    const curso = cursos.find(c => c.id === turma.cursoId);
    const produtosVinculados: string[] = [];
    if (curso && curso.produtosVinculados) {
      produtosVinculados.push(...curso.produtosVinculados);
    }

    let sucessos = 0;
    let erros = 0;

    alunosProcessados.forEach((alunoExcel) => {
      try {
        adicionarAluno({
          nome: alunoExcel.nome,
          cpf: alunoExcel.cpf || '',
          rg: alunoExcel.rg || '',
          dataNascimento: alunoExcel.dataNascimento || '',
          email: alunoExcel.email || '',
          telefone: alunoExcel.telefone || '',
          endereco: alunoExcel.endereco || '',
          turmaId: turmaId,
          valorTotal: turma.preco || 0,
          desconto: 0,
          statusLink: 'Agendado',
          statusPagamento: false,
          statusDocumentos: false,
          observacoes: alunoExcel.observacoes || '',
          foto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(alunoExcel.nome)}`,
          dataInicioAluno: turma.dataInicio,
          dataFimAluno: turma.dataFim,
          statusProva: {
            ativo: false
          },
          produtosExtras: produtosVinculados, // ✅ Produtos do curso!
          documentos: [],
          pagamentos: {
            historico: [],
            valorPago: 0,
            pendente: false
          }
        });
        sucessos++;
      } catch (error) {
        console.error('Erro ao cadastrar aluno:', alunoExcel.nome, error);
        erros++;
      }
    });

    if (sucessos > 0) {
      toast.success(`${sucessos} aluno(s) cadastrado(s) com sucesso!`);
    }
    if (erros > 0) {
      toast.error(`${erros} aluno(s) não puderam ser cadastrados`);
    }

    // Limpar após cadastro e fechar dialog
    setArquivo(null);
    setAlunosProcessados([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Fechar o dialog
    onOpenChange(false);
  };

  const enviarLinksInscricao = () => {
    setEnviandoLinks(true);
    
    setTimeout(() => {
      const alunosComContato = alunosProcessados.filter(a => a.email || a.telefone);
      
      if (alunosComContato.length === 0) {
        toast.error('Nenhum aluno possui email ou telefone cadastrado');
        setEnviandoLinks(false);
        return;
      }

      // Simulação de envio
      const linkInscricao = `https://smcorp.com/inscricao/${turmaId}`;
      const mensagemPadrao = configuracoesWhatsApp?.mensagemPadrao || 'Olá! Segue o link para sua inscrição: {link}';
      const mensagem = mensagemPadrao.replace('{link}', linkInscricao);

      toast.success(`Links de inscrição enviados para ${alunosComContato.length} aluno(s)`, {
        description: `Via: ${alunosComContato.filter(a => a.email).length} email(s) e ${alunosComContato.filter(a => a.telefone).length} WhatsApp`
      });

      setEnviandoLinks(false);
    }, 2000);
  };

  const baixarModeloPlanilha = () => {
    const modelo = [
      {
        'Nome': 'João da Silva',
        'CPF': '123.456.789-00',
        'RG': '12.345.678-9',
        'Data de Nascimento': '01/01/1990',
        'Email': 'joao@example.com',
        'Telefone': '(11) 98765-4321',
        'Endereço': 'Rua Exemplo, 123',
        'Observações': 'Aluno exemplo'
      },
      {
        'Nome': 'Maria Santos',
        'CPF': '987.654.321-00',
        'RG': '98.765.432-1',
        'Data de Nascimento': '15/05/1995',
        'Email': 'maria@example.com',
        'Telefone': '(11) 91234-5678',
        'Endereço': 'Av. Teste, 456',
        'Observações': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
    XLSX.writeFile(wb, 'modelo_planilha_alunos.xlsx');
    toast.success('Modelo de planilha baixado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-red-600" />
            Upload de Planilha - {turmaNome}
          </DialogTitle>
          <DialogDescription>
            Importe alunos em lote através de uma planilha Excel (.xlsx, .xls) ou CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">📋 Como usar:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Baixe o modelo de planilha clicando no botão abaixo</li>
              <li>Preencha os dados dos alunos seguindo as colunas do modelo</li>
              <li>Faça o upload do arquivo preenchido</li>
              <li>Revise os dados e confirme o cadastro</li>
              <li>Opcionalmente, envie os links de inscrição por email/WhatsApp</li>
            </ol>
          </div>

          {/* Botão Download Modelo */}
          <div>
            <Button
              onClick={baixarModeloPlanilha}
              variant="outline"
              className="w-full border-green-300 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              Baixar Modelo de Planilha
            </Button>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label>Upload de Arquivo</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-red-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                {arquivo ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">{arquivo.name}</p>
                    <p className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(2)} KB</p>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Arquivo carregado
                    </Badge>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-gray-400 mt-1">Excel (.xlsx, .xls) ou CSV</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Preview dos Alunos */}
          {processando && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processando planilha...</p>
            </div>
          )}

          {alunosProcessados.length > 0 && !processando && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Alunos Encontrados ({alunosProcessados.length})</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  Pronto para cadastrar
                </Badge>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nome</th>
                      <th className="px-3 py-2 text-left font-semibold">CPF</th>
                      <th className="px-3 py-2 text-left font-semibold">Email</th>
                      <th className="px-3 py-2 text-left font-semibold">Telefone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {alunosProcessados.map((aluno, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {aluno.nome || <span className="text-red-500 italic">Sem nome</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{aluno.cpf || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{aluno.email || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{aluno.telefone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <p className="text-xs text-green-600 font-semibold mb-1">Total</p>
                  <p className="text-2xl font-bold text-green-700">{alunosProcessados.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Com Email</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {alunosProcessados.filter(a => a.email).length}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Com Telefone</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {alunosProcessados.filter(a => a.telefone).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso sobre empresa */}
          {turma && !turma.empresaId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Atenção!</p>
                <p>Esta turma não está vinculada a uma empresa. A funcionalidade de upload em lote é recomendada para turmas corporativas.</p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>

          {alunosProcessados.length > 0 && (
            <>
              <Button
                onClick={enviarLinksInscricao}
                variant="outline"
                className="flex-1 border-blue-300 hover:bg-blue-50"
                disabled={enviandoLinks}
              >
                {enviandoLinks ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Links
                  </>
                )}
              </Button>

              <Button
                onClick={cadastrarAlunos}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Cadastrar {alunosProcessados.length} Aluno(s)
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};