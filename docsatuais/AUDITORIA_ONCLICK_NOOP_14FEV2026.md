# Auditoria de Handlers `onClick` No-Op — 14/02/2026

## Escopo
- Verificação em `frontend/src/**/*.tsx` para callbacks de clique sem efeito real.

## Método
- Varredura automática por padrões de no-op:
  - `onClick={() => {}}`
  - `onClick={() => void 0}`
  - `onClick={() => undefined|null|false}`
  - `onClick={() => { return; }}`
- Revisão manual dos suspeitos para filtrar falso-positivo.

## Resultado
- Suspeitos encontrados: **2** (`docsatuais/_tmp_onclick_noop_audit_14fev2026.json`)
- Falso-positivo: **1** (captura regex atravessando blocos)
- Problema real: **1**

## Correção aplicada
- Arquivo: `frontend/src/app/(dashboard)/costs/page.tsx`
- Ponto: callback vazio em `onToggleSelect` na aba **A Receber**.
- Antes: `onToggleSelect={() => {}}`
- Depois: feedback explícito via toast informando que seleção em lote está disponível na aba **A Pagar**.

## Continuidade (persistência de ação)
- Arquivo: `frontend/src/stores/costs.store.ts`
- Ponto: `renumberCostEntries` alterava apenas estado local (efeito perdido após recarregar).
- Ajuste: renumeração agora também faz `updateEntry` na API para persistir `code` de cada lançamento.

## Continuidade (falhas silenciosas em clique/API)
1. `frontend/src/app/(dashboard)/vendas/page.tsx`
  - Ponto: registro de interação podia falhar no CRM e ainda exibir sucesso.
  - Ajuste: quando falha persistência no CRM, exibe aviso de fallback local e evita toast de sucesso falso.

2. `frontend/src/components/operational/operational-dashboard.tsx`
  - Ponto: falha na geração de token oficial de matrícula era silenciosa.
  - Ajuste: exibe aviso de uso de token temporário local quando API falha.

## Status
- Correção aplicada e validada sem erros de TypeScript.

## Terceira passada (documents/crm/cliente-pj)
- Artefatos gerados:
  - `docsatuais/_tmp_target_buttons_14fev2026.json`
  - `docsatuais/_tmp_target_catches_14fev2026.json`
- Achados:
  - Botão suspeito em `cliente-pj`: **falso-positivo** (`DialogTrigger asChild` com abertura de modal).
  - `catch` silenciosos em `crm` e `documents`: convertidos para feedback único de fallback local.
  - `catch` silencioso em detalhe de documentos: convertido para aviso após atualização sem sincronização do status geral.
- Correções aplicadas:
  1. `frontend/src/app/(dashboard)/crm/page.tsx`
     - Adicionado aviso único: “API do CRM indisponível. Exibindo dados locais.”
  2. `frontend/src/app/(dashboard)/documents/page.tsx`
     - Adicionado aviso único: “API de documentos indisponível. Exibindo dados locais.”
  3. `frontend/src/components/documents/student-documents-detail.tsx`
     - Adicionado aviso quando sincronização de status geral falha após validar documento.

- Validação:
  - Sem erros de TypeScript nos arquivos alterados.

- Ajuste final de consistência textual:
  - `frontend/src/components/documents/student-documents-detail.tsx`
    - mensagens do fluxo de `Invalidar` alinhadas para "invalidado/invalidar" (antes havia mistura com "rejeitado").

## Fechamento extra de robustez
1. `frontend/src/app/(dashboard)/certificados/page.tsx`
  - removidos `catch` silenciosos de carga base (alunos/cursos/turmas) com aviso único de fallback local.
  - mensagem aplicada: "API de certificados indisponível. Exibindo dados locais.".

2. `frontend/src/components/settings/dialogs/company-pricing-dialog.tsx`
  - ação de excluir precificação ganhou feedback explícito quando o usuário cancela a confirmação.

- Validação:
  - Sem erros de TypeScript nos arquivos alterados.

## Alinhamento textual com PortalFigma (precificação)
- Referência comparada: `portalsmcorpfigma/src/app/components/DialogPrecificacoesEmpresa.tsx`.
- Ajustes aplicados para equivalência de microtexto/fluxo:
  1. `frontend/src/app/(dashboard)/cliente-pj/page.tsx`
     - "Regra de preço adicionada com sucesso!" → "Precificação adicionada com sucesso!"
     - confirmação de exclusão alinhada para "Deseja realmente excluir esta precificação?"
     - "Regra de preço removida com sucesso!" → "Precificação excluída com sucesso!"
  2. `frontend/src/components/settings/dialogs/company-pricing-dialog.tsx`
     - removido toast de cancelamento extra para manter o mesmo comportamento do PortalFigma (confirmação + sucesso apenas).

- Validação:
  - Sem erros de TypeScript nos arquivos alterados.

## Auditoria full de fechamento (14/02/2026)
- Artefato: `docsatuais/_tmp_full_parity_audit_14fev2026.json`
- Escopo varrido: `frontend/src/**/*.tsx`
- Métricas finais:
  - `button_no_onclick`: **0**
  - `onclick_noop`: **0**
  - `empty_catch`: **0**
  - `destructive_no_confirm`: **0**

- Ajustes finais aplicados para zerar pendências:
  1. `frontend/src/app/providers.tsx`
    - aviso único quando falha sincronização do perfil autenticado.
  2. `frontend/src/app/(dashboard)/vendas/page.tsx`
    - aviso único de fallback local em indisponibilidade de API.
  3. `frontend/src/app/(dashboard)/certificados/page.tsx`
    - aviso quando falha refresh automático após conflito `409`.
  4. `frontend/src/components/settings/backup-tab.tsx`
    - aviso quando contagens de backup não podem ser carregadas.

- Validação:
  - Sem erros de TypeScript nos arquivos alterados.

## Quarta passada (ações destrutivas)
- Foco: garantir confirmação + feedback em ações de exclusão/cancelamento.
- Revisão manual:
  - `classes/[id]`: já possui confirmação e toast no `StudentCard`.
  - `cliente-pj`: exclusão de empresa já possuía `AlertDialog`, mas remoção de pricing estava sem confirmação explícita.
- Correção aplicada:
  1. `frontend/src/app/(dashboard)/cliente-pj/page.tsx`
     - Criados handlers `handleAddPricing` e `handleDeletePricing`.
     - `handleDeletePricing` agora exige confirmação (`confirm`) antes de excluir.
     - Adicionados toasts de sucesso/cancelamento para remoção de pricing.
- Validação:
  - Sem erros de TypeScript no arquivo alterado.

## Quinta passada (revogar/rejeitar/cancelar com API)
- Foco: padronizar confirmação e justificativa em ações críticas com impacto de API.
- Correções aplicadas:
  1. `frontend/src/components/documents/student-documents-detail.tsx`
     - A ação de invalidar documento agora:
       - solicita motivo ao operador;
       - exige motivo com mínimo de 5 caracteres;
       - solicita confirmação final antes de chamar API;
       - exibe feedback de cancelamento quando usuário desiste.

  2. `frontend/src/app/(dashboard)/certificados/page.tsx`
     - Dialogs de emissão e revogação agora limpam estado ao fechar por botão, overlay ou tecla ESC.
     - Evita certificado selecionado/motivo residual em novas interações.

- Validação:
  - Sem erros de TypeScript nos arquivos alterados.
