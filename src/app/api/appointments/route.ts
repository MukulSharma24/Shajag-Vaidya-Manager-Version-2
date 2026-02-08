// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /api/appointments
// List all appointments with filters
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        const where: any = {};

        // Filter by date range
        if (startDate || endDate) {
            where.appointmentDate = {};
            if (startDate) where.appointmentDate.gte = new Date(startDate);
            if (endDate) where.appointmentDate.lt = new Date(endDate);
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        console.log('📅 Fetching appointments with filters:', where);

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        registrationId: true,
                        fullName: true,
                        age: true,
                        gender: true,
                        phoneNumber: true,
                        email: true,
                        bloodGroup: true,
                        addressLine1: true,
                        constitutionType: true,
                    },
                },
            },
            orderBy: [
                { appointmentDate: 'asc' },
                { appointmentTime: 'asc' },
            ],
        });

        console.log('✅ Found', appointments.length, 'appointments');

        return NextResponse.json({ appointments });
    } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        );
    }
}

// ============================================
// POST /api/appointments
// Create new appointment
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const appointment = await prisma.appointment.create({
            data: {
                patientId: body.patientId || null,
                guestName: body.guestName || null,
                guestPhone: body.guestPhone || null,
                guestEmail: body.guestEmail || null,
                appointmentDate: new Date(body.appointmentDate),
                appointmentTime: body.appointmentTime,
                duration: parseInt(body.duration),
                reason: body.reason,
                notes: body.notes || null,
                status: 'scheduled',
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
        console.error('Error creating appointment:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        );
    }
}