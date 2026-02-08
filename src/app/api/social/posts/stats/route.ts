// src/app/api/social/posts/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Get counts for each status
        const [total, drafts, scheduled, published] = await Promise.all([
            prisma.socialPost.count(),
            prisma.socialPost.count({ where: { status: 'DRAFT' } }),
            prisma.socialPost.count({ where: { status: 'SCHEDULED' } }),
            prisma.socialPost.count({ where: { status: 'PUBLISHED' } }),
        ]);

        return NextResponse.json({
            total,
            drafts,
            scheduled,
            published,
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}