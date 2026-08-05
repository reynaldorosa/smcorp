# 🎯 Sistema de Gestão de Custos de Prova - SMCORP

## 📋 Resumo

Sistema completo de controle de custos de instrutor vinculados a provas, com exclusão automática quando o aluno é o único agendado.

---

## ✨ Funcionalidades Implementadas

### 1. **Verificação de Custos de Prova**
- Função `verificarCustosProvaParaExcluir(alunoId)` que:
  - Verifica se o aluno tem prova agendada
  - Busca custos vinculados à ação "Instrutor Vinculado à Prova"
  - Conta quantos alunos têm a mesma prova com o mesmo instrutor
  - Retorna lista de custos e se devem ser excluídos

### 2. **Função Auxiliar de Contagem**
- Função `obterAlunosNaMesmaProva(instrutorId, numeroProva)` que:
  - Retorna todos os alunos com mesma prova e instrutor
  - Usada para decidir se custos devem ser mantidos ou excluídos

---

## 🔄 Lógica de Negócio

### **Regra Principal:**
> **Custos de instrutor são excluídos APENAS quando o aluno é o único agendado para aquela prova**

### Cenários:

#### ✅ **Cenário 1: Aluno ÚNICO na prova**
- **Ação:** Transferir, Cancelar ou Excluir aluno
- **Resultado:** Custos do instrutor são **EXCLUÍDOS**
- **Motivo:** Prova não acontecerá (não há outros alunos)

#### ✅ **Cenário 2: Múltiplos alunos na prova**
- **Ação:** Transferir, Cancelar ou Excluir um aluno
- **Resultado:** Custos do instrutor são **MANTIDOS**
- **Motivo:** Prova ainda acontecerá para os outros alunos

---

## 📦 Componentes Atualizados

### **1. SMCorpContext.tsx**

#### Novas Funções:
```typescript
verificarCustosProvaParaExcluir(alunoId: string): {
  custos: LancamentoCusto[],
  excluir: boolean,
  motivo: string
}

obterAlunosNaMesmaProva(instrutorId: string, numeroProva: string): Aluno[]
```

#### Funções Modificadas:
- ✅ `transferirAluno()` - Agora exclui custos de prova e reseta statusProva
- ✅ `excluirAluno()` - Agora exclui custos de prova se necessário
- ✅ `cancelarProva()` - Agora exclui custos de instrutor se aluno único

---

### **2. DialogTransferirTurma.tsx**

#### Recursos Adicionados:
- ✅ Verificação de custos ao abrir o dialog
- ✅ Aviso visual destacado quando há custos para excluir
- ✅ Lista detalhada de custos com códigos e valores
- ✅ Cálculo do total a ser excluído
- ✅ Mensagem informativa quando há outros alunos na prova

#### Interface Visual:
```
┌─────────────────────────────────────────┐
│ ⚠️ ATENÇÃO: Custos Serão Excluídos     │
│                                         │
│ Aluno é o único agendado para a        │
│ prova P0001 com o instrutor João.      │
│                                         │
│ Custos que serão excluídos:            │
│ ┌─────────────────────────────────┐    │
│ │ L0042      R$ 150.00            │    │
│ │ L0043      R$ 100.00            │    │
│ │ ──────────────────────────────  │    │
│ │ Total:     R$ 250.00            │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

### **3. CardAluno.tsx**

#### Melhorias:

**Dialog de Exclusão:**
- ✅ Mostra custos que serão excluídos
- ✅ Exibe total de custos a excluir
- ✅ Formato compacto e visual

**Dialog de Cancelamento de Prova:**
- ✅ Mostra custos de instrutor que serão excluídos
- ✅ Exibe motivo da exclusão
- ✅ Informa quando há outros alunos na prova

---

## 🎨 Fluxo de Usuário

### **Transferir Aluno**
```
1. Usuário clica em "Transferir Turma"
2. Sistema verifica custos de prova
3. Dialog mostra:
   - Turma origem/destino
   - Custos que serão excluídos (se aplicável)
   - Mensagem sobre outros alunos (se aplicável)
4. Usuário confirma
5. Sistema:
   - Exclui custos (se único aluno)
   - Transfere aluno
   - Reseta statusProva
   - Mantém histórico de presença
```

### **Cancelar Prova**
```
1. Usuário clica em "Cancelar Prova"
2. Sistema verifica custos de instrutor
3. Dialog mostra:
   - Aviso de exclusão da prova
   - Custos de instrutor que serão excluídos (se único)
   - Info sobre outros alunos (se aplicável)
4. Usuário confirma
5. Sistema:
   - Exclui custos de instrutor (se único)
   - Cancela custos do aluno
   - Reseta statusProva
```

### **Excluir Aluno**
```
1. Usuário clica em "Excluir Aluno"
2. Sistema verifica custos de prova
3. Popover mostra:
   - Aviso de exclusão permanente
   - Custos que serão excluídos (se tiver prova e for único)
4. Usuário confirma
5. Sistema:
   - Exclui custos de prova (se único)
   - Remove aluno do sistema
```

---

## 🔍 Logs do Sistema

### Transferência com Custos Excluídos:
```
🗑️ [TRANSFERÊNCIA] Excluindo 2 custo(s) de prova...
   ❌ Custo excluído: L0042 - R$ 150.00
   ❌ Custo excluído: L0043 - R$ 100.00
🔄 [TRANSFERÊNCIA] Aluno João Silva transferido de #0006 para #0010
```

### Cancelamento com Custos Mantidos:
```
ℹ️ [CANCELAR PROVA] Há 3 outro(s) aluno(s) agendado(s) para a mesma prova
ℹ️ [CANCELAR PROVA] Custos do instrutor serão mantidos
🔴 [CANCELAR CUSTOS] Cancelando lançamento L0040 gerado pela ação: Prova Agendada
```

---

## 📊 Métricas e Validações

### **Cenários de Teste:**
- ✅ Transferir aluno único em prova → Custos excluídos
- ✅ Transferir aluno com outros na prova → Custos mantidos
- ✅ Cancelar prova de aluno único → Custos de instrutor excluídos
- ✅ Cancelar prova com outros alunos → Custos de instrutor mantidos
- ✅ Excluir aluno único em prova → Custos excluídos
- ✅ Excluir aluno com outros na prova → Custos mantidos

---

## 🎯 Benefícios

1. **✅ Controle Financeiro Preciso**
   - Evita custos órfãos de provas canceladas
   - Mantém custos quando prova continua

2. **✅ Transparência Total**
   - Usuário sempre sabe quais custos serão afetados
   - Interface clara e informativa

3. **✅ Auditabilidade**
   - Todos os custos excluídos são logados
   - Histórico completo no console

4. **✅ Prevenção de Erros**
   - Confirmação antes de ações críticas
   - Validações automáticas

---

## 📝 Notas Técnicas

### **Performance:**
- Verificação de custos é feita sob demanda
- Não impacta carregamento inicial
- Operações otimizadas com filtros

### **Segurança:**
- Custos "Pagos" nunca são excluídos automaticamente
- Validações em múltiplas camadas
- Logs detalhados para auditoria

### **Manutenibilidade:**
- Funções isoladas e reutilizáveis
- Código bem documentado
- Lógica centralizada no contexto

---

## 🚀 Próximas Melhorias Sugeridas

1. **Relatório de Custos Excluídos**
   - Histórico de exclusões automáticas
   - Exportação para auditoria

2. **Notificações Push**
   - Alertar gestores sobre exclusões de custos altos
   - E-mail com resumo de exclusões

3. **Reversão de Exclusão**
   - Opção de desfazer exclusão de custos
   - Período de 24h para reversão

---

**Documentação atualizada em:** 29/01/2026  
**Versão do Sistema:** 1.0.0  
**Status:** ✅ Implementado e Testado
