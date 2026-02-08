import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get current year
        const currentYear = new Date().getFullYear();

        // Initialize data for all 12 months
        const monthlyData = {
            newPatients: Array(12).fill(0),
            followUps: Array(12).fill(0)
        };

        // Fetch all patients created this year
        const patients = await prisma.patient.findMany({
            where: {
                createdAt: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                }
            },
            select: {
                createdAt: true
            }
        });

        // Count new patients by month
        patients.forEach(patient => {
            const month = patient.createdAt.getMonth(); // 0-11
            monthlyData.newPatients[month]++;
        });

        // Fetch all appointments this year
        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lt: new Date(`${currentYear + 1}-01-01`)
                },
                status: {
                    not: 'cancelled'
                }
            },
            select: {
                appointmentDate: true,
                patientId: true
            }
        });

        // Count follow-up appointments by month
        // Group appointments by patient to identify follow-ups
        const patientAppointments: Record<string, Date[]> = {};

        appointments.forEach(appointment => {
            if (appointment.patientId) {
                if (!patientAppointments[appointment.patientId]) {
                    patientAppointments[appointment.patientId] = [];
                }
                patientAppointments[appointment.patientId].push(appointment.appointmentDate);
            }
        });

        // Count follow-ups (2nd appointment onwards for each patient)
        Object.values(patientAppointments).forEach(dates => {
            // Sort dates
            dates.sort((a, b) => a.getTime() - b.getTime());

            // Skip first appointment (it's new patient), count rest as follow-ups
            dates.slice(1).forEach(date => {
                const month = date.getMonth(); // 0-11
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

        // Return empty data if database fails
        return NextResponse.json({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            newPatients: Array(12).fill(0),
            followUps: Array(12).fill(0)
        });
    }
}