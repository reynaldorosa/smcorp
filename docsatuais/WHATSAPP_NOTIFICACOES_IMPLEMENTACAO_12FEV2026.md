# WHATSAPP + NOTIFICAÇÕES DE DOCUMENTOS — PLANO E IMPLEMENTAÇÃO INICIAL

**Data:** 12/02/2026  
**Escopo:** Módulo de Documentos (`student-documents`) com registro transacional de notificação e disparo assistido via WhatsApp Web/Email.

---

## 1) Objetivo

Padronizar o fluxo de notificação de documentos pendentes para sair de um comportamento apenas local/simulado e passar a ter:

- contrato backend dedicado;
- rastreabilidade em auditoria;
- payload consistente para canais (WhatsApp/Email);
- base pronta para integração com provedor oficial (WhatsApp Business API / SMTP transacional) sem quebrar UI.

---

## 2) O que foi implementado agora

### Backend (NestJS)

- Novo endpoint: `POST /student-documents/:id/notify-pending`
- Guardas: `JwtAuthGuard + RolesGuard`
- Perfis permitidos: `ADMIN`, `COLLABORATOR`, `MASTER`
- Validação Zod:
  - `notificationType`: `whatsapp | email | both`
  - `customMessage?`

### Regras de negócio

- Busca documento alvo e aluno vinculado.
- Busca matrículas ativas do aluno e documentos obrigatórios do curso.
- Calcula pendências reais (required - approved).
- Gera mensagem padrão quando não há customização.
- Monta estado dos canais (`requested`, `available`, `target`).
- Registra trilha em `audit_logs` com `tableName = student_document_notifications`.

### Frontend (Next.js)

- `documentOperations.notifyPending(...)` criado para consumir endpoint.
- Dialog de notificação em documentos agora:
  1. registra tentativa no backend;
  2. usa retorno oficial para montar disparo local de `wa.me` / `mailto`;
  3. mantém feedback de erro por ausência de contato.

---

## 3) Contrato de resposta (implementado)

```json
{
  "success": true,
  "message": "Notificação registrada com sucesso",
  "notificationType": "both",
  "pendingDocuments": ["CPF", "RG"],
  "previewMessage": "...",
  "subject": "Documentos pendentes - NR35",
  "channels": {
    "whatsapp": { "requested": true, "available": true, "target": "+55..." },
    "email": { "requested": true, "available": false, "target": null }
  }
}
```

---

## 4) Segurança e rastreabilidade

- Ação protegida por autenticação e autorização.
- Sem envio “cego”: backend valida pendências antes de registrar.
- Trilha mínima em auditoria com:
  - usuário emissor,
  - tipo de notificação,
  - pendências,
  - canais/targets disponíveis,
  - mensagem final,
  - timestamp.

---

## 5) Limites da versão atual

Esta implementação **não** envia mensagem por API oficial de provedores externos.

- WhatsApp: abertura assistida de WhatsApp Web (`wa.me`)
- Email: abertura assistida de cliente de email (`mailto`)

Ou seja: há contrato backend + auditoria real, porém o transporte final ainda depende do cliente.

---

## 6) Próxima fase recomendada (produção transacional)

1. Criar `notifications` module com tabela dedicada (`NotificationAttempt` / `NotificationDelivery`).
2. Integrar provedor oficial WhatsApp Business API.
3. Integrar provedor SMTP/API (SendGrid, SES, etc.).
4. Implementar fila (`BullMQ`) com retry/backoff e DLQ.
5. Expor status de entrega (queued/sent/delivered/failed).
6. Adicionar webhook de confirmação para atualização do status.

---

## 7) Arquivos impactados nesta entrega

- `backend/src/modules/student-documents/dto/student-document.dto.ts`
- `backend/src/modules/student-documents/student-documents.controller.ts`
- `backend/src/modules/student-documents/student-documents.service.ts`
- `frontend/src/services/operations.service.ts`
- `frontend/src/components/documents/student-documents-detail.tsx`

---

## 8) Resultado prático

O fluxo de notificação de documentos deixa de ser somente UI/simulação e passa a ter backend formal, validação e trilha auditável, reduzindo risco operacional e preparando a evolução para mensageria transacional real.
