'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface AddWaitingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (studentData: StudentData) => void | Promise<void>;
  className: string;
}

interface StudentData {
  name: string;
  taxId: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
}

const INITIAL_DATA: StudentData = {
  name: '',
  taxId: '',
  rg: '',
  birthDate: '',
  phone: '',
  email: '',
  address: ''
};

// ============================================
// COMPONENT
// ============================================

export function AddWaitingListDialog({
  open,
  onOpenChange,
  onAdd,
  className
}: AddWaitingListDialogProps) {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_DATA);

  const handleSubmit = async () => {
    if (!studentData.name || !studentData.taxId || !studentData.phone || !studentData.email) {
      toast.error('Preencha todos os campos obrigatórios (nome, CPF, telefone e e-mail).');
      return;
    }

    const cleanTaxId = studentData.taxId.replace(/\D/g, '');
    if (cleanTaxId.length !== 11) {
      toast.error('CPF inválido. Digite 11 dígitos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      toast.error('E-mail inválido.');
      return;
    }

    await onAdd(studentData);

    setStudentData(INITIAL_DATA);
    onOpenChange(false);
    
    toast.success(`${studentData.name} adicionado à fila de espera!`);
  };

  const formatTaxId = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
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
            Turma: <strong>{className}</strong>
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
                value={studentData.name}
                onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={studentData.taxId}
                onChange={(e) => setStudentData({ ...studentData, taxId: formatTaxId(e.target.value) })}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={studentData.rg}
                onChange={(e) => setStudentData({ ...studentData, rg: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={studentData.birthDate}
                onChange={(e) => setStudentData({ ...studentData, birthDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                value={studentData.phone}
                onChange={(e) => setStudentData({ ...studentData, phone: formatPhone(e.target.value) })}
                maxLength={15}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@email.com"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro - cidade, UF"
                value={studentData.address}
                onChange={(e) => setStudentData({ ...studentData, address: e.target.value })}
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
}
