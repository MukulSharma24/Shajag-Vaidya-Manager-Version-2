import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prescriptions/[id] - Get single prescription
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const prescription = await prisma.prescription.findUnique({
            where: { id: params.id },
            include: {
                patient: {
                    select: {
                        id: true,
                        registrationId: true,
                        fullName: true,
                        dateOfBirth: true,
                        age: true,
                        gender: true,
                        phoneNumber: true,
                        email: true,
                        bloodGroup: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        constitutionType: true,
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        appointmentDate: true,
                        appointmentTime: true,
                        reason: true,
                        status: true,
                    },
                },
                medicines: {
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                genericName: true,
                                type: true,
                                strength: true,
                                manufacturer: true,
                                currentStock: true,
                                reorderLevel: true,
                                sellingPrice: true,
                                mrp: true,
                            },
                        },
                    },
                    orderBy: {
                        orderIndex: 'asc',
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

        return NextResponse.json(prescription);
    } catch (error) {
        console.error('Error fetching prescription:', error);
        return NextResponse.json(
            { message: 'Failed to fetch prescription' },
            { status: 500 }
        );
    }
}

// PUT /api/prescriptions/[id] - Update prescription
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Delete existing medicines if updating
        await prisma.prescriptionMedicine.deleteMany({
            where: { prescriptionId: params.id },
        });

        const prescription = await prisma.prescription.update({
            where: { id: params.id },
            data: {
                chiefComplaints: body.chiefComplaints,
                symptoms: body.symptoms || null,
                diagnosis: body.diagnosis || null,
                vitals: body.vitals || null,
                instructions: body.instructions || null,
                dietaryAdvice: body.dietaryAdvice || null,
                followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
                followUpNotes: body.followUpNotes || null,
                status: body.status,
                medicines: {
                    create: body.medicines?.map((med: any, index: number) => ({
                        medicineId: med.medicineId,
                        medicineName: med.medicineName,
                        medicineType: med.medicineType || null,
                        strength: med.strength || null,
                        manufacturer: med.manufacturer || null,
                        dosageFormat: med.dosageFormat,
                        dosageMorning: med.dosageMorning || 0,
                        dosageAfternoon: med.dosageAfternoon || 0,
                        dosageEvening: med.dosageEvening || 0,
                        dosageNight: med.dosageNight || 0,
                        duration: med.duration,
                        durationUnit: med.durationUnit || 'DAYS',
                        timing: med.timing || 'After Food',
                        frequency: med.frequency || null,
                        route: med.route || null,
                        instructions: med.instructions || null,
                        quantityNeeded: med.quantityNeeded || 1,
                        unitType: med.unitType || 'Strip',
                        stockAvailable: med.stockAvailable || null,
                        orderIndex: index,
                    })) || [],
                },
            },
            include: {
                patient: true,
                appointment: true,
                medicines: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        return NextResponse.json(prescription);
    } catch (error) {
        console.error('Error updating prescription:', error);
        return NextResponse.json(
            { message: 'Failed to update prescription' },
            { status: 500 }
        );
    }
}

// DELETE /api/prescriptions/[id] - Delete prescription
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.prescription.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            message: 'Prescription deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting prescription:', error);
        return NextResponse.json(
            { message: 'Failed to delete prescription' },
            { status: 500 }
        );
    }
}