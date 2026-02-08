// src/app/api/social/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/social/accounts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform');
        const isActive = searchParams.get('isActive');

        const where: any = {};
        if (platform) where.platform = platform;
        if (isActive !== null) where.isActive = isActive === 'true';

        const accounts = await prisma.socialAccount.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ accounts });

    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accounts' },
            { status: 500 }
        );
    }
}

// POST /api/social/accounts
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const account = await prisma.socialAccount.create({
            data: {
                platform: body.platform,
                accountName: body.accountName,
                accountId: body.accountId,
                username: body.username || null,
                accessToken: body.accessToken || null,
                refreshToken: body.refreshToken || null,
                tokenExpiry: body.tokenExpiry ? new Date(body.tokenExpiry) : null,
                profilePicture: body.profilePicture || null,
                followers: body.followers || null,
                isActive: true,
            },
        });

        return NextResponse.json(account, { status: 201 });

    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}