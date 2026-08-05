'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Wallet, CreditCard, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ============================================
// Types
// ============================================

export interface CompanyFinancialData {
  name: string;
  tradeName: string;
  companyTaxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  bank: string;
  bankBranch: string;
  bankAccount: string;
  pixKey: string;
  physicalCash: number;
  cashNotes: string;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentData: CompanyFinancialData;
  onSave: (data: CompanyFinancialData) => void;
}

// ============================================
// Component
// ============================================

export const CompanyDialog: React.FC<CompanyDialogProps> = ({
  open,
  onOpenChange,
  currentData,
  onSave,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<CompanyFinancialData>(currentData);

  useEffect(() => {
    setEditedData(currentData);
    if (open) {
      setEditMode(false);
    }
  }, [open, currentData]);

  const handleSave = () => {
    onSave(editedData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedData(currentData);
    setEditMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              Dados da Empresa
            </div>
            {!editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Edite as informações institucionais e financeiras da empresa'
              : 'Informações institucionais, identidade visual e dados financeiros da empresa'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-xs">Nome Fantasia *</Label>
                <Input id="name" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
              </div>
              <div>
                <Label htmlFor="tradeName" className="text-xs">Razão Social *</Label>
                <Input id="tradeName" value={editedData.tradeName} onChange={(e) => setEditedData({ ...editedData, tradeName: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
              </div>
            </div>
            <div>
              <Label htmlFor="companyTaxId" className="text-xs">CNPJ *</Label>
              <Input id="companyTaxId" value={editedData.companyTaxId} onChange={(e) => setEditedData({ ...editedData, companyTaxId: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Endereço</h3>
            <div>
              <Label htmlFor="address" className="text-xs">Endereço Completo *</Label>
              <Input id="address" value={editedData.address} onChange={(e) => setEditedData({ ...editedData, address: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Informações de Contato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-xs">Telefone *</Label>
                <Input id="phone" value={editedData.phone} onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">E-mail *</Label>
                <Input id="email" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
              </div>
            </div>
            <div>
              <Label htmlFor="website" className="text-xs">Site</Label>
              <Input id="website" value={editedData.website} onChange={(e) => setEditedData({ ...editedData, website: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
            </div>
          </div>

          {/* Visual Identity */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b pb-2">Identidade Visual</h3>
            <div>
              <Label htmlFor="primaryColor" className="text-xs">Cor Principal *</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: editedData.primaryColor }} />
                <div className="flex-1">
                  <Input id="primaryColor" value={editedData.primaryColor} onChange={(e) => setEditedData({ ...editedData, primaryColor: e.target.value })} disabled={!editMode} className={`${!editMode ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'} dark:text-white`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal da cor principal da plataforma</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Data - Bank Account */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b border-red-200 dark:border-red-900 pb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-600" />
              Dados Financeiros - Caixa
            </h3>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-sm text-green-800 dark:text-green-300">Conta Bancária</h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="bank" className="text-xs text-green-700 dark:text-green-300">Banco</Label>
                  <Input id="bank" value={editedData.bank || ''} onChange={(e) => setEditedData({ ...editedData, bank: e.target.value })} placeholder="Nome do banco" disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`} />
                </div>
                <div>
                  <Label htmlFor="bankBranch" className="text-xs text-green-700 dark:text-green-300">Agência</Label>
                  <Input id="bankBranch" value={editedData.bankBranch || ''} onChange={(e) => setEditedData({ ...editedData, bankBranch: e.target.value })} placeholder="0000" disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`} />
                </div>
                <div>
                  <Label htmlFor="bankAccount" className="text-xs text-green-700 dark:text-green-300">Conta Corrente</Label>
                  <Input id="bankAccount" value={editedData.bankAccount || ''} onChange={(e) => setEditedData({ ...editedData, bankAccount: e.target.value })} placeholder="000000-0" disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`} />
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="pixKey" className="text-xs text-green-700 dark:text-green-300">Chave PIX</Label>
                <Input id="pixKey" value={editedData.pixKey || ''} onChange={(e) => setEditedData({ ...editedData, pixKey: e.target.value })} placeholder="email@exemplo.com ou CPF/CNPJ" disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`} />
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Chave PIX cadastrada para recebimentos</p>
              </div>
            </div>

            {/* Physical Cash */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">Caixa Físico</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="physicalCash" className="text-xs text-amber-700 dark:text-amber-300">Valor em Caixa</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 font-semibold">R$</span>
                    <Input id="physicalCash" type="number" step="0.01" value={editedData.physicalCash || 0} onChange={(e) => setEditedData({ ...editedData, physicalCash: parseFloat(e.target.value) || 0 })} disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-amber-300 dark:border-amber-600 text-sm pl-10 font-semibold text-amber-800 dark:text-amber-200`} />
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Dinheiro físico disponível</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-white/70 dark:bg-gray-800/70 border border-amber-300 dark:border-amber-600 rounded-lg p-3 w-full">
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Status do Caixa</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${(editedData.physicalCash || 0) > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        {(editedData.physicalCash || 0) > 0 ? 'Disponível' : 'Vazio'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="cashNotes" className="text-xs text-amber-700 dark:text-amber-300">Observações</Label>
                <Textarea id="cashNotes" value={editedData.cashNotes || ''} onChange={(e) => setEditedData({ ...editedData, cashNotes: e.target.value })} placeholder="Descreva a finalidade e regras de uso do caixa físico..." disabled={!editMode} className={`${!editMode ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-amber-300 dark:border-amber-600 text-sm resize-none`} rows={2} />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Finalidade e regras de uso do caixa físico</p>
              </div>
            </div>
          </div>

          {/* Info */}
          {!editMode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">i</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">Dados Editáveis</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Clique no botão &quot;Editar&quot; no topo para modificar as informações da empresa.
                    Os dados são salvos automaticamente no navegador e permanecerão disponíveis entre sessões.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
