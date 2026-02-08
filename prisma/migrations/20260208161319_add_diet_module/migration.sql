-- CreateTable
CREATE TABLE "diet_plans" (
    "id" TEXT NOT NULL,
    "planNumber" VARCHAR(50) NOT NULL,
    "patientId" TEXT NOT NULL,
    "constitution" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "morningMeal" TEXT NOT NULL,
    "lunchMeal" TEXT NOT NULL,
    "eveningMeal" TEXT NOT NULL,
    "guidelines" TEXT,
    "restrictions" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "compliance" TEXT DEFAULT 'NOT_ASSESSED',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diet_plans_planNumber_key" ON "diet_plans"("planNumber");

-- CreateIndex
CREATE INDEX "diet_plans_patientId_idx" ON "diet_plans"("patientId");

-- CreateIndex
CREATE INDEX "diet_plans_constitution_idx" ON "diet_plans"("constitution");

-- CreateIndex
CREATE INDEX "diet_plans_season_idx" ON "diet_plans"("season");

-- CreateIndex
CREATE INDEX "diet_plans_status_idx" ON "diet_plans"("status");

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
