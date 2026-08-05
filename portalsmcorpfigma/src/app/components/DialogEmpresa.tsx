import React, { useState, useEffect } from 'react';
import { Building2, Wallet, CreditCard, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { DadosInstitucionais, useSMCorp } from '@/app/contexts/SMCorpContext';

interface DialogEmpresaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dadosAtuais: DadosInstitucionais;
}

export const DialogEmpresa: React.FC<DialogEmpresaProps> = ({
  open,
  onOpenChange,
  dadosAtuais
}) => {
  const { atualizarDadosInstitucionais } = useSMCorp();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [dadosEditados, setDadosEditados] = useState<DadosInstitucionais>(dadosAtuais);

  // Sincronizar com dados atuais quando o dialog abrir ou dados mudarem
  useEffect(() => {
    setDadosEditados(dadosAtuais);
    if (open) {
      setModoEdicao(false);
    }
  }, [open, dadosAtuais]);

  const handleSalvar = () => {
    atualizarDadosInstitucionais(dadosEditados);
    setModoEdicao(false);
  };

  const handleCancelar = () => {
    setDadosEditados(dadosAtuais);
    setModoEdicao(false);
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
            {!modoEdicao && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModoEdicao(true)}
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {modoEdicao 
              ? 'Edite as informações institucionais e financeiras da empresa'
              : 'Informações institucionais, identidade visual e dados financeiros da empresa'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-xs">Nome Fantasia *</Label>
                <Input
                  id="nome"
                  value={dadosEditados.nome}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
                />
              </div>

              <div>
                <Label htmlFor="razaoSocial" className="text-xs">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={dadosEditados.razaoSocial}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, razaoSocial: e.target.value })}
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cnpj" className="text-xs">CNPJ *</Label>
              <Input
                id="cnpj"
                value={dadosEditados.cnpj}
                onChange={(e) => setDadosEditados({ ...dadosEditados, cnpj: e.target.value })}
                disabled={!modoEdicao}
                className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Endereço</h3>
            
            <div>
              <Label htmlFor="endereco" className="text-xs">Endereço Completo *</Label>
              <Input
                id="endereco"
                value={dadosEditados.endereco}
                onChange={(e) => setDadosEditados({ ...dadosEditados, endereco: e.target.value })}
                disabled={!modoEdicao}
                className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
              />
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Informações de Contato</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone" className="text-xs">Telefone *</Label>
                <Input
                  id="telefone"
                  value={dadosEditados.telefone}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, telefone: e.target.value })}
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs">E-mail *</Label>
                <Input
                  id="email"
                  value={dadosEditados.email}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, email: e.target.value })}
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="site" className="text-xs">Site</Label>
              <Input
                id="site"
                value={dadosEditados.site}
                onChange={(e) => setDadosEditados({ ...dadosEditados, site: e.target.value })}
                disabled={!modoEdicao}
                className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} dark:text-white`}
              />
            </div>
          </div>

          {/* Identidade Visual */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b pb-2">Identidade Visual</h3>
            
            <div>
              <Label htmlFor="cor" className="text-xs">Cor Principal *</Label>
              <div className="flex items-center gap-3 mt-2">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: dadosEditados.cor }}
                ></div>
                <div className="flex-1">
                  <Input
                    id="cor"
                    value={dadosEditados.cor}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, cor: e.target.value })}
                    disabled={!modoEdicao}
                    className={`${!modoEdicao ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'} dark:text-white`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal da cor principal da plataforma</p>
                </div>
              </div>
            </div>
          </div>

          {/* 💰 Dados Financeiros - Caixa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white border-b border-red-200 dark:border-red-900 pb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-600" />
              Dados Financeiros - Caixa
            </h3>
            
            {/* Dados Bancários */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-sm text-green-800 dark:text-green-300">Conta Bancária</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="banco" className="text-xs text-green-700 dark:text-green-300">Banco</Label>
                  <Input
                    id="banco"
                    value={dadosEditados.banco || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, banco: e.target.value })}
                    placeholder="Nome do banco"
                    disabled={!modoEdicao}
                    className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="agencia" className="text-xs text-green-700 dark:text-green-300">Agência</Label>
                  <Input
                    id="agencia"
                    value={dadosEditados.agencia || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, agencia: e.target.value })}
                    placeholder="0000"
                    disabled={!modoEdicao}
                    className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contaCorrente" className="text-xs text-green-700 dark:text-green-300">Conta Corrente</Label>
                  <Input
                    id="contaCorrente"
                    value={dadosEditados.contaCorrente || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, contaCorrente: e.target.value })}
                    placeholder="000000-0"
                    disabled={!modoEdicao}
                    className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`}
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="chavePix" className="text-xs text-green-700 dark:text-green-300">Chave PIX</Label>
                <Input
                  id="chavePix"
                  value={dadosEditados.chavePix || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, chavePix: e.target.value })}
                  placeholder="email@exemplo.com ou CPF/CNPJ"
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-green-300 dark:border-green-600 text-sm`}
                />
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Chave PIX cadastrada para recebimentos</p>
              </div>
            </div>

            {/* Caixa Físico */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">Caixa Físico</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="caixaFisico" className="text-xs text-amber-700 dark:text-amber-300">Valor em Caixa</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 font-semibold">R$</span>
                    <Input
                      id="caixaFisico"
                      type="number"
                      step="0.01"
                      value={dadosEditados.caixaFisico || 0}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, caixaFisico: parseFloat(e.target.value) || 0 })}
                      disabled={!modoEdicao}
                      className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-amber-300 dark:border-amber-600 text-sm pl-10 font-semibold text-amber-800 dark:text-amber-200`}
                    />
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Dinheiro físico disponível</p>
                </div>

                <div className="flex items-center">
                  <div className="bg-white/70 dark:bg-gray-800/70 border border-amber-300 dark:border-amber-600 rounded-lg p-3 w-full">
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Status do Caixa</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${(dadosEditados.caixaFisico || 0) > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        {(dadosEditados.caixaFisico || 0) > 0 ? 'Disponível' : 'Vazio'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="observacoesCaixa" className="text-xs text-amber-700 dark:text-amber-300">Observações</Label>
                <Textarea
                  id="observacoesCaixa"
                  value={dadosEditados.observacoesCaixa || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, observacoesCaixa: e.target.value })}
                  placeholder="Descreva a finalidade e regras de uso do caixa físico..."
                  disabled={!modoEdicao}
                  className={`${!modoEdicao ? 'bg-white/50' : 'bg-white'} dark:bg-gray-800/50 border-amber-300 dark:border-amber-600 text-sm resize-none`}
                  rows={2}
                />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Finalidade e regras de uso do caixa físico</p>
              </div>
            </div>
          </div>

          {/* Informativo */}
          {!modoEdicao && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  i
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">Dados Editáveis</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Clique no botão "Editar" no topo para modificar as informações da empresa. 
                    Os dados são salvos automaticamente no navegador e permanecerão disponíveis entre sessões.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
          {modoEdicao ? (
            <>
              <Button variant="outline" onClick={handleCancelar}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSalvar}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
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