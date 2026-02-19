import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const where: any = { clinicId: payload.clinicId };

        if (search && search.length >= 1) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const patients = await prisma.patient.findMany({
            where,
            select: {
                id: true, fullName: true, dateOfBirth: true, age: true,
                gender: true, phoneNumber: true, email: true,
                bloodGroup: true, constitutionType: true,
            },
            orderBy: { fullName: 'asc' },
            take: 50,
        });

        return NextResponse.json({ patients, count: patients.length });
    } catch (error: any) {
        return NextResponse.json({ message: 'Failed to fetch patients', error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        if (!body.fullName || !body.phoneNumber) {
            return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
        }

        const patient = await prisma.patient.create({
            data: {
                clinicId: payload.clinicId,
                fullName: body.fullName,
                dateOfBirth: new Date(body.dateOfBirth),
                age: parseInt(body.age),
                gender: body.gender,
                phoneNumber: body.phoneNumber,
                email: body.email || null,
                bloodGroup: body.bloodGroup || null,
                addressLine1: body.addressLine1 || null,
                addressLine2: body.addressLine2 || null,
                postalCode: body.postalCode || null,
                city: body.city || null,
                state: body.state || null,
                constitutionType: body.constitutionType,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(patient, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create patient', message: error.message }, { status: 500 });
    }
}
