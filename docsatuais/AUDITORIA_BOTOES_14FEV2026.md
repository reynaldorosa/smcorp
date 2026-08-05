# Auditoria de Botões — Frontend (14/02/2026)

## Escopo
- Varredura de botões em `frontend/src/**/*.tsx`.
- Regra de suspeita: botão sem `onClick` e sem `type="submit|reset"` e sem `asChild`.

## Resultado da varredura automática
- Suspeitos encontrados: **21**
- Arquivo bruto da varredura: `docsatuais/_tmp_button_audit_14fev2026.json`

## Classificação manual
- **Falsos positivos (válidos): 19**
  - Casos em `DialogTrigger/PopoverTrigger/... asChild`
  - Casos de envio de formulário (`type="submit"` implícito/explícito)
- **Problemas reais: 2**
  1. Botão de notificações no header sem ação.
  2. Botão `Ver` em certificados `EXPIRED/REVOKED` sem ação.

## Correções aplicadas
1. `frontend/src/components/layout/header.tsx`
   - Adicionado `onClick` no botão de sino com feedback via toast.

2. `frontend/src/app/(dashboard)/certificados/page.tsx`
   - Botão `Ver` agora abre o diálogo de verificação com o número do certificado preenchido.

## Observação
- Já havia correção anterior na tela financeira para `🔢 Renumerar` e `Gerar Custos` em `frontend/src/app/(dashboard)/costs/page.tsx`.
