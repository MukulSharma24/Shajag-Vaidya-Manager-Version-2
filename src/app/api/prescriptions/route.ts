// src/app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// ============================================
// GET /api/prescriptions
// ============================================
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // ✅ Always scoped to clinic
        const where: any = {
            clinicId: payload.clinicId,
        };

        if (patientId) where.patientId = patientId;

        if (status && status !== 'all') where.status = status;

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
                    orderBy: { orderIndex: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

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
        return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
    }
}

// ============================================
// POST /api/prescriptions
// ============================================
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

        if (!patientId || !chiefComplaints) {
            return NextResponse.json(
                { error: 'Patient and chief complaints are required' },
                { status: 400 }
            );
        }

        console.log('📝 Creating prescription for patient:', patientId);

        const prescription = await prisma.prescription.create({
            data: {
                clinicId: payload.clinicId, // ✅ Always from JWT
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
                    include: { medicine: true },
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
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}