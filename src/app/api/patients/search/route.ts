export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patients/search?q=search_term
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ patients: [] });
        }

        // Check if query is a number (could be registrationId)
        const isNumeric = /^\d+$/.test(query);

        const where: any = {
            OR: [
                // Search by full name (case-insensitive)
                {
                    fullName: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                // Search by phone number
                {
                    phoneNumber: {
                        contains: query,
                    },
                },
                // Search by email (case-insensitive)
                {
                    email: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
            ],
        };

        // If query is numeric, also search by registrationId
        if (isNumeric) {
            where.OR.push({
                registrationId: parseInt(query),
            });
        }

        const patients = await prisma.patient.findMany({
            where,
            select: {
                id: true,
                registrationId: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                age: true,
                gender: true,
                bloodGroup: true,
                city: true,
                lastVisit: true,
            },
            orderBy: [
                // Prioritize exact matches
                {
                    fullName: 'asc',
                },
            ],
            take: limit,
        });

        return NextResponse.json({ patients });
    } catch (error) {
        console.error('Error searching patients:', error);
        return NextResponse.json(
            { error: 'Failed to search patients' },
            { status: 500 }
        );
    }
}