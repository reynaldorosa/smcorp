# Módulo 05 — Compartilhamento Multicanal (WhatsApp Web, E-mail, Link/QR)

Data: 12/02/2026
Status: Planejado para implementação imediata
Escopo: **somente Módulo 05 (Vendas/CRM)**, sem criação de nova página.

## Objetivo
Evitar dependência exclusiva do WhatsApp para envio de matrícula/documentos, mantendo o layout atual do projeto.

## Problema reportado
- Fluxo atual depende principalmente de WhatsApp.
- Necessidade de enviar:
  - link/QR de matrícula
  - instruções de documentos
  - confirmação por canais alternativos
- Notificações percebidas como “não funcionando” em alguns cenários de canal/contato.

## Diretriz de UX (sem quebrar layout)
- Reaproveitar botões e menus existentes na Central de Vendas/CRM.
- Adicionar ação **Compartilhar Matrícula** no padrão visual atual.
- Modal enxuto com 4 ações:
  1. WhatsApp Web
  2. E-mail
  3. Copiar Link
  4. Exibir QR

## Regras funcionais
- Só habilitar compartilhamento quando houver `enrollmentId` do aluno.
- Gerar token via backend (`/enrollments/:id/generate-token`) no momento do compartilhamento.
- Se contato não tiver telefone/e-mail, desabilitar ação correspondente e mostrar feedback.
- Registrar feedback visual de sucesso/erro para cada canal.

## Correção de notificações (escopo M05)
- Tratar indisponibilidade de canal por contato (telefone/e-mail ausentes).
- Evitar “silêncio” no clique: sempre exibir `toast` indicando motivo quando não puder enviar.
- Manter fallback de copiar link quando canais não estiverem disponíveis.

## Critérios de aceite
1. Sem nova página criada.
2. Funciona dentro de `/vendas` e/ou `/crm` (Módulo 05).
3. Usuário consegue compartilhar por WhatsApp Web, e-mail e link copiado.
4. QR fica visível no próprio fluxo (modal) sem navegar para outra área.
5. Em falta de contato, interface informa claramente o motivo.

## Observações técnicas
- Reuso de serviços existentes:
  - `enrollmentOperations.generateToken`
- Reuso de componentes existentes:
  - `Dialog`, `Button`, `Badge`, `QRCodeSVG` (já utilizado no projeto)

