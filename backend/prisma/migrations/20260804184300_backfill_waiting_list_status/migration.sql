-- ============================================
-- Backfill da fila de espera
--
-- Antes desta mudança a fila de espera não era um estado de domínio: o
-- frontend gravava a string '[WAITING_LIST]' dentro de `notes` (texto livre)
-- e reconhecia a fila por `notes.includes('[WAITING_LIST]')`. Qualquer pessoa
-- que digitasse esse texto nas observações mudava o status do aluno.
--
-- Aqui os registros antigos passam para o status próprio e o marcador sai das
-- observações. Migration separada porque o Postgres não permite usar um valor
-- de enum na mesma transação em que ele é criado.
--
-- Só são convertidas matrículas ainda em SCHEDULED (o default de criação):
-- se a matrícula já avançou de estado, o marcador é apenas resíduo textual e
-- sobrescrever o status seria perda de informação.
-- ============================================

UPDATE "enrollments"
SET
  "status" = 'WAITING_LIST',
  "notes"  = NULLIF(BTRIM(REPLACE("notes", '[WAITING_LIST]', '')), '')
WHERE "notes" LIKE '%[WAITING_LIST]%'
  AND "status" = 'SCHEDULED'
  AND "deleted_at" IS NULL;

-- Matrículas que já saíram de SCHEDULED: mantém o status atual e só limpa o
-- marcador, para que nada volte a ser interpretado por substring.
UPDATE "enrollments"
SET "notes" = NULLIF(BTRIM(REPLACE("notes", '[WAITING_LIST]', '')), '')
WHERE "notes" LIKE '%[WAITING_LIST]%';
