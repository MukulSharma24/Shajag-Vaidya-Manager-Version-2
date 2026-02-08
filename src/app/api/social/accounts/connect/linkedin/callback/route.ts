// src/app/api/social/accounts/connect/linkedin/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect('/dashboard/communication/accounts?error=auth_failed');
        }

        // TODO: Exchange code for access token
        // Mock account creation
        const account = await prisma.socialAccount.create({
            data: {
                platform: 'LINKEDIN',
                accountName: 'My LinkedIn',
                accountId: `li-${Date.now()}`,
                username: 'mylinkedin',
                accessToken: 'mock-token',
                isActive: true,
            },
        });

        console.log('✅ LinkedIn account connected:', account.id);

        return NextResponse.redirect('/dashboard/communication/accounts?success=true');

    } catch (error) {
        console.error('Error in LinkedIn callback:', error);
        return NextResponse.redirect('/dashboard/communication/accounts?error=callback_failed');
    }
}