-- Add new settings-alignment columns
ALTER TABLE "rooms" ADD COLUMN "address" TEXT;

ALTER TABLE "extra_products"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'extra',
  ADD COLUMN "associated_cost_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "suppliers" ADD COLUMN "code" TEXT;

ALTER TABLE "instructors"
  ADD COLUMN "role" TEXT,
  ADD COLUMN "cost_per_hour" DECIMAL(10,2),
  ADD COLUMN "cost_per_day" DECIMAL(10,2);

ALTER TABLE "instructors" ALTER COLUMN "specialties" SET DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "extra_products_code_key" ON "extra_products"("code");
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
