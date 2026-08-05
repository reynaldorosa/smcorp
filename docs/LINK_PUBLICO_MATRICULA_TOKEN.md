# Link público de matrícula (token)

Este documento descreve como **gerar** e **usar** o link público do aluno para a rota `/enrollment/...` usando um **token** (sem login).

## Visão geral

- **Geração do token (privado / requer login)**: `POST /api/v1/enrollments/:id/generate-token`
- **Validação do token (público / sem login)**: `POST /api/v1/enrollments/validate-token`
- **Link público (frontend)**: `http://localhost:3005/enrollment/<TOKEN>`

O token é um hex de 64 caracteres (32 bytes aleatórios em hex) e pode ter expiração.

## 1) Gerar token (admin/colaborador)

1. Faça login no backend e obtenha um JWT.
2. Chame o endpoint abaixo com o `Authorization: Bearer <JWT>`.

### Request

- Método/rota: `POST /api/v1/enrollments/:id/generate-token`
- Header: `Authorization: Bearer <JWT>`
- Body (opcional):

```json
{
  "expiresInHours": 24
}
```

### Exemplo (curl)

```bash
curl -X POST "http://localhost:3001/api/v1/enrollments/<ENROLLMENT_ID>/generate-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d "{\"expiresInHours\":24}"
```

### Resposta (resumo)

A matrícula retornará campos como:

- `enrollmentToken`
- `tokenExpiresAt`

Use `enrollmentToken` para montar o link público.

## 2) Montar o link público

- Formato: `http://localhost:3005/enrollment/<TOKEN>`
- Exemplo: `http://localhost:3005/enrollment/0123abcd...` (64 chars)

Observação: o frontend identifica automaticamente tokens no path quando o valor parece um token (regex de 64 hex).

## 3) Validar token (público)

Esse endpoint **não exige login**.

- Método/rota: `POST /api/v1/enrollments/validate-token`
- Body:

```json
{
  "token": "<TOKEN>"
}
```

### Exemplo (curl)

```bash
curl -X POST "http://localhost:3001/api/v1/enrollments/validate-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"<TOKEN>\"}"
```

Se o token for válido, o backend retorna a matrícula com `student`, `class` (com `course` e `room`), `payment` e `exams`.

## 4) WhatsApp no portal público

O portal do aluno tenta abrir o WhatsApp usando, nesta ordem:

1. `settings.store → whatsappConfig.number`
2. `settings.store → institutionalData.phone`
3. Variáveis de ambiente do frontend:
   - `NEXT_PUBLIC_INSTITUTION_WHATSAPP_NUMBER`
   - `NEXT_PUBLIC_INSTITUTION_PHONE`

No Docker (dev), você pode definir essas envs no `docker-compose.yml` ou via `.env`.

## 5) QR Code da matrícula (para compartilhar com o aluno)

O QR Code **mais útil no dia a dia** é o QR Code do **link público** (token), para o aluno escanear e abrir direto a página `/enrollment/<TOKEN>`.

- Onde aparece no frontend:
  - Dialog de reenvio de link (dashboard): gera o token, mostra o link e renderiza o QR Code.
  - Formulário de matrícula (operacional): quando o token é gerado, mostra o QR Code do link.

### Base URL (evitar hardcode)

Para o QR Code apontar para o domínio correto, o frontend monta o link usando:

1. `NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL` (se definido)
2. Senão, `window.location.origin`

Exemplo (dev):

- `NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL=http://localhost:3005`

Em produção, ajuste para o domínio real do portal.

## 6) QR Code de check-in (interno)

Existe também um endpoint de QR Code no backend (`GET /api/v1/enrollments/:id/qrcode` e `/svg`). Ele gera um QR Code com um payload JSON para uso interno (ex: fluxos de check-in).

- Importante: esse QR Code **não é o link público do aluno**.
- Os endpoints ficam protegidos por JWT + roles (ADMIN/COLLABORATOR).

## Segurança (boas práticas)

- Trate o token como um **segredo** (qualquer pessoa com o link acessa os dados daquele aluno/matrícula).
- Use expiração (`expiresInHours`) compatível com o seu fluxo.
- Se precisar revogar um link, gere um novo token (o token antigo deixa de ser o atual).
