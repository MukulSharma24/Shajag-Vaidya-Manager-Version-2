-- AlterTable
ALTER TABLE "quick_income" ADD COLUMN     "patientId" TEXT;

-- CreateIndex
CREATE INDEX "quick_income_patientId_idx" ON "quick_income"("patientId");
