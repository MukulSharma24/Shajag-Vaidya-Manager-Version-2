// src/app/api/staff/my-leaves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET - Get logged-in user's leave requests
export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyJWT(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['DOCTOR', 'STAFF'].includes(user.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const staff = await prisma.staff.findFirst({
            where: { userId: user.userId },
            select: { id: true, clinicId: true },
        });

        if (!staff) {
            return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = { staffId: staff.id };
        if (status && status !== 'ALL') {
            where.status = status;
        }

        // Auto-approve pending leaves older than 24 hours (except already processed)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        await prisma.staffLeave.updateMany({
            where: {
                staffId: staff.id,
                status: 'PENDING',
                appliedDate: { lt: twentyFourHoursAgo },
                leaveType: { not: 'EMERGENCY' }, // Emergency already auto-approved
            },
            data: {
                status: 'APPROVED',
                reviewedDate: new Date(),
                reviewNotes: 'Auto-approved after 24 hours',
            },
        });

        const leaves = await prisma.staffLeave.findMany({
            where,
            orderBy: { appliedDate: 'desc' },
            include: {
                reviewedByUser: { select: { name: true } },
            },
        });

        const currentYear = new Date().getFullYear();
        const leaveBalance = await prisma.leaveBalance.findFirst({
            where: { staffId: staff.id, year: currentYear },
        });

        return NextResponse.json({ leaves, leaveBalance });
    } catch (error) {
        console.error('Error fetching leaves:', error);
        return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
    }
}

// POST - Apply for leave
export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyJWT(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['DOCTOR', 'STAFF'].includes(user.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const staff = await prisma.staff.findFirst({
            where: { userId: user.userId },
            select: { id: true, clinicId: true, firstName: true, lastName: true },
        });

        if (!staff) {
            return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
        }

        const body = await req.json();
        let { leaveType, startDate, endDate, reason } = body;

        // Map EMERGENCY to SICK for database (uses sickLeave balance)
        const dbLeaveType = leaveType === 'EMERGENCY' ? 'SICK' : leaveType;
        const isEmergency = leaveType === 'EMERGENCY';

        if (!leaveType || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Leave type, start date, and end date are required' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return NextResponse.json(
                { error: 'Start date must be before end date' },
                { status: 400 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            return NextResponse.json(
                { error: 'Cannot apply leave for past dates' },
                { status: 400 }
            );
        }

        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
        }

        // Check leave balance
        const currentYear = new Date().getFullYear();
        const balance = await prisma.leaveBalance.findFirst({
            where: { staffId: staff.id, year: currentYear },
        });

        if (!balance && dbLeaveType !== 'UNPAID') {
            return NextResponse.json(
                { error: 'Leave balance not found. Please contact admin.' },
                { status: 404 }
            );
        }

        // Check sufficient balance
        if (dbLeaveType !== 'UNPAID' && balance) {
            let availableBalance = 0;
            if (dbLeaveType === 'SICK') {
                availableBalance = Number(balance.sickLeaveBalance);
            } else if (dbLeaveType === 'CASUAL') {
                availableBalance = Number(balance.casualLeaveBalance);
            } else if (dbLeaveType === 'EARNED') {
                availableBalance = Number(balance.earnedLeaveBalance);
            }

            if (totalDays > availableBalance) {
                const leaveTypeName = isEmergency ? 'emergency' : dbLeaveType.toLowerCase();
                return NextResponse.json(
                    { error: `Insufficient ${leaveTypeName} leave balance. Available: ${availableBalance} days` },
                    { status: 400 }
                );
            }
        }

        // Check overlapping
        const overlapping = await prisma.staffLeave.findFirst({
            where: {
                staffId: staff.id,
                status: { in: ['PENDING', 'APPROVED'] },
                OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
            },
        });

        if (overlapping) {
            return NextResponse.json(
                { error: 'You already have a leave request for overlapping dates' },
                { status: 400 }
            );
        }

        // Create leave - Emergency leaves are auto-approved
        const leaveStatus = isEmergency ? 'APPROVED' : 'PENDING';

        const leave = await prisma.staffLeave.create({
            data: {
                staffId: staff.id,
                leaveType: dbLeaveType,
                startDate: start,
                endDate: end,
                totalDays,
                reason: reason || (isEmergency ? 'Emergency Leave' : ''),
                status: leaveStatus,
                clinicId: staff.clinicId,
                reviewedDate: isEmergency ? new Date() : null,
                reviewNotes: isEmergency ? 'Auto-approved (Emergency Leave)' : null,
            },
        });

        // If emergency (auto-approved), update leave balance immediately
        if (isEmergency && balance) {
            await prisma.leaveBalance.update({
                where: { id: balance.id },
                data: {
                    sickLeaveUsed: Number(balance.sickLeaveUsed) + totalDays,
                    sickLeaveBalance: Number(balance.sickLeaveBalance) - totalDays,
                },
            });

            // Mark attendance as LEAVE for emergency leave days
            const dates: Date[] = [];
            let currentDate = new Date(start);
            while (currentDate <= end) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            await Promise.all(
                dates.map(date => {
                    const createData: any = {
                        staffId: staff.id,
                        attendanceDate: date,
                        status: 'LEAVE',
                        notes: 'Emergency leave',
                    };
                    if (staff.clinicId) createData.clinicId = staff.clinicId;

                    return prisma.staffAttendance.upsert({
                        where: {
                            staffId_attendanceDate: {
                                staffId: staff.id,
                                attendanceDate: date,
                            },
                        },
                        create: createData,
                        update: {
                            status: 'LEAVE',
                            notes: 'Emergency leave',
                        },
                    });
                })
            );
        }

        return NextResponse.json({
            leave,
            message: isEmergency
                ? 'Emergency leave approved automatically'
                : 'Leave request submitted. Will auto-approve in 24 hours if not reviewed.',
        }, { status: 201 });
    } catch (error) {
        console.error('Error applying for leave:', error);
        return NextResponse.json({ error: 'Failed to apply for leave' }, { status: 500 });
    }
}