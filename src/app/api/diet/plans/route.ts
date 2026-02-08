import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDietTemplate, getCurrentSeason } from '@/lib/diet-templates';

// GET /api/diet/plans - Get all diet plans
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'ACTIVE';
        const patientId = searchParams.get('patientId');
        const constitution = searchParams.get('constitution');

        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (patientId) {
            where.patientId = patientId;
        }

        if (constitution) {
            where.constitution = constitution;
        }

        const plans = await prisma.dietPlan.findMany({
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ plans });
    } catch (error) {
        console.error('Error fetching diet plans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch diet plans' },
            { status: 500 }
        );
    }
}

// POST /api/diet/plans - Create new diet plan
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            patientId,
            constitution,
            season,
            morningMeal,
            lunchMeal,
            eveningMeal,
            guidelines,
            restrictions,
            notes,
        } = body;

        // Validation
        if (!patientId) {
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }

        if (!constitution) {
            return NextResponse.json(
                { error: 'Constitution type is required' },
                { status: 400 }
            );
        }

        // Auto-detect season if not provided
        const finalSeason = season || getCurrentSeason();

        // Get template if meals not provided
        let finalMorning = morningMeal;
        let finalLunch = lunchMeal;
        let finalEvening = eveningMeal;
        let finalGuidelines = guidelines;
        let finalRestrictions = restrictions;

        if (!morningMeal || !lunchMeal || !eveningMeal) {
            const template = getDietTemplate(constitution, finalSeason);
            finalMorning = finalMorning || JSON.stringify(template.morning);
            finalLunch = finalLunch || JSON.stringify(template.lunch);
            finalEvening = finalEvening || JSON.stringify(template.evening);
            finalGuidelines = finalGuidelines || template.guidelines.join('\n');
            finalRestrictions = finalRestrictions || template.restrictions.join('\n');
        }

        // Generate plan number
        const lastPlan = await prisma.dietPlan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { planNumber: true },
        });

        const planNumber = generatePlanNumber(lastPlan?.planNumber);

        // Create diet plan
        const dietPlan = await prisma.dietPlan.create({
            data: {
                planNumber,
                patientId,
                constitution,
                season: finalSeason,
                morningMeal: finalMorning,
                lunchMeal: finalLunch,
                eveningMeal: finalEvening,
                guidelines: finalGuidelines,
                restrictions: finalRestrictions,
                notes,
            },
            include: {
                patient: true,
            },
        });

        return NextResponse.json({ plan: dietPlan }, { status: 201 });
    } catch (error) {
        console.error('Error creating diet plan:', error);
        return NextResponse.json(
            { error: 'Failed to create diet plan' },
            { status: 500 }
        );
    }
}

// Helper: Generate plan number
function generatePlanNumber(lastPlanNumber?: string): string {
    const prefix = 'DP';
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