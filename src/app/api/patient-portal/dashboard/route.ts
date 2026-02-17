export const dynamic = 'force-dynamic';

// src/app/api/patient-portal/dashboard/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET() {
    try {
        // ── Get and verify token ──
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);

        if (!currentUser) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // ── Verify user is a patient ──
        if (currentUser.role !== 'PATIENT') {
            return NextResponse.json({ error: 'Access denied. Patients only.' }, { status: 403 });
        }

        // ── Get patientId from JWT or fetch from database ──
        let patientId = currentUser.patientId;

        if (!patientId) {
            // Fallback: fetch from database if not in JWT
            const user = await prisma.user.findUnique({
                where: { id: currentUser.userId },
                include: { patient: { select: { id: true } } },
            });
            patientId = user?.patient?.id;
        }

        if (!patientId) {
            return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
        }

        // ══════════════════════════════════════════════════════════════
        // CRITICAL: All queries below filter by patientId
        // This ensures patients can ONLY see their own data
        // ══════════════════════════════════════════════════════════════

        // ── Fetch patient profile ──
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            select: {
                id: true,
                fullName: true,
                age: true,
                gender: true,
                phoneNumber: true,
                email: true,
                constitutionType: true,
                bloodGroup: true,
                registrationId: true,
            },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        // ── Fetch appointments (ONLY for this patient) ──
        const appointments = await prisma.appointment.findMany({
            where: { patientId },
            orderBy: { appointmentDate: 'desc' },
            take: 20,
            select: {
                id: true,
                appointmentDate: true,
                appointmentTime: true,
                reason: true,
                status: true,
                notes: true,
            },
        });

        // ── Fetch prescriptions (ONLY for this patient) ──
        const prescriptionsRaw = await prisma.prescription.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                medicines: { select: { id: true } },
            },
        });

        const prescriptions = prescriptionsRaw.map(rx => ({
            id: rx.id,
            prescriptionNo: `RX-${rx.prescriptionNo}`,
            chiefComplaints: rx.chiefComplaints || '',
            diagnosis: rx.diagnosis,
            status: rx.status,
            createdAt: rx.createdAt.toISOString(),
            medicineCount: rx.medicines.length,
        }));

        // ── Fetch therapy plan (ONLY for this patient) ──
        const therapyPlanRaw = await prisma.therapyPlan.findFirst({
            where: {
                patientId,
                status: { in: ['ACTIVE', 'SCHEDULED'] },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sessions: {
                    where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                    orderBy: { scheduledDate: 'asc' },
                    take: 5,
                    select: {
                        id: true,
                        sessionNumber: true,
                        therapyType: true,
                        scheduledDate: true,
                        scheduledTime: true,
                        status: true,
                        observations: true,
                    },
                },
            },
        });

        let therapyPlan = null;
        let therapyProgress = 0;

        if (therapyPlanRaw) {
            const allSessions = await prisma.therapySession.findMany({
                where: { planId: therapyPlanRaw.id },
                select: { status: true },
            });

            const completedSessions = allSessions.filter(s => s.status === 'COMPLETED').length;
            const totalSessions = therapyPlanRaw.totalSessions || allSessions.length;
            therapyProgress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

            // Calculate duration from startDate to endDate
            const startDate = new Date(therapyPlanRaw.startDate);
            const endDate = new Date(therapyPlanRaw.endDate);
            const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            therapyPlan = {
                id: therapyPlanRaw.id,
                therapyTypes: therapyPlanRaw.therapyTypes || [],
                startDate: therapyPlanRaw.startDate.toISOString(),
                duration: durationDays,
                frequency: therapyPlanRaw.frequency || 'DAILY',
                status: therapyPlanRaw.status,
                completedSessions,
                totalSessions,
                upcomingSessions: therapyPlanRaw.sessions.map(s => ({
                    id: s.id,
                    scheduledDate: s.scheduledDate.toISOString(),
                    scheduledTime: s.scheduledTime || '10:00',
                    therapyType: s.therapyType,
                    status: s.status,
                    notes: s.observations || null,
                })),
            };
        }

        // ── Fetch diet plan (ONLY for this patient) ──
        const dietPlanRaw = await prisma.dietPlan.findFirst({
            where: {
                patientId,
                status: 'ACTIVE',
            },
            orderBy: { createdAt: 'desc' },
        });

        let dietPlan = null;
        if (dietPlanRaw) {
            // Parse JSON meal arrays safely
            const parseMeals = (json: string | null): string[] => {
                if (!json) return [];
                try {
                    const parsed = JSON.parse(json);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            };

            dietPlan = {
                id: dietPlanRaw.id,
                constitution: dietPlanRaw.constitution,
                season: dietPlanRaw.season,
                createdAt: dietPlanRaw.createdAt.toISOString(),
                status: dietPlanRaw.status,
                morningMeals: parseMeals(dietPlanRaw.morningMeal),
                lunchMeals: parseMeals(dietPlanRaw.lunchMeal),
                eveningMeals: parseMeals(dietPlanRaw.eveningMeal),
                guidelines: dietPlanRaw.guidelines,
            };
        }

        // ── Fetch bills (ONLY for this patient) ──
        const billsRaw = await prisma.bill.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                billNumber: true,
                totalAmount: true,
                paidAmount: true,
                status: true,
                createdAt: true,
                dueDate: true,
                notes: true,
            },
        });

        const bills = billsRaw.map(bill => ({
            id: bill.id,
            billNo: bill.billNumber,
            totalAmount: Number(bill.totalAmount),
            paidAmount: Number(bill.paidAmount),
            status: bill.status,
            createdAt: bill.createdAt.toISOString(),
            dueDate: bill.dueDate?.toISOString() || null,
            description: bill.notes,
        }));

        // ── Calculate stats ──
        const upcomingAppointments = appointments.filter(a =>
            a.status.toLowerCase() === 'scheduled'
        ).length;

        const activePrescriptions = prescriptions.filter(rx =>
            rx.status === 'FINALIZED' || rx.status === 'DISPENSED'
        ).length;

        const pendingBillsAmount = bills
            .filter(b => b.status !== 'PAID')
            .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

        // ── Return dashboard data ──
        return NextResponse.json({
            patient,
            appointments: appointments.map(apt => ({
                ...apt,
                appointmentDate: apt.appointmentDate.toISOString(),
                status: apt.status.toUpperCase(),
            })),
            prescriptions,
            therapyPlan,
            dietPlan,
            bills,
            stats: {
                upcomingAppointments,
                activePrescriptions,
                pendingBillsAmount,
                therapyProgress,
            },
        });

    } catch (error) {
        console.error('Patient dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to load dashboard' },
            { status: 500 }
        );
    }
}