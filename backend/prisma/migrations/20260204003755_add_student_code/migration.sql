-- AlterTable: Adicionar campo code aos alunos
ALTER TABLE "students" ADD COLUMN "code" TEXT;

-- Criar índice para o campo code
CREATE UNIQUE INDEX "students_code_key" ON "students"("code");

-- Criar índice regular para busca
CREATE INDEX "students_code_idx" ON "students"("code");
