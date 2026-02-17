// src/app/api/appointments/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Get all pending appointment requests (for staff)
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser || !['OWNER', 'DOCTOR', 'STAFF'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const requests = await prisma.appointment.findMany({
            where: {
                status: { in: ['PENDING_APPROVAL', 'ALTERNATIVE_PROPOSED'] }
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        registrationId: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ requests });

    } catch (error) {
        console.error('Get requests error:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}