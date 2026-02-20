// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// Helper to get clinicId - from JWT or fallback to default clinic
async function getClinicId(payload: any): Promise<string | null> {
    // First try from JWT payload
    if (payload?.clinicId) {
        return payload.clinicId;
    }

    // If user has userId, try to get clinicId from User record
    if (payload?.userId) {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                clinicId: true,
                staff: { select: { clinicId: true } },
                patient: { select: { clinicId: true } },
            },
        });

        if (user?.clinicId) return user.clinicId;
        if (user?.staff?.clinicId) return user.staff.clinicId;
        if (user?.patient?.clinicId) return user.patient.clinicId;
    }

    // Fallback: get default clinic
    const defaultClinic = await prisma.clinic.findFirst({
        select: { id: true },
    });

    return defaultClinic?.id || null;
}

// GET /api/patients - List all patients
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getUserFromToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const clinicId = await getClinicId(payload);
        if (!clinicId) {
            return NextResponse.json({ error: 'No clinic found' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {
            clinicId: clinicId,
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
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
                    treatmentCount: true,
                    lastVisit: true,
                    notes: true,
                    createdAt: true,
                },
            }),
            prisma.patient.count({ where }),
        ]);

        return NextResponse.json({
            patients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients' },
            { status: 500 }
        );
    }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getUserFromToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const clinicId = await getClinicId(payload);
        if (!clinicId) {
            return NextResponse.json(
                { error: 'No clinic found. Please contact administrator.' },
                { status: 400 }
            );
        }

        const body = await request.json();

        console.log('📝 Creating patient:', body.fullName, 'for clinic:', clinicId);

        // Validate required fields
        if (!body.fullName || !body.dateOfBirth || !body.gender || !body.phoneNumber) {
            return NextResponse.json(
                { error: 'Full name, date of birth, gender, and phone number are required' },
                { status: 400 }
            );
        }

        // Calculate age from date of birth
        const dob = new Date(body.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        const patient = await prisma.patient.create({
            data: {
                clinicId: clinicId,  // ✅ REQUIRED - from JWT/lookup
                fullName: body.fullName,
                dateOfBirth: dob,
                age: body.age || age,
                gender: body.gender,
                phoneNumber: body.phoneNumber,
                email: body.email || null,
                bloodGroup: body.bloodGroup || null,
                addressLine1: body.addressLine1 || null,
                addressLine2: body.addressLine2 || null,
                city: body.city || null,
                state: body.state || null,
                postalCode: body.postalCode || null,
                constitutionType: body.constitutionType || 'Not assessed yet',
                notes: body.notes || null,
            },
        });

        console.log('✅ Patient created:', patient.id);

        return NextResponse.json(patient, { status: 201 });
    } catch (error) {
        console.error('❌ Error creating patient:', error);
        return NextResponse.json(
            { error: 'Failed to create patient', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}