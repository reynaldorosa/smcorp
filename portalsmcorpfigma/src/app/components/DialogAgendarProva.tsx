import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, Clock, FileText, Users, User, CheckCircle2, XCircle } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { toast } from 'sonner';

interface DialogAgendarProvaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modo: 'selecionar-alunos' | 'selecionar-instrutor'; // Modo do dialog
  instrutorId?: string; // ID do instrutor quando vem do card do instrutor
  alunoId?: string; // ID do aluno quando vem do card do aluno
  turmaId: string;
  provaExistente?: {
    id: string;
    numeroProva: string;
    nomeProva: string;
    data: string;
    hora: string;
    instrutorId: string;
    alunosIds: string[];
  };
}

export const DialogAgendarProva: React.FC<DialogAgendarProvaProps> = ({
  open,
  onOpenChange,
  modo,
  instrutorId,
  alunoId,
  turmaId,
  provaExistente
}) => {
  const { alunos, instrutores, turmas, agendarProva, editarProvaAgendada } = useSMCorp();
  
  const [numeroProva, setNumeroProva] = useState('');
  const [nomeProva, setNomeProva] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [horaProva, setHoraProva] = useState('');
  const [instrutorSelecionado, setInstrutorSelecionado] = useState('');
  const [alunosSelecionados, setAlunosSelecionados] = useState<string[]>([]);

  const turma = turmas.find(t => t.id === turmaId);

  // Resetar form quando abre/fecha
  useEffect(() => {
    if (open) {
      if (provaExistente) {
        // Modo edição - carregar dados da prova existente
        setNumeroProva(provaExistente.numeroProva);
        setNomeProva(provaExistente.nomeProva);
        setDataProva(provaExistente.data);
        setHoraProva(provaExistente.hora);
        setInstrutorSelecionado(provaExistente.instrutorId);
        setAlunosSelecionados(provaExistente.alunosIds);
      } else {
        // Modo criação
        setNumeroProva('');
        setNomeProva('');
        setDataProva('');
        setHoraProva('');
        setInstrutorSelecionado(instrutorId || '');
        setAlunosSelecionados(alunoId ? [alunoId] : []);
      }
    }
  }, [open, instrutorId, alunoId, provaExistente]);

  // Filtrar alunos da turma que estão aptos para fazer prova (pagamento e documentos OK)
  const alunosDaTurma = alunos.filter(aluno => {
    if (!turma) return false;
    
    // Verificar se o aluno está na turma (os alunos têm turmaId)
    const alunoEstaNaTurma = aluno.turmaId === turmaId;
    if (!alunoEstaNaTurma) return false;

    // Verificar pagamento - basta ter pelo menos um pagamento confirmado
    const pagamentoOK = aluno.pagamentos && 
      aluno.pagamentos.historico && 
      aluno.pagamentos.historico.length > 0 && 
      aluno.pagamentos.historico.some(p => p.confirmedoPor);
    
    // Verificar documentos - usar statusDocumentos ou verificar documentos individuais
    const documentosOK = aluno.statusDocumentos || 
      (aluno.documentos && aluno.documentos.length > 0 && 
       aluno.documentos.some(d => d.status === 'Aprovado'));

    return pagamentoOK && documentosOK;
  });

  const toggleAluno = (alunoId: string) => {
    setAlunosSelecionados(prev => 
      prev.includes(alunoId) 
        ? prev.filter(id => id !== alunoId)
        : [...prev, alunoId]
    );
  };

  const handleConfirmar = () => {
    // Validações
    if (!numeroProva.trim()) {
      toast.error('Digite o número da prova');
      return;
    }
    if (!nomeProva.trim()) {
      toast.error('Digite o nome da prova');
      return;
    }
    if (!dataProva) {
      toast.error('Selecione a data da prova');
      return;
    }
    if (!horaProva) {
      toast.error('Digite o horário da prova');
      return;
    }
    if (!instrutorSelecionado) {
      toast.error('Selecione o instrutor');
      return;
    }
    if (alunosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um aluno');
      return;
    }

    if (provaExistente) {
      // Modo edição
      editarProvaAgendada(provaExistente.id, {
        numeroProva,
        nomeProva,
        data: dataProva,
        hora: horaProva,
        instrutorId: instrutorSelecionado,
        alunosIds: alunosSelecionados
      });
      toast.success('Prova atualizada com sucesso!');
    } else {
      // Modo criação
      agendarProva({
        turmaId,
        numeroProva,
        nomeProva,
        data: dataProva,
        hora: horaProva,
        instrutorId: instrutorSelecionado,
        alunosIds: alunosSelecionados
      });
      toast.success(`Prova agendada com sucesso! ${alunosSelecionados.length} aluno(s) cadastrado(s).`);
    }

    onOpenChange(false);
  };

  const selecionarTodosAlunos = () => {
    setAlunosSelecionados(alunosDaTurma.map(a => a.id));
  };

  const desmarcarTodosAlunos = () => {
    setAlunosSelecionados([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            {provaExistente ? 'Editar Prova Agendada' : 'Agendar Prova'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'selecionar-alunos' 
              ? 'Selecione os alunos que farão a prova com este instrutor'
              : 'Selecione o instrutor e configure os dados da prova'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Informações da Turma */}
          {turma && (() => {
            const curso = turmas.find(t => t.id === turmaId)?.cursoId;
            const nomeTurma = turma.nomePersonalizado || turma.codigo;
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">
                  Turma: {nomeTurma}
                </div>
              </div>
            );
          })()}

          {/* Dados da Prova */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número da Prova *</Label>
              <Input
                placeholder="Ex: P001"
                value={numeroProva}
                onChange={(e) => setNumeroProva(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Nome da Prova *</Label>
              <Input
                placeholder="Ex: Prova Teórica"
                value={nomeProva}
                onChange={(e) => setNomeProva(e.target.value)}
              />
            </div>
            <div>
              <Label>Data da Prova *</Label>
              <Input
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
              />
            </div>
            <div>
              <Label>Horário *</Label>
              <Input
                type="time"
                value={horaProva}
                onChange={(e) => setHoraProva(e.target.value)}
              />
            </div>
          </div>

          {/* Seleção de Instrutor */}
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Instrutor Aplicador *
            </Label>
            <Select 
              value={instrutorSelecionado} 
              onValueChange={setInstrutorSelecionado}
              disabled={!!instrutorId} // 🔒 Bloqueia quando vem do card do instrutor
            >
              <SelectTrigger className={instrutorId ? 'bg-gray-100 cursor-not-allowed' : ''}>
                <SelectValue placeholder="Selecione o instrutor" />
              </SelectTrigger>
              <SelectContent>
                {instrutores.map(instrutor => (
                  <SelectItem key={instrutor.id} value={instrutor.id}>
                    {instrutor.codigo} - {instrutor.nome} ({instrutor.funcao})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instrutorId && (
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Instrutor pré-selecionado pelo card
              </p>
            )}
          </div>

          {/* Seleção de Alunos */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Alunos Participantes * ({alunosSelecionados.length} selecionado{alunosSelecionados.length !== 1 ? 's' : ''})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selecionarTodosAlunos}
                  disabled={alunosDaTurma.length === 0}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={desmarcarTodosAlunos}
                  disabled={alunosSelecionados.length === 0}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Desmarcar Todos
                </Button>
              </div>
            </div>

            {alunosDaTurma.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Nenhum aluno apto para prova nesta turma.
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Os alunos precisam ter pagamento e documentos aprovados.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                  {alunosDaTurma.map(aluno => {
                    const isSelected = alunosSelecionados.includes(aluno.id);
                    return (
                      <div
                        key={aluno.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleAluno(aluno.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAluno(aluno.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {aluno.codigoSistema}
                            </Badge>
                            <span className="font-medium text-gray-900">
                              {aluno.nome}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            CPF: {aluno.cpf}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              {provaExistente ? 'Atualizar Prova' : 'Agendar Prova'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};