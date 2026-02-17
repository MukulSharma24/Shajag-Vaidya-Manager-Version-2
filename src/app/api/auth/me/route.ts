// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const currentUser = await getUserFromToken(token);

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            include: {
                patient: { select: { id: true } },
                staff: {
                    select: {
                        id: true,
                        employeeId: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is still active
        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account deactivated' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                patientId: user.patient?.id ?? null,
                staffId: user.staff?.id ?? null,
                employeeId: user.staff?.employeeId ?? null,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}