// src/app/api/social/accounts/connect/linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // TODO: Implement LinkedIn OAuth
        console.log('🔗 Initiating LinkedIn OAuth...');

        return NextResponse.json({
            message: 'LinkedIn OAuth coming soon!',
        });

    } catch (error) {
        console.error('Error initiating LinkedIn OAuth:', error);
        return NextResponse.json(
            { error: 'Failed to initiate OAuth' },
            { status: 500 }
        );
    }
}