// src/app/api/social/accounts/connect/facebook/callback/route.ts
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
        // const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?...`);

        // TODO: Get page info
        // const pageInfo = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=...`);

        // Mock account creation
        const account = await prisma.socialAccount.create({
            data: {
                platform: 'FACEBOOK',
                accountName: 'My Facebook Page',
                accountId: `fb-${Date.now()}`,
                username: 'mypage',
                accessToken: 'mock-token',
                isActive: true,
            },
        });

        console.log('✅ Facebook account connected:', account.id);

        return NextResponse.redirect('/dashboard/communication/accounts?success=true');

    } catch (error) {
        console.error('Error in Facebook callback:', error);
        return NextResponse.redirect('/dashboard/communication/accounts?error=callback_failed');
    }
}