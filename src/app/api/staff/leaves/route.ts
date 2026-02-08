import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch leave requests
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const staffId = searchParams.get('staffId');
        const status = searchParams.get('status');
        const leaveType = searchParams.get('leaveType');
        const clinicId = searchParams.get('clinicId'); // Pass from frontend

        const where: any = {};

        if (clinicId) {
            where.clinicId = clinicId;
        }

        if (staffId) where.staffId = staffId;
        if (status && status !== 'ALL') where.status = status;
        if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;

        const leaves = await prisma.staffLeave.findMany({
            where,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        role: true,
                    },
                },
                reviewedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                appliedDate: 'desc',
            },
        });

        // Get leave balance if staffId provided
        let leaveBalance = null;
        if (staffId) {
            const currentYear = new Date().getFullYear();
            leaveBalance = await prisma.leaveBalance.findFirst({
                where: {
                    staffId,
                    year: currentYear,
                },
            });
        }

        return NextResponse.json({ leaves, leaveBalance });
    } catch (error) {
        console.error('Error fetching leaves:', error);
        return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
    }
}

// POST - Apply for leave
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            staffId,
            leaveType,
            startDate,
            endDate,
            reason,
            clinicId, // Pass from frontend
        } = body;

        if (!staffId || !leaveType || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Calculate total days
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            return NextResponse.json(
                { error: 'Invalid date range' },
                { status: 400 }
            );
        }

        // Check leave balance
        const currentYear = new Date().getFullYear();
        const balance = await prisma.leaveBalance.findFirst({
            where: {
                staffId,
                year: currentYear,
            },
        });

        if (!balance) {
            return NextResponse.json(
                { error: 'Leave balance not found' },
                { status: 404 }
            );
        }

        // Check if sufficient leave available
        let availableBalance = 0;
        if (leaveType === 'SICK') {
            availableBalance = Number(balance.sickLeaveBalance);
        } else if (leaveType === 'CASUAL') {
            availableBalance = Number(balance.casualLeaveBalance);
        } else if (leaveType === 'EARNED') {
            availableBalance = Number(balance.earnedLeaveBalance);
        }

        if (leaveType !== 'UNPAID' && totalDays > availableBalance) {
            return NextResponse.json(
                { error: `Insufficient ${leaveType.toLowerCase()} leave balance` },
                { status: 400 }
            );
        }

        // Check for overlapping leaves
        const overlapping = await prisma.staffLeave.findFirst({
            where: {
                staffId,
                status: {
                    in: ['PENDING', 'APPROVED'],
                },
                OR: [
                    {
                        startDate: {
                            lte: end,
                        },
                        endDate: {
                            gte: start,
                        },
                    },
                ],
            },
        });

        if (overlapping) {
            return NextResponse.json(
                { error: 'Overlapping leave request exists' },
                { status: 400 }
            );
        }

        // Create leave request
        const leaveData: any = {
            staffId,
            leaveType,
            startDate: start,
            endDate: end,
            totalDays,
            reason,
            status: 'PENDING',
        };

        if (clinicId) leaveData.clinicId = clinicId;

        const leave = await prisma.staffLeave.create({
            data: leaveData,
            include: {
                staff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                    },
                },
            },
        });

        return NextResponse.json({ leave }, { status: 201 });
    } catch (error) {
        console.error('Error applying for leave:', error);
        return NextResponse.json({ error: 'Failed to apply for leave' }, { status: 500 });
    }
}

// PATCH - Approve/Reject leave
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { leaveId, action, reviewNotes, reviewedBy, clinicId, markedBy } = body;

        if (!leaveId || !action) {
            return NextResponse.json(
                { error: 'Leave ID and action are required' },
                { status: 400 }
            );
        }

        if (!['APPROVED', 'REJECTED'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        const leave = await prisma.staffLeave.findUnique({
            where: { id: leaveId },
            include: { staff: true },
        });

        if (!leave) {
            return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
        }

        if (leave.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Leave already processed' },
                { status: 400 }
            );
        }

        // Update leave status
        const updateData: any = {
            status: action,
            reviewedDate: new Date(),
            reviewNotes,
        };

        if (reviewedBy) updateData.reviewedBy = reviewedBy;

        const updated = await prisma.staffLeave.update({
            where: { id: leaveId },
            data: updateData,
            include: {
                staff: true,
                reviewedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // If approved, update leave balance and mark attendance
        if (action === 'APPROVED') {
            const currentYear = new Date().getFullYear();

            // Update leave balance
            if (leave.leaveType !== 'UNPAID') {
                const balance = await prisma.leaveBalance.findFirst({
                    where: {
                        staffId: leave.staffId,
                        year: currentYear,
                    },
                });

                if (balance) {
                    const balanceUpdateData: any = {};

                    if (leave.leaveType === 'SICK') {
                        balanceUpdateData.sickLeaveUsed = Number(balance.sickLeaveUsed) + leave.totalDays;
                        balanceUpdateData.sickLeaveBalance = Number(balance.sickLeaveBalance) - leave.totalDays;
                    } else if (leave.leaveType === 'CASUAL') {
                        balanceUpdateData.casualLeaveUsed = Number(balance.casualLeaveUsed) + leave.totalDays;
                        balanceUpdateData.casualLeaveBalance = Number(balance.casualLeaveBalance) - leave.totalDays;
                    } else if (leave.leaveType === 'EARNED') {
                        balanceUpdateData.earnedLeaveUsed = Number(balance.earnedLeaveUsed) + leave.totalDays;
                        balanceUpdateData.earnedLeaveBalance = Number(balance.earnedLeaveBalance) - leave.totalDays;
                    }

                    await prisma.leaveBalance.update({
                        where: { id: balance.id },
                        data: balanceUpdateData,
                    });
                }
            }

            // Mark attendance as LEAVE for all days
            const dates: Date[] = [];
            let currentDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);

            while (currentDate <= endDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            await Promise.all(
                dates.map(date => {
                    const createData: any = {
                        staffId: leave.staffId,
                        attendanceDate: date,
                        status: 'LEAVE',
                        notes: `${leave.leaveType} leave`,
                    };

                    if (clinicId) createData.clinicId = clinicId;
                    if (markedBy) createData.markedBy = markedBy;

                    return prisma.staffAttendance.upsert({
                        where: {
                            staffId_attendanceDate: {
                                staffId: leave.staffId,
                                attendanceDate: date,
                            },
                        },
                        create: createData,
                        update: {
                            status: 'LEAVE',
                            notes: `${leave.leaveType} leave`,
                        },
                    });
                })
            );
        }

        return NextResponse.json({
            leave: updated,
            message: `Leave ${action.toLowerCase()} successfully`,
        });
    } catch (error) {
        console.error('Error processing leave:', error);
        return NextResponse.json({ error: 'Failed to process leave' }, { status: 500 });
    }
}