ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "User_clinicId_idx" ON "User"("clinicId");

ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE;

ALTER TABLE "quick_income" ALTER COLUMN "clinicId" SET NOT NULL;

ALTER TABLE "payment_confirmations" ALTER COLUMN "clinicId" SET NOT NULL;