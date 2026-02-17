export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const currentYear = new Date().getFullYear();

        const monthlyData = {
            newPatients: Array(12).fill(0),
            followUps: Array(12).fill(0)
        };

        const patients = await prisma.patient.findMany({
            where: {
                createdAt: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                }
            },
            select: { createdAt: true }
        });

        patients.forEach(patient => {
            const month = patient.createdAt.getMonth();
            monthlyData.newPatients[month]++;
        });

        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                },
                status: { not: 'cancelled' }
            },
            select: {
                appointmentDate: true,
                patientId: true
            }
        });

        const patientAppointments: Record<string, Date[]> = {};
        appointments.forEach(appointment => {
            if (appointment.patientId) {
                if (!patientAppointments[appointment.patientId]) {
                    patientAppointments[appointment.patientId] = [];
                }
                patientAppointments[appointment.patientId].push(appointment.appointmentDate);
            }
        });

        Object.values(patientAppointments).forEach(dates => {
            dates.sort((a, b) => a.getTime() - b.getTime());
            dates.slice(1).forEach(date => {
                const month = date.getMonth();
                monthlyData.followUps[month]++;
            });
        });

        return NextResponse.json({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            newPatients: monthlyData.newPatients,
            followUps: monthlyData.followUps
        });

    } catch (error) {
        console.error('Error fetching patient flow data:', error);
        return NextResponse.json({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            newPatients: Array(12).fill(0),
            followUps: Array(12).fill(0)
        });
    }
}