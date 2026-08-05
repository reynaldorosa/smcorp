# FASE 2.1 — ROTEIRO DE TESTES MANUAIS (QA Operacional)

**Data:** 13/02/2026  
**Objetivo:** Validar fluxos transacionais críticos com cenários reproduzíveis e critérios de aceite.  
**Escopo:** Settings, Operacional, Documentos, Pagamentos, Portal Cliente (PF/PJ, permissões, fallback de API, regressão de rota).

---

## Pré-condições

- Frontend compilando: `npm run build` ✅
- Backend disponível para validações integradas quando necessário.
- Usuários de teste:
  - ADMIN
  - COLLABORATOR
  - CLIENT_PJ
- Massa mínima:
  - 1 empresa PJ ativa com acesso portal
  - 1 turma ativa
  - 2 alunos PF e 2 alunos PJ
  - 1 pagamento pendente PF e 1 pagamento pendente PJ

---

## Cenários por fluxo

## 1) Settings

### 1.1 Navegação por abas e comandos rápidos
**Dado** que estou em `/settings` autenticado  
**Quando** navego por tabs usando breadcrumb, dropdown, command e botões anterior/próxima  
**Então** a aba muda corretamente sem perda de estado da tela.

**Aceite:** nenhuma quebra visual, sem erro no console, troca de aba consistente.

### 1.2 Empresas — persistência API
**Dado** que estou na aba Empresas  
**Quando** crio ou edito uma empresa com campos obrigatórios válidos  
**Então** os dados persistem via API e reaparecem após refresh.

**Aceite:** operação com feedback de sucesso e dados mantidos após recarga.

---

## 2) Operacional

### 2.1 Matrícula individual em turma
**Dado** uma turma ativa selecionada  
**Quando** adiciono aluno pelo formulário de matrícula com dados obrigatórios  
**Então** aluno é criado/vinculado e fica visível na turma após atualização.

**Aceite:** aluno aparece no painel da turma e mantém vínculo após reload.

### 2.2 Vínculo de instrutor
**Dado** uma turma sem instrutor adicional  
**Quando** adiciono instrutor e depois removo  
**Então** o estado persiste e reflete corretamente no card da turma.

**Aceite:** vínculo/desvínculo com feedback e persistência efetiva.

---

## 3) Documentos

### 3.1 Validação de documento obrigatório
**Dado** um aluno com pendência documental  
**Quando** aprovo um documento no detalhe do aluno  
**Então** status do documento e agregados do aluno são atualizados.

**Aceite:** badge/status muda para aprovado e permanece após recarga.

### 3.2 Notificação pendente
**Dado** um aluno com documento pendente  
**Quando** aciono notificação de pendência  
**Então** o sistema gera payload de notificação sem erro e retorna feedback.

**Aceite:** mensagem de sucesso/erro coerente; sem travamento de UI.

---

## 4) Pagamentos (PF/PJ)

### 4.1 Confirmação PF
**Dado** pagamento PF pendente  
**Quando** confirmo com PIN Master válido  
**Então** pagamento muda para pago e recibo pode ser gerado.

**Aceite:** status pago + recibo disponível.

### 4.2 Confirmação PJ exige NF
**Dado** pagamento PJ pendente  
**Quando** tento confirmar sem NF  
**Então** a ação deve ser bloqueada com mensagem de NF obrigatória.

**E quando** informo NF válida e confirmo com PIN Master  
**Então** pagamento é confirmado.

**Aceite:** bloqueio sem NF + sucesso com NF.

### 4.3 Lote PJ exige NF
**Dado** seleção de alunos PJ para aprovação em lote  
**Quando** executo lote sem NF  
**Então** bloqueia com erro obrigatório.

**Aceite:** lote só conclui com NF informada.

---

## 5) Portal Cliente

### 5.1 Login PJ sem exposição de credenciais
**Dado** a tela `/portal-cliente`  
**Quando** acesso sem autenticar  
**Então** não há listagem de logins/senhas na interface.

**Aceite:** ausência total de credenciais visíveis em tela.

### 5.2 Gate de autorização no dashboard PJ
**Dado** usuário não autenticado ou role diferente de CLIENT_PJ  
**Quando** tenta abrir `/portal-cliente/dashboard`  
**Então** deve ser redirecionado para `/portal-cliente`.

**Aceite:** acesso negado para perfil inválido.

### 5.3 Importação e aprovação de alunos
**Dado** empresa PJ logada no portal  
**Quando** importo planilha válida e aprovo alunos  
**Então** alunos são persistidos com `companyId` da sessão PJ.

**Aceite:** alunos criados/vinculados corretamente à empresa da sessão.

---

## 6) Regressão por rota crítica

Validar abertura e funcionalidade mínima em:

- `/settings`
- `/operacional`
- `/documents`
- `/pagamentos`
- `/portal-cliente`
- `/portal-cliente/dashboard`

**Aceite geral:** sem erro fatal de renderização, sem loop de navegação, sem quebra de autorização.

---

## 7) Checklist de evidências para QA

Para cada cenário executado, registrar:

- Data/hora
- Usuário/perfil
- Dados de entrada
- Resultado (Pass/Fail)
- Evidência (print/log curto)
- Observações

Modelo de registro:

| Cenário | Perfil | Resultado | Evidência | Observação |
|---|---|---|---|---|
| Ex.: 4.2 Confirmação PJ sem NF | ADMIN | Pass | print_2026-02-13_01.png | Bloqueio exibido corretamente |

---

## Saída esperada da Fase 2.1

- Taxa de aprovação dos cenários críticos ≥ 95%
- Nenhuma falha crítica de segurança (credenciais, bypass de gate, confirmação PJ sem NF)
- Plano de correção aberto para qualquer falha bloqueante encontrada
