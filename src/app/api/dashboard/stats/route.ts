import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

// Sidebar roles reference (from Sidebar.tsx):
//   OWNER  → everything
//   DOCTOR → appointments, patients, prescriptions, pharmacy, therapy, diet, reports, communication, my-leaves, settings
//            ✗ no billing  ✗ no staff
//   STAFF  → appointments, patients, billing, my-leaves, settings
//            ✗ no pharmacy  ✗ no therapy  ✗ no staff  ✗ no prescriptions

const formatRevenue = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

export async function GET(req: NextRequest) {
    try {
        // ── Resolve role ─────────────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const currentUser = token ? await getUserFromToken(token) : null;
        const role = currentUser?.role || 'STAFF';

        // ── Shared date helpers ──────────────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // ── Always fetch: patients + today's appointments (all roles have these)
        const [totalPatients, todayAppointments] = await Promise.all([
            prisma.patient.count(),
            prisma.appointment.count({
                where: {
                    appointmentDate: { gte: today, lt: tomorrow },
                    status: { notIn: ['CANCELLED', 'cancelled', 'DECLINED'] },
                },
            }),
        ]);

        // ════════════════════════════════════════════════════════════════════
        // STAFF — has billing, no pharmacy/therapy/staff
        // Shows: patients, appointments, revenue
        // Hides: medicines, therapy, staff (null = card not rendered)
        // ════════════════════════════════════════════════════════════════════
        if (role === 'STAFF') {
            let totalRevenue = 0;
            try {
                const [billRev, quickInc] = await Promise.all([
                    prisma.bill.aggregate({
                        where: {
                            status: { in: ['PAID', 'PARTIAL'] },
                            createdAt: { gte: firstOfMonth },
                        },
                        _sum: { paidAmount: true },
                    }),
                    (prisma as any).quickIncome.aggregate({
                        where: { receivedDate: { gte: firstOfMonth } },
                        _sum: { amount: true },
                    }).catch(() => ({ _sum: { amount: 0 } })),
                ]);
                totalRevenue =
                    Number(billRev._sum.paidAmount || 0) +
                    Number(quickInc._sum.amount || 0);
            } catch { /* billing tables may not exist yet */ }

            return NextResponse.json({
                totalPatients,
                todayAppointments,
                medicinesStock: null,       // ✗ no pharmacy
                therapyAssignments: null,   // ✗ no therapy
                totalStaff: null,           // ✗ no staff management
                totalRevenue: formatRevenue(totalRevenue),
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // DOCTOR — has pharmacy/therapy, no billing/staff
        // Shows: patients, appointments, medicines, therapy
        // Hides: staff, revenue (null = card not rendered)
        // ════════════════════════════════════════════════════════════════════
        if (role === 'DOCTOR') {
            let medicinesStock = 0;
            let therapyAssignments = 0;
            try {
                const [med, therapy] = await Promise.all([
                    prisma.medicine.count({ where: { currentStock: { gt: 0 } } }),
                    prisma.therapyPlan.count({ where: { status: 'ACTIVE' } }),
                ]);
                medicinesStock = med;
                therapyAssignments = therapy;
            } catch { /* tables may not exist yet */ }

            return NextResponse.json({
                totalPatients,
                todayAppointments,
                medicinesStock,
                therapyAssignments,
                totalStaff: null,       // ✗ no staff management
                totalRevenue: null,     // ✗ no billing
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // OWNER — sees everything
        // ════════════════════════════════════════════════════════════════════
        let medicinesStock = 0;
        try {
            medicinesStock = await prisma.medicine.count({
                where: { currentStock: { gt: 0 } },
            });
        } catch { /* medicine table may not exist yet */ }

        let therapyAssignments = 0;
        try {
            therapyAssignments = await prisma.therapyPlan.count({
                where: { status: 'ACTIVE' },
            });
        } catch { /* therapy table may not exist yet */ }

        // Present today → fallback to total active staff
        let totalStaff = 0;
        try {
            const presentToday = await prisma.staffAttendance.count({
                where: {
                    attendanceDate: { gte: today, lt: tomorrow },
                    status: { in: ['PRESENT', 'LATE'] },
                },
            });
            totalStaff = presentToday > 0
                ? presentToday
                : await prisma.staff.count({ where: { status: 'ACTIVE' } });
        } catch { /* staff table may not exist yet */ }

        let totalRevenue = 0;
        try {
            const [billRev, quickInc] = await Promise.all([
                prisma.bill.aggregate({
                    where: {
                        status: { in: ['PAID', 'PARTIAL'] },
                        createdAt: { gte: firstOfMonth },
                    },
                    _sum: { paidAmount: true },
                }),
                (prisma as any).quickIncome.aggregate({
                    where: { receivedDate: { gte: firstOfMonth } },
                    _sum: { amount: true },
                }).catch(() => ({ _sum: { amount: 0 } })),
            ]);
            totalRevenue =
                Number(billRev._sum.paidAmount || 0) +
                Number(quickInc._sum.amount || 0);
        } catch { /* billing tables may not exist yet */ }

        return NextResponse.json({
            totalPatients,
            todayAppointments,
            medicinesStock,
            therapyAssignments,
            totalStaff,
            totalRevenue: formatRevenue(totalRevenue),
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({
            totalPatients: 0,
            todayAppointments: 0,
            medicinesStock: 0,
            therapyAssignments: 0,
            totalStaff: 0,
            totalRevenue: '₹0',
        });
    }
}