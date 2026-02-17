// src/app/api/appointments/pending-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Get pending count for notifications
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const currentUser = await getUserFromToken(token);
        if (!currentUser) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Staff sees pending requests
        if (['OWNER', 'DOCTOR', 'STAFF'].includes(currentUser.role)) {
            const pendingCount = await prisma.appointment.count({
                where: { status: 'PENDING_APPROVAL' },
            });
            return NextResponse.json({ pendingRequests: pendingCount });
        }

        // Patient sees pending actions
        if (currentUser.role === 'PATIENT') {
            let patientId = currentUser.patientId;
            if (!patientId) {
                const user = await prisma.user.findUnique({
                    where: { id: currentUser.userId },
                    include: { patient: { select: { id: true } } },
                });
                patientId = user?.patient?.id;
            }

            if (!patientId) {
                return NextResponse.json({ pendingActions: 0 });
            }

            const pendingActions = await prisma.appointment.count({
                where: { patientId, status: 'ALTERNATIVE_PROPOSED' },
            });
            return NextResponse.json({ pendingActions });
        }

        return NextResponse.json({ pendingRequests: 0, pendingActions: 0 });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }
}