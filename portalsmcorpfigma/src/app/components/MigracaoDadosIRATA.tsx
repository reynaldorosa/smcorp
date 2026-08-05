import React, { useState } from 'react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';

export const MigracaoDadosIRATA: React.FC = () => {
  const { 
    fornecedores, 
    custosAuditaveis, 
    produtosExtras,
    adicionarFornecedor,
    adicionarCustoAuditavel,
    adicionarProdutoExtra
  } = useSMCorp();

  const [executado, setExecutado] = useState(false);

  const executarMigracao = () => {
    try {
      // Verificar se o fornecedor IRATA já existe
      const fornecedorIRATA = fornecedores.find(f => f.nome === 'IRATA');
      let fornecedorId = '';

      if (!fornecedorIRATA) {
        // Adicionar fornecedor IRATA
        adicionarFornecedor({
          nome: 'IRATA',
          cnpj: '11.222.333/0001-44',
          telefone: '(11) 99999-8888',
          email: 'contato@irata.com.br'
        });
        
        // Buscar o ID do fornecedor recém-criado
        setTimeout(() => {
          const fornecedorCriado = fornecedores.find(f => f.nome === 'IRATA');
          if (fornecedorCriado) {
            fornecedorId = fornecedorCriado.id;
            adicionarCustoETaxas(fornecedorId);
          }
        }, 100);
      } else {
        fornecedorId = fornecedorIRATA.id;
        adicionarCustoETaxas(fornecedorId);
      }

    } catch (error) {
      console.error('Erro na migração IRATA:', error);
      toast.error('Erro ao executar migração IRATA');
    }
  };

  const adicionarCustoETaxas = (fornecedorId: string) => {
    // Verificar se a Taxa IRATA já existe
    const taxaIRATA = custosAuditaveis.find(c => c.nome === 'Taxa IRATA');
    let custoId = '';

    if (!taxaIRATA) {
      // Adicionar Taxa IRATA
      adicionarCustoAuditavel({ nome: 'Taxa IRATA', valor: 800, fornecedorId });
      
      // Buscar o ID do custo recém-criado
      setTimeout(() => {
        const custoCriado = custosAuditaveis.find(c => c.nome === 'Taxa IRATA');
        if (custoCriado) {
          custoId = custoCriado.id;
          adicionarProdutos(custoId);
        }
      }, 100);
    } else {
      custoId = taxaIRATA.id;
      adicionarProdutos(custoId);
    }
  };

  const adicionarProdutos = (custoId: string) => {
    // Verificar se os produtos IRATA já existem
    const irataN1PJ = produtosExtras.find(p => p.nome === 'IRATA N1 PJ');
    const irataN1PF = produtosExtras.find(p => p.nome === 'IRATA N1 PF');

    if (!irataN1PJ) {
      adicionarProdutoExtra({ tipo: 'produto', nome: 'IRATA N1 PJ', valor: 2650, custosAssociados: [custoId] });
    }

    if (!irataN1PF) {
      adicionarProdutoExtra({ tipo: 'produto', nome: 'IRATA N1 PF', valor: 2500, custosAssociados: [custoId] });
    }

    setExecutado(true);
    toast.success('Dados IRATA adicionados com sucesso!');
  };

  const verificarDados = () => {
    const fornecedorIRATA = fornecedores.find(f => f.nome === 'IRATA');
    const taxaIRATA = custosAuditaveis.find(c => c.nome === 'Taxa IRATA');
    const irataN1PJ = produtosExtras.find(p => p.nome === 'IRATA N1 PJ');
    const irataN1PF = produtosExtras.find(p => p.nome === 'IRATA N1 PF');

    return {
      fornecedor: !!fornecedorIRATA,
      custo: !!taxaIRATA,
      produtoPJ: !!irataN1PJ,
      produtoPF: !!irataN1PF,
      completo: !!fornecedorIRATA && !!taxaIRATA && !!irataN1PJ && !!irataN1PF
    };
  };

  const status = verificarDados();

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-purple-900">Adicionar Dados IRATA</CardTitle>
        </div>
        <CardDescription>
          Adiciona o Fornecedor IRATA, Taxa IRATA e Produtos IRATA N1 (PJ e PF)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status dos dados */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Fornecedor IRATA</span>
              {status.fornecedor ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Taxa IRATA (R$ 800,00)</span>
              {status.custo ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>IRATA N1 PJ (R$ 2.650,00)</span>
              {status.produtoPJ ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>IRATA N1 PF (R$ 2.500,00)</span>
              {status.produtoPF ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>

          {/* Botão de executar */}
          {!status.completo ? (
            <Button
              onClick={executarMigracao}
              disabled={executado}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {executado ? 'Migração Executada ✓' : 'Executar Migração IRATA'}
            </Button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 font-medium">
                Todos os dados IRATA já estão cadastrados!
              </p>
            </div>
          )}

          {executado && !status.completo && (
            <p className="text-xs text-purple-700">
              ⚠️ Migração executada. Recarregue a página para ver os dados atualizados.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};