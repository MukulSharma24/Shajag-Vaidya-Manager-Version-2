// src/app/api/prescriptions/patient/[patientId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/prescriptions/patient/[patientId]
// Get patient prescription history
// Phase 2 Feature: View past prescriptions
// ============================================
export async function GET(
    request: NextRequest,
    { params }: { params: { patientId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get patient's prescriptions
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientId: params.patientId,
            },
            include: {
                medicines: {
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                currentStock: true,
                            },
                        },
                    },
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        // Get patient info - FIXED: Using correct field names from schema
        const patient = await prisma.patient.findUnique({
            where: { id: params.patientId },
            select: {
                id: true,
                registrationId: true,
                fullName: true,        // Fixed: was 'name'
                age: true,
                gender: true,
                phoneNumber: true,     // Fixed: was 'phone'
                email: true,
                bloodGroup: true,
                constitutionType: true, // Fixed: was 'constitution'
                notes: true,           // Can contain allergy info if needed
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        // Format response
        const history = prescriptions.map(rx => ({
            id: rx.id,
            prescriptionNo: rx.prescriptionNo,
            date: rx.createdAt,
            chiefComplaints: rx.chiefComplaints,
            diagnosis: rx.diagnosis,
            status: rx.status,
            medicineCount: rx.medicines.length,
            medicines: rx.medicines.map(m => ({
                id: m.id,
                name: m.medicineName,
                dosage: m.dosageFormat,
                duration: `${m.duration} ${m.durationUnit.toLowerCase()}`,
            })),
        }));

        return NextResponse.json({
            patient,
            prescriptions: history,
            total: prescriptions.length,
        });

    } catch (error) {
        console.error('Error fetching patient prescription history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prescription history' },
            { status: 500 }
        );
    }
}