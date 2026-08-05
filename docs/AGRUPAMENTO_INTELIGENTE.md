# 📦 Agrupamento Inteligente de Lançamentos Recorrentes - Módulo 08

## 🎯 Objetivo

O sistema de **Agrupamento Inteligente** consolida automaticamente múltiplos lançamentos financeiros do mesmo aluno/custo/fornecedor em cards visuais únicos, facilitando a visualização e gestão de custos recorrentes.

## 🔄 Como Funciona

### Critérios de Agrupamento

Os lançamentos são agrupados quando compartilham:

1. **Mesmo Aluno** (`alunoId`)
2. **Mesmo Custo Auditável** (`custoAuditavelId`)
3. **Mesmo Fornecedor** (`fornecedorId`)
4. **Mesma Data de Vencimento** (`dataVencimento`)

### Chave de Agrupamento

```typescript
const chaveAgrupamento = `${alunoId}_${custoAuditavelId}_${fornecedorId}_${dataVencimento}`;
```

## 💡 Exemplo Prático

### Antes do Agrupamento (5 lançamentos separados)

```
D0001 - Alimentação - João Silva (ALU001) - R$ 25,00
D0002 - Alimentação - João Silva (ALU001) - R$ 25,00
D0003 - Alimentação - João Silva (ALU001) - R$ 25,00
D0004 - Alimentação - João Silva (ALU001) - R$ 25,00
D0005 - Alimentação - João Silva (ALU001) - R$ 25,00
```

### Depois do Agrupamento (1 card consolidado)

```
📦 D0001→D0005 - Alimentação - ALU001 João Silva | Fornecedor: Cantina XYZ
[5 lançamentos consolidados]
💰 Valor Total: R$ 125,00
📊 Valor Unitário: R$ 25,00
```

## 🎨 Componentes Implementados

### 1. **CardLancamentoAgrupado.tsx**

Componente visual especializado para exibir lançamentos consolidados com:

- ✅ Header com código consolidado (`D0001→D0005`)
- ✅ Badge indicando quantidade de lançamentos
- ✅ Informações consolidadas (valor total, unitário, vencimento)
- ✅ Dados do fornecedor, turma e aluno
- ✅ Fórmula de cálculo visual
- ✅ Detalhamento expandível com todos os lançamentos individuais
- ✅ Botões de ação (Ver detalhes, Baixar)

### 2. **Lógica de Agrupamento no Modulo08.tsx**

```typescript
// Mapeamento inteligente
const gruposInteligentes = new Map<string, LancamentoFinanceiro[]>();

lancamentosGerados.forEach(lancamento => {
  if (lancamento.tipo !== 'pagar') return;
  
  const chaveAgrupamento = `${lancamento.alunoId}_${lancamento.custoAuditavelId}_${lancamento.fornecedorId}_${lancamento.dataVencimento}`;
  
  if (!gruposInteligentes.has(chaveAgrupamento)) {
    gruposInteligentes.set(chaveAgrupamento, []);
  }
  gruposInteligentes.get(chaveAgrupamento)!.push(lancamento);
});

// Consolidação
gruposInteligentes.forEach((lancamentosGrupo, chave) => {
  if (lancamentosGrupo.length > 1) {
    // Criar lançamento consolidado
    const consolidado = {
      ...primeiro,
      codigo: `${codigoInicio}→${codigoFim}`,
      valor: valorTotal,
      agrupado: true,
      detalhamento: [...],
      descricao: descricaoConsolidada
    };
  }
});
```

## 📊 Interface de Dados

### LancamentoFinanceiro

```typescript
interface LancamentoFinanceiro {
  id: string;
  codigo: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'pendente' | 'vencido' | 'pago' | 'cancelado';
  
  // Campos para agrupamento
  custoAuditavelId?: string;
  fornecedorId?: string;
  alunoId?: string;
  
  // 🆕 Agrupamento inteligente
  agrupado?: boolean;
  detalhamento?: Array<{
    codigo: string;
    data: string;
    valor: number;
    descricao: string;
    observacoes?: string;
  }>;
}
```

## 🔍 Log de Depuração

O sistema gera logs detalhados no console:

```
🔄 [MÓDULO 08] Iniciando agrupamento inteligente de lançamentos recorrentes...
🎯 [AGRUPAMENTO INTELIGENTE] Total de grupos criados: 45
📦 [AGRUPAMENTO INTELIGENTE] Grupo com 5 lançamentos (chave: aluno123_custo456_fornecedor789_2026-01-30)
✅ [AGRUPAMENTO INTELIGENTE] Consolidado criado: {
  codigo: "D0001→D0005",
  aluno: "ALU001",
  custo: "Alimentação",
  fornecedor: "Cantina XYZ",
  valorTotal: "125.00",
  quantidadeLancamentos: 5
}
🎯 [AGRUPAMENTO INTELIGENTE] Total original: 150 | Consolidados: 25 | Final: 125
```

## 🎯 Vantagens do Sistema

1. **Visualização Simplificada**: Reduz clutter visual consolidando lançamentos relacionados
2. **Rastreabilidade Completa**: Mantém histórico detalhado de cada lançamento individual
3. **Cálculo Transparente**: Exibe fórmula de cálculo (R$ 25,00 × 5 lançamentos = R$ 125,00)
4. **Flexibilidade**: Permite expandir para ver detalhes individuais quando necessário
5. **Consistência de Dados**: Agrupa apenas lançamentos com critérios idênticos

## 🔧 Configuração

O agrupamento é **automático** e não requer configuração adicional. Ele:

- ✅ É aplicado durante a inicialização do Módulo 08
- ✅ Processa apenas lançamentos do tipo "pagar"
- ✅ Mantém lançamentos individuais quando não há correspondência
- ✅ Preserva todos os dados originais no campo `detalhamento`

## 📈 Performance

- **Eficiência**: Utiliza `Map` para agrupamento O(n)
- **Memória**: Lançamentos originais são removidos após consolidação
- **Renderização**: Componente otimizado com estado local para expansão

## 🎨 Identidade Visual

O card consolidado mantém a identidade visual da plataforma:

- 🔴 Vermelho: Cor principal (borda, valores)
- ⬜ Branco: Fundo dos cards
- 🔘 Cinza (10%): Detalhes e separadores
- 🟣 Roxo: Badges de agrupamento
- 🔵 Azul: Informações complementares (fornecedor, fórmula)

## 🚀 Próximas Melhorias

- [ ] Agrupamento configurável (ativar/desativar)
- [ ] Filtro específico para lançamentos agrupados
- [ ] Exportação de relatório consolidado
- [ ] Gráfico visual de distribuição de custos agrupados
- [ ] Notificação de novos agrupamentos criados

---

**Data de Implementação**: 24/01/2026  
**Versão**: 1.0  
**Módulo**: Módulo 08 - Fluxo Financeiro
