import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/prescriptions/[id]/dispense - Dispense prescription and update stock
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { performedBy = 'current-user-id' } = body;

        // Get prescription with medicines
        const prescription = await prisma.prescription.findUnique({
            where: { id: params.id },
            include: {
                medicines: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        if (!prescription) {
            return NextResponse.json(
                { message: 'Prescription not found' },
                { status: 404 }
            );
        }

        if (prescription.status === 'DISPENSED') {
            return NextResponse.json(
                { message: 'Prescription has already been dispensed' },
                { status: 400 }
            );
        }

        // Check stock availability for all medicines
        const stockIssues = [];
        for (const prescMed of prescription.medicines) {
            if (prescMed.medicine.currentStock < prescMed.quantityNeeded) {
                stockIssues.push({
                    medicine: prescMed.medicineName,
                    required: prescMed.quantityNeeded,
                    available: prescMed.medicine.currentStock,
                });
            }
        }

        if (stockIssues.length > 0) {
            return NextResponse.json(
                {
                    message: 'Insufficient stock for one or more medicines',
                    stockIssues,
                },
                { status: 400 }
            );
        }

        // Use a transaction to update stock and create stock transactions
        const result = await prisma.$transaction(async (tx) => {
            // Update medicine stock and create transactions
            for (const prescMed of prescription.medicines) {
                const currentMedicine = prescMed.medicine;
                const newStock = currentMedicine.currentStock - prescMed.quantityNeeded;

                // Update medicine stock
                await tx.medicine.update({
                    where: { id: prescMed.medicineId },
                    data: {
                        currentStock: newStock,
                    },
                });

                // Create stock transaction record
                await tx.stockTransaction.create({
                    data: {
                        medicineId: prescMed.medicineId,
                        type: 'OUT',
                        quantity: prescMed.quantityNeeded,
                        balanceAfter: newStock, // THIS WAS MISSING!
                        reason: 'Prescription Dispensed',
                        notes: `Prescription: ${prescription.prescriptionNo}`,
                        userId: performedBy,
                    },
                });
            }

            // Update prescription status
            const updatedPrescription = await tx.prescription.update({
                where: { id: params.id },
                data: {
                    status: 'DISPENSED',
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            registrationId: true,
                            fullName: true,
                            phoneNumber: true,
                        },
                    },
                    medicines: {
                        include: {
                            medicine: true,
                        },
                    },
                },
            });

            return updatedPrescription;
        });

        return NextResponse.json({
            message: 'Prescription dispensed successfully',
            prescription: result,
        });
    } catch (error) {
        console.error('Error dispensing prescription:', error);
        return NextResponse.json(
            {
                message: 'Failed to dispense prescription',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}