'use client';

import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, Link, Unlink, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface CostData {
  id: string;
  code: string;
  name: string;
  value: number;
  type?: string;
  bindingType?: 'student' | 'instructor' | 'none';
}

export interface InstructorData {
  id: string;
  code: string;
  name: string;
  role: string;
  linkedCosts?: string[];
}

interface InstructorCostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  availableCosts?: CostData[];
  onLinkCost?: (costId: string) => void;
  onUnlinkCost?: (costId: string) => void;
}

// ============================================
// Component
// ============================================

export function InstructorCostsDialog({
  open,
  onOpenChange,
  instructor,
  availableCosts = [],
  onLinkCost,
  onUnlinkCost,
}: InstructorCostsDialogProps) {
  const [selectedCosts, setSelectedCosts] = useState<Set<string>>(new Set());
  const [linkingMode, setLinkingMode] = useState(false);
  const [costToUnlink, setCostToUnlink] = useState<string | null>(null);

  // Filter costs
  const linkedCosts = availableCosts.filter(
    (cost) => instructor?.linkedCosts?.includes(cost.id)
  );

  const unlinkedCosts = availableCosts.filter(
    (cost) =>
      !instructor?.linkedCosts?.includes(cost.id) &&
      (cost.bindingType === 'instructor' || !cost.bindingType)
  );

  const handleToggleCost = (costId: string) => {
    const newSelected = new Set(selectedCosts);
    if (newSelected.has(costId)) {
      newSelected.delete(costId);
    } else {
      newSelected.add(costId);
    }
    setSelectedCosts(newSelected);
  };

  const handleLinkSelected = () => {
    if (selectedCosts.size === 0) {
      toast.error('Selecione pelo menos um custo para vincular');
      return;
    }

    selectedCosts.forEach((costId) => {
      if (onLinkCost) {
        onLinkCost(costId);
      }
    });

    toast.success(
      `${selectedCosts.size} ${
        selectedCosts.size === 1 ? 'custo vinculado' : 'custos vinculados'
      } com sucesso!`
    );
    setSelectedCosts(new Set());
    setLinkingMode(false);
  };

  const handleUnlink = () => {
    if (costToUnlink && onUnlinkCost) {
      onUnlinkCost(costToUnlink);
      toast.success('Custo desvinculado com sucesso!');
      setCostToUnlink(null);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalLinkedValue = (): number => {
    return linkedCosts.reduce((sum, cost) => sum + cost.value, 0);
  };

  if (!instructor) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
              Gestão de Custos - {instructor.name}
            </DialogTitle>
            <DialogDescription>
              Vincule custos auditáveis ao instrutor para facilitar o rastreamento financeiro
            </DialogDescription>
          </DialogHeader>

          {/* Instructor Info */}
          <Card className="border-l-4 border-l-purple-600 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-purple-600 text-xs">{instructor.code}</Badge>
                    <span className="font-semibold text-gray-900">{instructor.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{instructor.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {linkedCosts.length}
                  </div>
                  <div className="text-xs text-gray-600">
                    {linkedCosts.length === 1 ? 'custo vinculado' : 'custos vinculados'}
                  </div>
                  {linkedCosts.length > 0 && (
                    <div className="text-sm font-medium text-green-600 mt-1">
                      Total: {formatCurrency(getTotalLinkedValue())}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Costs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link className="w-5 h-5 text-green-600" />
                Custos Vinculados
              </h3>
            </div>

            {linkedCosts.length === 0 ? (
              <Card className="bg-gray-50 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <Unlink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Nenhum custo vinculado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {linkedCosts.map((cost) => (
                  <Card
                    key={cost.id}
                    className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700"
                            >
                              {cost.code}
                            </Badge>
                            <span className="font-semibold text-sm text-gray-900">
                              {cost.name}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(cost.value)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setCostToUnlink(cost.id)}
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

          {/* Available Costs to Link */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Custos Disponíveis
              </h3>
              {!linkingMode && unlinkedCosts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkingMode(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Vincular Custos
                </Button>
              )}
            </div>

            {unlinkedCosts.length === 0 ? (
              <Card className="bg-gray-50 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Todos os custos disponíveis já estão vinculados
                  </p>
                </CardContent>
              </Card>
            ) : linkingMode ? (
              <div className="space-y-2">
                <div className="max-h-64 overflow-y-auto space-y-2 p-2 border rounded-lg bg-blue-50/50">
                  {unlinkedCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCosts.has(cost.id)
                          ? 'bg-blue-100 border-2 border-blue-400'
                          : 'bg-white border border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleToggleCost(cost.id)}
                    >
                      <Checkbox
                        checked={selectedCosts.has(cost.id)}
                        onCheckedChange={() => handleToggleCost(cost.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {cost.code}
                          </Badge>
                          <span className="font-medium text-sm">{cost.name}</span>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          {formatCurrency(cost.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLinkingMode(false);
                      setSelectedCosts(new Set());
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLinkSelected}
                    disabled={selectedCosts.size === 0}
                    className="gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Vincular {selectedCosts.size > 0 ? `(${selectedCosts.size})` : ''}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {unlinkedCosts.slice(0, 4).map((cost) => (
                  <Card key={cost.id} className="bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {cost.code}
                        </Badge>
                        <span className="text-sm truncate">{cost.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatCurrency(cost.value)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {unlinkedCosts.length > 4 && (
                  <div className="col-span-2 text-center text-sm text-gray-500">
                    + {unlinkedCosts.length - 4} custos disponíveis
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600">💡</div>
                <p className="text-xs text-blue-800">
                  <strong>Dica:</strong> Custos vinculados ao instrutor serão automaticamente
                  considerados no cálculo financeiro quando o instrutor for escalado para uma
                  turma ou prova.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Unlink Dialog */}
      <AlertDialog open={!!costToUnlink} onOpenChange={() => setCostToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Custo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular este custo do instrutor? Esta ação pode ser
              revertida vinculando o custo novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink} className="bg-red-600 hover:bg-red-700">
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
