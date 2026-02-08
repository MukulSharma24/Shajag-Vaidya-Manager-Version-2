// src/app/api/social/accounts/connect/facebook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Initiate Facebook OAuth
export async function GET(request: NextRequest) {
    try {
        // TODO: Implement Facebook OAuth
        // const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement`;

        console.log('🔗 Initiating Facebook OAuth...');

        // For now, return mock response
        return NextResponse.json({
            message: 'Facebook OAuth coming soon!',
            // authUrl: facebookAuthUrl
        });

    } catch (error) {
        console.error('Error initiating Facebook OAuth:', error);
        return NextResponse.json(
            { error: 'Failed to initiate OAuth' },
            { status: 500 }
        );
    }
}