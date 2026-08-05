import React, { useState } from 'react';
import { DollarSign, Plus, Pencil, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useSMCorp, PrecificacaoEmpresa } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogPrecificacoesEmpresaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  empresaNome: string;
}

export const DialogPrecificacoesEmpresa: React.FC<DialogPrecificacoesEmpresaProps> = ({
  open,
  onOpenChange,
  empresaId,
  empresaNome
}) => {
  const { 
    clientesPJ, 
    cursos, 
    produtosExtras,
    adicionarPrecificacaoEmpresa, 
    editarPrecificacaoEmpresa,
    excluirPrecificacaoEmpresa
  } = useSMCorp();

  const empresa = clientesPJ.find(c => c.id === empresaId);
  const precificacoes = empresa?.precificacoes || [];

  const [novaPrecificacao, setNovaPrecificacao] = useState({
    cursoId: 'none',
    valorNegociado: 0,
    produtosInclusos: [] as string[],
    observacoes: '',
    dataVigencia: '',
    ativo: true
  });

  const [editando, setEditando] = useState<PrecificacaoEmpresa | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Limpar produtos inclusos quando trocar de curso
  React.useEffect(() => {
    if (novaPrecificacao.cursoId) {
      // Manter apenas produtos que existem no novo curso selecionado
      const produtosVinculados = getProdutosVinculadosCurso(novaPrecificacao.cursoId);
      const idsValidos = produtosVinculados.map(p => p.id);
      const produtosFiltrados = novaPrecificacao.produtosInclusos.filter(id => idsValidos.includes(id));
      
      if (produtosFiltrados.length !== novaPrecificacao.produtosInclusos.length) {
        setNovaPrecificacao(prev => ({ ...prev, produtosInclusos: produtosFiltrados }));
      }
    }
  }, [novaPrecificacao.cursoId]);

  const handleAdicionarPrecificacao = () => {
    if (novaPrecificacao.cursoId === 'none') {
      toast.error('Selecione um curso');
      return;
    }

    if (novaPrecificacao.valorNegociado <= 0) {
      toast.error('Valor negociado deve ser maior que zero');
      return;
    }

    // Verificar se já existe precificação ativa para este curso
    const jaExiste = precificacoes.some(
      p => p.cursoId === novaPrecificacao.cursoId && p.ativo
    );

    if (jaExiste) {
      toast.error('Já existe uma precificação ativa para este curso');
      return;
    }

    adicionarPrecificacaoEmpresa(empresaId, novaPrecificacao);
    toast.success('Precificação adicionada com sucesso!');
    
    setNovaPrecificacao({
      cursoId: 'none',
      valorNegociado: 0,
      produtosInclusos: [] as string[],
      observacoes: '',
      dataVigencia: '',
      ativo: true
    });
  };

  const handleEditarPrecificacao = () => {
    if (!editando) return;

    editarPrecificacaoEmpresa(empresaId, editando.id, {
      valorNegociado: editando.valorNegociado,
      produtosInclusos: editando.produtosInclusos,
      observacoes: editando.observacoes,
      dataVigencia: editando.dataVigencia,
      ativo: editando.ativo
    });

    toast.success('Precificação atualizada com sucesso!');
    setEditando(null);
    setModoEdicao(false);
  };

  const handleExcluirPrecificacao = (precificacaoId: string) => {
    if (confirm('Deseja realmente excluir esta precificação?')) {
      excluirPrecificacaoEmpresa(empresaId, precificacaoId);
      toast.success('Precificação excluída com sucesso!');
    }
  };

  const handleToggleAtivo = (precificacao: PrecificacaoEmpresa) => {
    editarPrecificacaoEmpresa(empresaId, precificacao.id, {
      ativo: !precificacao.ativo
    });
    toast.success(`Precificação ${!precificacao.ativo ? 'ativada' : 'desativada'} com sucesso!`);
  };

  const getCursoNome = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    return curso ? `${curso.codigo} - ${curso.nome}` : 'Curso não encontrado';
  };

  const getCursoValorBase = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    return curso?.valorBase ?? 0;
  };

  const calcularDesconto = (valorBase: number, valorNegociado: number) => {
    if (!valorBase || valorBase === 0) return '0.0';
    return ((valorBase - valorNegociado) / valorBase * 100).toFixed(1);
  };

  // Filtrar cursos que ainda não têm precificação ativa
  const cursosDisponiveis = cursos.filter(curso => {
    const temPrecificacaoAtiva = precificacoes.some(
      p => p.cursoId === curso.id && p.ativo
    );
    return !curso.excluido && !temPrecificacaoAtiva;
  });

  // Obter produtos vinculados ao curso selecionado
  const getProdutosVinculadosCurso = (cursoId: string) => {
    if (cursoId === 'none') return [];
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return [];

    const produtos = [];
    
    // Produtos principais (obrigatórios)
    if (curso.produtosVinculados) {
      curso.produtosVinculados.forEach(prodId => {
        const produto = produtosExtras.find(p => p.id === prodId);
        if (produto) {
          produtos.push({ ...produto, categoria: 'Principal' });
        }
      });
    }

    // Produtos extras (opcionais)
    if (curso.extrasVinculados) {
      curso.extrasVinculados.forEach(extraId => {
        const extra = produtosExtras.find(p => p.id === extraId);
        if (extra) {
          produtos.push({ ...extra, categoria: 'Extra' });
        }
      });
    }

    return produtos;
  };

  const toggleProdutoIncluso = (produtoId: string) => {
    const produtosAtuais = novaPrecificacao.produtosInclusos;
    const novoProdutos = produtosAtuais.includes(produtoId)
      ? produtosAtuais.filter(id => id !== produtoId)
      : [...produtosAtuais, produtoId];
    
    setNovaPrecificacao({ ...novaPrecificacao, produtosInclusos: novoProdutos });
  };

  const toggleProdutoInclusoEdicao = (produtoId: string) => {
    if (!editando) return;
    const produtosAtuais = editando.produtosInclusos || [];
    const novoProdutos = produtosAtuais.includes(produtoId)
      ? produtosAtuais.filter(id => id !== produtoId)
      : [...produtosAtuais, produtoId];
    
    setEditando({ ...editando, produtosInclusos: novoProdutos });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Precificações - {empresaNome}
          </DialogTitle>
          <DialogDescription>
            Gerencie as precificações customizadas vinculadas aos cursos do Módulo 01
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 overflow-y-auto flex-1 min-h-0">
          {/* Formulário de Nova Precificação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Nova Precificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curso" className="text-xs">Curso *</Label>
                  <Select
                    value={novaPrecificacao.cursoId}
                    onValueChange={(value) => setNovaPrecificacao({ ...novaPrecificacao, cursoId: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione um curso</SelectItem>
                      {cursosDisponiveis.map(curso => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.codigo} - {curso.nome} (Base: R$ {(curso.valorBase ?? 0).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cursosDisponiveis.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Todos os cursos já possuem precificação ativa
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="valorNegociado" className="text-xs">Valor Negociado (R$) *</Label>
                  <Input
                    id="valorNegociado"
                    type="number"
                    step="0.01"
                    value={novaPrecificacao.valorNegociado}
                    onChange={(e) => setNovaPrecificacao({ ...novaPrecificacao, valorNegociado: parseFloat(e.target.value) || 0 })}
                    className="h-10 text-base"
                    placeholder="0.00"
                  />
                  {novaPrecificacao.cursoId !== 'none' && novaPrecificacao.valorNegociado > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Desconto: {calcularDesconto(getCursoValorBase(novaPrecificacao.cursoId), novaPrecificacao.valorNegociado)}%
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="dataVigencia" className="text-xs">Data de Vigência</Label>
                <Input
                  id="dataVigencia"
                  type="date"
                  value={novaPrecificacao.dataVigencia}
                  onChange={(e) => setNovaPrecificacao({ ...novaPrecificacao, dataVigencia: e.target.value })}
                  className="h-10 text-base"
                />
              </div>

              <div>
                <Label htmlFor="observacoes" className="text-xs">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novaPrecificacao.observacoes}
                  onChange={(e) => setNovaPrecificacao({ ...novaPrecificacao, observacoes: e.target.value })}
                  placeholder="Ex: Desconto de 10% para turmas acima de 15 alunos"
                  rows={2}
                  className="text-base"
                />
              </div>

              <div>
                <Label className="text-xs">Produtos Inclusos</Label>
                {getProdutosVinculadosCurso(novaPrecificacao.cursoId).length > 0 ? (
                  <div className="space-y-2 border rounded-lg p-3 bg-gray-50 mt-1">
                    {getProdutosVinculadosCurso(novaPrecificacao.cursoId).map(produto => (
                      <div key={produto.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={novaPrecificacao.produtosInclusos.includes(produto.id)}
                          onChange={() => toggleProdutoIncluso(produto.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {produto.codigo} - {produto.nome} 
                          <Badge variant="outline" className="ml-2 text-xs">
                            {produto.categoria}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Selecione um curso para ver os produtos disponíveis
                  </p>
                )}
              </div>

              <Button 
                onClick={handleAdicionarPrecificacao}
                className="w-full bg-red-600 hover:bg-red-700 h-10"
                disabled={cursosDisponiveis.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Precificação
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Precificações Existentes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-900 border-b pb-2">
              Precificações Cadastradas ({precificacoes.length})
            </h3>

            {precificacoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma precificação cadastrada</p>
                <p className="text-xs mt-1">Adicione precificações customizadas usando o formulário acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {precificacoes.map((precificacao) => {
                  const valorBase = getCursoValorBase(precificacao.cursoId);
                  const desconto = calcularDesconto(valorBase, precificacao.valorNegociado);

                  return (
                    <Card key={precificacao.id} className={!precificacao.ativo ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        {modoEdicao && editando?.id === precificacao.id ? (
                          // Modo de Edição
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Curso</Label>
                                <p className="text-sm font-medium">{getCursoNome(precificacao.cursoId)}</p>
                              </div>

                              <div>
                                <Label htmlFor="editValor" className="text-xs">Valor Negociado (R$) *</Label>
                                <Input
                                  id="editValor"
                                  type="number"
                                  step="0.01"
                                  value={editando.valorNegociado}
                                  onChange={(e) => setEditando({ ...editando, valorNegociado: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="editDataVigencia" className="text-xs">Data de Vigência</Label>
                              <Input
                                id="editDataVigencia"
                                type="date"
                                value={editando.dataVigencia || ''}
                                onChange={(e) => setEditando({ ...editando, dataVigencia: e.target.value })}
                              />
                            </div>

                            <div>
                              <Label htmlFor="editObservacoes" className="text-xs">Observações</Label>
                              <Textarea
                                id="editObservacoes"
                                value={editando.observacoes || ''}
                                onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })}
                                rows={2}
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Produtos Inclusos</Label>
                              <div className="space-y-2">
                                {getProdutosVinculadosCurso(precificacao.cursoId).map(produto => (
                                  <div key={produto.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={editando.produtosInclusos?.includes(produto.id) || false}
                                      onChange={() => toggleProdutoInclusoEdicao(produto.id)}
                                    />
                                    <span className="text-sm">{produto.nome} ({produto.categoria})</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleEditarPrecificacao}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Salvar
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditando(null);
                                  setModoEdicao(false);
                                }}
                                variant="outline"
                                className="flex-1"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Modo de Visualização
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-sm">{getCursoNome(precificacao.cursoId)}</h4>
                                  {precificacao.ativo ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-800 text-xs">Inativo</Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <span className="text-gray-600">Valor Base:</span>
                                    <p className="font-semibold">R$ {(valorBase ?? 0).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Valor Negociado:</span>
                                    <p className="font-semibold text-green-600">R$ {(precificacao.valorNegociado ?? 0).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Desconto:</span>
                                    <p className="font-semibold text-blue-600">{desconto}%</p>
                                  </div>
                                </div>

                                {precificacao.dataVigencia && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    <strong>Vigência:</strong> até {new Date(precificacao.dataVigencia).toLocaleDateString('pt-BR')}
                                  </p>
                                )}

                                {precificacao.observacoes && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <strong>Observações:</strong> {precificacao.observacoes}
                                  </p>
                                )}

                                {precificacao.produtosInclusos && precificacao.produtosInclusos.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      Produtos Inclusos:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {precificacao.produtosInclusos.map(prodId => {
                                        const produto = produtosExtras.find(p => p.id === prodId);
                                        return produto ? (
                                          <Badge key={prodId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                            {produto.codigo}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                <Button
                                  onClick={() => {
                                    setEditando(precificacao);
                                    setModoEdicao(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  onClick={() => handleToggleAtivo(precificacao)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  {precificacao.ativo ? (
                                    <XCircle className="w-3 h-3 text-amber-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  )}
                                </Button>

                                <Button
                                  onClick={() => handleExcluirPrecificacao(precificacao.id)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informativo sobre Cascata de Dados */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                i
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Cascata de Dados</h4>
                <p className="text-xs text-blue-700">
                  As precificações customizadas ficam vinculadas aos cursos do Módulo 01 e podem ser utilizadas automaticamente 
                  ao criar turmas específicas para esta empresa no Módulo 02. Precificações inativas são mantidas no histórico 
                  mas não aparecem para seleção em novos cadastros.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};