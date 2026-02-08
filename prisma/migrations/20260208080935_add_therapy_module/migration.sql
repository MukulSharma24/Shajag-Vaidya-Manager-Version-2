-- CreateTable
CREATE TABLE "therapy_plans" (
    "id" TEXT NOT NULL,
    "planNumber" VARCHAR(50) NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapyTypes" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pricePerSession" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billId" TEXT,
    "notes" TEXT,
    "instructions" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapy_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_sessions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "therapyType" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "duration" INTEGER,
    "observations" TEXT,
    "vitals" TEXT,
    "patientFeedback" TEXT,
    "discomfort" TEXT,
    "rescheduledFrom" TIMESTAMP(3),
    "rescheduledTo" TIMESTAMP(3),
    "rescheduledNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapy_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "therapy_plans_planNumber_key" ON "therapy_plans"("planNumber");

-- CreateIndex
CREATE INDEX "therapy_plans_patientId_idx" ON "therapy_plans"("patientId");

-- CreateIndex
CREATE INDEX "therapy_plans_status_idx" ON "therapy_plans"("status");

-- CreateIndex
CREATE INDEX "therapy_plans_startDate_idx" ON "therapy_plans"("startDate");

-- CreateIndex
CREATE INDEX "therapy_sessions_planId_idx" ON "therapy_sessions"("planId");

-- CreateIndex
CREATE INDEX "therapy_sessions_scheduledDate_idx" ON "therapy_sessions"("scheduledDate");

-- CreateIndex
CREATE INDEX "therapy_sessions_status_idx" ON "therapy_sessions"("status");

-- AddForeignKey
ALTER TABLE "therapy_plans" ADD CONSTRAINT "therapy_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_plans" ADD CONSTRAINT "therapy_plans_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "therapy_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
