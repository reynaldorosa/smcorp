-- Suporte a múltiplos instrutores por turma
CREATE TABLE IF NOT EXISTS class_instructors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id TEXT NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS class_instructors_class_id_idx
  ON class_instructors (class_id);

CREATE INDEX IF NOT EXISTS class_instructors_instructor_id_idx
  ON class_instructors (instructor_id);

CREATE UNIQUE INDEX IF NOT EXISTS class_instructors_unique_active_idx
  ON class_instructors (class_id, instructor_id)
  WHERE deleted_at IS NULL;
