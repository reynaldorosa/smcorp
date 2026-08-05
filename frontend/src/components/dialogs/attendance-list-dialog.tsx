'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer, Calendar, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';

// Legacy PT types — component uses Portuguese property names
// TODO: migrate to Class, Student, Course, Room from @/types
interface Turma {
  id: string;
  codigo: string;
  cursoId: string;
  dataInicio: string;
  dataFim: string;
  salaId: string;
}
interface Aluno {
  id: string;
  nome: string;
  taxId: string;
  substituido?: boolean;
  filaEspera?: boolean;
}
interface Curso { id: string; nome: string; }
interface Sala { id: string; nome: string; }
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AutoTableDoc {
  lastAutoTable?: { finalY?: number };
}

interface AttendanceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turma: Turma;
  curso: Curso;
  sala: Sala;
  alunos: Aluno[];
  instrutor?: { id: string; nome: string };
}

// Helper para formatar data YYYY-MM-DD para DD/MM/YYYY
const formatDateBR = (data: string): string => {
  if (!data) return '';
  const partes = data.split('-');
  if (partes.length !== 3) return data;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

export function AttendanceListDialog({
  open,
  onOpenChange,
  turma,
  curso,
  sala,
  alunos,
  instrutor,
}: AttendanceListDialogProps) {
  const [printType, setPrintType] = useState<'single' | 'multiple'>('single');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrar apenas alunos ativos (não substituídos e não em fila de espera)
  const activeStudents = alunos.filter(
    (aluno) => !aluno.substituido && !aluno.filaEspera
  );

  const generateAttendanceList = () => {
    if (printType === 'single' && !singleDate) {
      toast.error('Por favor, selecione uma data');
      return;
    }

    if (printType === 'multiple' && (!startDate || !endDate)) {
      toast.error('Por favor, selecione o período');
      return;
    }

    // Validar se data fim é posterior à data início
    if (printType === 'multiple' && endDate < startDate) {
      toast.error('A data final deve ser posterior à data inicial');
      return;
    }

    // Gerar PDF
    generatePDF();

    toast.success('Lista de presença gerada em PDF!');
    onOpenChange(false);
  };

  const generatePDF = () => {
    const printDates: string[] = [];

    if (printType === 'single') {
      printDates.push(singleDate);
    } else {
      // Gerar array de datas entre startDate e endDate
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        printDates.push(`${year}-${month}-${day}`);
      }
    }

    // Criar PDF
    const doc = new jsPDF();

    printDates.forEach((date, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Cabeçalho vermelho SMCORP
      doc.setFillColor(220, 38, 38); // #dc2626
      doc.rect(0, 0, 210, 40, 'F');

      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTA DE PRESENÇA', 105, 15, { align: 'center' });

      // Informações da Turma
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Turma: ${turma.codigo} - ${curso.nome}`, 15, 25);
      doc.text(`Sala: ${sala.nome}`, 15, 30);
      doc.text(
        `Período: ${formatDateBR(turma.dataInicio)} a ${formatDateBR(turma.dataFim)}`,
        15,
        35
      );

      // Box cinza com informações da aula
      doc.setFillColor(243, 244, 246); // #f3f4f6
      doc.rect(10, 45, 190, 15, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Data da Aula: ${formatDateBR(date)}`, 15, 53);
      doc.text(
        `Instrutor: ${instrutor?.nome || '_____________________'}`,
        110,
        53
      );

      // Tabela de alunos
      const tableData = activeStudents.map((aluno, idx) => [
        (idx + 1).toString(),
        aluno.nome,
        aluno.taxId,
        '', // Coluna de assinatura vazia
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Nº', 'Nome do Aluno', 'CPF', 'Assinatura']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38], // #dc2626
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // Nº
          1: { cellWidth: 80 }, // Nome
          2: { cellWidth: 35 }, // CPF
          3: { cellWidth: 60 }, // Assinatura
        },
        margin: { left: 10, right: 10 },
      });

      // Rodapé com total e observações
      const finalY = (doc as AutoTableDoc).lastAutoTable?.finalY || 200;

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(1);
      doc.line(10, finalY + 10, 200, finalY + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de Alunos: ${activeStudents.length}`, 15, finalY + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Observações:', 15, finalY + 28);

      doc.setDrawColor(128, 128, 128);
      doc.setLineWidth(0.3);
      doc.line(15, finalY + 35, 195, finalY + 35);
      doc.line(15, finalY + 45, 195, finalY + 45);
    });

    // Salvar PDF
    const fileName = `lista-presenca-${turma.codigo}-${printType === 'single' ? singleDate : `${startDate}-ate-${endDate}`}.pdf`;
    doc.save(fileName);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return (
      Math.ceil(
        (new Date(endDate + 'T00:00:00').getTime() -
          new Date(startDate + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-red-600" />
            Imprimir Lista de Presença
          </DialogTitle>
          <DialogDescription>
            Configure a impressão da lista de presença para a turma{' '}
            <strong>{turma.codigo}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Turma */}
          <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
            <div>
              <strong>Curso:</strong> {curso.nome}
            </div>
            <div>
              <strong>Sala:</strong> {sala.nome}
            </div>
            <div>
              <strong>Período:</strong> {formatDateBR(turma.dataInicio)} a{' '}
              {formatDateBR(turma.dataFim)}
            </div>
            <div>
              <strong>Alunos Ativos:</strong> {activeStudents.length}
            </div>
          </div>

          {/* Tipo de Impressão */}
          <div>
            <Label className="mb-3 block text-sm font-semibold">
              Tipo de Impressão
            </Label>
            <RadioGroup
              value={printType}
              onValueChange={(value: 'single' | 'multiple') =>
                setPrintType(value)
              }
            >
              <div className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="single" id="single" />
                <label
                  htmlFor="single"
                  className="flex flex-1 cursor-pointer items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Data Única</div>
                    <div className="text-xs text-gray-500">
                      Uma lista para um dia específico
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                <RadioGroupItem value="multiple" id="multiple" />
                <label
                  htmlFor="multiple"
                  className="flex flex-1 cursor-pointer items-center gap-2"
                >
                  <CalendarRange className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">Múltiplas Datas</div>
                    <div className="text-xs text-gray-500">
                      Uma lista para cada dia do período
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Data Única */}
          {printType === 'single' && (
            <div>
              <Label htmlFor="singleDate" className="mb-2 block text-sm font-semibold">
                Data da Aula
              </Label>
              <Input
                id="singleDate"
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                min={turma.dataInicio}
                max={turma.dataFim}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Será gerada 1 lista de presença
              </p>
            </div>
          )}

          {/* Seleção de Múltiplas Datas */}
          {printType === 'multiple' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="startDate" className="mb-2 block text-sm font-semibold">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={turma.dataInicio}
                  max={turma.dataFim}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="mb-2 block text-sm font-semibold">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || turma.dataInicio}
                  max={turma.dataFim}
                  className="w-full"
                />
              </div>

              {startDate && endDate && (
                <p className="text-xs text-gray-500">
                  Serão geradas {calculateDays()} listas de presença
                </p>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={generateAttendanceList}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
