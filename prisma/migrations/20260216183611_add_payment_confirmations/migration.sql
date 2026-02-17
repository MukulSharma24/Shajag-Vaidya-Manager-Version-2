-- CreateTable
CREATE TABLE "payment_confirmations" (
    "id" TEXT NOT NULL,
    "confirmationNumber" VARCHAR(50) NOT NULL,
    "patientId" TEXT NOT NULL,
    "patientName" VARCHAR(255) NOT NULL,
    "patientEmail" VARCHAR(255) NOT NULL,
    "patientPhone" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "notes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_confirmations_confirmationNumber_key" ON "payment_confirmations"("confirmationNumber");

-- CreateIndex
CREATE INDEX "payment_confirmations_patientId_idx" ON "payment_confirmations"("patientId");

-- CreateIndex
CREATE INDEX "payment_confirmations_clinicId_idx" ON "payment_confirmations"("clinicId");

-- CreateIndex
CREATE INDEX "payment_confirmations_status_idx" ON "payment_confirmations"("status");

-- CreateIndex
CREATE INDEX "payment_confirmations_createdAt_idx" ON "payment_confirmations"("createdAt");

-- AddForeignKey
ALTER TABLE "payment_confirmations" ADD CONSTRAINT "payment_confirmations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_confirmations" ADD CONSTRAINT "payment_confirmations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
