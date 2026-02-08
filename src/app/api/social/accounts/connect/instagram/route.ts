// src/app/api/social/accounts/connect/instagram/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // TODO: Implement Instagram OAuth (uses Facebook Graph API)
        console.log('🔗 Initiating Instagram OAuth...');

        return NextResponse.json({
            message: 'Instagram OAuth coming soon!',
        });

    } catch (error) {
        console.error('Error initiating Instagram OAuth:', error);
        return NextResponse.json(
            { error: 'Failed to initiate OAuth' },
            { status: 500 }
        );
    }
}