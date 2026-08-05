# 📊 Diagrama Visual do Agrupamento Inteligente

## 🔄 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 1: Geração de Lançamentos                            │
│  (lancamentosGerados)                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LANÇAMENTOS INDIVIDUAIS (150 lançamentos)                  │
├─────────────────────────────────────────────────────────────┤
│  D0001 - Alimentação - João (ALU001) - R$ 25,00            │
│  D0002 - Alimentação - João (ALU001) - R$ 25,00            │
│  D0003 - Alimentação - João (ALU001) - R$ 25,00            │
│  D0004 - Alimentação - João (ALU001) - R$ 25,00            │
│  D0005 - Alimentação - João (ALU001) - R$ 25,00            │
│  ─────────────────────────────────────────────────────      │
│  L0010 - Transporte - Maria (ALU002) - R$ 150,00           │
│  L0011 - Transporte - Maria (ALU002) - R$ 150,00           │
│  ─────────────────────────────────────────────────────      │
│  D0020 - Material - Pedro (ALU003) - R$ 50,00              │
│  ... (mais lançamentos)                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 2: Mapeamento por Chave de Agrupamento              │
│  (gruposInteligentes)                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  GRUPOS CRIADOS (Map)                                        │
├─────────────────────────────────────────────────────────────┤
│  Chave: "aluno001_custo123_fornecedor456_2026-01-30"       │
│    ├─ D0001 (R$ 25,00)                                     │
│    ├─ D0002 (R$ 25,00)                                     │
│    ├─ D0003 (R$ 25,00)                                     │
│    ├─ D0004 (R$ 25,00)                                     │
│    └─ D0005 (R$ 25,00)                                     │
│                                                              │
│  Chave: "aluno002_custo789_fornecedor012_2026-01-30"       │
│    ├─ L0010 (R$ 150,00)                                    │
│    └─ L0011 (R$ 150,00)                                    │
│                                                              │
│  Chave: "aluno003_custo345_fornecedor678_2026-01-30"       │
│    └─ D0020 (R$ 50,00)  ← ÚNICO (não agrupa)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 3: Consolidação (apenas grupos com 2+ lançamentos)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LANÇAMENTOS CONSOLIDADOS (25 consolidados)                 │
├─────────────────────────────────────────────────────────────┤
│  📦 D0001→D0005                                             │
│     Código: "D0001→D0005"                                   │
│     Valor Total: R$ 125,00                                  │
│     Agrupado: true                                          │
│     Detalhamento: [                                         │
│       { codigo: "D0001", data: "25/01/2026", valor: 25 },  │
│       { codigo: "D0002", data: "26/01/2026", valor: 25 },  │
│       { codigo: "D0003", data: "27/01/2026", valor: 25 },  │
│       { codigo: "D0004", data: "28/01/2026", valor: 25 },  │
│       { codigo: "D0005", data: "29/01/2026", valor: 25 }   │
│     ]                                                        │
│                                                              │
│  📦 L0010→L0011                                             │
│     Código: "L0010→L0011"                                   │
│     Valor Total: R$ 300,00                                  │
│     Agrupado: true                                          │
│     Detalhamento: [                                         │
│       { codigo: "L0010", data: "01/02/2026", valor: 150 }, │
│       { codigo: "L0011", data: "01/03/2026", valor: 150 }  │
│     ]                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  ETAPA 4: Array Final                                       │
│  (lancamentosFinais)                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULTADO FINAL (125 lançamentos)                          │
├────────��────────────────────────────────────────────────────┤
│  - 100 lançamentos individuais (não agrupados)              │
│  - 25 lançamentos consolidados (agrupados)                  │
│                                                              │
│  ECONOMIA: 150 originais → 125 finais = 25 cards menos!    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Lógica de Agrupamento

```javascript
// PASSO 1: Criar chave única
const chaveAgrupamento = `
  ${lancamento.alunoId}_
  ${lancamento.custoAuditavelId}_
  ${lancamento.fornecedorId}_
  ${lancamento.dataVencimento}
`;

// Exemplo:
"aluno123_custo456_fornecedor789_2026-01-30"
 └─────┘  └───────┘  └────────────┘  └──────────┘
   João   Alimentação  Cantina XYZ    30/01/2026
```

## 📦 Estrutura do Card Consolidado

```
╔═══════════════════════════════════════════════════════════╗
║  📦 D0001→D0005                    [📦 5 lançamentos]     ║
║  Alimentação - ALU001 João Silva                          ║
║                                                            ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ 💰 Valor Total  📊 Unitário  📅 Vencimento  🏢 Forn. │ ║
║  │ R$ 125,00       R$ 25,00     30/01/2026    Cantina   │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                            ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ 💡 Cálculo Consolidado:                              │ ║
║  │ R$ 25,00 × 5 lançamentos = R$ 125,00                │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                            ║
║  ▼ Ver detalhes dos 5 lançamentos                        ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ D0001  📅 25/01/2026  💵 R$ 25,00                    │ ║
║  │ D0002  📅 26/01/2026  💵 R$ 25,00                    │ ║
║  │ D0003  📅 27/01/2026  💵 R$ 25,00                    │ ║
║  │ D0004  📅 28/01/2026  💵 R$ 25,00                    │ ║
║  │ D0005  📅 29/01/2026  💵 R$ 25,00                    │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                            ║
║  [👁️ Detalhes]  [✓ Baixar]                               ║
╚═══════════════════════════════════════════════════════════╝
```

## 🔍 Exemplo de Chaves de Agrupamento

```
✅ AGRUPA (mesma chave):
─────────────────────────────────────────────────────────────
Lançamento 1: aluno001_custo123_fornecedor456_2026-01-30
Lançamento 2: aluno001_custo123_fornecedor456_2026-01-30
Lançamento 3: aluno001_custo123_fornecedor456_2026-01-30
              └────────────────┬────────────────────────┘
                        MESMA CHAVE → AGRUPA!


❌ NÃO AGRUPA (chaves diferentes):
─────────────────────────────────────────────────────────────
Lançamento 1: aluno001_custo123_fornecedor456_2026-01-30
                                            ↑
Lançamento 2: aluno001_custo123_fornecedor789_2026-01-30
                                            ↑
              └──────────┬──────────────────┘
                  FORNECEDORES DIFERENTES → NÃO AGRUPA


Lançamento 1: aluno001_custo123_fornecedor456_2026-01-30
                                                        ↑
Lançamento 2: aluno001_custo123_fornecedor456_2026-02-15
                                                        ↑
              └──────────┬──────────────────────────────┘
                    DATAS DIFERENTES → NÃO AGRUPA
```

## 📊 Estatísticas de Agrupamento

```
┌─────────────────────────────────────────────────┐
│  ANTES DO AGRUPAMENTO                          │
├─────────────────────────────────────────────────┤
│  Total de lançamentos:           150           │
│  Lançamentos duplicados:          50           │
│  Lançamentos únicos:             100           │
└─────────────────────────────────────────────────┘
                    │
                    ▼ AGRUPAMENTO
┌─────────────────────────────────────────────────┐
│  DEPOIS DO AGRUPAMENTO                         │
├─────────────────────────────────────────────────┤
│  Total de lançamentos:           125           │
│  Lançamentos consolidados:        25           │
│  Lançamentos únicos:             100           │
│                                                 │
│  🎯 REDUÇÃO: 16.7% menos cards na tela!       │
└─────────────────────────────────────────────────┘
```

## 🎨 Cores e Visual

```
┌─────────────────────────────────────────────────┐
│  IDENTIDADE VISUAL                             │
├─────────────────────────────────────────────────┤
│  🔴 Vermelho (#DC2626)                         │
│     - Borda esquerda (4px)                     │
│     - Valores de custo                         │
│     - Ícones principais                        │
│                                                 │
│  🟣 Roxo (#9333EA)                             │
│     - Badge de agrupamento                     │
│     - Indicador no topo                        │
│                                                 │
│  🔵 Azul (#2563EB)                             │
│     - Box de fórmula                           │
│     - Informações do fornecedor                │
│                                                 │
│  ⬜ Branco (#FFFFFF)                           │
│     - Fundo principal                          │
│     - Cards de detalhamento                    │
│                                                 │
│  🔘 Cinza (#F3F4F6 - 10%)                      │
│     - Bordas e separadores                     │
│     - Fundo de listas                          │
└─────────────────────────────────────────────────┘
```

---

**Implementado em**: 24/01/2026  
**Versão**: 1.0
