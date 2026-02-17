// src/app/api/patient-portal/appointments/[id]/respond/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get token from cookies
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyJWT(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only patients can use this endpoint
        if (user.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Only patients can respond to appointment alternatives' }, { status: 403 });
        }

        // Get patientId from JWT
        const patientId = user.patientId;
        if (!patientId) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        const body = await request.json();
        const { action } = body;

        if (!action || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be accept or decline' }, { status: 400 });
        }

        // Get the appointment and verify it belongs to this patient
        const appointment = await prisma.appointment.findUnique({
            where: { id: params.id },
            include: { patient: true }
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Verify this appointment belongs to the logged-in patient
        if (appointment.patientId !== patientId) {
            return NextResponse.json({ error: 'Unauthorized - This appointment does not belong to you' }, { status: 403 });
        }

        // Check if appointment is in ALTERNATIVE_PROPOSED status
        if (appointment.status !== 'ALTERNATIVE_PROPOSED') {
            return NextResponse.json({
                error: 'This appointment does not have a pending alternative to respond to'
            }, { status: 400 });
        }

        let updatedAppointment;

        if (action === 'accept') {
            // Accept the alternative - change status to SCHEDULED
            updatedAppointment = await prisma.appointment.update({
                where: { id: params.id },
                data: {
                    status: 'SCHEDULED',
                    notes: appointment.notes
                        ? `${appointment.notes}\n\n[Alternative accepted by patient on ${new Date().toLocaleDateString()}]`
                        : `[Alternative accepted by patient on ${new Date().toLocaleDateString()}]`
                },
                include: { patient: true }
            });

            return NextResponse.json({
                success: true,
                message: 'Appointment confirmed! You are now scheduled for the proposed time.',
                appointment: updatedAppointment
            });

        } else if (action === 'decline') {
            // Decline the alternative - change status to CANCELLED
            updatedAppointment = await prisma.appointment.update({
                where: { id: params.id },
                data: {
                    status: 'CANCELLED',
                    notes: appointment.notes
                        ? `${appointment.notes}\n\n[Alternative declined by patient on ${new Date().toLocaleDateString()}]`
                        : `[Alternative declined by patient on ${new Date().toLocaleDateString()}]`
                },
                include: { patient: true }
            });

            return NextResponse.json({
                success: true,
                message: 'You have declined the proposed time. You can request a new appointment if needed.',
                appointment: updatedAppointment
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error responding to appointment alternative:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}