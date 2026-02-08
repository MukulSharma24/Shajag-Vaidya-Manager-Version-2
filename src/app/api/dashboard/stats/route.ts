import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch real-time data from database using Prisma
        const [
            totalPatients,
            todayAppointments
        ] = await Promise.all([
            // Total Patients
            prisma.patient.count(),

            // Today's Appointments
            prisma.appointment.count({
                where: {
                    appointmentDate: {
                        gte: today,
                        lt: tomorrow
                    },
                    status: {
                        not: 'cancelled'
                    }
                }
            })
        ]);

        return NextResponse.json({
            totalPatients,
            todayAppointments,
            medicinesStock: 0,        // Add when you have medicine table
            therapyAssignments: 0,     // Add when you have therapy table
            totalStaff: 0,             // Add when you have staff table
            totalRevenue: '₹0'         // Add when you have invoice/billing table
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);

        // Return sample data if database fails
        return NextResponse.json({
            totalPatients: 0,
            todayAppointments: 0,
            medicinesStock: 0,
            therapyAssignments: 0,
            totalStaff: 0,
            totalRevenue: '₹0'
        });
    }
}