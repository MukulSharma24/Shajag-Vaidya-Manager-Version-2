-- CreateTable
CREATE TABLE "quick_income" (
    "id" TEXT NOT NULL,
    "entryNumber" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "patientName" VARCHAR(255),
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "referenceNumber" VARCHAR(255),
    "category" TEXT NOT NULL DEFAULT 'DIRECT_PAYMENT',
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicId" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quick_income_entryNumber_key" ON "quick_income"("entryNumber");

-- CreateIndex
CREATE INDEX "quick_income_clinicId_idx" ON "quick_income"("clinicId");

-- CreateIndex
CREATE INDEX "quick_income_receivedDate_idx" ON "quick_income"("receivedDate");

-- CreateIndex
CREATE INDEX "quick_income_category_idx" ON "quick_income"("category");

-- AddForeignKey
ALTER TABLE "quick_income" ADD CONSTRAINT "quick_income_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
