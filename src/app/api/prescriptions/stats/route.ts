// src/app/api/prescriptions/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// ============================================
// GET /api/prescriptions/stats
// Get prescription statistics for dashboard
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'week'; // today, week, month, year

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Get total prescriptions
        const totalPrescriptions = await prisma.prescription.count();

        // Get prescriptions in period
        const periodPrescriptions = await prisma.prescription.count({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
        });

        // Get today's prescriptions
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayPrescriptions = await prisma.prescription.count({
            where: {
                createdAt: {
                    gte: todayStart,
                },
            },
        });

        // Get prescriptions by status
        const statusCounts = await prisma.prescription.groupBy({
            by: ['status'],
            _count: true,
        });

        const statusStats = {
            draft: statusCounts.find(s => s.status === 'DRAFT')?._count || 0,
            completed: statusCounts.find(s => s.status === 'COMPLETED')?._count || 0,
            dispensed: statusCounts.find(s => s.status === 'DISPENSED')?._count || 0,
            closed: statusCounts.find(s => s.status === 'CLOSED')?._count || 0,
        };

        // Pending to dispense (COMPLETED status)
        const pendingDispense = statusStats.completed;

        // Get follow-ups due (next 7 days)
        const weekFromNow = new Date();
        weekFromNow.setDate(now.getDate() + 7);

        const upcomingFollowUps = await prisma.prescription.count({
            where: {
                followUpDate: {
                    gte: now,
                    lte: weekFromNow,
                },
                status: {
                    not: 'CLOSED',
                },
            },
        });

        // Most prescribed medicines (top 10)
        const mostPrescribedMedicines = await prisma.prescriptionMedicine.groupBy({
            by: ['medicineId', 'medicineName'],
            _count: true,
            orderBy: {
                _count: {
                    medicineId: 'desc',
                },
            },
            take: 10,
        });

        // Recent prescriptions trend (last 7 days)
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const count = await prisma.prescription.count({
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
            });

            trendData.push({
                date: date.toISOString().split('T')[0],
                count,
            });
        }

        return NextResponse.json({
            overview: {
                total: totalPrescriptions,
                period: periodPrescriptions,
                today: todayPrescriptions,
                pendingDispense,
                upcomingFollowUps,
            },
            statusBreakdown: statusStats,
            mostPrescribedMedicines: mostPrescribedMedicines.map(m => ({
                medicineId: m.medicineId,
                medicineName: m.medicineName,
                count: m._count,
            })),
            trend: trendData,
        });

    } catch (error) {
        console.error('Error fetching prescription stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}