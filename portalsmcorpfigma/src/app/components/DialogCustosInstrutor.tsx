import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Link, Unlink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Separator } from '@/app/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import type { Instrutor, CustoAuditavel } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogCustosInstrutorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrutor: Instrutor;
  custosDisponiveis: CustoAuditavel[];
  onVincularCusto: (custoId: string) => void;
  onDesvincularCusto: (custoId: string) => void;
}

export const DialogCustosInstrutor: React.FC<DialogCustosInstrutorProps> = ({
  open,
  onOpenChange,
  instrutor,
  custosDisponiveis,
  onVincularCusto,
  onDesvincularCusto
}) => {
  const [custosSelecionados, setCustosSelecionados] = useState<Set<string>>(new Set());
  const [modoVinculacao, setModoVinculacao] = useState(false);
  const [custoParaDesvincular, setCustoParaDesvincular] = useState<string | null>(null);

  const custosVinculados = custosDisponiveis.filter(custo => 
    instrutor.custosVinculados?.includes(custo.id)
  );

  const custosNaoVinculados = custosDisponiveis.filter(custo => 
    !instrutor.custosVinculados?.includes(custo.id)
  );

  const handleToggleCusto = (custoId: string) => {
    const novoselecionados = new Set(custosSelecionados);
    if (novoselecionados.has(custoId)) {
      novoselecionados.delete(custoId);
    } else {
      novoselecionados.add(custoId);
    }
    setCustosSelecionados(novoselecionados);
  };

  const handleVincularSelecionados = () => {
    if (custosSelecionados.size === 0) {
      toast.error('Selecione pelo menos um custo para vincular');
      return;
    }

    custosSelecionados.forEach(custoId => {
      onVincularCusto(custoId);
    });

    toast.success(`${custosSelecionados.size} ${custosSelecionados.size === 1 ? 'custo vinculado' : 'custos vinculados'} com sucesso!`);
    setCustosSelecionados(new Set());
    setModoVinculacao(false);
  };

  const handleDesvincular = () => {
    if (custoParaDesvincular) {
      onDesvincularCusto(custoParaDesvincular);
      toast.success('Custo desvinculado com sucesso!');
      setCustoParaDesvincular(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
              Gestão de Custos - {instrutor.nome}
            </DialogTitle>
            <DialogDescription>
              Vincule custos auditáveis ao instrutor para facilitar o rastreamento financeiro
            </DialogDescription>
          </DialogHeader>

          {/* Informações do Instrutor */}
          <Card className="border-l-4 border-l-purple-600 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-purple-600 text-xs">
                      {instrutor.codigo}
                    </Badge>
                    <span className="font-semibold text-gray-900">
                      {instrutor.nome}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {instrutor.funcao}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {custosVinculados.length}
                  </div>
                  <div className="text-xs text-gray-600">
                    {custosVinculados.length === 1 ? 'custo vinculado' : 'custos vinculados'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos Vinculados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link className="w-5 h-5 text-green-600" />
                Custos Vinculados
              </h3>
            </div>

            {custosVinculados.length === 0 ? (
              <Card className="bg-gray-50 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <Unlink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Nenhum custo vinculado ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {custosVinculados.map(custo => (
                  <Card key={custo.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              {custo.codigo}
                            </Badge>
                            <span className="font-semibold text-sm text-gray-900">
                              {custo.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>💰 {custo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span>•</span>
                            <span>📦 {custo.categoria}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCustoParaDesvincular(custo.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Adicionar Novos Custos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Adicionar Custos
              </h3>
              {!modoVinculacao && custosNaoVinculados.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setModoVinculacao(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Vincular Custos
                </Button>
              )}
            </div>

            {modoVinculacao ? (
              <>
                {/* Modo de Seleção de Custos */}
                <Card className="border-blue-300 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-700">
                        Selecione os custos que deseja vincular ao instrutor
                      </p>
                      <Badge className="bg-blue-600">
                        {custosSelecionados.size} selecionado{custosSelecionados.size !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Lista de Custos Disponíveis */}
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                      {custosNaoVinculados.map(custo => (
                        <Card 
                          key={custo.id}
                          className={`cursor-pointer transition-all ${
                            custosSelecionados.has(custo.id) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                          onClick={() => handleToggleCusto(custo.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={custosSelecionados.has(custo.id)}
                                onCheckedChange={() => handleToggleCusto(custo.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {custo.codigo}
                                  </Badge>
                                  <span className="font-semibold text-sm text-gray-900">
                                    {custo.nome}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <span>💰 {custo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                  <span>•</span>
                                  <span>📦 {custo.categoria}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setModoVinculacao(false);
                          setCustosSelecionados(new Set());
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleVincularSelecionados}
                        disabled={custosSelecionados.size === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Link className="w-4 h-4 mr-1" />
                        Vincular ({custosSelecionados.size})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Modo Normal - Lista de Custos Disponíveis */}
                {custosNaoVinculados.length === 0 ? (
                  <Card className="bg-gray-50 border-dashed border-2">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        Todos os custos disponíveis já estão vinculados
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {custosNaoVinculados.slice(0, 3).map(custo => (
                      <Card key={custo.id} className="border-l-4 border-l-gray-300">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {custo.codigo}
                            </Badge>
                            <span className="font-semibold text-sm text-gray-900">
                              {custo.nome}
                            </span>
                            <span className="text-xs text-gray-600">
                              💰 {custo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {custosNaoVinculados.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        ... e mais {custosNaoVinculados.length - 3} {custosNaoVinculados.length - 3 === 1 ? 'custo' : 'custos'}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Desvincular */}
      <AlertDialog open={!!custoParaDesvincular} onOpenChange={(open) => !open && setCustoParaDesvincular(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlink className="w-5 h-5 text-red-600" />
              Desvincular Custo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente desvincular este custo do instrutor?
              <br />
              <span className="text-red-600 font-semibold">
                Esta ação não afetará lançamentos já existentes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesvincular}
              className="bg-red-600 hover:bg-red-700"
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
