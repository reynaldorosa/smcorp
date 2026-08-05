-- Add RG field to students for operational enrollment parity
ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "rg" TEXT;
