import React, { useState } from 'react';
import { Plus, BookOpen, Clock, Calendar, FileText, CheckSquare, Edit, Trash2, Upload, Type } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

// Módulo 01: DNA Técnico - Catálogo de Cursos
export const Modulo01: React.FC = () => {
  const { cursos, produtosExtras, adicionarCurso, atualizarCurso, excluirCurso } = useSMCorp();

  const [novoCurso, setNovoCurso] = useState({
    nome: '',
    conteudoProgramatico: '',
    cargaHorariaTotal: 0,
    horasAulaPorDia: 0,
    horarioInicio: '',
    horarioFim: '',
    intervalo: 0,
    validadeCertificacao: 0,
    usaFimDeSemana: false,
    documentosObrigatorios: [] as { nome: string; requerUpload: boolean }[],
    produtosVinculados: [] as string[],
    extrasVinculados: [] as string[]
  });

  const [novoDoc, setNovoDoc] = useState('');
  const [tipoNovoDoc, setTipoNovoDoc] = useState<'upload' | 'texto'>('upload');

  // Estado para edição
  const [cursoEditando, setCursoEditando] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    nome: '',
    conteudoProgramatico: '',
    cargaHorariaTotal: 0,
    horasAulaPorDia: 0,
    horarioInicio: '',
    horarioFim: '',
    intervalo: 0,
    validadeCertificacao: 0,
    usaFimDeSemana: false,
    documentosObrigatorios: [] as { nome: string; requerUpload: boolean }[],
    produtosVinculados: [] as string[],
    extrasVinculados: [] as string[]
  });
  const [docEdicao, setDocEdicao] = useState('');
  const [tipoDocEdicao, setTipoDocEdicao] = useState<'upload' | 'texto'>('upload');

  const handleAdicionarCurso = () => {
    adicionarCurso(novoCurso);
    setNovoCurso({
      nome: '',
      conteudoProgramatico: '',
      cargaHorariaTotal: 0,
      horasAulaPorDia: 0,
      horarioInicio: '',
      horarioFim: '',
      intervalo: 0,
      validadeCertificacao: 0,
      usaFimDeSemana: false,
      documentosObrigatorios: [],
      produtosVinculados: [],
      extrasVinculados: []
    });
  };

  const adicionarDocumento = () => {
    if (novoDoc.trim()) {
      setNovoCurso({
        ...novoCurso,
        documentosObrigatorios: [...novoCurso.documentosObrigatorios, { nome: novoDoc.trim(), requerUpload: tipoNovoDoc === 'upload' }]
      });
      setNovoDoc('');
      setTipoNovoDoc('upload');
    }
  };

  const removerDocumento = (index: number) => {
    setNovoCurso({
      ...novoCurso,
      documentosObrigatorios: novoCurso.documentosObrigatorios.filter((_, i) => i !== index)
    });
  };

  const toggleProdutoVinculado = (produtoId: string) => {
    const produtos = novoCurso.produtosVinculados.includes(produtoId)
      ? novoCurso.produtosVinculados.filter(id => id !== produtoId)
      : [...novoCurso.produtosVinculados, produtoId];
    
    setNovoCurso({ ...novoCurso, produtosVinculados: produtos });
  };

  const toggleExtraVinculado = (extraId: string) => {
    const extras = novoCurso.extrasVinculados.includes(extraId)
      ? novoCurso.extrasVinculados.filter(id => id !== extraId)
      : [...novoCurso.extrasVinculados, extraId];
    
    setNovoCurso({ ...novoCurso, extrasVinculados: extras });
  };

  const iniciarEdicao = (cursoId: string) => {
    const curso = cursos.find(c => c.id === cursoId);
    if (curso) {
      setCursoEditando(cursoId);
      setDadosEdicao({
        nome: curso.nome,
        conteudoProgramatico: curso.conteudoProgramatico,
        cargaHorariaTotal: curso.cargaHorariaTotal,
        horasAulaPorDia: curso.horasAulaPorDia,
        horarioInicio: curso.horarioInicio,
        horarioFim: curso.horarioFim,
        intervalo: curso.intervalo,
        validadeCertificacao: curso.validadeCertificacao,
        usaFimDeSemana: curso.usaFimDeSemana,
        documentosObrigatorios: curso.documentosObrigatorios || [],
        produtosVinculados: curso.produtosVinculados || [],
        extrasVinculados: curso.extrasVinculados || []
      });
    }
  };

  const adicionarDocumentoEdicao = () => {
    if (docEdicao.trim()) {
      setDadosEdicao({
        ...dadosEdicao,
        documentosObrigatorios: [...dadosEdicao.documentosObrigatorios, { nome: docEdicao.trim(), requerUpload: tipoDocEdicao === 'upload' }]
      });
      setDocEdicao('');
      setTipoDocEdicao('upload');
    }
  };

  const removerDocumentoEdicao = (index: number) => {
    setDadosEdicao({
      ...dadosEdicao,
      documentosObrigatorios: dadosEdicao.documentosObrigatorios.filter((_, i) => i !== index)
    });
  };

  const toggleProdutoVinculadoEdicao = (produtoId: string) => {
    const produtos = dadosEdicao.produtosVinculados.includes(produtoId)
      ? dadosEdicao.produtosVinculados.filter(id => id !== produtoId)
      : [...dadosEdicao.produtosVinculados, produtoId];
    
    setDadosEdicao({ ...dadosEdicao, produtosVinculados: produtos });
  };

  const toggleExtraVinculadoEdicao = (extraId: string) => {
    const extras = dadosEdicao.extrasVinculados.includes(extraId)
      ? dadosEdicao.extrasVinculados.filter(id => id !== extraId)
      : [...dadosEdicao.extrasVinculados, extraId];
    
    setDadosEdicao({ ...dadosEdicao, extrasVinculados: extras });
  };

  const handleAtualizarCurso = () => {
    if (cursoEditando) {
      atualizarCurso(cursoEditando, dadosEdicao);
      setCursoEditando(null);
      setDadosEdicao({
        nome: '',
        conteudoProgramatico: '',
        cargaHorariaTotal: 0,
        horasAulaPorDia: 0,
        horarioInicio: '',
        horarioFim: '',
        intervalo: 0,
        validadeCertificacao: 0,
        usaFimDeSemana: false,
        documentosObrigatorios: [],
        produtosVinculados: [],
        extrasVinculados: []
      });
    }
  };

  return (
    <div className="px-3 py-3">
      <div className="max-w-7xl">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-900">Módulo 01: DNA Técnico</h1>
          <p className="text-gray-600 mt-1 text-xs">Catálogo de Cursos - Onde as regras de cada treinamento são imutáveis</p>
        </div>

        <div className="flex justify-end mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
                <DialogTitle>Adicionar Novo Curso</DialogTitle>
                <DialogDescription>Insira os detalhes do novo curso que deseja adicionar ao catálogo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
                {/* Identificação */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Identificação
                  </h3>
                  <div>
                    <Label htmlFor="nomeCurso">Nome do Curso</Label>
                    <Input
                      id="nomeCurso"
                      value={novoCurso.nome}
                      onChange={(e) => setNovoCurso({ ...novoCurso, nome: e.target.value })}
                      placeholder="Ex: AC N1 IRATA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="conteudo">Conteúdo Programático</Label>
                    <Textarea
                      id="conteudo"
                      value={novoCurso.conteudoProgramatico}
                      onChange={(e) => setNovoCurso({ ...novoCurso, conteudoProgramatico: e.target.value })}
                      placeholder="Descreva o conteúdo do curso..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Configuração de Tempo */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Configuração de Tempo
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cargaTotal">Carga Horária Total (h)</Label>
                      <Input
                        id="cargaTotal"
                        type="number"
                        value={novoCurso.cargaHorariaTotal || ''}
                        onChange={(e) => setNovoCurso({ ...novoCurso, cargaHorariaTotal: parseInt(e.target.value) })}
                        placeholder="40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="horasDia">Horas de Aula por Dia</Label>
                      <Input
                        id="horasDia"
                        type="number"
                        value={novoCurso.horasAulaPorDia || ''}
                        onChange={(e) => setNovoCurso({ ...novoCurso, horasAulaPorDia: parseInt(e.target.value) })}
                        placeholder="8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="inicio">Horário Início</Label>
                      <Input
                        id="inicio"
                        type="time"
                        value={novoCurso.horarioInicio}
                        onChange={(e) => setNovoCurso({ ...novoCurso, horarioInicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fim">Horário Fim</Label>
                      <Input
                        id="fim"
                        type="time"
                        value={novoCurso.horarioFim}
                        onChange={(e) => setNovoCurso({ ...novoCurso, horarioFim: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="intervalo">Intervalo (min)</Label>
                      <Input
                        id="intervalo"
                        type="number"
                        value={novoCurso.intervalo || ''}
                        onChange={(e) => setNovoCurso({ ...novoCurso, intervalo: parseInt(e.target.value) })}
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fimDeSemana"
                      checked={novoCurso.usaFimDeSemana}
                      onCheckedChange={(checked) => setNovoCurso({ ...novoCurso, usaFimDeSemana: checked })}
                    />
                    <Label htmlFor="fimDeSemana">Curso pode ocupar Sábado e Domingo</Label>
                  </div>
                  <div>
                    <Label htmlFor="validadeCertificacao">Validade da Certificação (meses)</Label>
                    <Input
                      id="validadeCertificacao"
                      type="number"
                      value={novoCurso.validadeCertificacao || ''}
                      onChange={(e) => setNovoCurso({ ...novoCurso, validadeCertificacao: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 12, 24, 36"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe 0 para certificação sem validade</p>
                  </div>
                </div>

                {/* Requisitos de Matrícula */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Requisitos de Matrícula
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={novoDoc}
                      onChange={(e) => setNovoDoc(e.target.value)}
                      placeholder="Ex: RG, CPF, ASO..."
                      onKeyPress={(e) => e.key === 'Enter' && adicionarDocumento()}
                      className="flex-1"
                    />
                    <Select value={tipoNovoDoc} onValueChange={(value: 'upload' | 'texto') => setTipoNovoDoc(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upload">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Arquivo
                          </div>
                        </SelectItem>
                        <SelectItem value="texto">
                          <div className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Preenchimento
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={adicionarDocumento}>Adicionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {novoCurso.documentosObrigatorios.map((doc, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer flex items-center gap-1" 
                        onClick={() => removerDocumento(index)}
                      >
                        {doc.requerUpload ? <Upload className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                        {doc.nome} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Vínculo Financeiro */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Vínculo Financeiro
                  </h3>
                  
                  {/* Produtos (Valores de Curso) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-600">Produtos / Valores de Curso</Label>
                    <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                      {produtosExtras.filter(p => p.tipo === 'produto').length > 0 ? (
                        produtosExtras.filter(p => p.tipo === 'produto').map((produto) => (
                          <div key={produto.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`produto-${produto.id}`}
                              checked={novoCurso.produtosVinculados.includes(produto.id)}
                              onChange={() => toggleProdutoVinculado(produto.id)}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`produto-${produto.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-blue-600 text-white text-xs">{produto.codigo}</Badge>
                                <span>{produto.nome}</span>
                              </div>
                              <span className="text-blue-700 font-semibold">R$ {produto.valor.toFixed(2)}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Nenhum produto cadastrado no Módulo 00</p>
                      )}
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-600">Produtos Extras</Label>
                    <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                      {produtosExtras.filter(e => e.tipo === 'extra').length > 0 ? (
                        produtosExtras.filter(e => e.tipo === 'extra').map((extra) => (
                          <div key={extra.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`extra-${extra.id}`}
                              checked={novoCurso.extrasVinculados.includes(extra.id)}
                              onChange={() => toggleExtraVinculado(extra.id)}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`extra-${extra.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-purple-600 text-white text-xs">{extra.codigo}</Badge>
                                <span>{extra.nome}</span>
                              </div>
                              <span className="text-purple-700 font-semibold">R$ {extra.valor.toFixed(2)}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">Nenhum extra cadastrado no Módulo 00</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t flex-shrink-0 bg-white">
                <Button onClick={handleAdicionarCurso} className="w-full">Salvar Curso</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Cursos */}
        <div className="grid grid-cols-1 gap-6">
          {cursos.map((curso) => {
            const produtosSelecionados = produtosExtras.filter(p => curso.produtosVinculados?.includes(p.id) || false);
            const extrasSelecionados = produtosExtras.filter(e => curso.extrasVinculados?.includes(e.id) || false);
            const custoTotal = produtosSelecionados.reduce((acc, p) => acc + p.valor, 0) + extrasSelecionados.reduce((acc, e) => acc + e.valor, 0);
            const diasNecessarios = Math.ceil(curso.cargaHorariaTotal / curso.horasAulaPorDia);

            return (
              <Card key={curso.id} className="border-red-200">
                <CardHeader className="bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="default" className="bg-red-600 text-white font-mono">
                          {curso.codigo}
                        </Badge>
                        <CardTitle className="text-xl text-red-600">{curso.nome}</CardTitle>
                      </div>
                      <CardDescription className="mt-2">{curso.conteudoProgramatico}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        {curso.cargaHorariaTotal}h totais
                      </Badge>
                      <Dialog open={cursoEditando === curso.id} onOpenChange={(open) => !open && setCursoEditando(null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => iniciarEdicao(curso.id)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
                          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
                            <DialogTitle>Editar Curso</DialogTitle>
                            <DialogDescription>Atualize as informações do curso.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 overflow-y-auto px-6 py-4 flex-1">
                            {/* Identificação */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Identificação
                              </h3>
                              <div>
                                <Label htmlFor="editNomeCurso">Nome do Curso</Label>
                                <Input
                                  id="editNomeCurso"
                                  value={dadosEdicao.nome}
                                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })}
                                  placeholder="Ex: AC N1 IRATA"
                                />
                              </div>
                              <div>
                                <Label htmlFor="editConteudo">Conteúdo Programático</Label>
                                <Textarea
                                  id="editConteudo"
                                  value={dadosEdicao.conteudoProgramatico}
                                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, conteudoProgramatico: e.target.value })}
                                  placeholder="Descreva o conteúdo do curso..."
                                  rows={3}
                                />
                              </div>
                            </div>

                            {/* Configuração de Tempo */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Configuração de Tempo
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="editCargaTotal">Carga Horária Total (h)</Label>
                                  <Input
                                    id="editCargaTotal"
                                    type="number"
                                    value={dadosEdicao.cargaHorariaTotal || ''}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, cargaHorariaTotal: parseInt(e.target.value) })}
                                    placeholder="40"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editHorasDia">Horas de Aula por Dia</Label>
                                  <Input
                                    id="editHorasDia"
                                    type="number"
                                    value={dadosEdicao.horasAulaPorDia || ''}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, horasAulaPorDia: parseInt(e.target.value) })}
                                    placeholder="8"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="editInicio">Horário Início</Label>
                                  <Input
                                    id="editInicio"
                                    type="time"
                                    value={dadosEdicao.horarioInicio}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, horarioInicio: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editFim">Horário Fim</Label>
                                  <Input
                                    id="editFim"
                                    type="time"
                                    value={dadosEdicao.horarioFim}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, horarioFim: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editIntervalo">Intervalo (min)</Label>
                                  <Input
                                    id="editIntervalo"
                                    type="number"
                                    value={dadosEdicao.intervalo || ''}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, intervalo: parseInt(e.target.value) })}
                                    placeholder="60"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="editFimDeSemana"
                                  checked={dadosEdicao.usaFimDeSemana}
                                  onCheckedChange={(checked) => setDadosEdicao({ ...dadosEdicao, usaFimDeSemana: checked })}
                                />
                                <Label htmlFor="editFimDeSemana">Curso pode ocupar Sábado e Domingo</Label>
                              </div>
                              <div>
                                <Label htmlFor="editValidadeCertificacao">Validade da Certificação (meses)</Label>
                                <Input
                                  id="editValidadeCertificacao"
                                  type="number"
                                  value={dadosEdicao.validadeCertificacao || ''}
                                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, validadeCertificacao: parseInt(e.target.value) || 0 })}
                                  placeholder="Ex: 12, 24, 36"
                                />
                                <p className="text-xs text-gray-500 mt-1">Deixe 0 para certificação sem validade</p>
                              </div>
                            </div>

                            {/* Requisitos de Matrícula */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Requisitos de Matrícula
                              </h3>
                              <div className="flex gap-2">
                                <Input
                                  value={docEdicao}
                                  onChange={(e) => setDocEdicao(e.target.value)}
                                  placeholder="Ex: RG, CPF, ASO..."
                                  onKeyPress={(e) => e.key === 'Enter' && adicionarDocumentoEdicao()}
                                  className="flex-1"
                                />
                                <Select value={tipoDocEdicao} onValueChange={(value: 'upload' | 'texto') => setTipoDocEdicao(value)}>
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="upload">
                                      <div className="flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Upload Arquivo
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="texto">
                                      <div className="flex items-center gap-2">
                                        <Type className="w-4 h-4" />
                                        Preenchimento
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button type="button" onClick={adicionarDocumentoEdicao}>Adicionar</Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {dadosEdicao.documentosObrigatorios.map((doc, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="cursor-pointer flex items-center gap-1" 
                                    onClick={() => removerDocumentoEdicao(index)}
                                  >
                                    {doc.requerUpload ? <Upload className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                                    {doc.nome} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Vínculo Financeiro */}
                            <div className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                Vínculo Financeiro
                              </h3>
                              
                              {/* Produtos (Valores de Curso) */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-blue-600">Produtos / Valores de Curso</Label>
                                <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                                  {produtosExtras.filter(p => p.tipo === 'produto').length > 0 ? (
                                    produtosExtras.filter(p => p.tipo === 'produto').map((produto) => (
                                      <div key={produto.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`edit-produto-${produto.id}`}
                                          checked={dadosEdicao.produtosVinculados.includes(produto.id)}
                                          onChange={() => toggleProdutoVinculadoEdicao(produto.id)}
                                          className="w-4 h-4"
                                        />
                                        <label htmlFor={`edit-produto-${produto.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-blue-600 text-white text-xs">{produto.codigo}</Badge>
                                            <span>{produto.nome}</span>
                                          </div>
                                          <span className="text-blue-700 font-semibold">R$ {produto.valor.toFixed(2)}</span>
                                        </label>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">Nenhum produto cadastrado no Módulo 00</p>
                                  )}
                                </div>
                              </div>

                              {/* Extras */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-purple-600">Produtos Extras</Label>
                                <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                                  {produtosExtras.filter(e => e.tipo === 'extra').length > 0 ? (
                                    produtosExtras.filter(e => e.tipo === 'extra').map((extra) => (
                                      <div key={extra.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`edit-extra-${extra.id}`}
                                          checked={dadosEdicao.extrasVinculados.includes(extra.id)}
                                          onChange={() => toggleExtraVinculadoEdicao(extra.id)}
                                          className="w-4 h-4"
                                        />
                                        <label htmlFor={`edit-extra-${extra.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-purple-600 text-white text-xs">{extra.codigo}</Badge>
                                            <span>{extra.nome}</span>
                                          </div>
                                          <span className="text-purple-700 font-semibold">R$ {extra.valor.toFixed(2)}</span>
                                        </label>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">Nenhum extra cadastrado no Módulo 00</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="px-6 py-3 border-t flex-shrink-0 bg-white">
                            <Button onClick={handleAtualizarCurso} className="w-full">Salvar Alterações</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                excluirCurso(curso.id);
                              }}
                            >Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Configuração de Tempo */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Configuração de Tempo
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Horas/Dia:</span>
                          <span className="font-medium">{curso.horasAulaPorDia}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Horário:</span>
                          <span className="font-medium">{curso.horarioInicio} - {curso.horarioFim}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Intervalo:</span>
                          <span className="font-medium">{curso.intervalo} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dias necessários:</span>
                          <span className="font-medium">{diasNecessarios} dias</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fim de semana:</span>
                          <span className="font-medium">{curso.usaFimDeSemana ? 'Sim' : 'Não'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Documentos Obrigatórios */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        Documentos Obrigatórios
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {curso.documentosObrigatorios?.map((doc, index) => (
                          <Badge key={index} variant="outline">
                            {typeof doc === 'string' ? doc : doc.nome}
                          </Badge>
                        )) || <span className="text-sm text-gray-500">Nenhum documento definido</span>}
                      </div>
                    </div>

                    {/* Vínculo Financeiro */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                        Vínculo Financeiro
                      </h4>
                      <div className="space-y-2 text-sm">
                        {produtosSelecionados.map((produto) => (
                          <div key={produto.id} className="flex justify-between">
                            <span className="text-gray-600">{produto.nome}:</span>
                            <span className="font-medium">R$ {produto.valor.toFixed(2)}</span>
                          </div>
                        ))}
                        {extrasSelecionados.map((extra) => (
                          <div key={extra.id} className="flex justify-between">
                            <span className="text-gray-600">{extra.nome}:</span>
                            <span className="font-medium">R$ {extra.valor.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold">Total:</span>
                          <span className="font-semibold text-green-600">R$ {custoTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};