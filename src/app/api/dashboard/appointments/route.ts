import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's appointments from database
        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: today,
                    lt: tomorrow
                },
                status: {
                    not: 'cancelled'
                }
            },
            include: {
                patient: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: {
                appointmentTime: 'asc'
            }
        });

        // Format appointments for the frontend
        const formattedAppointments = appointments.map((appointment: any) => {
            // Use patient name if available, otherwise use guest name
            const patientName = appointment.patient?.fullName || appointment.guestName || 'Guest';

            // Parse time string (e.g., "14:30" or "2:30 PM")
            let formattedTime = appointment.appointmentTime;
            try {
                // If time is in 24-hour format (HH:mm), convert to 12-hour
                if (appointment.appointmentTime.includes(':') && !appointment.appointmentTime.includes('AM') && !appointment.appointmentTime.includes('PM')) {
                    const [hours, minutes] = appointment.appointmentTime.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    formattedTime = `${displayHour}:${minutes} ${ampm}`;
                }
            } catch (e) {
                // If parsing fails, use original time
                formattedTime = appointment.appointmentTime;
            }

            return {
                id: appointment.id,
                patientName: patientName,
                time: formattedTime,
                type: appointment.reason || 'General Consultation',
                status: appointment.status.toLowerCase()
            };
        });

        return NextResponse.json(formattedAppointments);

    } catch (error) {
        console.error('Error fetching today\'s appointments:', error);

        // Return empty array if database fails
        return NextResponse.json([]);
    }
}