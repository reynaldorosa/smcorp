import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import type { Instrutor } from '@/app/contexts/SMCorpContext';

interface DialogAdicionarInstrutorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrutores: Instrutor[];
  instrutoresJaVinculados: string[]; // IDs dos instrutores já vinculados
  onConfirmar: (instrutorId: string) => void;
}

export const DialogAdicionarInstrutor: React.FC<DialogAdicionarInstrutorProps> = ({
  open,
  onOpenChange,
  instrutores,
  instrutoresJaVinculados,
  onConfirmar
}) => {
  const [busca, setBusca] = useState('');
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<string | null>(null);

  const instrutoresFiltrados = instrutores.filter(instrutor => {
    const buscaLower = busca.toLowerCase();
    return (
      instrutor.nome.toLowerCase().includes(buscaLower) ||
      instrutor.codigo.toLowerCase().includes(buscaLower) ||
      instrutor.funcao.toLowerCase().includes(buscaLower)
    );
  });

  const handleConfirmar = () => {
    if (instrutorSelecionado) {
      onConfirmar(instrutorSelecionado);
      setInstrutorSelecionado(null);
      setBusca('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Adicionar Instrutor à Turma
          </DialogTitle>
          <DialogDescription>
            Selecione um instrutor da lista para vincular a esta turma
          </DialogDescription>
        </DialogHeader>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, código ou função..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Instrutores */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {instrutoresFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {instrutores.length === 0 
                ? 'Nenhum instrutor cadastrado no sistema'
                : 'Nenhum instrutor encontrado com os critérios de busca'}
            </div>
          ) : (
            instrutoresFiltrados.map((instrutor) => {
              const jaVinculado = instrutoresJaVinculados.includes(instrutor.id);
              const selecionado = instrutorSelecionado === instrutor.id;

              return (
                <Card 
                  key={instrutor.id}
                  className={`cursor-pointer transition-all ${
                    jaVinculado 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                      : selecionado 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                  onClick={() => !jaVinculado && setInstrutorSelecionado(instrutor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {instrutor.codigo}
                          </Badge>
                          <h3 className="font-semibold text-gray-900">
                            {instrutor.nome}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {instrutor.funcao}
                        </p>
                      </div>
                      {jaVinculado && (
                        <Badge className="bg-gray-500">
                          Já vinculado
                        </Badge>
                      )}
                      {selecionado && !jaVinculado && (
                        <Badge className="bg-purple-600">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setInstrutorSelecionado(null);
              setBusca('');
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!instrutorSelecionado}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
