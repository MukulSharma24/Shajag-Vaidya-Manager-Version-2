// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// Helper to get clinicId - from JWT or fallback to database lookup
async function getClinicId(payload: any): Promise<string | null> {
    if (payload?.clinicId) return payload.clinicId;

    if (payload?.userId) {
        const staff = await prisma.staff.findFirst({
            where: { userId: payload.userId },
            select: { clinicId: true },
        });
        if (staff?.clinicId) return staff.clinicId;
    }

    const defaultClinic = await prisma.clinic.findFirst({ select: { id: true } });
    return defaultClinic?.id || null;
}

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await getUserFromToken(token);
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const clinicId = await getClinicId(payload);
        if (!clinicId) return NextResponse.json({ error: 'No clinic found' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const patientId = searchParams.get('patientId');

        const where: any = { clinicId };
        if (startDate || endDate) {
            where.appointmentDate = {};
            if (startDate) where.appointmentDate.gte = new Date(startDate);
            if (endDate) where.appointmentDate.lt = new Date(endDate);
        }
        if (status && status !== 'all') where.status = status;
        if (patientId) where.patientId = patientId;

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true, registrationId: true, fullName: true,
                        age: true, gender: true, phoneNumber: true,
                        email: true, bloodGroup: true, addressLine1: true,
                        constitutionType: true, dateOfBirth: true,
                    },
                },
            },
            orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        });

        return NextResponse.json({ appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await getUserFromToken(token);
        if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const clinicId = await getClinicId(payload);
        if (!clinicId) return NextResponse.json({ error: 'No clinic found. Please contact administrator.' }, { status: 400 });

        const body = await request.json();

        console.log('📅 Creating appointment for clinic:', clinicId);

        if (!body.appointmentDate || !body.appointmentTime || !body.reason) {
            return NextResponse.json({ error: 'Date, time, and reason are required' }, { status: 400 });
        }

        if (!body.patientId && !body.guestName) {
            return NextResponse.json({ error: 'Either patient or guest information is required' }, { status: 400 });
        }

        const appointment = await prisma.appointment.create({
            data: {
                clinicId,
                patientId: body.patientId || null,
                guestName: body.guestName || null,
                guestPhone: body.guestPhone || null,
                guestEmail: body.guestEmail || null,
                appointmentDate: new Date(body.appointmentDate),
                appointmentTime: body.appointmentTime,
                duration: parseInt(body.duration) || 30,
                reason: body.reason,
                notes: body.notes || null,
                status: 'scheduled',
            },
            include: {
                patient: {
                    select: { id: true, fullName: true, phoneNumber: true, email: true },
                },
            },
        });

        console.log('✅ Appointment created:', appointment.id);
        return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
        console.error('❌ Error creating appointment:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await getUserFromToken(token);
        const clinicId = await getClinicId(payload);

        const body = await request.json();
        const { id, status, notes, appointmentDate, appointmentTime, reason } = body;

        if (!id) return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });

        const existing = await prisma.appointment.findFirst({
            where: { id, ...(clinicId && { clinicId }) },
        });

        if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (appointmentDate !== undefined) updateData.appointmentDate = new Date(appointmentDate);
        if (appointmentTime !== undefined) updateData.appointmentTime = appointmentTime;
        if (reason !== undefined) updateData.reason = reason;

        const appointment = await prisma.appointment.update({
            where: { id },
            data: updateData,
            include: {
                patient: {
                    select: { id: true, fullName: true, phoneNumber: true, email: true },
                },
            },
        });

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}