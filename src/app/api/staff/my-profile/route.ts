export const dynamic = 'force-dynamic';

// src/app/api/staff/my-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET - Get logged-in user's staff profile and leave balance
export async function GET(req: NextRequest) {
    try {
        // Get token from cookies
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyJWT(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only DOCTOR and STAFF can access this
        if (!['DOCTOR', 'STAFF'].includes(user.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Find staff record linked to this user
        const staff = await prisma.staff.findFirst({
            where: {
                userId: user.userId,
            },
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                department: true,
                designation: true,
                clinicId: true,
            },
        });

        if (!staff) {
            return NextResponse.json({
                error: 'Staff profile not found. Please contact admin.',
                notLinked: true
            }, { status: 404 });
        }

        // Get leave balance for current year
        const currentYear = new Date().getFullYear();
        let leaveBalance = await prisma.leaveBalance.findFirst({
            where: {
                staffId: staff.id,
                year: currentYear,
            },
        });

        // If no leave balance exists, create default one
        if (!leaveBalance) {
            leaveBalance = await prisma.leaveBalance.create({
                data: {
                    staffId: staff.id,
                    year: currentYear,
                    clinicId: staff.clinicId,
                    sickLeaveTotal: 12,
                    sickLeaveUsed: 0,
                    sickLeaveBalance: 12,
                    casualLeaveTotal: 12,
                    casualLeaveUsed: 0,
                    casualLeaveBalance: 12,
                    earnedLeaveTotal: 15,
                    earnedLeaveUsed: 0,
                    earnedLeaveBalance: 15,
                },
            });
        }

        return NextResponse.json({
            staff,
            leaveBalance,
        });
    } catch (error) {
        console.error('Error fetching staff profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}