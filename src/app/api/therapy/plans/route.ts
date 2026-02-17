import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/therapy/plans - Get all therapy plans
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'ACTIVE';
        const patientId = searchParams.get('patientId');

        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (patientId) {
            where.patientId = patientId;
        }

        const plans = await prisma.therapyPlan.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        age: true,
                        gender: true,
                        constitutionType: true,
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        status: true,
                        scheduledDate: true,
                        scheduledTime: true,
                    },
                    orderBy: {
                        scheduledDate: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate stats for each plan
        const plansWithStats = plans.map(plan => {
            const completedSessions = plan.sessions.filter(s => s.status === 'COMPLETED').length;
            // FIX: Compare only date portion so today's sessions are always included in upcoming
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingSessions = plan.sessions.filter(s => {
                const sessionDate = new Date(s.scheduledDate);
                sessionDate.setHours(0, 0, 0, 0);
                return s.status === 'SCHEDULED' && sessionDate >= today;
            });
            const nextSession = upcomingSessions[0] || null;

            return {
                ...plan,
                stats: {
                    completed: completedSessions,
                    total: plan.totalSessions,
                    percentage: (completedSessions / plan.totalSessions) * 100,
                    nextSession,
                },
            };
        });

        return NextResponse.json({ plans: plansWithStats });
    } catch (error) {
        console.error('Error fetching therapy plans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch therapy plans' },
            { status: 500 }
        );
    }
}

// POST /api/therapy/plans - Create new therapy plan
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            patientId,
            therapyTypes,
            startDate,
            duration,
            frequency,
            pricePerSession,
            notes,
            instructions,
            sessionTimes,
        } = body;

        // Validation
        if (!patientId) {
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }

        if (!therapyTypes || therapyTypes.length === 0) {
            return NextResponse.json(
                { error: 'At least one therapy type must be selected' },
                { status: 400 }
            );
        }

        if (!startDate || !duration || !frequency) {
            return NextResponse.json(
                { error: 'Start date, duration, and frequency are required' },
                { status: 400 }
            );
        }

        // Calculate end date and total sessions
        const start = new Date(startDate);
        let totalSessions = 0;
        let endDate = new Date(start);

        switch (frequency) {
            case 'DAILY':
                totalSessions = duration;
                endDate.setDate(start.getDate() + duration - 1);
                break;
            case 'ALTERNATE_DAYS':
                totalSessions = Math.ceil(duration / 2);
                endDate.setDate(start.getDate() + (duration * 2) - 1);
                break;
            case 'WEEKLY':
                totalSessions = duration;
                endDate.setDate(start.getDate() + (duration * 7) - 1);
                break;
            default:
                totalSessions = duration;
                endDate.setDate(start.getDate() + duration - 1);
        }

        // Generate plan number
        const lastPlan = await prisma.therapyPlan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { planNumber: true },
        });

        const planNumber = generatePlanNumber(lastPlan?.planNumber);

        // Calculate total amount
        const totalAmount = pricePerSession * totalSessions * therapyTypes.length;

        // Create therapy plan
        const therapyPlan = await prisma.therapyPlan.create({
            data: {
                planNumber,
                patientId,
                therapyTypes,
                startDate: start,
                endDate,
                totalSessions: totalSessions * therapyTypes.length,
                frequency,
                pricePerSession,
                totalAmount,
                notes,
                instructions,
            },
            include: {
                patient: true,
            },
        });

        // Generate sessions starting from session #1 on the start date
        await generateSessions(
            therapyPlan.id,
            therapyTypes,
            start,
            totalSessions,
            frequency,
            sessionTimes
        );

        // Fetch complete plan with sessions
        const completePlan = await prisma.therapyPlan.findUnique({
            where: { id: therapyPlan.id },
            include: {
                patient: true,
                sessions: {
                    orderBy: {
                        scheduledDate: 'asc',
                    },
                },
            },
        });

        return NextResponse.json({ plan: completePlan }, { status: 201 });
    } catch (error) {
        console.error('Error creating therapy plan:', error);
        return NextResponse.json(
            { error: 'Failed to create therapy plan' },
            { status: 500 }
        );
    }
}

// Helper: Generate plan number
function generatePlanNumber(lastPlanNumber?: string): string {
    const prefix = 'TP';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (!lastPlanNumber) {
        return `${prefix}${year}${month}-0001`;
    }

    const parts = lastPlanNumber.split('-');
    const lastNumber = parseInt(parts[1] || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}-${newNumber}`;
}

// Helper: Generate sessions
// Sessions are numbered starting from 1 and the FIRST session is always on startDate
async function generateSessions(
    planId: string,
    therapyTypes: string[],
    startDate: Date,
    sessionsPerTherapy: number,
    frequency: string,
    sessionTimes?: string[]
) {
    // Use a single global counter across all therapy types so session numbers are unique and sequential
    let sessionNumber = 1;

    for (const therapyType of therapyTypes) {
        // Always start from the exact startDate — session #1 is on day 1
        let currentDate = new Date(startDate);

        for (let i = 0; i < sessionsPerTherapy; i++) {
            const time =
                sessionTimes && sessionTimes.length > 0
                    ? sessionTimes[i % sessionTimes.length]
                    : '10:00 AM';

            await prisma.therapySession.create({
                data: {
                    planId,
                    sessionNumber,        // Starts at 1
                    therapyType,
                    scheduledDate: new Date(currentDate),
                    scheduledTime: time,
                    status: 'SCHEDULED',
                },
            });

            sessionNumber++;

            // Advance date AFTER creating the session so day 1 = startDate
            switch (frequency) {
                case 'DAILY':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'ALTERNATE_DAYS':
                    currentDate.setDate(currentDate.getDate() + 2);
                    break;
                case 'WEEKLY':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                default:
                    currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }
}