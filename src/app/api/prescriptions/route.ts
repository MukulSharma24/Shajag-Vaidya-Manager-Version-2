// src/app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/prescriptions
// List all prescriptions with filters
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Query parameters
        const patientId = searchParams.get('patientId');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: any = {};

        if (patientId) {
            where.patientId = patientId;
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { patient: { fullName: { contains: search, mode: 'insensitive' } } },
                { patient: { phoneNumber: { contains: search } } },
                { diagnosis: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Fetch prescriptions with relations
        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        age: true,
                        gender: true,
                        phoneNumber: true,
                        email: true,
                    },
                },
                medicines: {
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                currentStock: true,
                                sellingPrice: true,
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
            skip: (page - 1) * limit,
            take: limit,
        });

        // Get total count for pagination
        const total = await prisma.prescription.count({ where });

        return NextResponse.json({
            prescriptions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prescriptions' },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/prescriptions
// Create new prescription
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            patientId,
            appointmentId,
            chiefComplaints,
            symptoms,
            diagnosis,
            vitals,
            medicines,
            instructions,
            dietaryAdvice,
            followUpDate,
            followUpNotes,
            status = 'DRAFT',
            createdBy,
        } = body;

        // Validate required fields
        if (!patientId || !chiefComplaints) {
            return NextResponse.json(
                { error: 'Patient and chief complaints are required' },
                { status: 400 }
            );
        }

        console.log('📝 Creating prescription for patient:', patientId);

        // ✅ Create prescription - Let Prisma auto-increment prescriptionNo
        const prescription = await prisma.prescription.create({
            data: {
                // ✅ NO prescriptionNo - Prisma auto-increments
                patientId,
                appointmentId: appointmentId || undefined,
                chiefComplaints,
                symptoms: symptoms || null,
                diagnosis: diagnosis || null,
                vitals: vitals || null,
                instructions: instructions || null,
                dietaryAdvice: dietaryAdvice || null,
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                followUpNotes: followUpNotes || null,
                status,
                createdBy: createdBy || null,
                medicines: {
                    create: medicines?.map((med: any, index: number) => ({
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
                medicines: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        console.log('✅ Prescription created with number:', prescription.prescriptionNo);

        return NextResponse.json(prescription, { status: 201 });

    } catch (error: any) {
        console.error('❌ Error creating prescription:', error);
        return NextResponse.json(
            {
                error: 'Failed to create prescription',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}