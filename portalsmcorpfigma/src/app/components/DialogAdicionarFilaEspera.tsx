import React, { useState } from 'react';
import { UserPlus, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

interface DialogAdicionarFilaEsperaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdicionar: (dadosAluno: {
    nome: string;
    cpf: string;
    rg: string;
    dataNascimento: string;
    telefone: string;
    email: string;
    endereco: string;
  }) => void;
  nomeTurma: string;
}

export const DialogAdicionarFilaEspera: React.FC<DialogAdicionarFilaEsperaProps> = ({
  open,
  onOpenChange,
  onAdicionar,
  nomeTurma
}) => {
  const [dadosAluno, setDadosAluno] = useState({
    nome: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  const handleSubmit = () => {
    // Validações básicas
    if (!dadosAluno.nome || !dadosAluno.cpf || !dadosAluno.telefone || !dadosAluno.email) {
      toast.error('❌ Preencha todos os campos obrigatórios (nome, CPF, telefone e e-mail).');
      return;
    }

    // Validação de CPF
    const cpfLimpo = dadosAluno.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      toast.error('❌ CPF inválido. Digite 11 dígitos.');
      return;
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dadosAluno.email)) {
      toast.error('❌ E-mail inválido.');
      return;
    }

    onAdicionar(dadosAluno);

    // Limpar formulário
    setDadosAluno({
      nome: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      endereco: ''
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Adicionar à Fila de Espera
          </DialogTitle>
          <DialogDescription>
            Turma: <strong>{nomeTurma}</strong>
            <br />
            <span className="text-xs text-orange-600">
              ⚠️ Aluno ficará em fila de espera até ser ativado via substituição
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João da Silva"
                value={dadosAluno.nome}
                onChange={(e) => setDadosAluno({ ...dadosAluno, nome: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={dadosAluno.cpf}
                onChange={(e) => setDadosAluno({ ...dadosAluno, cpf: e.target.value })}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={dadosAluno.rg}
                onChange={(e) => setDadosAluno({ ...dadosAluno, rg: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dadosAluno.dataNascimento}
                onChange={(e) => setDadosAluno({ ...dadosAluno, dataNascimento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                value={dadosAluno.telefone}
                onChange={(e) => setDadosAluno({ ...dadosAluno, telefone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@email.com"
                value={dadosAluno.email}
                onChange={(e) => setDadosAluno({ ...dadosAluno, email: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro - cidade, UF"
                value={dadosAluno.endereco}
                onChange={(e) => setDadosAluno({ ...dadosAluno, endereco: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Adicionar à Fila de Espera
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
