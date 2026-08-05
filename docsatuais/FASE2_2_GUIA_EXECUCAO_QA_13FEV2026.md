# FASE 2.2 — Guia de Execução QA

## Arquivo de execução

Use o template em:

- [docsatuais/FASE2_2_TEMPLATE_EXECUCAO_QA_13FEV2026.csv](docsatuais/FASE2_2_TEMPLATE_EXECUCAO_QA_13FEV2026.csv)

## Como preencher

- `status_execucao`: Pendente | Em Execução | Passou | Falhou | Bloqueado
- `severidade`: Baixa | Media | Alta | Critica
- `evidencia`: nome do print/video/log (ex.: `qa_4_2_nf_bloqueio.png`)
- `defeito_id`: ID do ticket (ex.: `BUG-214`), se aplicável
- `executado_em`: data/hora ISO (ex.: `2026-02-13T22:15:00-03:00`)

## Regra de aceite da fase

- Aprovação mínima: **95%** dos cenários com status `Passou`.
- Cenários de severidade `Critica` não podem ficar em `Falhou`.
- Todo cenário `Falhou` deve gerar `defeito_id` e evidência.

## Priorização de execução

1. Executar primeiro cenários críticos: `4.2`, `4.3`, `5.1`, `5.2`.
2. Executar depois os cenários de persistência/fluxo: `1.2`, `2.1`, `2.2`, `5.3`.
3. Finalizar com regressão de rotas `6.1` a `6.6`.

## Saída esperada

- CSV preenchido e versionado em `docsatuais/`.
- Lista de defeitos abertos com prioridade.
- Decisão de go/no-go operacional com base nos critérios acima.
