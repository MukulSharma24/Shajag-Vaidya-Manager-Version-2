import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/therapy/plans/[id] - Get single plan details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const plan = await prisma.therapyPlan.findUnique({
            where: { id: params.id },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        age: true,
                        gender: true,
                        constitutionType: true,
                        email: true,
                    },
                },
                sessions: {
                    orderBy: {
                        scheduledDate: 'asc',
                    },
                },
                bill: {
                    select: {
                        id: true,
                        billNumber: true,
                        status: true,
                        totalAmount: true,
                    },
                },
            },
        });

        if (!plan) {
            return NextResponse.json(
                { error: 'Therapy plan not found' },
                { status: 404 }
            );
        }

        // Calculate stats
        const completedSessions = plan.sessions.filter(s => s.status === 'COMPLETED');
        const upcomingSessions = plan.sessions.filter(s =>
            s.status === 'SCHEDULED' && new Date(s.scheduledDate) >= new Date()
        );
        const missedSessions = plan.sessions.filter(s => s.status === 'MISSED');

        const planWithStats = {
            ...plan,
            stats: {
                completed: completedSessions.length,
                upcoming: upcomingSessions.length,
                missed: missedSessions.length,
                total: plan.totalSessions,
                percentage: (completedSessions.length / plan.totalSessions) * 100,
            },
        };

        return NextResponse.json({ plan: planWithStats });
    } catch (error) {
        console.error('Error fetching therapy plan:', error);
        return NextResponse.json(
            { error: 'Failed to fetch therapy plan' },
            { status: 500 }
        );
    }
}

// PUT /api/therapy/plans/[id] - Update plan status
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { status, billId } = body;

        const plan = await prisma.therapyPlan.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
                ...(billId && { billId }),
            },
            include: {
                patient: true,
                sessions: true,
            },
        });

        return NextResponse.json({ plan });
    } catch (error) {
        console.error('Error updating therapy plan:', error);
        return NextResponse.json(
            { error: 'Failed to update therapy plan' },
            { status: 500 }
        );
    }
}

// DELETE /api/therapy/plans/[id] - Cancel plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.therapyPlan.update({
            where: { id: params.id },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling therapy plan:', error);
        return NextResponse.json(
            { error: 'Failed to cancel therapy plan' },
            { status: 500 }
        );
    }
}