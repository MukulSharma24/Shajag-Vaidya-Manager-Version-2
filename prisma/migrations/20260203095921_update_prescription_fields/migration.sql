-- AlterTable
ALTER TABLE "prescription_medicines" ADD COLUMN     "dosageAfternoon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dosageEvening" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dosageMorning" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dosageNight" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "medicineType" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "route" TEXT,
ADD COLUMN     "stockAvailable" INTEGER,
ADD COLUMN     "strength" TEXT,
ADD COLUMN     "unitType" TEXT NOT NULL DEFAULT 'Strip';

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "dietaryAdvice" TEXT,
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "vitals" TEXT;
