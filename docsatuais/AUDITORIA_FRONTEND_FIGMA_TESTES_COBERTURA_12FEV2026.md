# AUDITORIA FRONTEND x FIGMA + TESTES DE COBERTURA

Data: 12/02/2026

## 1) Escopo auditado
- Módulos principais de frontend (`/dashboard`, `/settings`, `/courses`, `/classes`, `/operacional`, `/documents`, `/vendas`, `/crm`, `/cliente-pj`, `/pagamentos`, `/financial`, `/costs`).
- Fluxos de autenticação separados por entidade (Admin/PF e Cliente PJ).
- Fluxo comercial do Módulo 05 com foco em integração CRM + matrícula + compartilhamento.

## 2) Mapa click a click (alto impacto)

### 2.1 Login Admin/PF
1. Acessar `/login`.
2. Inserir e-mail/senha.
3. Clicar em `Entrar na Plataforma`.
4. Esperado: autentica e redireciona para `/dashboard`.

### 2.2 Login Cliente PJ
1. Acessar `/portal-cliente`.
2. Inserir login/senha PJ.
3. Clicar em `Entrar`.
4. Esperado: autentica em `/auth/portal-pj/login`.
5. Esperado: busca perfil em `/auth/portal-pj/profile`.
6. Esperado: grava `portalClienteLogado` em sessão e redireciona para `/portal-cliente/dashboard`.
7. Link auxiliar: `Login PF` aponta para `/login`.

### 2.3 Central de Vendas (Módulo 05)
1. Acessar `/vendas`.
2. Selecionar contato na lista.
3. Registrar interação no campo de atendimento e clicar em `Registrar`.
4. Esperado: mensagem local + atividade no CRM.
5. Clicar em `Enviar Link`.
6. Esperado: gerar token de matrícula e abrir diálogo de compartilhamento.
7. Testar ações de compartilhamento: WhatsApp Web, E-mail, Copiar Link, Usar no Chat.
8. Esperado: status do contato sincronizado com CRM quando alterado.

### 2.4 CRM (Módulo 05)
1. Acessar `/crm`.
2. Alterar status de lead/interessado/matriculado.
3. Criar atividade e validar listagem.
4. Esperado: endpoints CRM respondendo sem 500 e UI atualizada.

## 3) Correções de produção já aplicadas nesta rodada
- Login PJ sem dependência de cache local no frontend.
- Novo endpoint de perfil PJ no backend (`/auth/portal-pj/profile`).
- Sessão PJ preenchida automaticamente com código/CNPJ da empresa.
- Link explícito para login PF na tela PJ.
- Central de Vendas simplificada para painel único de atendimento.

## 4) Testes automatizados implementados

### 4.1 Frontend (Vitest + RTL)
- `src/app/login/page.test.tsx`
  - login admin/pf com redirecionamento.
- `src/app/portal-cliente/page.test.tsx`
  - login PJ com perfil + sessão.
  - link `Login PF`.
- `src/services/auth.service.test.ts`
  - contrato de chamadas para `/auth/portal-pj/login` e `/auth/portal-pj/profile`.
- `src/components/sales/helpers.test.ts`
  - regras de status/cores/label do módulo de vendas.
- `src/lib/route-module-map.test.ts`
  - gate de rotas por módulo (inclui módulo 05/06/financeiro).

### 4.2 Comando de execução
- `npm run test:cov` (na pasta `frontend`).

## 5) Situação atual de cobertura
- Cobertura global ainda baixa (base ampla, muitos módulos sem testes de componente/e2e).
- Estrutura de cobertura está pronta e integrada para crescimento incremental sem retrabalho.

## 6) Próxima fase recomendada (prioridade)
1. E2E Playwright para fluxos críticos click a click (Login, M05, PJ Dashboard, Documents, Pagamentos).
2. Testes de integração dos componentes de alto risco do M05 (`vendas`, `crm`, `operational-dashboard`).
3. Meta progressiva de cobertura por módulo (não só cobertura global), começando por M05/M06.

## 7) Critério de aceite para produção (sugerido)
- Login Admin e PJ validados com testes automatizados.
- Módulo 05 com cenários críticos cobertos (registro de interação, geração de link/token, compartilhamento, atualização de status).
- Sem erros de TypeScript nos arquivos alterados.
- Build e testes de cobertura executando em CI.
