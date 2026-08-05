import React, { useState } from 'react';
import { UserPlus, Send, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';

interface ProdutoDisponivel {
  id: string;
  codigo: string;
  nome: string;
  valor: number;
  tipo: 'produto' | 'extra';
}

interface DialogAdicionarAlunoIndividualProps {
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
    produtoSelecionadoId?: string;
  }) => void;
  nomeTurma: string;
  valorCurso: number;
  produtosDisponiveis?: ProdutoDisponivel[];
}

export const DialogAdicionarAlunoIndividual: React.FC<DialogAdicionarAlunoIndividualProps> = ({
  open,
  onOpenChange,
  onAdicionar,
  nomeTurma,
  valorCurso,
  produtosDisponiveis
}) => {
  const [dados, setDados] = useState({
    nome: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: '',
    produtoSelecionadoId: ''
  });

  const handleSubmit = () => {
    // Validações básicas
    if (!dados.nome || !dados.cpf || !dados.telefone || !dados.email) {
      toast.error('❌ Preencha todos os campos obrigatórios.');
      return;
    }

    // Validação de CPF (formato simples)
    const cpfLimpo = dados.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      toast.error('❌ CPF inválido. Digite 11 dígitos.');
      return;
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dados.email)) {
      toast.error('❌ E-mail inválido.');
      return;
    }

    onAdicionar(dados);
    
    // Limpar formulário
    setDados({
      nome: '',
      cpf: '',
      rg: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      endereco: '',
      produtoSelecionadoId: ''
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-600" />
            Adicionar Aluno Individual
          </DialogTitle>
          <DialogDescription>
            Turma: <strong>{nomeTurma}</strong> | Após preencher, você selecionará os produtos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João da Silva"
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={dados.cpf}
                onChange={(e) => setDados({ ...dados, cpf: e.target.value })}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={dados.rg}
                onChange={(e) => setDados({ ...dados, rg: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dados.dataNascimento}
                onChange={(e) => setDados({ ...dados, dataNascimento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                value={dados.telefone}
                onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@email.com"
                value={dados.email}
                onChange={(e) => setDados({ ...dados, email: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro - cidade, UF"
                value={dados.endereco}
                onChange={(e) => setDados({ ...dados, endereco: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Continuar para Aprovação
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