import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, DollarSign, Calendar, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { toast } from 'sonner';
import type { ClientePJ, Curso, PrecificacaoEmpresa, ProdutoExtra } from '@/app/contexts/SMCorpContext';

interface DialogEditarClientePJProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClientePJ | null;
  cursos: Curso[];
  produtosExtras: ProdutoExtra[];
  onSalvar: (id: string, dados: Partial<Omit<ClientePJ, 'id' | 'codigo'>>) => void;
}

export const DialogEditarClientePJ: React.FC<DialogEditarClientePJProps> = ({
  open,
  onOpenChange,
  cliente,
  cursos,
  produtosExtras,
  onSalvar
}) => {
  const [dadosBasicos, setDadosBasicos] = useState({
    nome: '',
    cnpj: '',
    razaoSocial: '',
    endereco: '',
    telefone: '',
    email: '',
    formasPagamentoPermitidas: [] as string[],
    login: '',
    senha: '',
    acessoAtivo: false
  });

  const [precificacoes, setPrecificacoes] = useState<PrecificacaoEmpresa[]>([]);
  const [novaPrecificacao, setNovaPrecificacao] = useState({
    cursoId: '',
    produtosInclusos: [] as string[],
    observacoes: '',
    dataVigencia: '',
    ativo: true
  });

  // Função para obter produtos vinculados ao curso
  const getProdutosVinculadosCurso = (cursoId: string) => {
    if (!cursoId) return [];
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

  // Função para obter produtos JÁ INCLUSOS em precificações ativas
  const getProdutosJaInclusos = () => {
    const produtosJaSelecionados = new Set<string>();
    
    // Buscar todos os produtos de precificações ativas
    precificacoes.forEach(prec => {
      if (prec.ativo && prec.produtosInclusos) {
        prec.produtosInclusos.forEach(prodId => {
          produtosJaSelecionados.add(prodId);
        });
      }
    });
    
    return produtosJaSelecionados;
  };

  // Função para obter produtos DISPONÍVEIS (ainda não inclusos em precificações ativas)
  const getProdutosDisponiveisCurso = (cursoId: string) => {
    const todosProdutos = getProdutosVinculadosCurso(cursoId);
    const produtosJaInclusos = getProdutosJaInclusos();
    
    // Filtrar apenas produtos que NÃO estão em precificações ativas
    return todosProdutos.filter(produto => !produtosJaInclusos.has(produto.id));
  };

  // Carregar dados do cliente quando o dialog abrir
  useEffect(() => {
    if (cliente) {
      setDadosBasicos({
        nome: cliente.nome,
        cnpj: cliente.cnpj,
        razaoSocial: cliente.razaoSocial || '',
        endereco: cliente.endereco || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        formasPagamentoPermitidas: cliente.formasPagamentoPermitidas || [],
        login: cliente.login || '',
        senha: cliente.senha || '',
        acessoAtivo: cliente.acessoAtivo || false
      });
      setPrecificacoes(cliente.precificacoes || []);
    }
  }, [cliente]);

  // Resetar form quando fechar
  useEffect(() => {
    if (!open) {
      setNovaPrecificacao({
        cursoId: '',
        produtosInclusos: [] as string[],
        observacoes: '',
        dataVigencia: '',
        ativo: true
      });
    }
  }, [open]);

  const handleAdicionarPrecificacao = () => {
    if (!novaPrecificacao.cursoId) {
      toast.error('Selecione um curso para a precificação.');
      return;
    }

    if (novaPrecificacao.produtosInclusos.length === 0) {
      toast.error('Selecione pelo menos um produto para a precificação.');
      return;
    }

    const precificacao: PrecificacaoEmpresa = {
      id: Date.now().toString(),
      ...novaPrecificacao
    };

    setPrecificacoes([...precificacoes, precificacao]);
    setNovaPrecificacao({
      cursoId: '',
      produtosInclusos: [] as string[],
      observacoes: '',
      dataVigencia: '',
      ativo: true
    });
    toast.success('Precificação adicionada!');
  };

  const handleRemoverPrecificacao = (id: string) => {
    setPrecificacoes(precificacoes.filter(p => p.id !== id));
    toast.info('Precificação removida.');
  };

  const handleTogglePrecificacaoAtiva = (id: string) => {
    setPrecificacoes(precificacoes.map(p =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ));
  };

  const handleSalvar = () => {
    // Validações básicas
    if (!dadosBasicos.nome || !dadosBasicos.nome.trim()) {
      toast.error('Nome da empresa é obrigatório.');
      return;
    }

    if (!dadosBasicos.cnpj || !dadosBasicos.cnpj.trim()) {
      toast.error('CNPJ é obrigatório.');
      return;
    }

    if (dadosBasicos.acessoAtivo && (!dadosBasicos.login || !dadosBasicos.senha)) {
      toast.error('Login e senha são obrigatórios quando o acesso está ativo.');
      return;
    }

    // Salvar
    if (cliente) {
      onSalvar(cliente.id, {
        ...dadosBasicos,
        precificacoes
      });
      toast.success('Cliente atualizado com sucesso!');
      onOpenChange(false);
    }
  };

  const getCursoNome = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    return curso ? `${curso.codigo} - ${curso.nome}` : 'Curso não encontrado';
  };

  // Todos os cursos disponíveis (permitindo múltiplas precificações por curso)
  const cursosDisponiveis = cursos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            Editar Cliente Pessoa Jurídica
          </DialogTitle>
          <DialogDescription>
            {cliente?.codigo} - Edite as informações cadastrais e gerencie as precificações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-6 flex-1 min-h-0">
          {/* Dados Básicos */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Dados Básicos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={dadosBasicos.nome}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, nome: e.target.value })}
                  placeholder="Tech Solutions Ltda"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={dadosBasicos.cnpj}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, cnpj: e.target.value })}
                  placeholder="12.345.678/0001-90"
                />
              </div>

              <div>
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  value={dadosBasicos.razaoSocial}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, razaoSocial: e.target.value })}
                  placeholder="Tech Solutions Tecnologia Ltda"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={dadosBasicos.telefone}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, telefone: e.target.value })}
                  placeholder="(11) 3000-1000"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={dadosBasicos.email}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={dadosBasicos.endereco}
                  onChange={(e) => setDadosBasicos({ ...dadosBasicos, endereco: e.target.value })}
                  placeholder="Av. Paulista, 1000 - São Paulo, SP"
                />
              </div>
            </div>
          </div>

          {/* 💳 Formas de Pagamento Permitidas */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              Formas de Pagamento Permitidas
            </h3>
            
            <p className="text-xs text-gray-600 mb-3">
              Selecione as formas de pagamento que esta empresa está autorizada a utilizar:
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque', 'Boleto'].map((forma) => (
                <div key={forma} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={`edit-forma-${forma}`}
                    checked={dadosBasicos.formasPagamentoPermitidas?.includes(forma) || false}
                    onCheckedChange={(checked) => {
                      const formasAtuais = dadosBasicos.formasPagamentoPermitidas || [];
                      const novasFormas = checked
                        ? [...formasAtuais, forma]
                        : formasAtuais.filter(f => f !== forma);
                      setDadosBasicos({ ...dadosBasicos, formasPagamentoPermitidas: novasFormas });
                    }}
                  />
                  <Label htmlFor={`edit-forma-${forma}`} className="text-sm cursor-pointer flex-1">
                    {forma}
                  </Label>
                </div>
              ))}
            </div>
            
            {(!dadosBasicos.formasPagamentoPermitidas || dadosBasicos.formasPagamentoPermitidas.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                <p className="text-xs text-amber-700">
                  ⚠️ Se nenhuma forma for selecionada, TODAS as formas de pagamento estarão disponíveis.
                </p>
              </div>
            )}
            
            {dadosBasicos.formasPagamentoPermitidas && dadosBasicos.formasPagamentoPermitidas.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-2 mt-3">
                <p className="text-xs text-green-700 font-semibold">
                  ✓ {dadosBasicos.formasPagamentoPermitidas.length} forma(s) de pagamento selecionada(s)
                </p>
              </div>
            )}
          </div>

          {/* Acesso à Área do Cliente */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Acesso à Área do Cliente</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acessoAtivo"
                  checked={dadosBasicos.acessoAtivo}
                  onCheckedChange={(checked) => 
                    setDadosBasicos({ ...dadosBasicos, acessoAtivo: checked as boolean })
                  }
                />
                <Label htmlFor="acessoAtivo" className="cursor-pointer">
                  Habilitar acesso à Área do Cliente (Módulo 05)
                </Label>
              </div>

              {dadosBasicos.acessoAtivo && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-red-200">
                  <div>
                    <Label htmlFor="login">Login *</Label>
                    <Input
                      id="login"
                      value={dadosBasicos.login}
                      onChange={(e) => setDadosBasicos({ ...dadosBasicos, login: e.target.value })}
                      placeholder="usuario_empresa"
                    />
                  </div>

                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="text"
                      value={dadosBasicos.senha}
                      onChange={(e) => setDadosBasicos({ ...dadosBasicos, senha: e.target.value })}
                      placeholder="senha123"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gerenciamento de Precificações */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Precificações Negociadas</h3>
            
            {/* Adicionar Nova Precificação */}
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-blue-900">Adicionar Nova Precificação</span>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6">
                      <Label htmlFor="novoCurso" className="text-xs">Curso *</Label>
                      <Select 
                        value={novaPrecificacao.cursoId} 
                        onValueChange={(value) => setNovaPrecificacao({ ...novaPrecificacao, cursoId: value })}
                      >
                        <SelectTrigger id="novoCurso" className="bg-white h-10">
                          <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursosDisponiveis.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum curso cadastrado no sistema
                            </SelectItem>
                          ) : (
                            cursosDisponiveis.map((curso) => (
                              <SelectItem key={curso.id} value={curso.id}>
                                {curso.codigo} - {curso.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label htmlFor="novaVigencia" className="text-xs">Data de Vigência</Label>
                      <Input
                        id="novaVigencia"
                        type="date"
                        value={novaPrecificacao.dataVigencia}
                        onChange={(e) => setNovaPrecificacao({ ...novaPrecificacao, dataVigencia: e.target.value })}
                        className="bg-white h-10 text-base"
                      />
                    </div>
                  </div>

                  {/* Produtos Vinculados */}
                  {novaPrecificacao.cursoId && (
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-2">
                        <Package className="w-3 h-3 text-red-600" />
                        Produtos Inclusos na Precificação
                      </Label>
                      {getProdutosDisponiveisCurso(novaPrecificacao.cursoId).length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          <p className="text-xs text-amber-700 text-center">
                            {getProdutosVinculadosCurso(novaPrecificacao.cursoId).length === 0 
                              ? '⚠️ Este curso não possui produtos vinculados'
                              : '⚠️ Todos os produtos deste curso já estão inclusos em precificações ativas'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 border border-green-200 rounded-lg p-3 bg-white mt-2 max-h-[200px] overflow-y-auto">
                          <p className="text-xs text-green-700 mb-2">
                            Selecione os produtos inclusos nesta precificação:
                          </p>
                          {getProdutosJaInclusos().size > 0 && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-700">
                                💡 <strong>Dica:</strong> Produtos já incluídos em outras precificações ativas não aparecem aqui para evitar duplicação.
                              </p>
                            </div>
                          )}
                          {getProdutosDisponiveisCurso(novaPrecificacao.cursoId).map(produto => (
                            <div key={produto.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                              <Checkbox
                                id={`novo-produto-${produto.id}`}
                                checked={novaPrecificacao.produtosInclusos.includes(produto.id)}
                                onCheckedChange={(checked) => {
                                  const novosProdutos = checked
                                    ? [...novaPrecificacao.produtosInclusos, produto.id]
                                    : novaPrecificacao.produtosInclusos.filter(id => id !== produto.id);
                                  setNovaPrecificacao({ ...novaPrecificacao, produtosInclusos: novosProdutos });
                                }}
                              />
                              <label htmlFor={`novo-produto-${produto.id}`} className="flex-1 cursor-pointer text-xs">
                                <span className="font-medium">{produto.codigo} - {produto.nome}</span>
                                <span className="ml-2 text-xs text-gray-600">R$ {produto.valor.toFixed(2)}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`ml-2 text-xs ${produto.categoria === 'Principal' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-purple-100 text-purple-700 border-purple-300'}`}
                                >
                                  {produto.categoria}
                                </Badge>
                              </label>
                            </div>
                          ))}
                          {novaPrecificacao.produtosInclusos.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <p className="text-xs text-green-800 font-semibold">
                                ✓ {novaPrecificacao.produtosInclusos.length} produto(s) selecionado(s)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="novasObservacoes" className="text-xs">Observações</Label>
                    <Input
                      id="novasObservacoes"
                      value={novaPrecificacao.observacoes}
                      onChange={(e) => setNovaPrecificacao({ ...novaPrecificacao, observacoes: e.target.value })}
                      placeholder="Ex: Desconto de 10% para turmas acima de 15 alunos"
                      className="bg-white h-10 text-base"
                    />
                  </div>

                  <Button
                    onClick={handleAdicionarPrecificacao}
                    disabled={!novaPrecificacao.cursoId}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Precificação
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Precificações */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {precificacoes.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  Nenhuma precificação cadastrada ainda.
                </div>
              ) : (
                precificacoes.map((prec) => (
                  <Card key={prec.id} className={`border ${prec.ativo ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{getCursoNome(prec.cursoId)}</span>
                            <Badge variant={prec.ativo ? 'default' : 'secondary'} className={prec.ativo ? 'bg-green-600' : 'bg-gray-400'}>
                              {prec.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs">
                            {/* Produtos Inclusos */}
                            {prec.produtosInclusos && prec.produtosInclusos.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <span className="text-gray-500 font-semibold flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  Produtos Inclusos:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {prec.produtosInclusos.map(prodId => {
                                    const produto = produtosExtras.find(p => p.id === prodId);
                                    return produto ? (
                                      <Badge key={prodId} variant="outline" className="text-xs bg-white">
                                        {produto.codigo}
                                      </Badge>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                            {prec.dataVigencia && (
                              <div>
                                <span className="text-gray-500">Vigência: </span>
                                <span className="text-gray-700">{prec.dataVigencia}</span>
                              </div>
                            )}
                            {prec.observacoes && (
                              <div>
                                <span className="text-gray-500">Obs: </span>
                                <span className="text-gray-700">{prec.observacoes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <Button
                            onClick={() => handleTogglePrecificacaoAtiva(prec.id)}
                            variant="outline"
                            size="sm"
                            className="h-8"
                          >
                            {prec.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            onClick={() => handleRemoverPrecificacao(prec.id)}
                            variant="outline"
                            size="sm"
                            className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} className="bg-red-600 hover:bg-red-700">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};