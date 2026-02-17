import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// POST /api/patient-portal/appointments/[id]/respond
// Patient accepts or declines a staff-proposed alternative time
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);

        // This endpoint is for PATIENTS only
        if (!currentUser || currentUser.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Patients only' }, { status: 403 });
        }

        // Resolve the patient's ID
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

        const { action } = await req.json();

        if (!action || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "accept" or "decline"' }, { status: 400 });
        }

        // Fetch the appointment and verify it belongs to this patient
        const appointment = await prisma.appointment.findUnique({
            where: { id: params.id },
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.patientId !== patientId) {
            return NextResponse.json({ error: 'Not your appointment' }, { status: 403 });
        }

        // Can only respond to ALTERNATIVE_PROPOSED appointments
        if (appointment.status !== 'ALTERNATIVE_PROPOSED') {
            return NextResponse.json(
                { error: 'This appointment is not awaiting your response' },
                { status: 400 }
            );
        }

        if (action === 'accept') {
            // Confirm the appointment with the proposed date/time
            await prisma.appointment.update({
                where: { id: params.id },
                data: {
                    status: 'SCHEDULED',
                    // Keep the alternative date/time that was set by staff
                    // (those fields were already updated when staff proposed the alternative)
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Appointment confirmed! See you then.',
            });
        } else {
            // Patient declines — set back to cancelled
            await prisma.appointment.update({
                where: { id: params.id },
                data: { status: 'CANCELLED' },
            });

            return NextResponse.json({
                success: true,
                message: 'Appointment declined. You can request a new time anytime.',
            });
        }
    } catch (error: any) {
        console.error('Patient respond error:', error);
        return NextResponse.json(
            { error: 'Failed to respond to appointment', details: error?.message },
            { status: 500 }
        );
    }
}