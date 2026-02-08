import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/therapy/sessions/[id] - Update session
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const {
            status,
            completedAt,
            duration,
            observations,
            vitals,
            patientFeedback,
            discomfort,
            scheduledDate,
            scheduledTime,
            rescheduledNote,
        } = body;

        const updateData: any = {};

        if (status) {
            updateData.status = status;

            if (status === 'COMPLETED') {
                updateData.completedAt = completedAt || new Date();
            }

            if (status === 'RESCHEDULED' && scheduledDate) {
                updateData.rescheduledFrom = new Date();
                updateData.rescheduledTo = new Date(scheduledDate);
                updateData.scheduledDate = new Date(scheduledDate);
                if (scheduledTime) updateData.scheduledTime = scheduledTime;
                if (rescheduledNote) updateData.rescheduledNote = rescheduledNote;
            }
        }

        if (duration) updateData.duration = duration;
        if (observations) updateData.observations = observations;
        if (vitals) updateData.vitals = vitals;
        if (patientFeedback) updateData.patientFeedback = patientFeedback;
        if (discomfort) updateData.discomfort = discomfort;

        const session = await prisma.therapySession.update({
            where: { id: params.id },
            data: updateData,
        });

        // Check if plan is completed
        const plan = await prisma.therapyPlan.findUnique({
            where: { id: session.planId },
            include: {
                sessions: true,
            },
        });

        if (plan) {
            const allCompleted = plan.sessions.every(
                s => s.status === 'COMPLETED' || s.status === 'CANCELLED'
            );

            if (allCompleted && plan.status === 'ACTIVE') {
                await prisma.therapyPlan.update({
                    where: { id: plan.id },
                    data: { status: 'COMPLETED' },
                });
            }
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}