export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: { gte: today, lt: tomorrow },
                status: { not: 'cancelled' }
            },
            include: {
                patient: {
                    select: { fullName: true }
                }
            },
            orderBy: { appointmentTime: 'asc' }
        });

        const formattedAppointments = appointments.map((appointment: any) => {
            const patientName = appointment.patient?.fullName || appointment.guestName || 'Guest';

            let formattedTime = appointment.appointmentTime;
            try {
                if (
                    appointment.appointmentTime.includes(':') &&
                    !appointment.appointmentTime.includes('AM') &&
                    !appointment.appointmentTime.includes('PM')
                ) {
                    const [hours, minutes] = appointment.appointmentTime.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    formattedTime = `${displayHour}:${minutes} ${ampm}`;
                }
            } catch {
                formattedTime = appointment.appointmentTime;
            }

            return {
                id: appointment.id,
                patientName,
                time: formattedTime,
                type: appointment.reason || 'General Consultation',
                status: appointment.status.toLowerCase()
            };
        });

        return NextResponse.json(formattedAppointments);

    } catch (error) {
        console.error("Error fetching today's appointments:", error);
        return NextResponse.json([]);
    }
}