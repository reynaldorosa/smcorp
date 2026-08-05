'use client';

import React, { useState } from 'react';
import { RefreshCw, Users, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Student } from '@/types';

interface SelectSubstituteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoAntigo: Student;
  alunosFilaEspera: Student[];
  onConfirmar: (alunoNovoId: string, motivo: string) => void;
}

export const SelectSubstituteDialog: React.FC<SelectSubstituteDialogProps> = ({
  open,
  onOpenChange,
  alunoAntigo,
  alunosFilaEspera,
  onConfirmar
}) => {
  const [alunoNovoId, setAlunoNovoId] = useState('');
  const [motivo, setMotivo] = useState('');

  const handleConfirmar = () => {
    if (!alunoNovoId) {
      toast.error('❌ Selecione um aluno da fila de espera.');
      return;
    }

    if (!motivo.trim()) {
      toast.error('❌ Informe o motivo da substituição.');
      return;
    }

    onConfirmar(alunoNovoId, motivo);
    
    // Limpar
    setAlunoNovoId('');
    setMotivo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-600" />
            Substituir Aluno
          </DialogTitle>
          <DialogDescription>
            Substituindo: <strong>{alunoAntigo.name}</strong> ({alunoAntigo.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerta se não houver alunos em fila */}
          {alunosFilaEspera.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <p className="font-semibold mb-1">⚠️ Nenhum aluno em fila de espera</p>
                  <p className="text-xs">
                    Para substituir um aluno, primeiro adicione candidatos à fila de espera usando o botão
                    <strong> &quot;Adicionar à Fila de Espera&quot;</strong> na turma.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Informações do aluno que será substituído */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Aluno que será REMOVIDO
                </h3>
                <div className="text-sm text-red-800 space-y-1">
                  <p><strong>Nome:</strong> {alunoAntigo.name}</p>
                  <p><strong>Código:</strong> {alunoAntigo.code}</p>
                  <p><strong>CPF:</strong> {alunoAntigo.taxId}</p>
                  <p><strong>Telefone:</strong> {alunoAntigo.phone}</p>
                </div>
              </div>

              {/* Seleção do substituto */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Selecione o aluno da FILA DE ESPERA
                </h3>
                <Select value={alunoNovoId} onValueChange={setAlunoNovoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um aluno em fila de espera" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunosFilaEspera.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id}>
                        {aluno.name} - {aluno.taxId} ({aluno.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Exibir detalhes do aluno selecionado */}
                {alunoNovoId && (() => {
                  const alunoSelecionado = alunosFilaEspera.find(a => a.id === alunoNovoId);
                  if (!alunoSelecionado) return null;
                  
                  return (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300 text-sm space-y-1">
                      <p><strong>Nome:</strong> {alunoSelecionado.name}</p>
                      <p><strong>CPF:</strong> {alunoSelecionado.taxId}</p>
                      <p><strong>E-mail:</strong> {alunoSelecionado.email}</p>
                      <p><strong>Telefone:</strong> {alunoSelecionado.phone}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Motivo da substituição */}
              <div>
                <Label htmlFor="motivo">Motivo da Substituição *</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ex: Aluno desistiu do curso, Solicitação da empresa, etc."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este motivo ficará registrado no histórico do aluno substituído
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleConfirmar}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!alunoNovoId || !motivo.trim()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Confirmar Substituição
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
