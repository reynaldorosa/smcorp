# Mapa canônico (frontend) — Rotas → Módulos (11/02/2026)

Objetivo: levantar **como o frontend realmente controla acesso hoje** e, a partir disso, propor um **mapa canônico** (rotas → `modulo00..08`) para só então aplicar gating no menu/rotas com segurança (sem "chute" pós-refactor).

Convenção:
- Identificadores de código (types, helpers, chaves internas) em **inglês**.
- `modulo00..08` é mantido **somente** como chave de contrato (Figma-like) para permissões granulares.
- Labels/descrições de UI podem permanecer em PT-BR.

---

## 1) Onde o app controla acesso HOJE (canônico de runtime)

### 1.1 Guard de autenticação (único guard de rota)
- Dashboard layout exige login: [frontend/src/app/(dashboard)/layout.tsx](../frontend/src/app/(dashboard)/layout.tsx)
  - Se `!isAuthenticated` → `router.push('/login')` e renderiza `null`.

### 1.2 Gating do menu lateral (RBAC por role do backend)
- Menu é filtrado por `auth.user.role` via `roles: ['ADMIN', 'COLLABORATOR']`: [frontend/src/components/layout/sidebar.tsx](../frontend/src/components/layout/sidebar.tsx)
- **Não** usa `settings.currentUser.permissions.modulos`.

### 1.3 Checks de permissão espalhados (intra-feature)
- Existem checks locais de nível (ex.: `usuarioAtual.nivel === 'Master'`) e fluxo de PIN em dialogs operacionais.
- Isso **não** cria um mapa “rotas → módulos”; é apenas controle local por feature.

### 1.4 Permissões granulares estilo Figma (estrutura pronta, mas sem gating de rota/menu)
- Estrutura `UserPermissions` com `modulos.modulo00..08` + `acoes.*`: [frontend/src/lib/user-permissions.ts](../frontend/src/lib/user-permissions.ts)
- UI de edição dessas permissões (fonte de significado dos módulos 00–08):
  - [frontend/src/components/settings/dialogs/user-permissions-dialog.tsx](../frontend/src/components/settings/dialogs/user-permissions-dialog.tsx)
- Observação: existe outro sistema em inglês que hoje parece **não usado** (`modules/settings/courses/...`):
  - [frontend/src/lib/permissions.ts](../frontend/src/lib/permissions.ts)

Conclusão: **o “mapa canônico” atual de controle de acesso é (Auth Guard + Sidebar por role)**. O mapa `modulo00..08` existe (Figma-like), mas ainda não é a fonte canônica de gating de navegação.

Para respeitar a convenção de código em inglês sem quebrar o contrato Figma-like, existe uma camada de mapeamento “rotas → módulo” (em inglês) no frontend:
- [frontend/src/lib/route-module-map.ts](../frontend/src/lib/route-module-map.ts)

---

## 2) Inventário de rotas atuais (App Router)

Rotas em `frontend/src/app/(dashboard)/` (pastas de primeiro nível):
- `/dashboard`
- `/settings`
- `/courses`
- `/classes`
- `/operacional`
- `/timeline`
- `/vendas`
- `/crm`
- `/cliente-pj`
- `/documents`
- `/pagamentos`
- `/costs`
- `/financial`
- `/certificados`

Observação: o Sidebar atual expõe (com gating por role):
- `/dashboard`, `/settings`, `/courses`, `/classes`, `/operacional`, `/timeline`, `/vendas`, `/cliente-pj`, `/documents`, `/pagamentos`, `/costs`, `/certificados`, `/crm`.

---

## 3) Mapa “rotas → modulo00..08” (proposto, baseado no que o próprio frontend já define)

Fonte de nomes/semântica dos módulos (atual no frontend): `MODULES_CONFIG` em [frontend/src/components/settings/dialogs/user-permissions-dialog.tsx](../frontend/src/components/settings/dialogs/user-permissions-dialog.tsx).

### 3.1 Mapeamento direto (sem ambiguidade)

> **Revisão 04/08/2026 — fonte de verdade trocada.**
> A semântica dos módulos passou a seguir o protótipo `portalsmcorpfigma`
> (nav em `portalsmcorpfigma/src/app/components/Layout.tsx`), que é a
> **referência funcional** do sistema. O `MODULES_CONFIG` do frontend, usado
> como fonte na versão anterior deste documento, divergia nos módulos
> **04/05/06** e foi corrigido para bater com o protótipo.
>
> Diferença corrigida:
>
> | Chave | Antes (MODULES_CONFIG) | Agora (protótipo) |
> |---|---|---|
> | `modulo04` | Documentos | **Central de Vendas** |
> | `modulo05` | Vendas | **Área do Cliente PJ** |
> | `modulo06` | Área do Cliente | **Validação de Documentos** |
>
> Os defaults por perfil em `user-permissions.ts` **já seguiam o protótipo**
> (o perfil Seller recebe `modulo04`, que é Central de Vendas) — era o mapa de
> rotas e os labels que estavam fora de sincronia. Por isso os defaults não
> foram alterados.

| Rota | Módulo | Nome (protótipo) | Base |
|---|---|---|---|
| `/settings` | `modulo00` | Módulo 00 - Infraestrutura | Protótipo + Sidebar |
| `/courses` | `modulo01` | Módulo 01 - Catálogo de Cursos | Protótipo + Sidebar |
| `/classes` | `modulo02` | Módulo 02 - Abertura de Turmas | Protótipo + Sidebar |
| `/operacional` | `modulo03` | Módulo 03 - Dashboard Operacional | Protótipo + Sidebar |
| `/vendas` | `modulo04` | Módulo 04 - Central de Vendas | Protótipo (WhatsApp/leads) + Sidebar |
| `/crm` | `modulo04` | Módulo 04 - Central de Vendas | Protótipo (CRM/pipeline) + Sidebar |
| `/cliente-pj` | `modulo05` | Módulo 05 - Área do Cliente PJ | Protótipo + Sidebar |
| `/documents` | `modulo06` | Módulo 06 - Validação de Documentos | Protótipo + Sidebar |

### 3.2 Mapeamento com ambiguidade (precisa decidir antes de gating)
| Rota | Candidato(s) | Por quê |
|---|---|---|
| `/pagamentos` | `modulo07` (Financeiro) **ou** “novo bit” | O frontend chama essa área de “Gestão de Pagamentos” no Sidebar, mas `MODULES_CONFIG` não tem um módulo “Pagamentos” separado; pagamento geralmente cai em Financeiro. |
| `/costs` | `modulo07` (Financeiro) **e/ou** `modulo08` (Custos) | A página mistura conceitos (contas a pagar/receber + custos auditáveis + fornecedores). Isso impede separação **por rota** entre 07 e 08. |
| `/financial` | `modulo07` (Financeiro) | Existe rota separada, mas não está no Sidebar hoje (pode ser legacy/alternativa). |

Decisão aplicada (11/02/2026):
- Como essas telas estão sendo tratadas como **visualização** de fluxo financeiro, o gating foi implementado como:
  - permitir acesso quando o usuário tiver **`modulo07` OU `modulo08`**.
- Rotas cobertas por essa regra: `/pagamentos`, `/costs`, `/financial`.

Observação:
- Se no futuro essas rotas forem separadas de forma 1:1 (ex.: `/financial` = `modulo07` e `/costs` = `modulo08`), basta ajustar as regras em `route-module-map.ts`.

---

## 4) Rotas fora do escopo dos módulos (hoje só por role)

Estas rotas existem e estão no Sidebar, mas **não têm** módulo correspondente no `UserPermissions.modulos`:
- `/timeline` (Timeline Semanal)
- `/certificados` (Certificados)

Hoje o controle delas é apenas via `roles` no Sidebar (ADMIN/COLLABORATOR) + guard de autenticação.
Por serem ungated, servem também de **destino de último recurso** para o fallback
`getFirstAllowedRoute` (ver seção 4.1).

`/dashboard` **saiu desta lista**: é gated por `modulo09` (Dashboard Executivo),
que agora também é editável na UI de permissões.

### 4.1 Fallback de rota negada (corrigido em 04/08/2026)

O layout do dashboard, ao negar uma rota por módulo, redirecionava para `/dashboard`
fixo. Como `/dashboard` é gated por `modulo09` e o perfil Seller não tem esse módulo,
o usuário era negado e mandado de volta para a mesma rota negada — o layout renderizava
`null` indefinidamente, **antes** da `<Sidebar />`, resultando em tela totalmente em
branco e sem navegação. Some-se a isso que `modulo09` não existia no `MODULES_CONFIG`,
então nem o Master conseguia liberar o acesso pela UI.

Correções:
- `getFirstAllowedRoute(modulos)` em `route-module-map.ts` resolve a primeira rota que o
  usuário realmente pode acessar (caindo em rota ungated se não houver nenhuma).
- O layout usa esse destino e nunca redireciona para o próprio pathname atual.
- `modulo09` foi adicionado ao `MODULES_CONFIG` do dialog de permissões.

---

## 5) Próximo passo (sem risco) antes de implementar gating

1) Confirmar a decisão para o bloco financeiro:
   - qual rota é **Financeiro (modulo07)** e qual é **Custos (modulo08)**.
2) Confirmar o lugar de `/pagamentos` (se herda `modulo07` ou vira algo separado).
3) Só então aplicar:
   - filtro de Sidebar por `settings.currentUser.permissions.modulos[moduloXX]`.
   - guard de rota leve no layout (ou middleware), usando o mesmo mapa canônico.

---

## Apêndice: evidências rápidas
- Rotas atuais vieram do diretório `frontend/src/app/(dashboard)/`.
- Sidebar atual e seus `href` + `roles`: [frontend/src/components/layout/sidebar.tsx](../frontend/src/components/layout/sidebar.tsx)
- Nomes/descrições oficiais dos módulos 00–08 no frontend: `MODULES_CONFIG` em [frontend/src/components/settings/dialogs/user-permissions-dialog.tsx](../frontend/src/components/settings/dialogs/user-permissions-dialog.tsx)
