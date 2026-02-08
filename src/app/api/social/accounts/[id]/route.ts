// src/app/api/social/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/social/accounts/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const account = await prisma.socialAccount.findUnique({
            where: { id: params.id },
        });

        if (!account) {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(account);

    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json(
            { error: 'Failed to fetch account' },
            { status: 500 }
        );
    }
}

// PATCH /api/social/accounts/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const account = await prisma.socialAccount.update({
            where: { id: params.id },
            data: {
                isActive: body.isActive,
                accountName: body.accountName,
                username: body.username,
                followers: body.followers,
                lastSync: body.lastSync ? new Date(body.lastSync) : undefined,
            },
        });

        return NextResponse.json(account);

    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json(
            { error: 'Failed to update account' },
            { status: 500 }
        );
    }
}

// DELETE /api/social/accounts/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.socialAccount.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}