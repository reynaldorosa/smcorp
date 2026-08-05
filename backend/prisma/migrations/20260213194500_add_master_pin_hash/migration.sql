-- Add dedicated hash column for MASTER PIN
ALTER TABLE "users"
ADD COLUMN "master_pin_hash" TEXT;

-- Backfill from current password hash for existing MASTER users (compatibility)
UPDATE "users"
SET "master_pin_hash" = "password"
WHERE "role" = 'MASTER'
  AND "deleted_at" IS NULL
  AND "master_pin_hash" IS NULL;
