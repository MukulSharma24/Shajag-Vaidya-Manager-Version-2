import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch attendance records
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const staffId = searchParams.get('staffId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const clinicId = searchParams.get('clinicId'); // Pass from frontend

        const where: any = {};

        if (clinicId) {
            where.clinicId = clinicId;
        }

        if (staffId) {
            where.staffId = staffId;
        }

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0);
            where.attendanceDate = {
                gte: startDate,
                lte: endDate,
            };
        } else if (fromDate && toDate) {
            where.attendanceDate = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

        const attendance = await prisma.staffAttendance.findMany({
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
                markedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                attendanceDate: 'desc',
            },
        });

        // Calculate summary if staffId is provided
        let summary = null;
        if (staffId && month && year) {
            const statsWhere: any = {
                staffId,
                attendanceDate: where.attendanceDate,
            };

            if (clinicId) {
                statsWhere.clinicId = clinicId;
            }

            const stats = await prisma.staffAttendance.groupBy({
                by: ['status'],
                where: statsWhere,
                _count: true,
                _sum: {
                    totalHours: true,
                },
            });

            summary = {
                totalDays: attendance.length,
                present: stats.find(s => s.status === 'PRESENT')?._count || 0,
                absent: stats.find(s => s.status === 'ABSENT')?._count || 0,
                halfDay: stats.find(s => s.status === 'HALF_DAY')?._count || 0,
                leave: stats.find(s => s.status === 'LEAVE')?._count || 0,
                totalHours: stats.reduce((sum, s) => sum + Number(s._sum.totalHours || 0), 0),
            };
        }

        return NextResponse.json({ attendance, summary });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

// POST - Mark attendance (clock in/out or manual marking)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            staffId,
            attendanceDate,
            clockIn,
            clockOut,
            status,
            notes,
            clinicId, // Pass from frontend
            markedBy, // Pass userId from frontend
        } = body;

        if (!staffId || !attendanceDate) {
            return NextResponse.json(
                { error: 'Staff ID and date are required' },
                { status: 400 }
            );
        }

        const date = new Date(attendanceDate);
        date.setHours(0, 0, 0, 0);

        // Check if attendance already exists for this date
        const existingWhere: any = {
            staffId,
            attendanceDate: date,
        };

        if (clinicId) {
            existingWhere.clinicId = clinicId;
        }

        const existing = await prisma.staffAttendance.findFirst({
            where: existingWhere,
        });

        let totalHours = 0;
        if (clockIn && clockOut) {
            const inTime = new Date(`2000-01-01T${clockIn}`);
            const outTime = new Date(`2000-01-01T${clockOut}`);
            totalHours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        }

        if (existing) {
            // Update existing attendance
            const updated = await prisma.staffAttendance.update({
                where: { id: existing.id },
                data: {
                    clockIn,
                    clockOut,
                    status,
                    totalHours,
                    notes,
                },
                include: {
                    staff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            return NextResponse.json({ attendance: updated });
        } else {
            // Create new attendance record
            const attendanceData: any = {
                staffId,
                attendanceDate: date,
                clockIn,
                clockOut,
                status: status || 'PRESENT',
                totalHours,
                notes,
            };

            if (clinicId) attendanceData.clinicId = clinicId;
            if (markedBy) attendanceData.markedBy = markedBy;

            const attendance = await prisma.staffAttendance.create({
                data: attendanceData,
                include: {
                    staff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            return NextResponse.json({ attendance }, { status: 201 });
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }
}

// PATCH - Bulk mark attendance for multiple staff
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { date, attendanceRecords, clinicId, markedBy } = body;

        if (!date || !attendanceRecords || attendanceRecords.length === 0) {
            return NextResponse.json(
                { error: 'Date and attendance records are required' },
                { status: 400 }
            );
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Process each attendance record
        const results = await Promise.all(
            attendanceRecords.map(async (record: any) => {
                const { staffId, status, clockIn, clockOut, notes } = record;

                let totalHours = 0;
                if (clockIn && clockOut) {
                    const inTime = new Date(`2000-01-01T${clockIn}`);
                    const outTime = new Date(`2000-01-01T${clockOut}`);
                    totalHours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
                }

                const createData: any = {
                    staffId,
                    attendanceDate,
                    status,
                    clockIn,
                    clockOut,
                    totalHours,
                    notes,
                };

                if (clinicId) createData.clinicId = clinicId;
                if (markedBy) createData.markedBy = markedBy;

                // Upsert attendance
                return prisma.staffAttendance.upsert({
                    where: {
                        staffId_attendanceDate: {
                            staffId,
                            attendanceDate,
                        },
                    },
                    create: createData,
                    update: {
                        status,
                        clockIn,
                        clockOut,
                        totalHours,
                        notes,
                    },
                });
            })
        );

        return NextResponse.json({
            message: 'Attendance marked successfully',
            count: results.length,
        });
    } catch (error) {
        console.error('Error bulk marking attendance:', error);
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }
}