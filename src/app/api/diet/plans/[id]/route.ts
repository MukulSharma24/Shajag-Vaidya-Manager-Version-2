import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/diet/plans/[id] - Get single plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const plan = await prisma.dietPlan.findUnique({
            where: { id: params.id },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        email: true,
                        age: true,
                        gender: true,
                        constitutionType: true,
                    },
                },
            },
        });

        if (!plan) {
            return NextResponse.json(
                { error: 'Diet plan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ plan });
    } catch (error) {
        console.error('Error fetching diet plan:', error);
        return NextResponse.json(
            { error: 'Failed to fetch diet plan' },
            { status: 500 }
        );
    }
}

// PUT /api/diet/plans/[id] - Update plan
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const {
            morningMeal,
            lunchMeal,
            eveningMeal,
            guidelines,
            restrictions,
            notes,
            status,
            compliance,
            followUpDate,
        } = body;

        const updateData: any = {};

        if (morningMeal) updateData.morningMeal = morningMeal;
        if (lunchMeal) updateData.lunchMeal = lunchMeal;
        if (eveningMeal) updateData.eveningMeal = eveningMeal;
        if (guidelines) updateData.guidelines = guidelines;
        if (restrictions) updateData.restrictions = restrictions;
        if (notes !== undefined) updateData.notes = notes;
        if (status) updateData.status = status;
        if (compliance) updateData.compliance = compliance;
        if (followUpDate) updateData.followUpDate = new Date(followUpDate);

        const plan = await prisma.dietPlan.update({
            where: { id: params.id },
            data: updateData,
            include: {
                patient: true,
            },
        });

        return NextResponse.json({ plan });
    } catch (error) {
        console.error('Error updating diet plan:', error);
        return NextResponse.json(
            { error: 'Failed to update diet plan' },
            { status: 500 }
        );
    }
}

// DELETE /api/diet/plans/[id] - Archive plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.dietPlan.update({
            where: { id: params.id },
            data: { status: 'ARCHIVED' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error archiving diet plan:', error);
        return NextResponse.json(
            { error: 'Failed to archive diet plan' },
            { status: 500 }
        );
    }
}