// src/app/api/patient-portal/appointments/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// POST - Patient requests appointment
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Patients only' }, { status: 403 });
        }

        let patientId = currentUser.patientId;
        if (!patientId) {
            const user = await prisma.user.findUnique({
                where: { id: currentUser.userId },
                include: { patient: { select: { id: true } } },
            });
            patientId = user?.patient?.id;
        }

        if (!patientId) {
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }

        const { preferredDate, preferredTime, reason, notes } = await req.json();

        if (!preferredDate || !preferredTime || !reason) {
            return NextResponse.json({ error: 'Date, time, and reason are required' }, { status: 400 });
        }

        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                appointmentDate: new Date(preferredDate),
                appointmentTime: preferredTime,
                reason,
                notes: notes || null,
                status: 'PENDING_APPROVAL',
                duration: 30,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Appointment request submitted',
            appointment: {
                id: appointment.id,
                date: appointment.appointmentDate,
                time: appointment.appointmentTime,
                status: appointment.status,
            },
        }, { status: 201 });

    } catch (error) {
        console.error('Appointment request error:', error);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }
}

// GET - Get patient's appointments
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || currentUser.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Patients only' }, { status: 403 });
        }

        let patientId = currentUser.patientId;
        if (!patientId) {
            const user = await prisma.user.findUnique({
                where: { id: currentUser.userId },
                include: { patient: { select: { id: true } } },
            });
            patientId = user?.patient?.id;
        }

        if (!patientId) {
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ appointments });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}