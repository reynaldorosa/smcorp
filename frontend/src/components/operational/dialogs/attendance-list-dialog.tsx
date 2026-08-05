'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer, Calendar, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';
import type { Class, Course, Room, Student, Instructor } from '@/types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: Class;
  course: Course;
  room: Room;
  students: Student[];
  instructor?: Instructor;
}

// Função helper para formatar data YYYY-MM-DD para DD/MM/YYYY
const formatarDataBR = (data: string): string => {
  if (!data) return '';
  const partes = data.split('-');
  if (partes.length !== 3) return data;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

export const AttendanceListDialog: React.FC<AttendanceListDialogProps> = ({
  open,
  onOpenChange,
  classItem,
  course,
  room,
  students,
  instructor
}) => {
  const [tipoImpressao, setTipoImpressao] = useState<'unico' | 'multiplas'>('unico');
  const [dataUnica, setDataUnica] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Filtrar apenas alunos ativos (não substituídos e não em fila de espera)
  const activeStudents = students.filter(
    (student) => student.status !== 'Replaced' && student.status !== 'WaitingList'
  );

  const gerarListaPresenca = () => {
    if (tipoImpressao === 'unico' && !dataUnica) {
      toast.error('Por favor, selecione uma data');
      return;
    }

    if (tipoImpressao === 'multiplas' && (!dataInicio || !dataFim)) {
      toast.error('Por favor, selecione o período');
      return;
    }

    // Validar se data fim é posterior à data início
    if (tipoImpressao === 'multiplas' && dataFim < dataInicio) {
      toast.error('A data final deve ser posterior à data inicial');
      return;
    }

    // Gerar PDF
    gerarPDFListaPresenca();
    
    toast.success('Lista de presença gerada em PDF!');
    onOpenChange(false);
  };

  const gerarPDFListaPresenca = () => {
    const datasImpressao: string[] = [];

    if (tipoImpressao === 'unico') {
      datasImpressao.push(dataUnica);
    } else {
      // Gerar array de datas entre dataInicio e dataFim
      const inicio = new Date(dataInicio + 'T00:00:00');
      const fim = new Date(dataFim + 'T00:00:00');
      
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        datasImpressao.push(`${ano}-${mes}-${dia}`);
      }
    }

    // Criar PDF
    const doc = new jsPDF();
    
    datasImpressao.forEach((data, index) => {
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
      doc.text(`Turma: ${classItem.code} - ${course.name}`, 15, 25);
      doc.text(`Sala: ${room.name}`, 15, 30);
      doc.text(
        `Período: ${formatarDataBR(classItem.startDate)} a ${formatarDataBR(classItem.endDate)}`,
        15,
        35
      );
      
      // Box cinza com informações da aula
      doc.setFillColor(243, 244, 246); // #f3f4f6
      doc.rect(10, 45, 190, 15, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Data da Aula: ${formatarDataBR(data)}`, 15, 53);
      doc.text(`Instrutor: ${instructor?.name || '_____________________'}`, 110, 53);
      
      // Tabela de alunos
      const dadosTabela = activeStudents.map((student, idx) => [
        (idx + 1).toString(),
        student.name,
        student.taxId || '',
        '' // Coluna de assinatura vazia
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      autoTable(doc as any, {
        startY: 65,
        head: [['Nº', 'Nome do Aluno', 'CPF', 'Assinatura']],
        body: dadosTabela,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38], // #dc2626
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // Nº
          1: { cellWidth: 80 }, // Nome
          2: { cellWidth: 35 }, // CPF
          3: { cellWidth: 60 } // Assinatura
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // #f9fafb
        },
        margin: { left: 10, right: 10 }
      });

      // Rodapé com total e observações
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;
      
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
    const nomeArquivo = `lista-presenca-${classItem.code}-${tipoImpressao === 'unico' ? dataUnica : `${dataInicio}-ate-${dataFim}`}.pdf`;
    doc.save(nomeArquivo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-red-600" />
            Imprimir Lista de Presença
          </DialogTitle>
          <DialogDescription>
            Configure a impressão da lista de presença para a turma <strong>{classItem.code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Turma */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-sm">
            <div><strong>Curso:</strong> {course.name}</div>
            <div><strong>Sala:</strong> {room.name}</div>
            <div><strong>Período:</strong> {formatarDataBR(classItem.startDate)} a {formatarDataBR(classItem.endDate)}</div>
            <div><strong>Alunos Ativos:</strong> {activeStudents.length}</div>
          </div>

          {/* Tipo de Impressão */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Tipo de Impressão</Label>
            <RadioGroup value={tipoImpressao} onValueChange={(value: 'unico' | 'multiplas') => setTipoImpressao(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="unico" id="unico" />
                <label htmlFor="unico" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Data Única</div>
                    <div className="text-xs text-gray-500">Uma lista para um dia específico</div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="multiplas" id="multiplas" />
                <label htmlFor="multiplas" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CalendarRange className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-medium">Múltiplas Datas</div>
                    <div className="text-xs text-gray-500">Uma lista para cada dia do período</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Seleção de Data Única */}
          {tipoImpressao === 'unico' && (
            <div>
              <Label htmlFor="dataUnica" className="text-sm font-semibold mb-2 block">
                Data da Aula
              </Label>
              <Input
                id="dataUnica"
                type="date"
                value={dataUnica}
                onChange={(e) => setDataUnica(e.target.value)}
                min={classItem.startDate}
                max={classItem.endDate}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Será gerada 1 lista de presença
              </p>
            </div>
          )}

          {/* Seleção de Múltiplas Datas */}
          {tipoImpressao === 'multiplas' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="dataInicioPeriodo" className="text-sm font-semibold mb-2 block">
                  Data Inicial
                </Label>
                <Input
                  id="dataInicioPeriodo"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  min={classItem.startDate}
                  max={classItem.endDate}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="dataFimPeriodo" className="text-sm font-semibold mb-2 block">
                  Data Final
                </Label>
                <Input
                  id="dataFimPeriodo"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  min={dataInicio || classItem.startDate}
                  max={classItem.endDate}
                  className="w-full"
                />
              </div>

              {dataInicio && dataFim && (
                <p className="text-xs text-gray-500">
                  Serão geradas {Math.ceil((new Date(dataFim + 'T00:00:00').getTime() - new Date(dataInicio + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} listas de presença
                </p>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={gerarListaPresenca}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
