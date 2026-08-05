'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  Truck,
  DollarSign,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settings.store';
import { useCostsStore } from '@/stores/costs.store';

// ============================================
// CONSTANTS
// ============================================

const IRATA_SUPPLIER_NAME = 'IRATA' as const;
const IRATA_SUPPLIER_CATEGORY = 'Certifier' as const;

const IRATA_COST_NAME = 'IRATA Fee' as const;
const IRATA_COST_VALUE = 800 as const;

const IRATA_PRODUCTS = [
  {
    name: 'IRATA N1 PJ',
    type: 'product' as const,
    price: 2650,
    description: 'IRATA Level 1 - PJ (Company)',
  },
  {
    name: 'IRATA N1 PF',
    type: 'product' as const,
    price: 2500,
    description: 'IRATA Level 1 - PF (Individual)',
  },
] as const;

// ============================================
// TYPES
// ============================================

interface MigrationStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'completed' | 'error';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function IrataDataMigration() {
  const { suppliers, extraProducts, addSupplier, addExtraProduct } = useSettingsStore();
  const { auditableCosts, addAuditableCost } = useCostsStore();

  const [isMigrating, setIsMigrating] = useState(false);

  // Check existing data
  const existingSupplier = useMemo(
    () => suppliers.find((s) => s.name.toUpperCase() === IRATA_SUPPLIER_NAME),
    [suppliers]
  );

  const existingCost = useMemo(
    () => auditableCosts.find((c) => c.name === IRATA_COST_NAME),
    [auditableCosts]
  );

  const existingProducts = useMemo(
    () =>
      IRATA_PRODUCTS.map((p) => ({
        ...p,
        exists: extraProducts.some((ep) => ep.name === p.name),
      })),
    [extraProducts]
  );

  const allProductsExist = existingProducts.every((p) => p.exists);

  // Build step statuses
  const steps: MigrationStep[] = useMemo(
    () => [
      {
        id: 'supplier',
        label: 'Fornecedor IRATA',
        description: existingSupplier
          ? `Encontrado: ${existingSupplier.name} (${existingSupplier.id})`
          : 'Será criado automaticamente',
        icon: Truck,
        status: existingSupplier ? 'completed' : 'pending',
      },
      {
        id: 'cost',
        label: `Custo Auditável — ${IRATA_COST_NAME}`,
        description: existingCost
          ? `Encontrado: R$ ${existingCost.value.toLocaleString('pt-BR')}`
          : `Será criado: R$ ${IRATA_COST_VALUE.toLocaleString('pt-BR')}`,
        icon: DollarSign,
        status: existingCost ? 'completed' : 'pending',
      },
      {
        id: 'products',
        label: 'Produtos IRATA',
        description: allProductsExist
          ? 'Todos os produtos já existem'
          : `${existingProducts.filter((p) => p.exists).length}/${IRATA_PRODUCTS.length} produtos encontrados`,
        icon: Package,
        status: allProductsExist ? 'completed' : 'pending',
      },
    ],
    [existingSupplier, existingCost, existingProducts, allProductsExist]
  );

  const isFullyMigrated = steps.every((s) => s.status === 'completed');

  // Migration handler
  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);

    try {
      let supplierId = existingSupplier?.id;

      // Step 1: Create supplier if missing
      if (!existingSupplier) {
        const newSupplier = {
          id: `supplier-irata-${Date.now()}`,
          name: IRATA_SUPPLIER_NAME,
          category: IRATA_SUPPLIER_CATEGORY,
          active: true,
        };
        addSupplier(newSupplier);
        supplierId = newSupplier.id;
      }

      // Step 2: Create auditable cost if missing
      let costId = existingCost?.id;
      if (!existingCost) {
        const createdCost = addAuditableCost({
          name: IRATA_COST_NAME,
          value: IRATA_COST_VALUE,
          supplierId,
          active: true,
        });
        costId = createdCost.id;
      }

      // Step 3: Create missing products
      for (const product of existingProducts) {
        if (!product.exists) {
          addExtraProduct({
            id: `product-irata-${crypto.randomUUID()}`,
            name: product.name,
            type: product.type,
            price: product.price,
            description: product.description,
            associatedCosts: costId ? [costId] : [],
            active: true,
          });
        }
      }

      toast.success('Migração IRATA concluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao executar migração IRATA');
      console.error('[IrataDataMigration] Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  }, [
    existingSupplier,
    existingCost,
    existingProducts,
    addSupplier,
    addExtraProduct,
    addAuditableCost,
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Migração de Dados IRATA
            </CardTitle>
            <CardDescription>
              Cria automaticamente fornecedor, custo auditável e produtos IRATA
            </CardDescription>
          </div>
          {isFullyMigrated && (
            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Migrado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-green-900' : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                </div>
                {isCompleted ? (
                  <Badge variant="outline" className="bg-green-100 border-green-300 text-green-700 shrink-0">
                    OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 border-amber-300 text-amber-700 shrink-0">
                    Pendente
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        {!isFullyMigrated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Informação</p>
                <p className="text-xs text-blue-700 mt-1">
                  A migração criará os dados padrão IRATA no sistema. Dados existentes não serão alterados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleMigrate}
          disabled={isMigrating || isFullyMigrated}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isMigrating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Migrando...
            </>
          ) : isFullyMigrated ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Migração Completa
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Executar Migração IRATA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
