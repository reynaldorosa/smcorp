'use client';

import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle, AlertCircle, Users, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { ExtraProduct } from '@/types';

// ============================================
// Types
// ============================================

export interface StudentToApprove {
  name: string;
  taxId: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  totalValue: number;
  extraProductIds?: string[];
  [key: string]: unknown;
}

interface ApproveImportedStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentToApprove[];
  className: string;
  availableExtraProducts?: ExtraProduct[];
  onApproveStudent: (student: StudentToApprove) => void | Promise<void>;
  onFinishApproval: (approved: number, rejected: number) => void;
}

// ============================================
// Component
// ============================================

export const ApproveImportedStudentsDialog: React.FC<ApproveImportedStudentsDialogProps> = ({
  open,
  onOpenChange,
  students,
  className,
  availableExtraProducts = [],
  onApproveStudent,
  onFinishApproval,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [approvalBatchId] = useState(() => `BATCH-${crypto.randomUUID()}`);

  const currentStudent = students[currentIndex];
  const totalStudents = students.length;
  const progress = currentIndex + 1;

  const handleApprove = async () => {
    if (!currentStudent) return;

    const alreadyIncluded = currentStudent.extraProductIds || [];
    const allSelectedProducts = [...alreadyIncluded, ...selectedProducts];

    const calculatedTotal = allSelectedProducts.reduce((total, productId) => {
      const product = availableExtraProducts.find((p) => p.id === productId);
      return total + (product?.price || 0);
    }, 0);

    const studentWithProducts: StudentToApprove = {
      ...currentStudent,
      extraProductIds: allSelectedProducts,
      totalValue: calculatedTotal,
      approvalBatchId,
    };

    try {
      await onApproveStudent(studentWithProducts);
      setApprovedCount((prev) => prev + 1);
      setSelectedProducts([]);

      if (currentIndex < totalStudents - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishProcess(approvedCount + 1, rejectedCount);
      }
    } catch {
      toast.error('Falha ao aprovar aluno. Corrija o problema e tente novamente.');
    }
  };

  const handleReject = () => {
    setRejectedCount((prev) => prev + 1);
    setSelectedProducts([]);

    if (currentIndex < totalStudents - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishProcess(approvedCount, rejectedCount + 1);
    }
  };

  const finishProcess = (totalApproved: number, totalRejected: number) => {
    onFinishApproval(totalApproved, totalRejected);
    setCurrentIndex(0);
    setApprovedCount(0);
    setRejectedCount(0);
    setSelectedProducts([]);
    onOpenChange(false);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const alreadyIncluded = currentStudent?.extraProductIds || [];
  const allSelectedProducts = [...alreadyIncluded, ...selectedProducts];

  const calculatedTotal = allSelectedProducts.reduce((total, productId) => {
    const product = availableExtraProducts.find((p) => p.id === productId);
    return total + (product?.price || 0);
  }, 0);

  const handleCancel = () => {
    if (window.confirm(`Você aprovou ${approvedCount} e rejeitou ${rejectedCount} alunos até agora. Deseja realmente cancelar o processo?`)) {
      finishProcess(approvedCount, rejectedCount);
    }
  };

  if (!currentStudent) return null;

  const requiredProducts = availableExtraProducts.filter((p) => p.type === 'product');
  const optionalProducts = availableExtraProducts.filter((p) => p.type === 'extra');

  const atLeastOneRequiredSelected =
    requiredProducts.length === 0 ||
    requiredProducts.some(
      (p) => selectedProducts.includes(p.id) || alreadyIncluded.includes(p.id)
    );

  const canApprove = atLeastOneRequiredSelected;

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Aprovar Alunos Importados
            </span>
            <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
              {progress} de {totalStudents}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progresso da Aprovação</span>
              <span className="font-semibold">{totalStudents > 0 ? Math.round((progress / totalStudents) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${totalStudents > 0 ? (progress / totalStudents) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {approvedCount} aprovados
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> {rejectedCount} rejeitados
              </span>
            </div>
          </div>

          {/* Class and Value Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 mb-2"><strong>Turma:</strong> {className}</p>
            <div className="flex items-center justify-end text-sm">
              <div className="text-blue-900 font-bold">
                <strong>Valor Total:</strong> <span className="text-green-600 text-lg ml-1">R$ {Number(calculatedTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Current Student Card */}
          <Card className="border-2 border-blue-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {currentStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{currentStudent.name}</h3>
                  <p className="text-sm text-gray-600">CPF: {currentStudent.taxId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">RG</label>
                  <p className="text-sm text-gray-900">{currentStudent.rg || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data de Nascimento</label>
                  <p className="text-sm text-gray-900">{currentStudent.birthDate || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Telefone</label>
                  <p className="text-sm text-gray-900">{currentStudent.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">E-mail</label>
                  <p className="text-sm text-gray-900 truncate" title={currentStudent.email}>{currentStudent.email}</p>
                </div>
                {currentStudent.address && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Endereço</label>
                    <p className="text-sm text-gray-900">{currentStudent.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Required Products */}
          {requiredProducts.length > 0 && (
            <Card className="border-2 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Produtos Obrigatórios</h4>
                    <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">
                      {requiredProducts.filter((p) => selectedProducts.includes(p.id)).length}/{requiredProducts.length} selecionados
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-red-700 mb-3 font-semibold">
                  ⚠️ Selecione PELO MENOS 1 produto obrigatório para este aluno.
                </p>
                <div className="space-y-2">
                  {requiredProducts.map((product) => {
                    const isAlreadyIncluded = alreadyIncluded.includes(product.id);
                    const isSelected = selectedProducts.includes(product.id) || isAlreadyIncluded;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          isAlreadyIncluded ? 'border-green-400 bg-green-50 cursor-not-allowed opacity-75'
                            : isSelected ? 'border-red-400 bg-red-50 cursor-pointer'
                            : 'border-red-200 bg-white hover:border-red-300 cursor-pointer'
                        }`}
                        onClick={() => !isAlreadyIncluded && toggleProduct(product.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox checked={isSelected} disabled={isAlreadyIncluded} onCheckedChange={() => !isAlreadyIncluded && toggleProduct(product.id)} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className={`text-sm font-medium ${!isAlreadyIncluded ? 'cursor-pointer' : 'cursor-not-allowed'}`}>{product.name}</Label>
                              {isAlreadyIncluded ? (
                                <Badge className="bg-green-600 text-white text-xs">✓ JÁ INCLUÍDO</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">OBRIGATÓRIO</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-600">+ R$ {Number(product.price || 0).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optional Products */}
          {optionalProducts.length > 0 && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Produtos Extras (Opcionais)</h4>
                  <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                    {optionalProducts.filter((p) => selectedProducts.includes(p.id)).length} selecionados
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mb-3">ℹ️ Estes produtos são opcionais. Selecione conforme necessidade do aluno.</p>
                <div className="space-y-2">
                  {optionalProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedProducts.includes(product.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox checked={selectedProducts.includes(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium cursor-pointer">{product.name}</Label>
                            <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">EXTRA</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">+ R$ {Number(product.price || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Revise os dados do aluno</p>
              <p className="text-xs mt-1">
                Clique em <strong>&quot;Aprovar e Enviar Link&quot;</strong> para matricular este aluno e enviar o link de
                acesso, ou em <strong>&quot;Rejeitar&quot;</strong> para pular este aluno.
              </p>
            </div>
          </div>

          {/* Missing Required Product Alert */}
          {!canApprove && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">⚠️ Nenhum produto obrigatório selecionado!</p>
                <p className="text-xs mt-1">
                  Você deve selecionar <strong>PELO MENOS 1 dos {requiredProducts.length} produtos obrigatórios</strong> antes de aprovar este aluno.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleReject} variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-50" size="lg">
              <X className="w-5 h-5 mr-2" /> Rejeitar
            </Button>
            <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700" size="lg" disabled={!canApprove}>
              <CheckCircle className="w-5 h-5 mr-2" /> Aprovar e Enviar Link
              {currentIndex < totalStudents - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
            </Button>
          </div>

          {/* Cancel Process */}
          <div className="text-center pt-2 border-t">
            <Button onClick={handleCancel} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              Cancelar Processo de Aprovação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
