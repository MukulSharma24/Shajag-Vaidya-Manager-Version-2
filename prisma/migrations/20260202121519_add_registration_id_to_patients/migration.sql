/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "registrationId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "patients_registrationId_key" ON "patients"("registrationId");
