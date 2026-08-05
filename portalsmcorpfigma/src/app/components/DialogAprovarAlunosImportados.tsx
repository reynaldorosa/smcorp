import React, { useState } from 'react';
import { UserPlus, X, ChevronRight, CheckCircle, AlertCircle, Users, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';

interface AlunoParaAprovar {
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  valorTotal: number;
  [key: string]: any;
}

interface ProdutoExtra {
  id: string;
  codigo: string;
  tipo: 'produto' | 'extra';
  nome: string;
  valor: number;
}

interface DialogAprovarAlunosImportadosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunos: AlunoParaAprovar[];
  nomeTurma: string;
  produtosExtrasDisponiveis?: ProdutoExtra[]; // Produtos extras disponíveis para seleção
  onAprovarAluno: (aluno: AlunoParaAprovar) => void;
  onFinalizarAprovacao: (aprovados: number, rejeitados: number) => void;
}

export const DialogAprovarAlunosImportados: React.FC<DialogAprovarAlunosImportadosProps> = ({
  open,
  onOpenChange,
  alunos,
  nomeTurma,
  produtosExtrasDisponiveis = [],
  onAprovarAluno,
  onFinalizarAprovacao
}) => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [aprovados, setAprovados] = useState(0);
  const [rejeitados, setRejeitados] = useState(0);
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]); // IDs dos produtos extras selecionados
  
  // 🎯 Gerar ID único para este lote de aprovação
  const [loteAprovacaoId] = useState(() => `LOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log('🎯 [DIALOG APROVAÇÃO] Renderizando...');
  console.log('Open:', open);
  console.log('Alunos:', alunos);
  console.log('Nome Turma:', nomeTurma);
  console.log('Índice Atual:', indiceAtual);
  console.log('🆔 Lote Aprovação ID:', loteAprovacaoId);

  const alunoAtual = alunos[indiceAtual];
  const totalAlunos = alunos.length;
  const progresso = indiceAtual + 1;

  console.log('Aluno Atual:', alunoAtual);
  console.log('Total Alunos:', totalAlunos);

  const handleAprovar = () => {
    if (!alunoAtual) return;

    // Adicionar produtos extras selecionados ao aluno
    // 🔧 REGRA: Valor total = APENAS soma dos produtos selecionados
    const produtosJaIncluidos = alunoAtual?.produtosExtras || [];
    const todosProdutosSelecionados = [...produtosJaIncluidos, ...produtosSelecionados];
    
    const valorTotalCalculado = todosProdutosSelecionados.reduce((total, produtoId) => {
      const produto = produtosExtrasDisponiveis.find(p => p.id === produtoId);
      return total + (produto?.valor || 0);
    }, 0);

    const alunoComProdutos = {
      ...alunoAtual,
      produtosExtras: todosProdutosSelecionados,
      valorTotal: valorTotalCalculado,
      loteAprovacaoId // 🆔 Adicionar ID do lote para todos os alunos aprovados juntos
    };

    onAprovarAluno(alunoComProdutos);
    setAprovados(prev => prev + 1);

    // Resetar produtos selecionados para o próximo aluno
    setProdutosSelecionados([]);

    // Avançar para próximo aluno ou finalizar
    if (indiceAtual < totalAlunos - 1) {
      setIndiceAtual(prev => prev + 1);
    } else {
      finalizarProcesso(aprovados + 1, rejeitados);
    }
  };

  const handleRejeitar = () => {
    setRejeitados(prev => prev + 1);

    // Resetar produtos selecionados
    setProdutosSelecionados([]);

    // Avançar para próximo aluno ou finalizar
    if (indiceAtual < totalAlunos - 1) {
      setIndiceAtual(prev => prev + 1);
    } else {
      finalizarProcesso(aprovados, rejeitados + 1);
    }
  };

  const finalizarProcesso = (totalAprovados: number, totalRejeitados: number) => {
    onFinalizarAprovacao(totalAprovados, totalRejeitados);
    
    // Reset do estado
    setIndiceAtual(0);
    setAprovados(0);
    setRejeitados(0);
    setProdutosSelecionados([]);
    
    onOpenChange(false);
  };

  // Função para alternar seleção de produto
  const toggleProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => 
      prev.includes(produtoId) 
        ? prev.filter(id => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  // Calcular valor total com produtos selecionados
  // 🔧 REGRA: Valor total = APENAS soma dos produtos selecionados
  const produtosJaIncluidos = alunoAtual?.produtosExtras || [];
  const todosProdutosSelecionados = [...produtosJaIncluidos, ...produtosSelecionados];
  
  const valorTotalCalculado = todosProdutosSelecionados.reduce((total, produtoId) => {
    const produto = produtosExtrasDisponiveis.find(p => p.id === produtoId);
    return total + (produto?.valor || 0);
  }, 0);

  const handleCancelar = () => {
    if (window.confirm(`Você aprovou ${aprovados} e rejeitou ${rejeitados} alunos até agora. Deseja realmente cancelar o processo?`)) {
      finalizarProcesso(aprovados, rejeitados);
    }
  };

  if (!alunoAtual) return null;

  // Separar produtos obrigatórios e extras
  const produtosObrigatorios = produtosExtrasDisponiveis.filter(p => p.tipo === 'produto');
  const produtosExtrasOpc = produtosExtrasDisponiveis.filter(p => p.tipo === 'extra');

  // Validar se PELO MENOS 1 produto obrigatório foi selecionado
  // ✅ CORREÇÃO: Considerar produtos já incluídos automaticamente
  const peloMenosUmObrigatorioSelecionado = produtosObrigatorios.length === 0 || 
    produtosObrigatorios.some(p => produtosSelecionados.includes(p.id) || produtosJaIncluidos.includes(p.id));

  // Botão de aprovar só habilitado se pelo menos 1 obrigatório estiver selecionado
  const podeAprovar = peloMenosUmObrigatorioSelecionado;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancelar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Aprovar Alunos Importados
            </span>
            <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
              {progresso} de {totalAlunos}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Área com scroll */}
        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progresso da Aprovação</span>
              <span className="font-semibold">{Math.round((progresso / totalAlunos) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progresso / totalAlunos) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {aprovados} aprovados
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" />
                {rejeitados} rejeitados
              </span>
            </div>
          </div>

          {/* Informações da Turma e Valores */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Turma:</strong> {nomeTurma}
            </p>
            <div className="flex items-center justify-end text-sm">
              <div className="text-blue-900 font-bold">
                <strong>Valor Total:</strong> <span className="text-green-600 text-lg ml-1">R$ {(valorTotalCalculado || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card do Aluno Atual */}
          <Card className="border-2 border-blue-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {alunoAtual.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{alunoAtual.nome}</h3>
                  <p className="text-sm text-gray-600">CPF: {alunoAtual.cpf}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">RG</label>
                  <p className="text-sm text-gray-900">{alunoAtual.rg || '—'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data de Nascimento</label>
                  <p className="text-sm text-gray-900">{alunoAtual.dataNascimento || '—'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Telefone</label>
                  <p className="text-sm text-gray-900">{alunoAtual.telefone}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">E-mail</label>
                  <p className="text-sm text-gray-900 truncate" title={alunoAtual.email}>{alunoAtual.email}</p>
                </div>

                {alunoAtual.endereco && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Endereço</label>
                    <p className="text-sm text-gray-900">{alunoAtual.endereco}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 1: Produtos Obrigatórios */}
          {produtosObrigatorios.length > 0 && (
            <Card className="border-2 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Produtos Obrigatórios</h4>
                    <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">
                      {produtosObrigatorios.filter(p => produtosSelecionados.includes(p.id)).length}/{produtosObrigatorios.length} selecionados
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-red-700 mb-3 font-semibold">
                  ⚠️ Selecione PELO MENOS 1 produto obrigatório para este aluno (pode escolher mais de um se necessário).
                </p>
                <div className="space-y-2">
                  {produtosObrigatorios.map((produto) => {
                    // ✅ Verificar se este produto já foi incluído automaticamente
                    const jaIncluido = produtosJaIncluidos.includes(produto.id);
                    const estaSelecionado = produtosSelecionados.includes(produto.id) || jaIncluido;
                    
                    return (
                      <div
                        key={produto.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          jaIncluido 
                            ? 'border-green-400 bg-green-50 cursor-not-allowed opacity-75'
                            : estaSelecionado
                              ? 'border-red-400 bg-red-50 cursor-pointer'
                              : 'border-red-200 bg-white hover:border-red-300 cursor-pointer'
                        }`}
                        onClick={() => !jaIncluido && toggleProduto(produto.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={estaSelecionado}
                            disabled={jaIncluido}
                            onCheckedChange={() => !jaIncluido && toggleProduto(produto.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className={`text-sm font-medium ${!jaIncluido ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                {produto.nome}
                              </Label>
                              {jaIncluido ? (
                                <Badge className="bg-green-600 text-white text-xs">
                                  ✓ JÁ INCLUÍDO
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">
                                  OBRIGATÓRIO
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{produto.codigo}</p>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          + R$ {(produto.valor || 0).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO 2: Produtos Extras (Opcionais) */}
          {produtosExtrasOpc.length > 0 && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Produtos Extras (Opcionais)</h4>
                  <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                    {produtosExtrasOpc.filter(p => produtosSelecionados.includes(p.id)).length} selecionados
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  ℹ️ Estes produtos são opcionais. Selecione conforme necessidade do aluno.
                </p>
                <div className="space-y-2">
                  {produtosExtrasOpc.map((produto) => (
                    <div
                      key={produto.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        produtosSelecionados.includes(produto.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                      onClick={() => toggleProduto(produto.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={produtosSelecionados.includes(produto.id)}
                          onCheckedChange={() => toggleProduto(produto.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium cursor-pointer">
                              {produto.nome}
                            </Label>
                            <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                              EXTRA
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{produto.codigo}</p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        + R$ {(produto.valor || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta de Ação */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Revise os dados do aluno</p>
              <p className="text-xs mt-1">
                Clique em <strong>"Aprovar e Enviar Link"</strong> para matricular este aluno e enviar o link de acesso, 
                ou em <strong>"Rejeitar"</strong> para pular este aluno.
              </p>
            </div>
          </div>

          {/* Alerta se faltam produtos obrigatórios */}
          {!podeAprovar && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">⚠️ Nenhum produto obrigatório selecionado!</p>
                <p className="text-xs mt-1">
                  Você deve selecionar <strong>PELO MENOS 1 dos {produtosObrigatorios.length} produtos obrigatórios</strong> antes de aprovar este aluno.
                </p>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleRejeitar}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              size="lg"
            >
              <X className="w-5 h-5 mr-2" />
              Rejeitar
            </Button>

            <Button
              onClick={handleAprovar}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={!podeAprovar}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Aprovar e Enviar Link
              {indiceAtual < totalAlunos - 1 && (
                <ChevronRight className="w-5 h-5 ml-1" />
              )}
            </Button>
          </div>

          {/* Botão Cancelar Processo */}
          <div className="text-center pt-2 border-t">
            <Button
              onClick={handleCancelar}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar Processo de Aprovação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};